import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createProceduralTexturePack } from './materials/proceduralTextures';
import { createSkyAtmosphere } from './components/SkyAtmosphere';
import { createTerrainAndWater } from './components/TerrainWater';
import { createWoodenBridge } from './components/WoodenBridge';
import { createStoneLantern } from './components/StoneLantern';
import { createOffroadTruck } from './components/OffroadTruck';
import { createProjectsZone } from './components/ProjectsZone';
import { createLabZone } from './components/LabZone';
import { createCareerZone } from './components/CareerZone';
import { createCircuitZone } from './components/CircuitZone';
import { createBowlingZone } from './components/BowlingZone';
import { createAltarAndWaterfall } from './components/AltarWaterfallZone';
import { createPlaygroundProps, type WhisperFlag } from './components/PlaygroundProps';
import {
  createInitialVehicleState,
  findNearestZone,
  groundHeightAt,
  resolveDynamicBodyCollision,
  stepVehiclePhysics,
  updateCircuitProgress,
  WORLD_ZONES,
  type AtmospherePresetId,
  type CircuitState,
  type VehicleInput,
  type VehicleState,
  type WorldZoneDef,
} from './worldLogic';

export interface WorldHudSnapshot {
  speedKmh: number;
  distanceMeters: number;
  cookiesCollected: number;
  totalCookies: number;
  pinsKnocked: number;
  nearestZone: WorldZoneDef;
  insideZone: boolean;
  truckX: number;
  truckZ: number;
  truckHeading: number;
  circuit: CircuitState;
  unlockedAchievements: string[];
}

export interface WorldSceneCallbacks {
  onProgress: (percent: number, stageLabel: string) => void;
  onReady: () => void;
  onHudUpdate: (snapshot: WorldHudSnapshot) => void;
  onZoneInteract: (zoneId: WorldZoneDef['id']) => void;
}

export interface WorldSceneHandle {
  setAtmosphere: (preset: AtmospherePresetId) => void;
  setCameraMode: (mode: 'follow' | 'free') => void;
  teleportToZone: (zoneId: WorldZoneDef['id']) => void;
  respawnTruck: () => void;
  resetProps: () => void;
  plantWhisper: (author: string, message: string) => void;
  setTouchInput: (patch: Partial<VehicleInput>) => void;
  honk: () => void;
  dispose: () => void;
}

export const INITIAL_WHISPERS: WhisperFlag[] = [
  { id: 'w1', author: 'Bruno', message: 'Welcome to my 3D world!', x: 3.5, z: 7.2, color: '#d43545' },
  { id: 'w2', author: 'Lin', message: 'Love the golden sunset!', x: 16, z: -8, color: '#7c3aed' },
  { id: 'w3', author: 'Alex', message: 'Strike at the bowling!', x: -9, z: -26, color: '#ea580c' },
];

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

