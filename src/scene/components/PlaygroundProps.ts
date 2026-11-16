import * as THREE from 'three';
import type { ResumeSiteConfig } from '../../data/resumeConfig';
import {
  createMetricPillarTexture,
  createSignpostTexture,
  createWelcomeMonolithTexture,
  type ProceduralTexturePack,
} from '../materials/proceduralTextures';
import {
  groundHeightAt,
  riverCenterZ,
  WORLD_RAMPS,
  type DynamicBody,
} from '../worldLogic';

export interface PlaygroundPropsComponent {
  group: THREE.Group;
  crates: DynamicBody[];
  resetCrates: () => void;
  update: (dt: number) => void;
  dispose: () => void;
}

/**
 * Independent component: Candidate Welcome Monolith ("韩鸿哲 · AI 产品总监"),
 * 4 Core Overview Highlight Steles, Directional Signposts to enabled resume modules,
 * and optional Stunt Ramps + Knockable Crates.
 */
export function createPlaygroundProps(
  textures: ProceduralTexturePack,
  config: ResumeSiteConfig,
  maxAniso: number
): PlaygroundPropsComponent {
  const group = new THREE.Group();
  group.name = 'PlaygroundProps';

  const createdTextures: THREE.Texture[] = [];

  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.woodMap,
    bumpMap: textures.woodBump,
    bumpScale: 0.04,
    roughness: 0.72,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x342c4a,
    roughness: 0.55,
    metalness: 0.25,
  });

  const enableProps = config.display.enableStuntProps;

  // 1. Stunt Jump Ramps (matching WORLD_RAMPS physics when enabled)
  if (enableProps) {
    for (const r of WORLD_RAMPS) {
      const rampGroup = new THREE.Group();
      rampGroup.position.set(r.x, 0, r.z);
      rampGroup.rotation.y = r.yaw;

      const shape = new THREE.Shape();
      shape.moveTo(-r.length * 0.5, 0);
      shape.lineTo(r.length * 0.5, 0);
      shape.lineTo(r.length * 0.5, r.height);
      shape.closePath();

      const rampGeo = new THREE.ExtrudeGeometry(shape, {
        depth: r.width,
        bevelEnabled: false,
      });
      rampGeo.translate(0, 0, -r.width * 0.5);
      rampGeo.rotateY(-Math.PI / 2);

      const rampMesh = new THREE.Mesh(rampGeo, woodMat);
      rampMesh.castShadow = true;
      rampMesh.receiveShadow = true;
      rampGroup.add(rampMesh);

      const lipBar = new THREE.Mesh(
        new THREE.BoxGeometry(r.width * 0.88, 0.08, 0.24),
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: new THREE.Color(0xf59e0b),
          emissiveIntensity: 1.4,
        })
      );
      lipBar.position.set(0, r.height + 0.02, r.length * 0.5 - 0.16);
      rampGroup.add(lipBar);
      group.add(rampGroup);
    }
  }

  // 2. Knockable Wooden Crates (lightweight driving physics props)
  const crateSpecs: Array<{ x: number; z: number }> = enableProps
    ? [
        { x: 6.2, z: 3.6 },
        { x: 7.3, z: 4.0 },
        { x: 6.7, z: 2.7 },
        { x: 18, z: -18 },
        { x: 19.2, z: -18.2 },
      ]
    : [];

  const crates: DynamicBody[] = [];
  const crateMeshes: THREE.Object3D[] = [];

  crateSpecs.forEach((spec) => {
    const gy = groundHeightAt(spec.x, spec.z, enableProps);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.92, 0.92), woodMat);
    box.position.set(spec.x, gy + 0.46, spec.z);
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);
    crateMeshes.push(box);
    crates.push({
      x: spec.x,
      y: gy + 0.46,
      z: spec.z,
      vx: 0,
      vy: 0,
      vz: 0,
      rx: 0,
      rz: 0,
      radius: 0.58,
      mass: 0.7,
      knocked: false,
    });
  });

  // 3. Directional Signposts pointing to active Resume Zones
  const addSignpost = (x: number, z: number, rotY: number, label: string, sublabel: string) => {
    const signGroup = new THREE.Group();
    signGroup.position.set(x, groundHeightAt(x, z, enableProps), z);
    signGroup.rotation.y = rotY;

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 2.3, 8), trimMat);
    post.position.y = 1.15;
    post.castShadow = true;
    signGroup.add(post);

    const boardTex = createSignpostTexture(label, sublabel, maxAniso);
    createdTextures.push(boardTex);
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.84, 0.14),
      new THREE.MeshStandardMaterial({
        map: boardTex,
        roughness: 0.5,
      })
    );
    board.position.y = 2.05;
    board.castShadow = true;
    signGroup.add(board);
    group.add(signGroup);
  };

  const enabledSet = new Set(config.modules.filter((m) => m.enabled).map((m) => m.id));
  const cz0 = riverCenterZ(0);

  if (enabledSet.has('projects')) {
    addSignpost(4.6, cz0 - 7.5, -0.35, '核心项目 ->', '影源 MaaS · 创影 AIGC');
  }
  if (enabledSet.has('career')) {
    addSignpost(-4.6, cz0 - 7.5, 0.35, '<- 职业历程', '影谱 · 非影 · 瓦特比尔 · 该亚');
  }
  if (enabledSet.has('contact')) {
    addSignpost(-8.2, 6.2, 0.45, '<- 成果与联系', '2000万+ 商业成果 · 电话/邮箱');
  }
  if (enabledSet.has('ai_lab')) {
    addSignpost(15.5, 13.5, -0.45, 'AI 技术栈 ->', '大模型 · AIGC · 数字孪生');
  }

  // 4. Candidate Welcome Monolith ("韩鸿哲 · AI 产品总监") facing initial spawn camera
  const profileEnabled = enabledSet.has('profile');
  if (profileEnabled) {
    const welcomeSign = new THREE.Group();
    const wx = -4.6;
    const wz = 7.4;
    welcomeSign.position.set(wx, groundHeightAt(wx, wz, enableProps), wz);
    welcomeSign.rotation.y = 0.32;

    for (const px of [-1.85, 1.85]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.75, 0.24), trimMat);
      leg.position.set(px, 1.37, 0);
      leg.castShadow = true;
      welcomeSign.add(leg);
    }

    const welcomeTex = createWelcomeMonolithTexture(
      config.profile.name,
      config.profile.title,
      config.profile.experienceYears,
      config.profile.availability,
      `${config.profile.phone} | ${config.profile.email}`,
      maxAniso
    );
    createdTextures.push(welcomeTex);

    const welcomeBoard = new THREE.Mesh(
      new THREE.BoxGeometry(4.3, 2.1, 0.22),
      new THREE.MeshStandardMaterial({
        map: welcomeTex,
        emissiveMap: welcomeTex,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.22,
        roughness: 0.42,
      })
    );
    welcomeBoard.position.y = 2.05;
    welcomeBoard.castShadow = true;
    welcomeSign.add(welcomeBoard);
    group.add(welcomeSign);

    // 4 Overview Core Strength Steles arranged gracefully on the east meadow facing the opening camera
    const steleColors = ['#fbbf24', '#fb7185', '#38bdf8', '#a855f7'];
    const steleSpots: Array<[number, number]> = [
      [4.4, -0.8],
      [6.8, 0.1],
      [9.1, 1.1],
      [11.3, 2.2],
    ];
    config.overviewHighlights.slice(0, 4).forEach((ov, idx) => {
      const [sx, sz] = steleSpots[idx] ?? [6 + idx * 2.5, 1];
      const sy = groundHeightAt(sx, sz, enableProps);
      const stele = new THREE.Group();
      stele.position.set(sx, sy, sz);
      stele.lookAt(5.0, sy, 14.5);

      const base = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.42, 0.52), trimMat);
      base.position.y = 0.21;
      base.castShadow = true;
      stele.add(base);

      const tex = createMetricPillarTexture(
        `优势 0${idx + 1}`,
        ov.title,
        ov.summary,
        steleColors[idx % steleColors.length],
        maxAniso
      );
      createdTextures.push(tex);

      const plaque = new THREE.Mesh(
        new THREE.BoxGeometry(2.15, 1.4, 0.15),
        new THREE.MeshStandardMaterial({
          map: tex,
          emissiveMap: tex,
          emissive: new THREE.Color(0xffffff),
          emissiveIntensity: 0.26,
          roughness: 0.4,
        })
      );
      plaque.position.set(0, 1.18, 0);
      plaque.castShadow = true;
      stele.add(plaque);
      group.add(stele);
    });
  }

  const resetCrates = () => {
    crateSpecs.forEach((spec, idx) => {
      const c = crates[idx];
      const gy = groundHeightAt(spec.x, spec.z, enableProps);
      c.x = spec.x;
      c.y = gy + 0.46;
      c.z = spec.z;
      c.vx = 0;
      c.vy = 0;
      c.vz = 0;
      c.rx = 0;
      c.rz = 0;
      c.knocked = false;
    });
  };

  const update = (dt: number) => {
    for (let i = 0; i < crates.length; i++) {
      const c = crates[i];
      if (c.knocked) {
        c.x += c.vx * dt;
        c.z += c.vz * dt;
        c.vy -= 18 * dt;
        c.y += c.vy * dt;
        const floor = groundHeightAt(c.x, c.z, enableProps) + 0.46;
        if (c.y <= floor) {
          c.y = floor;
          c.vy = -c.vy * 0.3;
          if (Math.abs(c.vy) < 0.35) c.vy = 0;
          c.vx *= Math.exp(-4.0 * dt);
          c.vz *= Math.exp(-4.0 * dt);
        }
        c.rx += c.vz * dt * 1.4;
        c.rz -= c.vx * dt * 1.4;
      }
      crateMeshes[i].position.set(c.x, c.y, c.z);
      crateMeshes[i].rotation.set(c.rx, 0, c.rz);
    }
  };

  const dispose = () => {
    for (const t of createdTextures) t.dispose();
  };

  return { group, crates, resetCrates, update, dispose };
}
