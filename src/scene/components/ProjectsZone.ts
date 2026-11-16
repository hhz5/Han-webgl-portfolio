import * as THREE from 'three';
import type { ProjectExperienceItem } from '../../data/resumeConfig';
import {
  createProjectScreenTexture,
  type ProceduralTexturePack,
} from '../materials/proceduralTextures';
import { groundHeightAt } from '../worldLogic';

export interface ProjectsZoneComponent {
  group: THREE.Group;
  update: (elapsed: number) => void;
  dispose: () => void;
}

/**
 * Independent component: AI Projects Showcase Plaza + Enterprise MaaS Core Beacon.
 * Dynamically renders featured projects from ResumeSiteConfig.
 */
export function createProjectsZone(
  textures: ProceduralTexturePack,
  projects: ProjectExperienceItem[],
  maxAniso: number
): ProjectsZoneComponent {
  const group = new THREE.Group();
  group.name = 'ProjectsZone';
  const cx = 28;
  const cz = -14;
  const baseY = groundHeightAt(cx, cz);
  group.position.set(cx, baseY, cz);

  const createdTextures: THREE.Texture[] = [];

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

  // Plaza octagonal dais
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(8.2, 8.6, 0.24, 8), frameMat);
  dais.position.y = 0.1;
  dais.receiveShadow = true;
  group.add(dais);

  // Centerpiece "Enterprise MaaS & AIGC Core" Monument positioned cleanly forward so billboards behind stay unobstructed
  const coreGroup = new THREE.Group();
  coreGroup.position.set(-2.8, 0, 3.2);
  group.add(coreGroup);

  const coreBase = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.2, 0.55, 6), trimMat);
  coreBase.position.y = 0.42;
  coreBase.castShadow = true;
  coreGroup.add(coreBase);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.19, 1.75, 8), frameMat);
  mast.position.y = 1.45;
  mast.castShadow = true;
  coreGroup.add(mast);

  const dishPivot = new THREE.Group();
  dishPivot.position.y = 2.5;
  coreGroup.add(dishPivot);

  const ringHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.07, 10, 28),
    new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: new THREE.Color(0xf59e0b),
      emissiveIntensity: 0.8,
      metalness: 0.65,
      roughness: 0.25,
    })
  );
  ringHalo.rotation.x = Math.PI * 0.35;
  dishPivot.add(ringHalo);

  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.38, 0),
    new THREE.MeshStandardMaterial({
      color: 0xfb7185,
      emissive: new THREE.Color(0xf43f5e),
      emissiveIntensity: 2.2,
      roughness: 0.2,
    })
  );
  dishPivot.add(beacon);

  // Project Billboards arranged along a wide northern arc facing the plaza approach (+Z)
  const featured = projects.filter((p) => p.featuredIn3D).slice(0, 6);
  const count = Math.max(1, featured.length);
  featured.forEach((proj, idx) => {
    const t = count === 1 ? 0.5 : idx / (count - 1);
    const angle = -Math.PI * 0.9 + t * Math.PI * 0.8;
    const dist = 6.7;
    const kx = Math.cos(angle) * dist;
    const kz = Math.sin(angle) * dist;

    const kiosk = new THREE.Group();
    kiosk.position.set(kx, 0.22, kz);
    kiosk.lookAt(1.5, 0.22, 8.5);

    for (const lx of [-1.2, 1.2]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.35, 0.22), frameMat);
      leg.position.set(lx, 1.15, 0);
      leg.castShadow = true;
      kiosk.add(leg);
    }

    const casing = new THREE.Mesh(new THREE.BoxGeometry(3.15, 2.05, 0.22), frameMat);
    casing.position.set(0, 2.38, 0);
    casing.castShadow = true;
    kiosk.add(casing);

    const screenTex = createProjectScreenTexture(
      proj.title,
      proj.category,
      proj.accentHex,
      proj.subtitle,
      proj.stats,
      maxAniso
    );
    createdTextures.push(screenTex);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.92, 1.82),
      new THREE.MeshStandardMaterial({
        map: screenTex,
        emissiveMap: screenTex,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.42,
        roughness: 0.28,
      })
    );
    screen.position.set(0, 2.38, 0.12);
    kiosk.add(screen);

    const pad = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.62, 20),
      new THREE.MeshBasicMaterial({
        color: proj.accentHex,
        side: THREE.DoubleSide,
      })
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(0, 0.04, 1.15);
    kiosk.add(pad);

    group.add(kiosk);
  });

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(7.7, 8.0, 32),
    new THREE.MeshBasicMaterial({
      color: 0xfb7185,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.23;
  group.add(ring);

  void textures;

  const update = (elapsed: number) => {
    dishPivot.rotation.y = elapsed * 0.75;
    ringHalo.rotation.z = elapsed * 0.5;
    beacon.scale.setScalar(1 + Math.sin(elapsed * 4.0) * 0.12);
  };

  const dispose = () => {
    for (const t of createdTextures) t.dispose();
  };

  return { group, update, dispose };
}