export function mountWorldScene(
  container: HTMLElement,
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
  renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
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
  camera.position.set(11, 7.8, 15.5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.06;
  controls.enableRotate = true;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.minDistance = 6;
  controls.maxDistance = 45;
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = Math.PI * 0.46;
  controls.target.set(0, 1.1, 2.5);
  controls.update();

  let cameraMode: 'follow' | 'free' = 'follow';
  let disposed = false;
  let frameId = 0;
  let vehicleState: VehicleState = createInitialVehicleState();
  let circuitState: CircuitState = {
    running: false,
    nextCheckpoint: 0,
    elapsedMs: 0,
    bestLapMs: null,
    lapsCompleted: 0,
  };

  let cookiesCollected = 0;
  const achievements = new Set<string>();
  const visitedZones = new Set<string>(['landing']);

  const keyInput: VehicleInput = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    boost: false,
    brake: false,
    jump: false,
  };

  const touchInput: VehicleInput = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    boost: false,
    brake: false,
    jump: false,
  };

  // Mutable component handles populated during progressive async setup
  let atmosphere: ReturnType<typeof createSkyAtmosphere> | null = null;
  let textures: ReturnType<typeof createProceduralTexturePack> | null = null;
  let terrainWater: ReturnType<typeof createTerrainAndWater> | null = null;
  let truck: ReturnType<typeof createOffroadTruck> | null = null;
  let projectsZone: ReturnType<typeof createProjectsZone> | null = null;
  let labZone: ReturnType<typeof createLabZone> | null = null;
  let circuitZone: ReturnType<typeof createCircuitZone> | null = null;
  let bowlingZone: ReturnType<typeof createBowlingZone> | null = null;
  let altarZone: ReturnType<typeof createAltarAndWaterfall> | null = null;
  let propsZone: ReturnType<typeof createPlaygroundProps> | null = null;
  let pmremTexture: THREE.Texture | null = null;

  const yieldStage = (ms: number) =>
    new Promise<void>((resolve) => {
      if (instantStart) resolve();
      else window.setTimeout(resolve, ms);
    });

  // Progressive initialization so laptops show smooth stage-by-stage progress
  const initWorld = async () => {
    callbacks.onProgress(12, '初始化渲染器与工作室环境光 (PMREM)...');
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = pmremTexture;
    pmremGenerator.dispose();
    atmosphere = createSkyAtmosphere(scene, isSoftwareGl, 'sunset');
    await yieldStage(45);
    if (disposed) return;

    callbacks.onProgress(30, '程序化绘制地面、木纹、灯笼与展板贴图...');
    const maxAniso = isSoftwareGl ? 1 : Math.min(8, renderer.capabilities.getMaxAnisotropy());
    textures = createProceduralTexturePack(maxAniso);
    await yieldStage(45);
    if (disposed) return;

    callbacks.onProgress(52, '构建连绵地形、宝石蓝溪流与木桥栈道...');
    terrainWater = createTerrainAndWater(textures);
    scene.add(terrainWater.group);
    scene.add(createWoodenBridge(textures));
    await yieldStage(45);
    if (disposed) return;

    callbacks.onProgress(70, '组装 12+ 部件红黑越野卡车与沿途石灯笼...');
    truck = createOffroadTruck(textures);
    truck.update(vehicleState, 0);
    scene.add(truck.root);

    // Scatter scenic Stone Lanterns along paths
    const lanternCoords: Array<[number, number, boolean]> = [
      [8.5, -1.5, false],
      [18, -9, true],
      [15, 16, false],
      [-14, -12, true],
      [-21, 9, false],
      [-4, -22, true],
      [7, 25, false],
      [-10, 26, true],
    ];
    for (const [lx, lz, hasLight] of lanternCoords) {
      scene.add(createStoneLantern(textures, lx, lz, 0.95, hasLight && !isSoftwareGl));
    }
    await yieldStage(45);
    if (disposed) return;

    callbacks.onProgress(88, '搭建作品展区、实验工坊、赛道、保龄球与瀑布祭坛...');
    projectsZone = createProjectsZone(textures, maxAniso);
    labZone = createLabZone();
    circuitZone = createCircuitZone(textures);
    bowlingZone = createBowlingZone(textures);
    altarZone = createAltarAndWaterfall(textures);
    propsZone = createPlaygroundProps(textures, maxAniso, INITIAL_WHISPERS);

    scene.add(
      projectsZone.group,
      labZone.group,
      createCareerZone(maxAniso),
      circuitZone.group,
      bowlingZone.group,
      altarZone.group,
      propsZone.group
    );
    await yieldStage(45);
    if (disposed) return;

    callbacks.onProgress(100, '编译着色器并启动 3D 世界...');
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    await yieldStage(35);
    if (disposed) return;

    callbacks.onReady();
    startLoop();
  };

  // Keyboard Listeners (WASD + Arrows + Space + Shift + R + Enter + H)
  const onKeyDown = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

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
        const nearest = findNearestZone(vehicleState.x, vehicleState.z);
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

  // Resize handler
  const onResize = () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  // Software-WebGL fenced loop pacing
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

    // Combine keyboard & touch inputs
    const mergedInput: VehicleInput = {
      forward: keyInput.forward || touchInput.forward,
      backward: keyInput.backward || touchInput.backward,
      left: keyInput.left || touchInput.left,
      right: keyInput.right || touchInput.right,
      boost: keyInput.boost || touchInput.boost,
      brake: keyInput.brake || touchInput.brake,
      jump: keyInput.jump || touchInput.jump,
    };

    const prevX = vehicleState.x;
    const prevZ = vehicleState.z;
    vehicleState = stepVehiclePhysics(vehicleState, mergedInput, dt);
    // One-shot jump key consumption prevents continuous hopping if held
    touchInput.jump = false;

    if (truck) truck.update(vehicleState, elapsedTotal);
    if (terrainWater) terrainWater.update(elapsedTotal);
    if (projectsZone) projectsZone.update(elapsedTotal);
    if (labZone) labZone.update(elapsedTotal);
    if (altarZone) altarZone.update(elapsedTotal);
    if (atmosphere) atmosphere.updateSunFollow(vehicleState.x, vehicleState.z);

    // Collisions & Dynamic World Systems
    let pinsKnocked = 0;
    if (bowlingZone) {
      resolveDynamicBodyCollision(
        bowlingZone.ball,
        vehicleState.x,
        vehicleState.z,
        vehicleState.vx,
        vehicleState.vz,
        1.75
      );
      for (const pin of bowlingZone.pins) {
        resolveDynamicBodyCollision(
          pin,
          vehicleState.x,
          vehicleState.z,
          vehicleState.vx,
          vehicleState.vz,
          1.6
        );
      }
      pinsKnocked = bowlingZone.update(dt);
      if (pinsKnocked >= 10) achievements.add('strike');
      else if (pinsKnocked >= 1) achievements.add('first_pin');
    }

    if (circuitZone) {
      for (const cone of circuitZone.cones) {
        resolveDynamicBodyCollision(
          cone,
          vehicleState.x,
          vehicleState.z,
          vehicleState.vx,
          vehicleState.vz,
          1.55
        );
      }
      circuitZone.update(dt, elapsedTotal, vehicleState.x, vehicleState.z);
    }

    if (propsZone) {
      for (const crate of propsZone.crates) {
        if (
          resolveDynamicBodyCollision(
            crate,
            vehicleState.x,
            vehicleState.z,
            vehicleState.vx,
            vehicleState.vz,
            1.65
          )
        ) {
          achievements.add('wrecker');
        }
      }
      const gained = propsZone.update(dt, elapsedTotal, vehicleState.x, vehicleState.z);
      if (gained > 0) {
        cookiesCollected += gained;
        achievements.add('cookie_hunter');
      }
    }

    // Circuit lap timing
    const circuitStep = updateCircuitProgress(circuitState, vehicleState.x, vehicleState.z, dt * 1000);
    circuitState = circuitStep.state;
    if (circuitStep.event === 'lap_finished') {
      achievements.add('speed_racer');
    }

    // Achievements checks
    if (vehicleState.distanceDriven > 45) achievements.add('road_trip');
    if (vehicleState.jumpsCount > 0 && vehicleState.y > 1.8) achievements.add('sky_jumper');

    // Follow camera smoothly tracks vehicle translation while preserving user OrbitControls rotation/zoom!
    if (cameraMode === 'follow') {
      _prevTarget.copy(controls.target);
      _desiredTarget.set(vehicleState.x, vehicleState.y + 1.15, vehicleState.z);
      const alpha = 1 - Math.exp(-7.5 * dt);
      controls.target.lerp(_desiredTarget, alpha);
      _delta.copy(controls.target).sub(_prevTarget);
      camera.position.add(_delta);
    } else {
      // Even in free mode, allow smooth follow if vehicle actually moves
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

    // Throttle HUD React updates to <= 10 Hz
    if (now - lastHudEmit > 110) {
      lastHudEmit = now;
      const nearest = findNearestZone(vehicleState.x, vehicleState.z);
      if (nearest.inside) {
        visitedZones.add(nearest.zone.id);
        if (visitedZones.size >= WORLD_ZONES.length) {
          achievements.add('world_explorer');
        }
      }
      callbacks.onHudUpdate({
        speedKmh: Math.round(Math.abs(vehicleState.speed) * 4.2),
        distanceMeters: Math.round(vehicleState.distanceDriven),
        cookiesCollected,
        totalCookies: propsZone ? propsZone.collectibleCookies.length : 8,
        pinsKnocked,
        nearestZone: nearest.zone,
        insideZone: nearest.inside,
        truckX: vehicleState.x,
        truckZ: vehicleState.z,
        truckHeading: vehicleState.heading,
        circuit: circuitState,
        unlockedAchievements: Array.from(achievements),
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

  // Public control API
  const teleportToZone = (zoneId: WorldZoneDef['id']) => {
    const zDef = WORLD_ZONES.find((z) => z.id === zoneId);
    if (!zDef) return;
    let spawnX = zDef.x;
    let spawnZ = zDef.z;
    if (zoneId === 'landing') spawnZ += 1.5;
    if (zoneId === 'projects') {
      spawnX -= 2.2;
      spawnZ += 4.2;
    } else if (zoneId === 'lab') {
      spawnX -= 3.8;
      spawnZ += 3.8;
    } else if (zoneId === 'altar') {
      spawnX += 3.2;
      spawnZ -= 4.2;
    }
    const spawnY = groundHeightAt(spawnX, spawnZ);

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

    controls.target.set(spawnX, spawnY + 1.15, spawnZ);
    camera.position.set(
      spawnX + zDef.cameraOffset[0],
      spawnY + zDef.cameraOffset[1],
      spawnZ + zDef.cameraOffset[2]
    );
    controls.update();
    if (truck) truck.update(vehicleState, elapsedTotal);
  };

  const respawnTruck = () => {
    const fresh = createInitialVehicleState();
    vehicleState = {
      ...fresh,
      distanceDriven: vehicleState.distanceDriven,
      jumpsCount: vehicleState.jumpsCount,
    };
    controls.target.set(fresh.x, fresh.y + 1.15, fresh.z);
    camera.position.set(11, 7.8, 15.5);
    controls.update();
  };

  const resetProps = () => {
    bowlingZone?.resetPins();
    circuitZone?.resetCones();
    propsZone?.resetCrates();
  };

  const plantWhisper = (author: string, message: string) => {
    if (!propsZone) return;
    const palette = ['#d43545', '#7c3aed', '#0284c7', '#d97706', '#059669'];
    const color = palette[Math.floor(Math.random() * palette.length)];
    propsZone.addWhisperFlag({
      id: `w-${Date.now()}`,
      author: author.trim() || 'Explorer',
      message: message.trim(),
      x: vehicleState.x + Math.cos(vehicleState.heading) * 2.2,
      z: vehicleState.z - Math.sin(vehicleState.heading) * 2.2,
      color,
    });
    achievements.add('whisperer');
  };

  const honk = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    plantWhisper,
    setTouchInput: (patch) => {
      Object.assign(touchInput, patch);
    },
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
      atmosphere?.dispose();
      pmremTexture?.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else mesh.material?.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
