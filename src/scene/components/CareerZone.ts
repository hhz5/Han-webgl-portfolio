import * as THREE from 'three';
import type { CareerMilestoneItem } from '../../data/resumeConfig';
import { createSignpostTexture } from '../materials/proceduralTextures';
import { groundHeightAt } from '../worldLogic';

export interface CareerZoneComponent {
  group: THREE.Group;
  dispose: () => void;
}

/**
 * Independent component: Career Timeline Avenue with monumental arches
 * representing each company & role from ResumeSiteConfig.
 */
export function createCareerZone(
  careers: CareerMilestoneItem[],
  maxAniso: number
): CareerZoneComponent {
  const group = new THREE.Group();
  group.name = 'CareerZone';
  const cx = -26;
  const cz = -25;
  group.position.set(cx, groundHeightAt(cx, cz), cz);
  group.rotation.y = 0.22;

  const createdTextures: THREE.Texture[] = [];

  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0xd9805b,
    roughness: 0.72,
    metalness: 0.08,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x3b3152,
    roughness: 0.5,
    metalness: 0.28,
  });

  const count = Math.max(1, careers.length);
  const spacing = 3.6;
  const runwayLength = Math.max(12, count * spacing + 2.2);

  const walkway = new THREE.Mesh(
    new THREE.BoxGeometry(6.2, 0.14, runwayLength),
    trimMat
  );
  walkway.position.set(0, 0.06, 0);
  walkway.receiveShadow = true;
  group.add(walkway);

  // Order arches so newest career (影谱科技) stands nearest the south entrance (+Z)
  const ordered = [...careers].reverse();
  ordered.forEach((m, idx) => {
    const zOffset = -((count - 1) * spacing) / 2 + idx * spacing;
    const arch = new THREE.Group();
    arch.position.set(0, 0.1, zOffset);

    for (const sx of [-2.55, 2.55]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.56, 3.35, 0.56), pillarMat);
      col.position.set(sx, 1.67, 0);
      col.castShadow = true;
      arch.add(col);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.22, 0.74), trimMat);
      cap.position.set(sx, 3.4, 0);
      arch.add(cap);
    }

    const beam = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.58, 0.62), pillarMat);
    beam.position.set(0, 3.7, 0);
    beam.castShadow = true;
    arch.add(beam);

    const signTex = createSignpostTexture(
      `${m.company}`,
      `${m.period} · ${m.role}`,
      maxAniso
    );
    createdTextures.push(signTex);

    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(4.1, 1.28),
      new THREE.MeshStandardMaterial({
        map: signTex,
        emissiveMap: signTex,
        emissive: new THREE.Color(0xffcfa0),
        emissiveIntensity: 0.28,
        roughness: 0.4,
      })
    );
    plaque.position.set(0, 3.7, 0.34);
    arch.add(plaque);

    const plaqueBack = plaque.clone();
    plaqueBack.rotation.y = Math.PI;
    plaqueBack.position.z = -0.34;
    arch.add(plaqueBack);

    group.add(arch);
  });

  const dispose = () => {
    for (const t of createdTextures) t.dispose();
  };

  return { group, dispose };
}
