import * as THREE from 'three';
import { groundHeightAt } from '../worldLogic';

export interface LabZoneComponent {
  group: THREE.Group;
  update: (elapsed: number) => void;
}

/**
 * Independent component: Science & Shader Lab Zone.
 * Kinetic 3-ring gyroscope, glowing containment core, and floating basalt crystal prisms.
 */
export function createLabZone(): LabZoneComponent {
  const group = new THREE.Group();
  group.name = 'LabZone';
  const cx = 25;
  const cz = 24;
  group.position.set(cx, groundHeightAt(cx, cz), cz);

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
    emissiveIntensity: 2.1,
    roughness: 0.18,
  });

  // 1. Octagonal Lab Pad
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 6.0, 0.28, 8), slateMat);
  pad.position.y = 0.14;
  pad.receiveShadow = true;
  group.add(pad);

  // 2. Pedestal + 3-Axis Kinetic Gyroscope
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.45, 0.85, 8), slateMat);
  pedestal.position.y = 0.7;
  pedestal.castShadow = true;
  group.add(pedestal);

  const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.11, 12, 36), brassMat);
  ringOuter.position.y = 3.2;
  ringOuter.castShadow = true;
  group.add(ringOuter);

  const ringMid = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.09, 10, 32), slateMat);
  ringMid.position.y = 3.2;
  ringMid.castShadow = true;
  group.add(ringMid);

  const ringInner = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.075, 10, 28), brassMat);
  ringInner.position.y = 3.2;
  group.add(ringInner);

  const energyCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1), cyanGlowMat);
  energyCore.position.y = 3.2;
  group.add(energyCore);

  // 3. Three surrounding floating crystal pylons
  const crystals: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const px = Math.cos(a) * 4.2;
    const pz = Math.sin(a) * 4.2;

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.65, 6), slateMat);
    base.position.set(px, 0.55, pz);
    base.castShadow = true;
    group.add(base);

    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.52, 0), cyanGlowMat);
    crystal.position.set(px, 1.85, pz);
    crystal.scale.set(0.7, 1.45, 0.7);
    crystal.castShadow = true;
    group.add(crystal);
    crystals.push(crystal);
  }

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
      c.position.y = 1.85 + Math.sin(elapsed * 2.1 + idx * 2.1) * 0.24;
      c.rotation.y = elapsed * 0.9 + idx;
    });
  };

  return { group, update };
}
