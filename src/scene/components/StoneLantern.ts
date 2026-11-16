import * as THREE from 'three';
import type { ProceduralTexturePack } from '../materials/proceduralTextures';
import { groundHeightAt } from '../worldLogic';

/**
 * Independent component: Bruno's iconic Stone & Warm Lattice Lantern.
 * Multi-part procedural THREE.Group (base plinth, chamfered shaft, glowing diamond-lattice cage, roof cap).
 */
export function createStoneLantern(
  textures: ProceduralTexturePack,
  x: number,
  z: number,
  scale = 1,
  withPointLight = false
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'StoneLantern';

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xd9836a,
    roughness: 0.78,
    metalness: 0.06,
  });

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x3b3152,
    roughness: 0.55,
    metalness: 0.2,
  });

  const glowCoreMat = new THREE.MeshStandardMaterial({
    map: textures.lanternGlowMap,
    emissiveMap: textures.lanternGlowMap,
    emissive: new THREE.Color(0xffa73b),
    emissiveIntensity: 1.9,
    roughness: 0.3,
    metalness: 0.05,
  });

  // 1. Stone plinth base (bottom-center pivot at y=0)
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.24, 0.92), darkTrimMat);
  plinth.position.y = 0.12;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // 2. Stepped collar
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.14, 0.76), stoneMat);
  collar.position.y = 0.31;
  collar.castShadow = true;
  group.add(collar);

  // 3. Glowing lattice core box
  const lanternBody = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.78, 0.56), glowCoreMat);
  lanternBody.position.y = 0.77;
  group.add(lanternBody);

  // 4. Four corner stone pillars framing the glowing cage
  const pillarGeo = new THREE.BoxGeometry(0.11, 0.82, 0.11);
  for (const px of [-0.26, 0.26]) {
    for (const pz of [-0.26, 0.26]) {
      const pillar = new THREE.Mesh(pillarGeo, stoneMat);
      pillar.position.set(px, 0.77, pz);
      pillar.castShadow = true;
      group.add(pillar);
    }
  }

  // 5. Eave cornice
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.12, 0.94), stoneMat);
  cornice.position.y = 1.22;
  cornice.castShadow = true;
  group.add(cornice);

  // 6. Beveled pyramid roof cap + glowing top jewel
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.54, 0.34, 4), darkTrimMat);
  roof.rotation.y = Math.PI * 0.25;
  roof.position.y = 1.45;
  roof.castShadow = true;
  group.add(roof);

  const finial = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.12, 0),
    new THREE.MeshStandardMaterial({
      color: 0xffd275,
      emissive: 0xffa030,
      emissiveIntensity: 1.5,
      roughness: 0.25,
    })
  );
  finial.position.y = 1.66;
  group.add(finial);

  if (withPointLight) {
    const light = new THREE.PointLight(0xffa63d, 2.8, 12, 1.8);
    light.position.set(0, 0.85, 0);
    group.add(light);
  }

  const gy = groundHeightAt(x, z);
  group.position.set(x, gy, z);
  group.scale.setScalar(scale);

  return group;
}
