import * as THREE from 'three';
import {
  createProjectScreenTexture,
  type ProceduralTexturePack,
} from '../materials/proceduralTextures';
import { groundHeightAt } from '../worldLogic';

export interface ProjectsZoneComponent {
  group: THREE.Group;
  update: (elapsed: number) => void;
}

export const PORTFOLIO_PROJECTS = [
  {
    title: 'Three.js Journey',
    category: 'Course · 90+ Hours',
    accent: '#fbbf24',
    subtitle: 'WebGL & TSL Masterclass',
    description:
      '系统化的 Three.js 与 WebGPU / TSL 着色器实战课程，涵盖物理引擎、Blender 烘焙、粒子系统与后处理管线。',
    stats: '45,000+ 学员 · 65 节高清课程',
  },
  {
    title: 'Folio 2025 WebGPU',
    category: 'Interactive World',
    accent: '#fb7185',
    subtitle: 'Open-World Portfolio',
    description:
      '基于 Three.js Shading Language (TSL) 与 Rapier 物理引擎打造的开放世界作品集，支持探索、赛车与多人微语旗帜。',
    stats: 'WebGPU + WebGL2 · 38 项成就',
  },
  {
    title: 'Terrain & Water Lab',
    category: 'Procedural Shaders',
    accent: '#38bdf8',
    subtitle: 'Real-Time Stylized Nature',
    description:
      '全程序化草地实例化、海岸线波纹泡沫、大气散射雾效与动态昼夜光照系统，专为轻量化浏览器流畅运行优化。',
    stats: '0 外部资源 · 60 FPS 流畅渲染',
  },
  {
    title: 'Orongo & Madbox',
    category: 'Creative Direction',
    accent: '#a855f7',
    subtitle: 'WebGL Studio Experiments',
    description:
      '为创意机构与独立游戏打造的互动式品牌体验，融合触觉物理反馈、动态音频合成与低多边形美术风格。',
    stats: 'FWA & Awwwards SOTD',
  },
];

/**
 * Independent component: Projects Showcase Plaza + "Fix the WiFi" rotating satellite/antenna monument.
 */
export function createProjectsZone(
  textures: ProceduralTexturePack,
  maxAniso: number
): ProjectsZoneComponent {
  const group = new THREE.Group();
  group.name = 'ProjectsZone';
  const cx = 28;
  const cz = -14;
  const baseY = groundHeightAt(cx, cz);
  group.position.set(cx, baseY, cz);

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x332b47,
    roughness: 0.45,
    metalness: 0.35,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xd97d54,
    roughness: 0.65,
    metalness: 0.1,
  });

  // Plaza stone dais
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.6, 0.22, 8), frameMat);
  dais.position.y = 0.08;
  dais.receiveShadow = true;
  group.add(dais);

  // Centerpiece "Fix the WiFi" Antenna Monument
  const wifiBase = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.35, 0.7, 6), trimMat);
  wifiBase.position.y = 0.5;
  wifiBase.castShadow = true;
  group.add(wifiBase);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 3.2, 8), frameMat);
  mast.position.y = 2.2;
  mast.castShadow = true;
  group.add(mast);

  const dishPivot = new THREE.Group();
  dishPivot.position.y = 3.7;
  group.add(dishPivot);

  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.45),
    new THREE.MeshStandardMaterial({
      color: 0xf4a071,
      roughness: 0.35,
      metalness: 0.4,
      side: THREE.DoubleSide,
    })
  );
  dish.rotation.x = Math.PI * 0.72;
  dish.castShadow = true;
  dishPivot.add(dish);

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 12, 12),
    new THREE.MeshStandardMaterial({
      color: 0xfb7185,
      emissive: new THREE.Color(0xf43f5e),
      emissiveIntensity: 2.4,
    })
  );
  beacon.position.set(0, 0.35, 0.45);
  dishPivot.add(beacon);

  // 4 Sculpted Project Billboard Kiosks arranged along the north arc facing the plaza approach (+Z/+X)
  const kioskAngles = [-Math.PI * 0.85, -Math.PI * 0.62, -Math.PI * 0.38, -Math.PI * 0.15];
  PORTFOLIO_PROJECTS.forEach((proj, idx) => {
    const angle = kioskAngles[idx];
    const dist = 5.4;
    const kx = Math.cos(angle) * dist;
    const kz = Math.sin(angle) * dist;

    const kiosk = new THREE.Group();
    kiosk.position.set(kx, 0.18, kz);
    kiosk.lookAt(0, 0.18, 4.5);

    // Dual support legs
    for (const lx of [-1.25, 1.25]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.2, 0.24), frameMat);
      leg.position.set(lx, 1.1, 0);
      leg.castShadow = true;
      kiosk.add(leg);
    }

    // Billboard casing
    const casing = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.1, 0.24), frameMat);
    casing.position.set(0, 2.25, 0);
    casing.castShadow = true;
    kiosk.add(casing);

    // Procedural screen canvas
    const screenTex = createProjectScreenTexture(
      proj.title,
      proj.category,
      proj.accent,
      proj.subtitle,
      maxAniso
    );
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.94, 1.84),
      new THREE.MeshStandardMaterial({
        map: screenTex,
        emissiveMap: screenTex,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.45,
        roughness: 0.25,
      })
    );
    screen.position.set(0, 2.25, 0.13);
    kiosk.add(screen);

    // Glowing foot pad in front of kiosk
    const pad = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.65, 20),
      new THREE.MeshBasicMaterial({
        color: proj.accent,
        side: THREE.DoubleSide,
      })
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(0, 0.04, 1.2);
    kiosk.add(pad);

    group.add(kiosk);
  });

  // Subtle decorative ground ring using wood texture accent
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(6.8, 7.1, 32),
    new THREE.MeshBasicMaterial({
      color: 0xfb7185,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.21;
  group.add(ring);

  // Keep reference to textures used for consistency
  void textures;

  const update = (elapsed: number) => {
    dishPivot.rotation.y = elapsed * 0.75;
    beacon.scale.setScalar(1 + Math.sin(elapsed * 4.5) * 0.14);
  };

  return { group, update };
}
