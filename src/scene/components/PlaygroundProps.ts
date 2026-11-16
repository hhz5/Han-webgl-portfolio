import * as THREE from 'three';
import {
  createSignpostTexture,
  type ProceduralTexturePack,
} from '../materials/proceduralTextures';
import {
  groundHeightAt,
  riverCenterZ,
  WORLD_RAMPS,
  type DynamicBody,
} from '../worldLogic';

export interface WhisperFlag {
  id: string;
  author: string;
  message: string;
  x: number;
  z: number;
  color: string;
}

export interface PlaygroundPropsComponent {
  group: THREE.Group;
  crates: DynamicBody[];
  collectibleCookies: Array<{ x: number; z: number; collected: boolean; mesh: THREE.Mesh }>;
  addWhisperFlag: (flag: WhisperFlag) => void;
  resetCrates: () => void;
  update: (dt: number, elapsed: number, truckX: number, truckZ: number) => number; // returns newly collected cookie count
}

/**
 * Independent component: Stunt Ramps, Cookie Stand & Collectible Cookies,
 * Knockable Crates + Portable Toilet Easter Egg, Directional Signposts,
 * 3D Welcome Monolith, and Visitor Whisper Flags.
 */
export function createPlaygroundProps(
  textures: ProceduralTexturePack,
  maxAniso: number,
  initialWhispers: WhisperFlag[]
): PlaygroundPropsComponent {
  const group = new THREE.Group();
  group.name = 'PlaygroundProps';

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

  // 1. Stunt Jump Ramps (matching WORLD_RAMPS physics)
  for (const r of WORLD_RAMPS) {
    const rampGroup = new THREE.Group();
    const gy = groundHeightAt(r.x, r.z);
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

    // Glowing chevron stripe at lip
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
    void gy;
    group.add(rampGroup);
  }

  // 2. Cookie Stand Pavilion at (13, 33) + Collectible Floating Cookies
  const standX = 13;
  const standZ = 33;
  const standGroup = new THREE.Group();
  standGroup.position.set(standX, groundHeightAt(standX, standZ), standZ);
  standGroup.rotation.y = -0.35;

  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.15, 1.6), woodMat);
  counter.position.y = 0.58;
  counter.castShadow = true;
  standGroup.add(counter);

  for (const px of [-1.7, 1.7]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.8, 0.18), trimMat);
    post.position.set(px, 1.4, -0.6);
    post.castShadow = true;
    standGroup.add(post);
  }

  const awning = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.2, 2.2), woodMat);
  awning.position.set(0, 2.75, 0);
  awning.rotation.x = 0.14;
  awning.castShadow = true;
  standGroup.add(awning);

  const giantCookie = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 0.24, 18),
    new THREE.MeshStandardMaterial({ map: textures.cookieMap, roughness: 0.72 })
  );
  giantCookie.rotation.x = Math.PI / 2;
  giantCookie.position.set(0, 3.55, 0);
  giantCookie.castShadow = true;
  standGroup.add(giantCookie);
  group.add(standGroup);

  const cookieSpots: Array<[number, number]> = [
    [6, 12],
    [13, 28],
    [19, 15],
    [22, -4],
    [-10, -20],
    [-22, 12],
    [2, -16],
    [10, 36],
  ];
  const cookieGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.18, 16);
  cookieGeo.rotateX(Math.PI / 2);
  const cookieMat = new THREE.MeshStandardMaterial({
    map: textures.cookieMap,
    emissive: new THREE.Color(0xf59e0b),
    emissiveIntensity: 0.22,
    roughness: 0.6,
  });

  const collectibleCookies = cookieSpots.map(([cx, cz]) => {
    const mesh = new THREE.Mesh(cookieGeo, cookieMat);
    mesh.position.set(cx, groundHeightAt(cx, cz) + 0.95, cz);
    mesh.castShadow = true;
    group.add(mesh);
    return { x: cx, z: cz, collected: false, mesh };
  });

  // 3. Knockable Wooden Crates + Portable Toilet Easter Egg
  const crateSpecs: Array<{ x: number; z: number; isToilet?: boolean }> = [
    { x: 5.5, z: 3.5 },
    { x: 6.6, z: 3.8 },
    { x: 6.0, z: 2.5 },
    { x: -7.5, z: -16.5 },
    { x: -8.6, z: -17.0 },
    { x: 18, z: -18 },
    { x: 19.2, z: -18.2 },
    { x: -17, z: -26, isToilet: true }, // Classic Bruno Simon knockable portable toilet easter egg!
  ];

  const crates: DynamicBody[] = [];
  const crateMeshes: THREE.Object3D[] = [];

  crateSpecs.forEach((spec) => {
    const gy = groundHeightAt(spec.x, spec.z);
    if (spec.isToilet) {
      const toilet = new THREE.Group();
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 2.25, 1.15),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.5 })
      );
      cabin.position.y = 1.12;
      cabin.castShadow = true;
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(1.25, 0.18, 1.25),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
      );
      roof.position.y = 2.3;
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 1.85, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.55 })
      );
      door.position.set(0, 1.0, 0.58);
      toilet.add(cabin, roof, door);
      toilet.position.set(spec.x, gy, spec.z);
      group.add(toilet);
      crateMeshes.push(toilet);
      crates.push({
        x: spec.x,
        y: gy,
        z: spec.z,
        vx: 0,
        vy: 0,
        vz: 0,
        rx: 0,
        rz: 0,
        radius: 0.72,
        mass: 1.1,
        knocked: false,
      });
    } else {
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
    }
  });

  // 4. Directional Signposts + Bruno's Home Welcome Banner near spawn
  const addSignpost = (x: number, z: number, rotY: number, label: string, sublabel: string) => {
    const signGroup = new THREE.Group();
    signGroup.position.set(x, groundHeightAt(x, z), z);
    signGroup.rotation.y = rotY;

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 2.3, 8), trimMat);
    post.position.y = 1.15;
    post.castShadow = true;
    signGroup.add(post);

    const boardTex = createSignpostTexture(label, sublabel, maxAniso);
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.78, 0.14),
      new THREE.MeshStandardMaterial({
        map: boardTex,
        roughness: 0.55,
      })
    );
    board.position.y = 2.05;
    board.castShadow = true;
    signGroup.add(board);
    group.add(signGroup);
  };

  const cz0 = riverCenterZ(0);
  addSignpost(-4.2, cz0 + 7.5, 0.35, 'PROJECTS ->', '作品与 WiFi 信号塔');
  addSignpost(4.5, cz0 - 7.5, -0.4, '<- BOWLING', '保龄球 · 职业历程');
  addSignpost(-14, 10, 0.5, 'CIRCUIT ->', '极速赛道圈速赛');
  addSignpost(14, 15, -0.5, 'LAB & ALTAR', '实验工坊与瀑布');

  // Welcome Monolith Sign ("BRUNO'S WORLD") behind starting truck
  const welcomeSign = new THREE.Group();
  welcomeSign.position.set(-4.5, groundHeightAt(-4.5, 8.2), 8.2);
  welcomeSign.rotation.y = 0.25;
  for (const px of [-1.7, 1.7]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.6, 0.24), trimMat);
    leg.position.set(px, 1.3, 0);
    leg.castShadow = true;
    welcomeSign.add(leg);
  }
  const welcomeTex = createSignpostTexture("BRUNO'S WORLD", 'WASD 驾驶 · 鼠标旋转', maxAniso);
  const welcomeBoard = new THREE.Mesh(
    new THREE.BoxGeometry(3.9, 1.3, 0.2),
    new THREE.MeshStandardMaterial({ map: welcomeTex, roughness: 0.45 })
  );
  welcomeBoard.position.y = 2.15;
  welcomeBoard.castShadow = true;
  welcomeSign.add(welcomeBoard);
  group.add(welcomeSign);

  // 5. Visitor Whisper Flags planted in the meadow
  const whispersGroup = new THREE.Group();
  group.add(whispersGroup);

  const addWhisperFlag = (flag: WhisperFlag) => {
    const fg = new THREE.Group();
    const gy = groundHeightAt(flag.x, flag.z);
    fg.position.set(flag.x, gy, flag.z);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.1, 8), trimMat);
    pole.position.y = 1.05;
    pole.castShadow = true;
    fg.add(pole);

    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 256;
    bannerCanvas.height = 128;
    const ctx = bannerCanvas.getContext('2d')!;
    ctx.fillStyle = flag.color;
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 248, 120);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(flag.author.slice(0, 14), 16, 44);
    ctx.font = '18px sans-serif';
    ctx.fillText(flag.message.slice(0, 20), 16, 86);

    const flagTex = new THREE.CanvasTexture(bannerCanvas);
    flagTex.colorSpace = THREE.SRGBColorSpace;
    flagTex.anisotropy = maxAniso;

    const pennant = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.72, 0.06),
      new THREE.MeshStandardMaterial({ map: flagTex, roughness: 0.5 })
    );
    pennant.position.set(0.78, 1.75, 0);
    pennant.castShadow = true;
    fg.add(pennant);

    whispersGroup.add(fg);
  };

  for (const wf of initialWhispers) {
    addWhisperFlag(wf);
  }

  const resetCrates = () => {
    crateSpecs.forEach((spec, idx) => {
      const c = crates[idx];
      const gy = groundHeightAt(spec.x, spec.z);
      c.x = spec.x;
      c.y = spec.isToilet ? gy : gy + 0.46;
      c.z = spec.z;
      c.vx = 0;
      c.vy = 0;
      c.vz = 0;
      c.rx = 0;
      c.rz = 0;
      c.knocked = false;
    });
  };

  const update = (dt: number, elapsed: number, truckX: number, truckZ: number) => {
    giantCookie.rotation.z = elapsed * 0.65;

    let newlyCollected = 0;
    for (const c of collectibleCookies) {
      if (!c.collected) {
        c.mesh.rotation.y = elapsed * 1.8;
        c.mesh.position.y = groundHeightAt(c.x, c.z) + 0.95 + Math.sin(elapsed * 3 + c.x) * 0.14;
        if (Math.hypot(truckX - c.x, truckZ - c.z) < 2.2) {
          c.collected = true;
          c.mesh.visible = false;
          newlyCollected++;
        }
      }
    }

    for (let i = 0; i < crates.length; i++) {
      const c = crates[i];
      const isToilet = Boolean(crateSpecs[i].isToilet);
      if (c.knocked) {
        c.x += c.vx * dt;
        c.z += c.vz * dt;
        c.vy -= 18 * dt;
        c.y += c.vy * dt;
        const floor = groundHeightAt(c.x, c.z) + (isToilet ? 0.35 : 0.46);
        if (c.y <= floor) {
          c.y = floor;
          c.vy = -c.vy * 0.3;
          if (Math.abs(c.vy) < 0.35) c.vy = 0;
          c.vx *= Math.exp(-4.0 * dt);
          c.vz *= Math.exp(-4.0 * dt);
        }
        c.rx += c.vz * dt * 1.4;
        c.rz -= c.vx * dt * 1.4;
        if (isToilet && Math.abs(c.rx) < 0.6 && Math.abs(c.rz) < 0.6) {
          c.rx = 1.45;
        }
      }
      crateMeshes[i].position.set(c.x, c.y, c.z);
      crateMeshes[i].rotation.set(c.rx, 0, c.rz);
    }

    return newlyCollected;
  };

  return { group, crates, collectibleCookies, addWhisperFlag, resetCrates, update };
}
