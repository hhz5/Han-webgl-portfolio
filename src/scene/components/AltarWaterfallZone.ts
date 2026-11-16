import * as THREE from 'three';
import type { ProceduralTexturePack } from '../materials/proceduralTextures';
import { groundHeightAt } from '../worldLogic';

export interface AltarWaterfallComponent {
  group: THREE.Group;
  update: (elapsed: number) => void;
}

/**
 * Independent component: Mystical Altar (star rune circle + purple obelisks)
 * paired with the Achievements Waterfall & levitating rune pillar.
 */
export function createAltarAndWaterfall(textures: ProceduralTexturePack): AltarWaterfallComponent {
  const group = new THREE.Group();
  group.name = 'AltarWaterfallZone';

  const cx = -11;
  const cz = 36;
  const baseY = groundHeightAt(cx, cz);

  const basaltMat = new THREE.MeshStandardMaterial({
    color: 0x3b3157,
    roughness: 0.72,
    metalness: 0.14,
  });

  const purpleGlowMat = new THREE.MeshStandardMaterial({
    color: 0xd8b4fe,
    emissive: new THREE.Color(0x9333ea),
    emissiveIntensity: 2.0,
    roughness: 0.25,
  });

  // 1. Altar Rune Circle on ground
  const altarCircle = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 7.2),
    new THREE.MeshBasicMaterial({
      map: textures.runeCircleMap,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })
  );
  altarCircle.rotation.x = -Math.PI / 2;
  altarCircle.position.set(cx, baseY + 0.05, cz);
  group.add(altarCircle);

  // 5 Hexagonal Basalt Obelisks ringing the Altar
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const ox = cx + Math.cos(a) * 4.4;
    const oz = cz + Math.sin(a) * 4.4;
    const oy = groundHeightAt(ox, oz);

    const obelisk = new THREE.Group();
    obelisk.position.set(ox, oy, oz);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.55, 2.8, 6), basaltMat);
    shaft.position.y = 1.4;
    shaft.castShadow = true;
    obelisk.add(shaft);

    const runeCap = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), purpleGlowMat);
    runeCap.position.y = 3.1;
    obelisk.add(runeCap);
    group.add(obelisk);
  }

  // 2. Hexagonal Waterfall Cliff & Basin behind the Altar (z = 44)
  const cliffX = -11;
  const cliffZ = 44;
  const cliffCoords: Array<[number, number, number, number]> = [
    [-2.2, 0, 1.4, 4.6],
    [0, -0.5, 1.6, 5.4],
    [2.1, 0.1, 1.4, 4.4],
    [-1.2, 1.4, 1.2, 3.2],
    [1.3, 1.4, 1.2, 3.4],
  ];
  for (const [dx, dz, rad, h] of cliffCoords) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 1.06, h, 6), basaltMat);
    col.position.set(cliffX + dx, h * 0.5, cliffZ + dz);
    col.castShadow = true;
    col.receiveShadow = true;
    group.add(col);
  }

  // Cascading animated water ribbon
  const fallUniforms = { uTime: { value: 0 } };
  const fallMat = new THREE.MeshStandardMaterial({
    color: 0x60a5fa,
    emissive: new THREE.Color(0x2563eb),
    emissiveIntensity: 0.45,
    roughness: 0.15,
    transparent: true,
    opacity: 0.85,
  });
  fallMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = fallUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vFallUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFallUv = uv;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uTime;\nvarying vec2 vFallUv;'
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float streak = sin(vFallUv.x * 24.0) * 0.5 + 0.5;
         float flow = fract(vFallUv.y * 3.0 + uTime * 1.8);
         float foam = smoothstep(0.65, 0.95, streak * (1.0 - flow));
         diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.85, 0.95, 1.0), foam * 0.65);`
      );
  };

  const waterfallMesh = new THREE.Mesh(new THREE.BoxGeometry(2.1, 4.6, 0.35), fallMat);
  waterfallMesh.position.set(cliffX, 2.3, cliffZ - 1.35);
  group.add(waterfallMesh);

  // Waterfall plunge pool
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(3.3, 24),
    new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.14,
      metalness: 0.3,
    })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(cliffX, baseY + 0.08, cliffZ - 2.6);
  group.add(pool);

  // 3. Levitating Achievements Pillar beside the waterfall
  const pillar = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), purpleGlowMat);
  pillar.scale.set(0.75, 1.9, 0.75);
  pillar.position.set(cx, baseY + 2.8, cz);
  pillar.castShadow = true;
  group.add(pillar);

  const update = (elapsed: number) => {
    fallUniforms.uTime.value = elapsed;
    pillar.position.y = baseY + 2.7 + Math.sin(elapsed * 2.0) * 0.32;
    pillar.rotation.y = elapsed * 0.7;
    altarCircle.rotation.z = elapsed * 0.18;
  };

  return { group, update };
}
