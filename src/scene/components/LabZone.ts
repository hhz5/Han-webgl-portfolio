import * as THREE from 'three';
import type { TechLayerItem } from '../../data/resumeConfig';
import { createMetricPillarTexture } from '../materials/proceduralTextures';
import { groundHeightAt } from '../worldLogic';

export interface LabZoneComponent {
  group: THREE.Group;
  update: (elapsed: number) => void;
  dispose: () => void;
}

/**
 * Independent component: AI & Digital Twin Technology Lab.
 * Kinetic 3-ring gyroscope, glowing containment core, and labeled crystal pillars.
 */
export function createLabZone(
  techLayers: TechLayerItem[],
  maxAniso: number
): LabZoneComponent {
  const group = new THREE.Group();
  group.name = 'LabZone';
  const cx = 25;
  const cz = 24;
  group.position.set(cx, groundHeightAt(cx, cz), cz);

  const createdTextures: THREE.Texture[] = [];

  const slateMat = new THREE.MeshStandardMaterial({
    color: 0x342c4a,
    roughness: 0.55,
    metalness: 0.3,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.26,
    metalness: 0.78,
  });

  const cyanGlowMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: new THREE.Color(0x0ea5e9),
    emissiveIntensity: 2.0,
    roughness: 0.18,
  });

  const pad = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 6.8, 0.28, 8), slateMat);
  pad.position.y = 0.14;
  pad.receiveShadow = true;
  group.add(pad);

  const gyroGroup = new THREE.Group();
  gyroGroup.position.set(-4.2, 0, 1.8);
  group.add(gyroGroup);

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 1.22, 0.7, 8), slateMat);
  pedestal.position.y = 0.6;
  pedestal.castShadow = true;
  gyroGroup.add(pedestal);

  const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.095, 12, 36), brassMat);
  ringOuter.position.y = 2.5;
  ringOuter.castShadow = true;
  gyroGroup.add(ringOuter);

  const ringMid = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.08, 10, 32), slateMat);
  ringMid.position.y = 2.5;
  ringMid.castShadow = true;
  gyroGroup.add(ringMid);

  const ringInner = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.065, 10, 28), brassMat);
  ringInner.position.y = 2.5;
  gyroGroup.add(ringInner);

  const energyCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), cyanGlowMat);
  energyCore.position.y = 2.5;
  gyroGroup.add(energyCore);

  const crystals: THREE.Mesh[] = [];
  const layers = techLayers.slice(0, 3);
  const pillarCoords: Array<[number, number]> = [
    [-2.2, -1.5],
    [0.6, -3.2],
    [4.2, -2.5],
  ];
  layers.forEach((layer, i) => {
    const [px, pz] = pillarCoords[i] ?? [0, -4.2];

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.8, 0.7, 6), slateMat);
    base.position.set(px, 0.55, pz);
    base.castShadow = true;
    group.add(base);

    const crystalMat = new THREE.MeshStandardMaterial({
      color: layer.accentHex,
      emissive: new THREE.Color(layer.accentHex),
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 0), crystalMat);
    crystal.position.set(px, 2.75, pz);
    crystal.scale.set(0.7, 1.4, 0.7);
    crystal.castShadow = true;
    group.add(crystal);
    crystals.push(crystal);

    const tex = createMetricPillarTexture(
      `0${i + 1}`,
      layer.title,
      layer.stack,
      layer.accentHex,
      maxAniso
    );
    createdTextures.push(tex);
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 1.45, 0.14),
      new THREE.MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.28,
        roughness: 0.4,
      })
    );
    board.position.set(px, 1.35, pz + 0.65);
    board.lookAt(35.5, 1.35, 38.5);
    board.castShadow = true;
    group.add(board);
  });

  const update = (elapsed: number) => {
    ringOuter.rotation.y = elapsed * 0.55;
    ringOuter.rotation.x = Math.sin(elapsed * 0.4) * 0.35;
    ringMid.rotation.x = elapsed * 0.85;
    ringMid.rotation.z = elapsed * 0.35;
    ringInner.rotation.z = -elapsed * 1.15;
    ringInner.rotation.y = elapsed * 0.6;
    energyCore.rotation.y = -elapsed * 1.2;
    energyCore.scale.setScalar(1 + Math.sin(elapsed * 3.2) * 0.08);

    crystals.forEach((c, idx) => {
      c.position.y = 2.75 + Math.sin(elapsed * 2.1 + idx * 2.1) * 0.2;
      c.rotation.y = elapsed * 0.9 + idx;
    });
  };

  const dispose = () => {
    for (const t of createdTextures) t.dispose();
  };

  return { group, update, dispose };
}
