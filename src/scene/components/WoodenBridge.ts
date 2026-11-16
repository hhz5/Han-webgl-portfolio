import * as THREE from 'three';
import type { ProceduralTexturePack } from '../materials/proceduralTextures';
import { bridgeDeckHeightAt, riverCenterZ } from '../worldLogic';
import { createStoneLantern } from './StoneLantern';

/**
 * Independent component: The iconic Wooden Plank Bridge + riverside bench at the spawn vista.
 */
export function createWoodenBridge(textures: ProceduralTexturePack): THREE.Group {
  const group = new THREE.Group();
  group.name = 'WoodenBridge';

  const cz = riverCenterZ(0);

  const plankMat = new THREE.MeshStandardMaterial({
    map: textures.woodMap,
    bumpMap: textures.woodBump,
    bumpScale: 0.04,
    roughness: 0.72,
    metalness: 0.04,
  });

  const postMat = new THREE.MeshStandardMaterial({
    color: 0xd17958,
    roughness: 0.76,
    metalness: 0.05,
  });

  const ironCapMat = new THREE.MeshStandardMaterial({
    color: 0x3b3354,
    roughness: 0.45,
    metalness: 0.55,
  });

  // 1. Arched wooden planks spanning across the river (z from cz-5.8 to cz+5.8)
  const plankCount = 22;
  const span = 11.6;
  const plankGeo = new THREE.BoxGeometry(4.6, 0.16, 0.46);

  for (let i = 0; i < plankCount; i++) {
    const z = cz - span * 0.5 + (i + 0.5) * (span / plankCount);
    const y = bridgeDeckHeightAt(0, z);
    const nextZ = z + 0.3;
    const slope = Math.atan2(bridgeDeckHeightAt(0, nextZ) - y, 0.3);

    const plank = new THREE.Mesh(plankGeo, plankMat);
    plank.position.set(0, y - 0.06, z);
    plank.rotation.x = -slope;
    plank.rotation.y = (Math.sin(i * 1.9) * 0.015);
    plank.castShadow = true;
    plank.receiveShadow = true;
    group.add(plank);
  }

  // 2. Side Curb Beams & Timber Bridge Posts
  const postPositionsZ = [-5.4, -2.7, 0, 2.7, 5.4];
  const postGeo = new THREE.BoxGeometry(0.48, 1.85, 0.48);
  const ironBoltGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);

  for (const sideX of [-2.38, 2.38]) {
    for (let idx = 0; idx < postPositionsZ.length; idx++) {
      const pz = cz + postPositionsZ[idx];
      const deckY = bridgeDeckHeightAt(0, pz);

      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(sideX, deckY + 0.25, pz);
      post.castShadow = true;
      post.receiveShadow = true;
      group.add(post);

      // Decorative dark iron bracket
      const bolt = new THREE.Mesh(ironBoltGeo, ironCapMat);
      bolt.position.set(sideX + (sideX > 0 ? 0.24 : -0.24), deckY + 0.65, pz);
      group.add(bolt);
    }

    // Horizontal handrail beams connecting posts
    for (let idx = 0; idx < postPositionsZ.length - 1; idx++) {
      const zA = cz + postPositionsZ[idx];
      const zB = cz + postPositionsZ[idx + 1];
      const yA = bridgeDeckHeightAt(0, zA) + 0.85;
      const yB = bridgeDeckHeightAt(0, zB) + 0.85;
      const segLen = Math.hypot(zB - zA, yB - yA);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, segLen + 0.15), postMat);
      rail.position.set(sideX, (yA + yB) * 0.5, (zA + zB) * 0.5);
      rail.rotation.x = -Math.atan2(yB - yA, zB - zA);
      rail.castShadow = true;
      group.add(rail);

      // Lower stringer beam
      const lower = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, segLen + 0.15), plankMat);
      lower.position.set(sideX, (yA + yB) * 0.5 - 0.55, (zA + zB) * 0.5);
      lower.rotation.x = -Math.atan2(yB - yA, zB - zA);
      group.add(lower);
    }
  }

  // 3. Cozy Wooden Bench beside the bridge approach (matches Bruno's bridge scene!)
  const bench = new THREE.Group();
  bench.position.set(3.8, 0, cz - 4.4);
  bench.rotation.y = -0.35;

  const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 0.62), plankMat);
  benchSeat.position.y = 0.5;
  benchSeat.castShadow = true;
  bench.add(benchSeat);

  const benchBack = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.52, 0.1), plankMat);
  benchBack.position.set(0, 0.88, -0.26);
  benchBack.rotation.x = -0.15;
  benchBack.castShadow = true;
  bench.add(benchBack);

  for (const bx of [-0.78, 0.78]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.56), ironCapMat);
    leg.position.set(bx, 0.25, 0);
    leg.castShadow = true;
    bench.add(leg);
  }
  group.add(bench);

  // 4. Flanking Stone Lanterns on bridge corners
  group.add(createStoneLantern(textures, -3.4, cz + 5.8, 0.92, true));
  group.add(createStoneLantern(textures, 3.4, cz - 5.8, 0.92, true));

  return group;
}
