import * as THREE from 'three';
import type { AtmospherePresetId } from '../worldLogic';

export interface AtmosphereRig {
  group: THREE.Group;
  skyMesh: THREE.Mesh;
  sunLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  rimLight: THREE.DirectionalLight;
  applyPreset: (preset: AtmospherePresetId, scene: THREE.Scene) => void;
  updateSunFollow: (targetX: number, targetZ: number) => void;
  dispose: () => void;
}

interface PresetConfig {
  skyTop: number;
  skyMid: number;
  skyHorizon: number;
  fogColor: number;
  fogDensity: number;
  sunColor: number;
  sunIntensity: number;
  sunPos: [number, number, number];
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  rimColor: number;
  rimIntensity: number;
}

const PRESETS: Record<AtmospherePresetId, PresetConfig> = {
  sunset: {
    skyTop: 0x3b2d5e,
    skyMid: 0x9c5577,
    skyHorizon: 0xf4a071,
    fogColor: 0xc97b74,
    fogDensity: 0.0086,
    sunColor: 0xffd394,
    sunIntensity: 2.3,
    sunPos: [38, 26, 26],
    hemiSky: 0x8e7cc3,
    hemiGround: 0x4f2c44,
    hemiIntensity: 1.0,
    rimColor: 0xff9a76,
    rimIntensity: 0.9,
  },
  twilight: {
    skyTop: 0x1a1838,
    skyMid: 0x4d346b,
    skyHorizon: 0xb85b7f,
    fogColor: 0x6f436e,
    fogDensity: 0.0096,
    sunColor: 0xd8a8ff,
    sunIntensity: 1.65,
    sunPos: [-34, 24, 30],
    hemiSky: 0x6867b8,
    hemiGround: 0x38203c,
    hemiIntensity: 0.95,
    rimColor: 0x7dd3fc,
    rimIntensity: 0.9,
  },
  dawn: {
    skyTop: 0x4c78a8,
    skyMid: 0xd1928c,
    skyHorizon: 0xffe0a8,
    fogColor: 0xf2c299,
    fogDensity: 0.0074,
    sunColor: 0xfff0c2,
    sunIntensity: 2.5,
    sunPos: [42, 34, -22],
    hemiSky: 0x93c5fd,
    hemiGround: 0x875045,
    hemiIntensity: 1.15,
    rimColor: 0xfde68a,
    rimIntensity: 0.75,
  },
};

/**
 * Independent component: Sky dome gradient shader, exponential horizon fog,
 * and 3-point warm/cool outdoor studio lighting rig.
 */
export function createSkyAtmosphere(
  scene: THREE.Scene,
  isSoftwareGl: boolean,
  initialPreset: AtmospherePresetId = 'sunset'
): AtmosphereRig {
  const group = new THREE.Group();
  group.name = 'SkyAtmosphereRig';

  const skyUniforms = {
    uTopColor: { value: new THREE.Color(PRESETS[initialPreset].skyTop) },
    uMidColor: { value: new THREE.Color(PRESETS[initialPreset].skyMid) },
    uHorizonColor: { value: new THREE.Color(PRESETS[initialPreset].skyHorizon) },
  };

  const skyGeo = new THREE.SphereGeometry(220, 32, 20);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor;
      uniform vec3 uMidColor;
      uniform vec3 uHorizonColor;
      varying vec3 vWorldPos;
      void main() {
        float h = clamp(normalize(vWorldPos).y, 0.0, 1.0);
        vec3 col = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.28, h));
        col = mix(col, uTopColor, smoothstep(0.24, 0.85, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  group.add(skyMesh);

  // 1. Warm Golden Key Light (single shadow caster)
  const sunLight = new THREE.DirectionalLight(0xffd093, 2.35);
  sunLight.position.set(38, 28, 26);
  sunLight.castShadow = !isSoftwareGl;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.camera.near = 2;
  sunLight.shadow.camera.far = 120;
  const d = 34;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.025;
  group.add(sunLight);
  group.add(sunLight.target);

  // 2. Cool Indigo-Violet Sky / Warm Earth Hemisphere Fill
  const hemiLight = new THREE.HemisphereLight(0x9980cc, 0x733a3d, 1.05);
  group.add(hemiLight);

  // 3. Rim Backlight for crisp silhouette separation
  const rimLight = new THREE.DirectionalLight(0xff9a76, 0.85);
  rimLight.position.set(-32, 16, -28);
  group.add(rimLight);

  const fog = new THREE.FogExp2(PRESETS[initialPreset].fogColor, PRESETS[initialPreset].fogDensity);
  scene.fog = fog;
  scene.background = new THREE.Color(PRESETS[initialPreset].skyHorizon);

  const sunOffset = new THREE.Vector3(...PRESETS[initialPreset].sunPos);

  const applyPreset = (preset: AtmospherePresetId, targetScene: THREE.Scene) => {
    const cfg = PRESETS[preset];
    skyUniforms.uTopColor.value.setHex(cfg.skyTop);
    skyUniforms.uMidColor.value.setHex(cfg.skyMid);
    skyUniforms.uHorizonColor.value.setHex(cfg.skyHorizon);
    fog.color.setHex(cfg.fogColor);
    fog.density = cfg.fogDensity;
    targetScene.background = new THREE.Color(cfg.skyHorizon);

    sunLight.color.setHex(cfg.sunColor);
    sunLight.intensity = cfg.sunIntensity;
    sunOffset.set(...cfg.sunPos);

    hemiLight.color.setHex(cfg.hemiSky);
    hemiLight.groundColor.setHex(cfg.hemiGround);
    hemiLight.intensity = cfg.hemiIntensity;

    rimLight.color.setHex(cfg.rimColor);
    rimLight.intensity = cfg.rimIntensity;
  };

  const updateSunFollow = (targetX: number, targetZ: number) => {
    sunLight.position.set(targetX + sunOffset.x, sunOffset.y, targetZ + sunOffset.z);
    sunLight.target.position.set(targetX, 0, targetZ);
    sunLight.target.updateMatrixWorld();
  };

  applyPreset(initialPreset, scene);
  scene.add(group);

  return {
    group,
    skyMesh,
    sunLight,
    hemiLight,
    rimLight,
    applyPreset,
    updateSunFollow,
    dispose: () => {
      skyGeo.dispose();
      skyMat.dispose();
    },
  };
}
