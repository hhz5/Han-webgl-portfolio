import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { ResumeModuleId, ResumeSiteConfig } from '../data/resumeConfig';
import { createProceduralTexturePack } from './materials/proceduralTextures';
import { createSkyAtmosphere } from './components/SkyAtmosphere';
import { createTerrainAndWater } from './components/TerrainWater';
import { createWoodenBridge } from './components/WoodenBridge';
import { createStoneLantern } from './components/StoneLantern';
import { createOffroadTruck } from './components/OffroadTruck';
import { createProjectsZone } from './components/ProjectsZone';
import { createLabZone } from './components/LabZone';
import { createCareerZone } from './components/CareerZone';
import { createAltarAndWaterfall } from './components/AltarWaterfallZone';
import { createContactImpactZone } from './components/ContactImpactZone';
import { createPlaygroundProps } from './components/PlaygroundProps';
import {
  createInitialVehicleState,
  findNearestZone,
  groundHeightAt,
  resolveDynamicBodyCollision,
  stepVehiclePhysics,
  WORLD_ZONES,
  type AtmospherePresetId,
  type VehicleInput,
  type VehicleState,
  type WorldZoneDef,
} from './worldLogic';

export interface WorldHudSnapshot {
  speedKmh: number;
  distanceMeters: number;
  nearestZone: WorldZoneDef;
  insideZone: boolean;
  truckX: number;
  truckZ: number;
  truckHeading: number;
}

export interface WorldSceneCallbacks {
  onProgress: (percent: number, stageLabel: string) => void;
  onReady: () => void;
  onHudUpdate: (snapshot: WorldHudSnapshot) => void;
  onZoneInteract: (zoneId: ResumeModuleId) => void;
}

export interface WorldSceneHandle {
  setAtmosphere: (preset: AtmospherePresetId) => void;
  setCameraMode: (mode: 'follow' | 'free') => void;
  teleportToZone: (zoneId: ResumeModuleId) => void;
  respawnTruck: () => void;
  resetProps: () => void;
  applyConfig: (config: ResumeSiteConfig) => void;
  honk: () => void;
  dispose: () => void;
}

const _prevTarget = new THREE.Vector3();
const _desiredTarget = new THREE.Vector3();
const _delta = new THREE.Vector3();

function detectSoftwareGl(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function disposeObjectTree(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
      else mesh.material?.dispose();
    }
  });
}

