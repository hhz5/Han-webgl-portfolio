import * as THREE from 'three';
import type { ProceduralTexturePack } from '../materials/proceduralTextures';
import { CIRCUIT_CHECKPOINTS, groundHeightAt, type DynamicBody } from '../worldLogic';

export interface CircuitZoneComponent {
  group: THREE.Group;
  cones: DynamicBody[];
  resetCones: () => void;
  update: (dt: number, elapsed: number, truckX: number, truckZ: number) => void;
}

/**
 * Independent component: Speed Circuit Racing Oval with checkered start gantry,
 * asphalt loop, corner curbs, glowing checkpoint gates, and knockable traffic cones.
 */
export function createCircuitZone(textures: ProceduralTexturePack): CircuitZoneComponent {
  const group = new THREE.Group();
  group.name = 'CircuitZone';

  // Circuit track centered around (-33, 7)
  const centerX = -33;
  const centerZ = 7;
  const radiusX = 11.5;
  const radiusZ = 14.5;

  // 1. Flat oval asphalt loop built with Ring/Tube ribbon slightly elevated above ground (y = 0.03)
  const trackShape = new THREE.Shape();
  trackShape.absellipse(0, 0, radiusX + 2.4, radiusZ + 2.4, 0, Math.PI * 2, false, 0);
  const innerHole = new THREE.Path();
  innerHole.absellipse(0, 0, radiusX - 2.4, radiusZ - 2.4, 0, Math.PI * 2, true, 0);
  trackShape.holes.push(innerHole);

  const trackGeo = new THREE.ShapeGeometry(trackShape, 48);
  trackGeo.rotateX(-Math.PI / 2);
  const trackMat = new THREE.MeshStandardMaterial({
    map: textures.asphaltMap,
    roughness: 0.85,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const trackMesh = new THREE.Mesh(trackGeo, trackMat);
  trackMesh.position.set(centerX, 0.035, centerZ);
  trackMesh.receiveShadow = true;
  group.add(trackMesh);

  // 2. Red & Cream outer/inner curb markers
  const curbGeo = new THREE.BoxGeometry(1.1, 0.14, 0.45);
  const redMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.65 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xfff3e0, roughness: 0.65 });
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const cx = centerX + Math.cos(a) * (radiusX + 2.55);
    const cz = centerZ + Math.sin(a) * (radiusZ + 2.55);
    const curb = new THREE.Mesh(curbGeo, i % 2 === 0 ? redMat : creamMat);
    curb.position.set(cx, 0.08, cz);
    curb.rotation.y = -a + Math.PI / 2;
    group.add(curb);
  }

  // 3. Checkered Start / Finish Gantry Arch at first checkpoint (-32, 18)
  const cp0 = CIRCUIT_CHECKPOINTS[0];
  const gantry = new THREE.Group();
  gantry.position.set(cp0.x, groundHeightAt(cp0.x, cp0.z), cp0.z);
  gantry.rotation.y = -0.32;

  const poleMat = new THREE.MeshStandardMaterial({ color: 0x332b47, roughness: 0.45, metalness: 0.4 });
  for (const px of [-2.8, 2.8]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 4.2, 10), poleMat);
    pole.position.set(px, 2.1, 0);
    pole.castShadow = true;
    gantry.add(pole);
  }

  const banner = new THREE.Mesh(
    new THREE.BoxGeometry(6.2, 1.15, 0.28),
    new THREE.MeshStandardMaterial({
      map: textures.checkeredMap,
      roughness: 0.45,
    })
  );
  banner.position.set(0, 4.1, 0);
  banner.castShadow = true;
  gantry.add(banner);
  group.add(gantry);

  // 4. Glowing Checkpoint Ring Markers
  const cpRings: THREE.Mesh[] = [];
  CIRCUIT_CHECKPOINTS.forEach((cp, idx) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.7, 2.05, 24),
      new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0xfbbf24 : 0x38bdf8,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(cp.x, 0.06, cp.z);
    group.add(ring);
    cpRings.push(ring);
  });

  // 5. Dynamic Knockable Traffic Cones
  const coneGeo = new THREE.ConeGeometry(0.26, 0.72, 10);
  coneGeo.translate(0, 0.36, 0);
  const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
  const coneBaseGeo = new THREE.BoxGeometry(0.52, 0.08, 0.52);
  const coneBaseMat = new THREE.MeshStandardMaterial({ color: 0x262230, roughness: 0.8 });

  const initialConeCoords: Array<[number, number]> = [
    [-28, 16],
    [-36, 19],
    [-43, 12],
    [-44, 2],
    [-39, -7],
    [-27, -6],
    [-22, 4],
    [-23, 13],
  ];

  const cones: DynamicBody[] = [];
  const coneMeshes: THREE.Group[] = [];

  initialConeCoords.forEach(([kx, kz]) => {
    const coneGroup = new THREE.Group();
    const coneTop = new THREE.Mesh(coneGeo, coneMat);
    coneTop.castShadow = true;
    const coneFoot = new THREE.Mesh(coneBaseGeo, coneBaseMat);
    coneFoot.position.y = 0.04;
    coneGroup.add(coneTop, coneFoot);
    const cy = groundHeightAt(kx, kz);
    coneGroup.position.set(kx, cy, kz);
    group.add(coneGroup);
    coneMeshes.push(coneGroup);

    cones.push({
      x: kx,
      y: cy,
      z: kz,
      vx: 0,
      vy: 0,
      vz: 0,
      rx: 0,
      rz: 0,
      radius: 0.36,
      mass: 0.6,
      knocked: false,
    });
  });

  const resetCones = () => {
    initialConeCoords.forEach(([kx, kz], i) => {
      const c = cones[i];
      c.x = kx;
      c.y = groundHeightAt(kx, kz);
      c.z = kz;
      c.vx = 0;
      c.vy = 0;
      c.vz = 0;
      c.rx = 0;
      c.rz = 0;
      c.knocked = false;
    });
  };

  const update = (dt: number, elapsed: number) => {
    cpRings.forEach((r, idx) => {
      const pulse = 1 + Math.sin(elapsed * 3.5 + idx) * 0.06;
      r.scale.setScalar(pulse);
    });

    for (let i = 0; i < cones.length; i++) {
      const c = cones[i];
      const m = coneMeshes[i];
      if (c.knocked) {
        c.x += c.vx * dt;
        c.z += c.vz * dt;
        c.vy -= 18 * dt;
        c.y += c.vy * dt;
        const gy = groundHeightAt(c.x, c.z);
        if (c.y <= gy) {
          c.y = gy;
          c.vy = -c.vy * 0.35;
          if (Math.abs(c.vy) < 0.4) c.vy = 0;
          c.vx *= Math.exp(-4.5 * dt);
          c.vz *= Math.exp(-4.5 * dt);
        }
        const spd = Math.hypot(c.vx, c.vz);
        if (spd > 0.2) {
          c.rx += c.vz * dt * 1.4;
          c.rz -= c.vx * dt * 1.4;
        } else if (Math.abs(c.rx) < 0.6 && Math.abs(c.rz) < 0.6) {
          c.rx = 1.25;
        }
      }
      m.position.set(c.x, c.y, c.z);
      m.rotation.set(c.rx, 0, c.rz);
    }
  };

  return { group, cones, resetCones, update };
}
