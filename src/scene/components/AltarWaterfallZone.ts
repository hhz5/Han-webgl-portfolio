import * as THREE from 'three';
import type { EducationItem } from '../../data/resumeConfig';
import {
  createSignpostTexture,
  type ProceduralTexturePack,
} from '../materials/proceduralTextures';
import { groundHeightAt } from '../worldLogic';

export interface AltarWaterfallComponent {
  group: THREE.Group;
  update: (elapsed: number) => void;
  dispose: () => void;
}

/**
 * Independent component: Education Sanctuary & Waterfall.
 * Displays 3 academic obelisks (Madrid/Cervantes, Northeastern Univ., Shenyang Agric.)
 * framed by hexagonal basalt cliffs and animated waterfall.
 */
export function createAltarAndWaterfall(
  textures: ProceduralTexturePack,
  education: EducationItem[],
  maxAniso: number
): AltarWaterfallComponent {
  const group = new THREE.Group();
  group.name = 'EducationSanctuaryZone';

  const cx = -11;
  const cz = 36;
  const baseY = groundHeightAt(cx, cz);
  const createdTextures: THREE.Texture[] = [];

  const basaltMat = new THREE.MeshStandardMaterial({
    color: 0x3b3157,
    roughness: 0.72,
    metalness: 0.14,
  });

  const purpleGlowMat = new THREE.MeshStandardMaterial({
    color: 0xd8b4fe,
    emissive: new THREE.Color(0x9333ea),
    emissiveIntensity: 1.9,
    roughness: 0.25,
  });

  // 1. Sanctuary Rune Circle on ground
  const altarCircle = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 7.2),
    new THREE.MeshBasicMaterial({
      map: textures.runeCircleMap,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    })
  );
  altarCircle.rotation.x = -Math.PI / 2;
  altarCircle.position.set(cx, baseY + 0.05, cz);
  group.add(altarCircle);

  // 2. Academic Obelisks arranged in distinct screen lanes flanking the waterfall pool
  const obeliskCoords: Array<[number, number]> = [
    [cx + 6.2, cz + 2.8],
    [cx - 3.6, cz + 1.4],
    [cx - 6.8, cz - 1.0],
  ];
  education.slice(0, 3).forEach((edu, i) => {
    const [ox, oz] = obeliskCoords[i] ?? [cx, cz];
    const oy = groundHeightAt(ox, oz);

    const obelisk = new THREE.Group();
    obelisk.position.set(ox, oy, oz);
    obelisk.lookAt(cx + 8, oy, cz - 15);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.58, 2.7, 6), basaltMat);
    shaft.position.y = 1.35;
    shaft.castShadow = true;
    obelisk.add(shaft);

    const runeCap = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), purpleGlowMat);
    runeCap.position.y = 3.05;
    obelisk.add(runeCap);

    const plaqueTex = createSignpostTexture(
      edu.school,
      `${edu.period} · ${edu.major} · ${edu.degree}`,
      maxAniso
    );
    createdTextures.push(plaqueTex);
    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(2.75, 0.92, 0.14),
      new THREE.MeshStandardMaterial({
        map: plaqueTex,
        emissiveMap: plaqueTex,
        emissive: new THREE.Color(0xe9d5ff),
        emissiveIntensity: 0.25,
        roughness: 0.4,
      })
    );
    plaque.position.set(0, 1.55, 0.65);
    obelisk.add(plaque);

    group.add(obelisk);
  });

  // 3. Hexagonal Waterfall Cliff & Basin behind the Sanctuary (z = 44)
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

  const fallUniforms = { uTime: { value: 0 } };
  const fallMat = new THREE.MeshStandardMaterial({
    color: 0x60a5fa,
    emissive: new THREE.Color(0x2563eb),
    emissiveIntensity: 0.55,
    roughness: 0.15,
    transparent: true,
    opacity: 0.9,
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
         float foam = smoothstep(0.62, 0.95, streak * (1.0 - flow));
         diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.88, 0.96, 1.0), foam * 0.72);`
      );
  };

  // Position cleanly in front of the central basalt cliff (z = 44 - 0.5 - 1.6 = 41.9)
  const waterfallMesh = new THREE.Mesh(new THREE.BoxGeometry(2.3, 4.9, 0.4), fallMat);
  waterfallMesh.position.set(cliffX, 2.45, cliffZ - 2.35);
  group.add(waterfallMesh);

  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(3.4, 24),
    new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.14,
      metalness: 0.3,
    })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(cliffX, baseY + 0.08, cliffZ - 3.6);
  group.add(pool);

  // 4. Levitating Crystal Focus flanking left side of waterfall (keeps waterfall ribbon clear!)
  const pillar = new THREE.Mesh(new THREE.OctahedronGeometry(0.82, 0), purpleGlowMat);
  pillar.scale.set(0.75, 1.65, 0.75);
  pillar.position.set(cx + 3.4, baseY + 2.6, cz + 6.0);
  pillar.castShadow = true;
  group.add(pillar);

  const update = (elapsed: number) => {
    fallUniforms.uTime.value = elapsed;
    pillar.position.y = baseY + 2.6 + Math.sin(elapsed * 2.0) * 0.28;
    pillar.rotation.y = elapsed * 0.7;
    altarCircle.rotation.z = elapsed * 0.18;
  };

  const dispose = () => {
    for (const t of createdTextures) t.dispose();
  };

  return { group, update, dispose };
}