export function mountWorldScene(
  container: HTMLElement,
  initialConfig: ResumeSiteConfig,
  callbacks: WorldSceneCallbacks,
  instantStart = false
): WorldSceneHandle {
  const isSoftwareGl = detectSoftwareGl();

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(
    container.clientWidth || window.innerWidth,
    container.clientHeight || window.innerHeight
  );
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;
  const camera = new THREE.PerspectiveCamera(48, width / height, 0.4, 340);
  camera.position.set(12.5, 8.6, 18.3);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.06;
  controls.enableRotate = true;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.minDistance = 6;
  controls.maxDistance = 48;
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = Math.PI * 0.46;
  controls.target.set(0, 1.1, 2.5);
  controls.update();

  let currentConfig = initialConfig;
  let cameraMode: 'follow' | 'free' = 'follow';
  let disposed = false;
  let frameId = 0;
  let vehicleState: VehicleState = createInitialVehicleState();

  const keyInput: VehicleInput = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    boost: false,
    brake: false,
    jump: false,
  };

  let atmosphere: ReturnType<typeof createSkyAtmosphere> | null = null;
  let textures: ReturnType<typeof createProceduralTexturePack> | null = null;
  let terrainWater: ReturnType<typeof createTerrainAndWater> | null = null;
  let truck: ReturnType<typeof createOffroadTruck> | null = null;
  let projectsZone: ReturnType<typeof createProjectsZone> | null = null;
  let careerZone: ReturnType<typeof createCareerZone> | null = null;
  let labZone: ReturnType<typeof createLabZone> | null = null;
  let educationZone: ReturnType<typeof createAltarAndWaterfall> | null = null;
  let contactZone: ReturnType<typeof createContactImpactZone> | null = null;
  let propsZone: ReturnType<typeof createPlaygroundProps> | null = null;
  let pmremTexture: THREE.Texture | null = null;
  let maxAniso = 1;

  const isModuleEnabled = (cfg: ResumeSiteConfig, id: ResumeModuleId): boolean =>
    cfg.modules.some((m) => m.id === id && m.enabled);

  const rebuildResumeModules = (cfg: ResumeSiteConfig) => {
    if (!textures) return;

    // Dispose and replace dynamic resume groups cleanly
    if (projectsZone) {
      scene.remove(projectsZone.group);
      projectsZone.dispose();
      disposeObjectTree(projectsZone.group);
    }
    if (careerZone) {
      scene.remove(careerZone.group);
      careerZone.dispose();
      disposeObjectTree(careerZone.group);
    }
    if (labZone) {
      scene.remove(labZone.group);
      labZone.dispose();
      disposeObjectTree(labZone.group);
    }
    if (educationZone) {
      scene.remove(educationZone.group);
      educationZone.dispose();
      disposeObjectTree(educationZone.group);
    }
    if (contactZone) {
      scene.remove(contactZone.group);
      contactZone.dispose();
      disposeObjectTree(contactZone.group);
    }
    if (propsZone) {
      scene.remove(propsZone.group);
      propsZone.dispose();
      disposeObjectTree(propsZone.group);
    }

    projectsZone = createProjectsZone(textures, cfg.projects, maxAniso);
    projectsZone.group.visible = isModuleEnabled(cfg, 'projects');

    careerZone = createCareerZone(cfg.careers, maxAniso);
    careerZone.group.visible = isModuleEnabled(cfg, 'career');

    labZone = createLabZone(cfg.techLayers, maxAniso);
    labZone.group.visible = isModuleEnabled(cfg, 'ai_lab');

    educationZone = createAltarAndWaterfall(textures, cfg.education, maxAniso);
    educationZone.group.visible = isModuleEnabled(cfg, 'education');

    contactZone = createContactImpactZone(cfg.impactMetrics, cfg.profile, maxAniso);
    contactZone.group.visible = isModuleEnabled(cfg, 'contact');

    propsZone = createPlaygroundProps(textures, cfg, maxAniso);

    scene.add(
      projectsZone.group,
      careerZone.group,
      labZone.group,
      educationZone.group,
      contactZone.group,
      propsZone.group
    );
  };

  const yieldStage = (ms: number) =>
    new Promise<void>((resolve) => {
      if (instantStart) resolve();
      else window.setTimeout(resolve, ms);
    });

  const initWorld = async () => {
    callbacks.onProgress(15, '初始化渲染器与工作室环境光...');
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = pmremTexture;
    pmremGenerator.dispose();
    atmosphere = createSkyAtmosphere(scene, isSoftwareGl, currentConfig.display.atmosphere);
    await yieldStage(40);
    if (disposed) return;

    callbacks.onProgress(35, '程序化生成地形、木纹、石灯笼与中文展板贴图...');
    maxAniso = isSoftwareGl ? 1 : Math.min(8, renderer.capabilities.getMaxAnisotropy());
    textures = createProceduralTexturePack(maxAniso);
    await yieldStage(40);
    if (disposed) return;

    callbacks.onProgress(58, '构建河谷地形、跨河木桥与沿途石灯笼...');
    terrainWater = createTerrainAndWater(textures);
    scene.add(terrainWater.group);
    scene.add(createWoodenBridge(textures));

    const lanternCoords: Array<[number, number, boolean]> = [
      [8.5, -1.5, false],
      [18, -9, true],
      [15, 16, false],
      [-14, -12, true],
      [-21, 9, false],
      [7, 25, false],
      [-10, 26, true],
    ];
    for (const [lx, lz, hasLight] of lanternCoords) {
      scene.add(createStoneLantern(textures, lx, lz, 0.95, hasLight && !isSoftwareGl));
    }
    await yieldStage(40);
    if (disposed) return;

    callbacks.onProgress(80, '装配红黑越野卡车与简历各 3D 展区...');
    truck = createOffroadTruck(textures);
    truck.update(vehicleState, 0);
    scene.add(truck.root);
    rebuildResumeModules(currentConfig);
    await yieldStage(40);
    if (disposed) return;

    callbacks.onProgress(100, '启动 3D 简历交互世界...');
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    await yieldStage(30);
    if (disposed) return;

    callbacks.onReady();
    startLoop();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keyInput.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keyInput.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keyInput.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keyInput.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keyInput.boost = true;
        break;
      case 'KeyB':
      case 'ControlLeft':
        keyInput.brake = true;
        break;
      case 'Space':
        keyInput.jump = true;
        break;
      case 'KeyR':
        respawnTruck();
        break;
      case 'KeyH':
        honk();
        break;
      case 'Enter': {
        const enabledSet = new Set(
          currentConfig.modules.filter((m) => m.enabled).map((m) => m.id)
        );
        const nearest = findNearestZone(vehicleState.x, vehicleState.z, enabledSet);
        if (nearest.inside) {
          callbacks.onZoneInteract(nearest.zone.id);
        }
        break;
      }
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keyInput.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keyInput.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keyInput.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keyInput.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keyInput.boost = false;
        break;
      case 'KeyB':
      case 'ControlLeft':
        keyInput.brake = false;
        break;
      case 'Space':
        keyInput.jump = false;
        break;
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  const onResize = () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  function afterDraw(cb: () => void) {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
    gl.flush();
    if (!sync) {
      frameId = window.setTimeout(cb, 80);
      return;
    }
    const poll = () => {
      if (disposed) {
        gl.deleteSync(sync);
        return;
      }
      const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 80);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  let lastTime = performance.now();
  let lastHudEmit = 0;
  let elapsedTotal = 0;

  const tick = () => {
    if (disposed) return;
    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    elapsedTotal += dt;

    const enableRamps = currentConfig.display.enableStuntProps;
    const prevX = vehicleState.x;
    const prevZ = vehicleState.z;
    vehicleState = stepVehiclePhysics(vehicleState, keyInput, dt, 56, enableRamps);

    if (truck) truck.update(vehicleState, elapsedTotal);
    if (terrainWater) terrainWater.update(elapsedTotal);
    if (projectsZone && projectsZone.group.visible) projectsZone.update(elapsedTotal);
    if (labZone && labZone.group.visible) labZone.update(elapsedTotal);
    if (educationZone && educationZone.group.visible) educationZone.update(elapsedTotal);
    if (contactZone && contactZone.group.visible) contactZone.update(elapsedTotal);
    if (atmosphere) atmosphere.updateSunFollow(vehicleState.x, vehicleState.z);

    if (propsZone) {
      for (const crate of propsZone.crates) {
        resolveDynamicBodyCollision(
          crate,
          vehicleState.x,
          vehicleState.z,
          vehicleState.vx,
          vehicleState.vz,
          1.65
        );
      }
      propsZone.update(dt);
    }

    if (cameraMode === 'follow') {
      _prevTarget.copy(controls.target);
      _desiredTarget.set(vehicleState.x, vehicleState.y + 1.15, vehicleState.z);
      const alpha = 1 - Math.exp(-7.5 * dt);
      controls.target.lerp(_desiredTarget, alpha);
      _delta.copy(controls.target).sub(_prevTarget);
      camera.position.add(_delta);
    } else {
      const movedX = vehicleState.x - prevX;
      const movedZ = vehicleState.z - prevZ;
      if (Math.abs(movedX) > 0.001 || Math.abs(movedZ) > 0.001) {
        controls.target.x += movedX;
        controls.target.z += movedZ;
        camera.position.x += movedX;
        camera.position.z += movedZ;
      }
    }

    controls.update();
    renderer.render(scene, camera);

    if (now - lastHudEmit > 110) {
      lastHudEmit = now;
      const enabledSet = new Set(
        currentConfig.modules.filter((m) => m.enabled).map((m) => m.id)
      );
      const nearest = findNearestZone(vehicleState.x, vehicleState.z, enabledSet);
      callbacks.onHudUpdate({
        speedKmh: Math.round(Math.abs(vehicleState.speed) * 4.2),
        distanceMeters: Math.round(vehicleState.distanceDriven),
        nearestZone: nearest.zone,
        insideZone: nearest.inside,
        truckX: vehicleState.x,
        truckZ: vehicleState.z,
        truckHeading: vehicleState.heading,
      });
    }

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  };

  function startLoop() {
    lastTime = performance.now();
    if (isSoftwareGl) {
      renderer.render(scene, camera);
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  }

  const teleportToZone = (zoneId: ResumeModuleId) => {
    const zDef = WORLD_ZONES.find((z) => z.id === zoneId);
    if (!zDef) return;
    const spawnX = zDef.x + zDef.spawnOffset[0];
    const spawnZ = zDef.z + zDef.spawnOffset[1];
    const spawnY = groundHeightAt(spawnX, spawnZ, currentConfig.display.enableStuntProps);

    vehicleState = {
      ...vehicleState,
      x: spawnX,
      y: spawnY,
      z: spawnZ,
      vx: 0,
      vy: 0,
      vz: 0,
      speed: 0,
      heading: zDef.spawnHeading,
      grounded: true,
    };

    controls.target.set(zDef.x, groundHeightAt(zDef.x, zDef.z) + 1.35, zDef.z);
    camera.position.set(
      spawnX + zDef.cameraOffset[0],
      spawnY + zDef.cameraOffset[1],
      spawnZ + zDef.cameraOffset[2]
    );
    controls.update();
    if (truck) truck.update(vehicleState, elapsedTotal);
    renderer.render(scene, camera);
  };

  const respawnTruck = () => {
    const fresh = createInitialVehicleState();
    vehicleState = {
      ...fresh,
      distanceDriven: vehicleState.distanceDriven,
      jumpsCount: vehicleState.jumpsCount,
    };
    controls.target.set(0, 1.1, 2.5);
    camera.position.set(11, 7.8, 15.5);
    controls.update();
    if (truck) truck.update(vehicleState, elapsedTotal);
    renderer.render(scene, camera);
  };

  const resetProps = () => {
    propsZone?.resetCrates();
  };

  const applyConfig = (nextConfig: ResumeSiteConfig) => {
    currentConfig = nextConfig;
    atmosphere?.applyPreset(nextConfig.display.atmosphere, scene);
    rebuildResumeModules(nextConfig);
    renderer.render(scene, camera);
  };

  const honk = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      for (const freq of [392, 493.88]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // Ignore audio autoplay restriction errors
    }
  };

  void initWorld();

  return {
    setAtmosphere: (preset) => {
      atmosphere?.applyPreset(preset, scene);
    },
    setCameraMode: (mode) => {
      cameraMode = mode;
      controls.enablePan = mode === 'free';
    },
    teleportToZone,
    respawnTruck,
    resetProps,
    applyConfig,
    honk,
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      textures?.dispose();
      projectsZone?.dispose();
      careerZone?.dispose();
      labZone?.dispose();
      educationZone?.dispose();
      contactZone?.dispose();
      propsZone?.dispose();
      atmosphere?.dispose();
      pmremTexture?.dispose();
      disposeObjectTree(scene);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
