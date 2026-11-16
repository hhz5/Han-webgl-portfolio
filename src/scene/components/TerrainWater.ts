import * as THREE from 'three';
import type { ProceduralTexturePack } from '../materials/proceduralTextures';
import { groundHeightAt, riverCenterZ, WORLD_ZONES } from '../worldLogic';

export interface TerrainWaterComponent {
  group: THREE.Group;
  update: (elapsed: number) => void;
}

/**
 * Independent component: Continuous sculpted terrain, glowing sapphire river water,
 * hexagonal basalt rock pillars, stone-edged trails, instanced golden grass, and stylized trees.
 */
export function createTerrainAndWater(textures: ProceduralTexturePack): TerrainWaterComponent {
  const group = new THREE.Group();
  group.name = 'TerrainAndWater';

  // 1. Continuous Ground Mesh (170x170m so horizon blends smoothly into fog)
  const terrainGeo = new THREE.PlaneGeometry(170, 170, 110, 110);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(posAttr.count * 3);
  const cDry = new THREE.Color(0xe68d68); // warm peach-terracotta
  const cPath = new THREE.Color(0xf2a77b); // lighter sandy path
  const cBed = new THREE.Color(0x6b455c); // deep plum-slate riverbed
  const cHill = new THREE.Color(0xc96b59); // richer dusk terracotta hills
  const tmpColor = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    // Do not apply bridge deck height to underlying terrain mesh (riverbed stays carved under the bridge!)
    const cz = riverCenterZ(x);
    const distRiver = Math.abs(z - cz);
    const riverHalfW = 4.1 + Math.sin(x * 0.14) * 0.6;
    let y = 0;
    if (distRiver < riverHalfW) {
      const t = distRiver / riverHalfW;
      y = -1.25 * (1 - t * t);
    } else if (distRiver < riverHalfW + 2.4) {
      const t = (distRiver - riverHalfW) / 2.4;
      y = -0.05 * (1 - t);
    }

    const radial = Math.hypot(x, z);
    if (radial > 48) {
      const hf = Math.min(1, (radial - 48) / 36);
      const rolling =
        (Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.5 + 0.5) * 6.5 +
        Math.sin(x * 0.04 + z * 0.05) * 2.0;
      y += hf * hf * (2.5 + rolling);
    }

    const altarDist = Math.hypot(x + 11, z - 44);
    if (altarDist < 10) {
      const m = 1 - altarDist / 10;
      y += m * m * 2.2;
    }

    posAttr.setY(i, y);

    // Vertex color shading by elevation & path proximity
    tmpColor.copy(cDry);
    if (y < -0.15) {
      tmpColor.lerp(cBed, Math.min(1, (-y) / 1.1));
    } else if (y > 0.6) {
      tmpColor.lerp(cHill, Math.min(1, (y - 0.6) / 4.0));
    } else {
      // Brighten paths radiating toward zones
      const onMainAxis = Math.abs(x) < 2.6 && Math.abs(z) < 35;
      const nearZone = WORLD_ZONES.some((wz) => Math.hypot(x - wz.x, z - wz.z) < 5.5);
      if (onMainAxis || nearZone) {
        tmpColor.lerp(cPath, 0.55);
      }
    }
    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }

  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.groundMap,
    bumpMap: textures.groundBump,
    bumpScale: 0.08,
    vertexColors: true,
    roughness: 0.88,
    metalness: 0.02,
  });

  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  group.add(terrainMesh);

  // 2. Animated Stylized River Water (custom onBeforeCompile wave & shoreline foam)
  const waterUniforms = {
    uTime: { value: 0 },
  };
  const waterGeo = new THREE.PlaneGeometry(160, 26, 64, 16);
  waterGeo.rotateX(-Math.PI / 2);
  const wPos = waterGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < wPos.count; i++) {
    const x = wPos.getX(i);
    const localZ = wPos.getZ(i);
    wPos.setZ(i, localZ + riverCenterZ(x));
  }
  waterGeo.computeVertexNormals();

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x2f5394,
    roughness: 0.16,
    metalness: 0.32,
    transparent: true,
    opacity: 0.9,
  });

  waterMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = waterUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uTime;
         varying vec3 vWaterWorld;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         transformed.y += sin(transformed.x * 0.45 + uTime * 2.2) * 0.04 + cos(transformed.z * 0.65 - uTime * 1.7) * 0.03;
         vWaterWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uTime;
         varying vec3 vWaterWorld;`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float stream = sin(vWaterWorld.x * 0.45 + uTime * 2.1 + sin(vWaterWorld.z * 0.9) * 1.4);
         float streak = smoothstep(0.72, 0.96, stream);
         float bankWave = smoothstep(0.55, 0.92, sin(vWaterWorld.z * 1.6 - uTime * 1.6) * 0.5 + 0.5);
         diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.68, 0.96), streak * 0.32 + bankWave * 0.14);`
      );
  };

  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = -0.34;
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  // 3. Signature Hexagonal Basalt Rock Clusters in & around the river (from bruno-share.png!)
  const hexGeo = new THREE.CylinderGeometry(1.0, 1.05, 2.2, 6);
  const hexMat = new THREE.MeshStandardMaterial({
    color: 0x453b66,
    roughness: 0.72,
    metalness: 0.12,
  });
  const hexCoords: Array<[number, number, number, number]> = [
    [-7.5, riverCenterZ(-7.5) + 0.5, 1.15, 0.9],
    [-9.2, riverCenterZ(-9.2) - 0.8, 1.35, 1.25],
    [-11.0, riverCenterZ(-11.0) + 1.0, 0.95, 0.75],
    [7.2, riverCenterZ(7.2) - 0.6, 1.25, 1.05],
    [9.4, riverCenterZ(9.4) + 0.9, 1.45, 1.35],
    [11.4, riverCenterZ(11.4) - 1.1, 1.0, 0.8],
    [13.6, riverCenterZ(13.6) + 0.4, 1.1, 1.0],
    [-16.5, riverCenterZ(-16.5) - 0.4, 1.3, 1.1],
    [-18.8, riverCenterZ(-18.8) + 1.1, 0.9, 0.8],
    [22.0, riverCenterZ(22.0) - 0.5, 1.4, 1.2],
  ];
  const hexInstanced = new THREE.InstancedMesh(hexGeo, hexMat, hexCoords.length);
  hexInstanced.castShadow = true;
  hexInstanced.receiveShadow = true;
  const dummy = new THREE.Object3D();
  hexCoords.forEach(([hx, hz, sx, sy], idx) => {
    dummy.position.set(hx, -0.35 + sy * 0.55, hz);
    dummy.rotation.set(0, idx * 0.5, 0);
    dummy.scale.set(sx, sy, sx);
    dummy.updateMatrix();
    hexInstanced.setMatrixAt(idx, dummy.matrix);
  });
  hexInstanced.instanceMatrix.needsUpdate = true;
  hexInstanced.computeBoundingSphere();
  group.add(hexInstanced);

  // 4. Instanced Lush 3-Blade Golden-Olive Grass Tufts along riverbanks & meadows
  const bladeGeo = new THREE.BufferGeometry();
  const bladeVerts = new Float32Array([
    // Blade 1 (center tall)
    -0.09, 0, 0,   0.09, 0, 0,   0.0, 0.92, 0.05,
    // Blade 2 (left tilted)
    -0.18, 0, 0.05, -0.02, 0, -0.04, -0.26, 0.72, 0.08,
    // Blade 3 (right tilted)
    0.02, 0, -0.04,  0.18, 0, 0.05,  0.25, 0.76, -0.06,
  ]);
  bladeGeo.setAttribute('position', new THREE.BufferAttribute(bladeVerts, 3));
  bladeGeo.computeVertexNormals();

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const grassCount = 960;
  const grassInstanced = new THREE.InstancedMesh(bladeGeo, grassMat, grassCount);
  const grassColorA = new THREE.Color(0xc49547);
  const grassColorB = new THREE.Color(0x918a41);
  const grassColorC = new THREE.Color(0xd97d48);
  const grassTint = new THREE.Color();

  let gSeed = 4242;
  const gRand = () => {
    gSeed = (gSeed * 16807) % 2147483647;
    return (gSeed - 1) / 2147483646;
  };

  let placed = 0;
  let attempts = 0;
  while (placed < grassCount && attempts < 4000) {
    attempts++;
    const gx = (gRand() - 0.5) * 98;
    const gz = (gRand() - 0.5) * 98;
    const gy = groundHeightAt(gx, gz);
    if (gy < -0.15) continue;
    // Keep roads, bridge, and zone plazas completely clear of grass blades
    if (Math.abs(gx) < 3.4 && Math.abs(gz) < 16) continue;
    const nearZone = WORLD_ZONES.some(
      (zDef) => Math.hypot(gx - zDef.x, gz - zDef.z) < zDef.radius + 1.6
    );
    if (nearZone) continue;

    dummy.position.set(gx, gy, gz);
    dummy.rotation.set((gRand() - 0.5) * 0.25, gRand() * Math.PI * 2, (gRand() - 0.5) * 0.25);
    const s = 0.75 + gRand() * 0.65;
    dummy.scale.set(s, 0.8 + gRand() * 0.7, s);
    dummy.updateMatrix();
    grassInstanced.setMatrixAt(placed, dummy.matrix);

    const t = gRand();
    grassTint.copy(t < 0.5 ? grassColorA : t < 0.85 ? grassColorB : grassColorC);
    grassInstanced.setColorAt(placed, grassTint);
    placed++;
  }
  grassInstanced.count = placed;
  grassInstanced.instanceMatrix.needsUpdate = true;
  if (grassInstanced.instanceColor) grassInstanced.instanceColor.needsUpdate = true;
  grassInstanced.computeBoundingSphere();
  group.add(grassInstanced);

  // 5. Stylized Multi-Part Trees around perimeter & riverbanks (Instanced trunks + crowns)
  const treePositions: Array<[number, number, number]> = [];
  const isClearOfZonesAndCameras = (tx: number, tz: number) =>
    !WORLD_ZONES.some((zDef) => {
      const distCenter = Math.hypot(tx - zDef.x, tz - zDef.z);
      const camX = zDef.x + zDef.spawnOffset[0] + zDef.cameraOffset[0];
      const camZ = zDef.z + zDef.spawnOffset[1] + zDef.cameraOffset[2];
      const distCam = Math.hypot(tx - camX, tz - camZ);
      return distCenter < zDef.radius + 5.2 || distCam < 8.5;
    });

  for (let i = 0; i < 42; i++) {
    const angle = (i / 42) * Math.PI * 2 + gRand() * 0.14;
    const radius = 38 + gRand() * 18;
    const tx = Math.cos(angle) * radius;
    const tz = Math.sin(angle) * radius;
    if (groundHeightAt(tx, tz) < -0.2) continue;
    if (!isClearOfZonesAndCameras(tx, tz)) continue;
    treePositions.push([tx, tz, 0.85 + gRand() * 0.55]);
  }
  // A few decorative meadow trees well clear of exhibit plazas & sightlines
  for (const [tx, tz, ts] of [
    [-11, -18, 1.0],
    [13, -6, 0.95],
    [14, 15, 1.05],
    [9, -24, 0.9],
  ] as Array<[number, number, number]>) {
    if (groundHeightAt(tx, tz) >= -0.1 && isClearOfZonesAndCameras(tx, tz)) {
      treePositions.push([tx, tz, ts]);
    }
  }

  const trunkGeo = new THREE.CylinderGeometry(0.24, 0.38, 2.2, 7);
  trunkGeo.translate(0, 1.1, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b3f3d, roughness: 0.88 });
  const crownGeo = new THREE.DodecahedronGeometry(1.55, 1);
  const crownMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.72,
    flatShading: true,
  });

  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treePositions.length);
  const crownInst = new THREE.InstancedMesh(crownGeo, crownMat, treePositions.length);
  trunkInst.castShadow = true;
  crownInst.castShadow = true;
  crownInst.receiveShadow = true;

  const crownColors = [
    new THREE.Color(0xd99241),
    new THREE.Color(0xc86d44),
    new THREE.Color(0xa69b48),
    new THREE.Color(0xe0784e),
  ];

  treePositions.forEach(([tx, tz, ts], idx) => {
    const ty = groundHeightAt(tx, tz);
    dummy.position.set(tx, ty, tz);
    dummy.rotation.set(0, idx * 1.1, 0);
    dummy.scale.setScalar(ts);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(tx, ty + 2.55 * ts, tz);
    dummy.scale.set(ts * 1.08, ts * 0.95, ts * 1.08);
    dummy.updateMatrix();
    crownInst.setMatrixAt(idx, dummy.matrix);
    crownInst.setColorAt(idx, crownColors[idx % crownColors.length]);
  });

  trunkInst.instanceMatrix.needsUpdate = true;
  crownInst.instanceMatrix.needsUpdate = true;
  if (crownInst.instanceColor) crownInst.instanceColor.needsUpdate = true;
  trunkInst.computeBoundingSphere();
  crownInst.computeBoundingSphere();
  group.add(trunkInst, crownInst);

  const update = (elapsed: number) => {
    waterUniforms.uTime.value = elapsed;
  };

  return { group, update };
}
