import * as THREE from 'three';
import type { ProceduralTexturePack } from '../materials/proceduralTextures';
import { groundHeightAt, type DynamicBody } from '../worldLogic';

export interface BowlingZoneComponent {
  group: THREE.Group;
  pins: DynamicBody[];
  ball: DynamicBody;
  resetPins: () => void;
  update: (dt: number) => number; // returns count of knocked pins
}

/**
 * Independent component: Giant Outdoor Bowling Alley with wooden lane,
 * LatheGeometry bowling pins, and a heavy rolling bowling ball.
 */
export function createBowlingZone(textures: ProceduralTexturePack): BowlingZoneComponent {
  const group = new THREE.Group();
  group.name = 'BowlingZone';

  const laneX = -4;
  const laneZ = -35;
  const baseY = groundHeightAt(laneX, laneZ);

  // 1. Polished Wooden Bowling Lane + Gutters
  const lane = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.14, 15.0),
    new THREE.MeshStandardMaterial({
      map: textures.woodMap,
      roughness: 0.35,
      metalness: 0.08,
    })
  );
  lane.position.set(laneX, baseY + 0.06, laneZ);
  lane.receiveShadow = true;
  group.add(lane);

  const gutterMat = new THREE.MeshStandardMaterial({ color: 0x2e2640, roughness: 0.65 });
  for (const gx of [-2.75, 2.75]) {
    const gutter = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 15.2), gutterMat);
    gutter.position.set(laneX + gx, baseY + 0.12, laneZ);
    gutter.castShadow = true;
    group.add(gutter);
  }

  // 2. Sculpted LatheGeometry Bowling Pin geometry (reused across all 10 pins)
  const pinProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.2, 0.0),
    new THREE.Vector2(0.28, 0.28),
    new THREE.Vector2(0.26, 0.65),
    new THREE.Vector2(0.13, 1.02),
    new THREE.Vector2(0.17, 1.28),
    new THREE.Vector2(0.12, 1.46),
    new THREE.Vector2(0.0, 1.5),
  ];
  const pinGeo = new THREE.LatheGeometry(pinProfile, 14);
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xfff5e9, roughness: 0.28, metalness: 0.05 });
  const stripeGeo = new THREE.CylinderGeometry(0.16, 0.145, 0.14, 12);
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xd93648, roughness: 0.35 });

  // 10 pins in classic triangle formation at back of lane
  const initialPinOffsets: Array<[number, number]> = [];
  const startPinZ = laneZ - 4.4;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col <= row; col++) {
      const px = laneX + (col - row * 0.5) * 0.85;
      const pz = startPinZ - row * 0.78;
      initialPinOffsets.push([px, pz]);
    }
  }

  const pins: DynamicBody[] = [];
  const pinMeshes: THREE.Group[] = [];

  initialPinOffsets.forEach(([px, pz]) => {
    const pinGroup = new THREE.Group();
    const body = new THREE.Mesh(pinGeo, pinMat);
    body.castShadow = true;
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 1.02;
    pinGroup.add(body, stripe);
    pinGroup.position.set(px, baseY + 0.13, pz);
    group.add(pinGroup);
    pinMeshes.push(pinGroup);

    pins.push({
      x: px,
      y: baseY + 0.13,
      z: pz,
      vx: 0,
      vy: 0,
      vz: 0,
      rx: 0,
      rz: 0,
      radius: 0.32,
      mass: 0.85,
      knocked: false,
    });
  });

  // 3. Giant Bowling Ball at front of lane
  const ballInitX = laneX;
  const ballInitZ = laneZ + 5.2;
  const ball: DynamicBody = {
    x: ballInitX,
    y: baseY + 0.88,
    z: ballInitZ,
    vx: 0,
    vy: 0,
    vz: 0,
    rx: 0,
    rz: 0,
    radius: 0.78,
    mass: 2.2,
    knocked: false,
  };

  const ballMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.78, 20, 16),
    new THREE.MeshPhysicalMaterial({
      color: 0x3b2d5e,
      roughness: 0.18,
      metalness: 0.25,
      clearcoat: 0.9,
    })
  );
  ballMesh.position.set(ball.x, ball.y, ball.z);
  ballMesh.castShadow = true;
  group.add(ballMesh);

  const resetPins = () => {
    initialPinOffsets.forEach(([px, pz], idx) => {
      const p = pins[idx];
      p.x = px;
      p.y = baseY + 0.13;
      p.z = pz;
      p.vx = 0;
      p.vy = 0;
      p.vz = 0;
      p.rx = 0;
      p.rz = 0;
      p.knocked = false;
    });
    ball.x = ballInitX;
    ball.y = baseY + 0.88;
    ball.z = ballInitZ;
    ball.vx = 0;
    ball.vy = 0;
    ball.vz = 0;
    ball.rx = 0;
    ball.rz = 0;
    ball.knocked = false;
  };

  const update = (dt: number) => {
    // Move bowling ball & allow ball-to-pin collisions
    if (ball.knocked) {
      ball.x += ball.vx * dt;
      ball.z += ball.vz * dt;
      ball.vx *= Math.exp(-1.1 * dt);
      ball.vz *= Math.exp(-1.1 * dt);
      ball.rx += ball.vz * dt * 1.1;
      ball.rz -= ball.vx * dt * 1.1;
      const floor = groundHeightAt(ball.x, ball.z) + 0.78;
      ball.y += (floor - ball.y) * Math.min(1, 14 * dt);

      // Ball hits pins!
      for (const p of pins) {
        const dx = p.x - ball.x;
        const dz = p.z - ball.z;
        const dist = Math.hypot(dx, dz);
        if (dist < ball.radius + p.radius + 0.1 && dist > 0.001) {
          const nx = dx / dist;
          const nz = dz / dist;
          const bSpeed = Math.hypot(ball.vx, ball.vz);
          if (bSpeed > 0.6) {
            p.vx += nx * Math.max(4.5, bSpeed * 1.25);
            p.vz += nz * Math.max(4.5, bSpeed * 1.25);
            p.vy = Math.max(p.vy, 2.2);
            p.knocked = true;
          }
        }
      }
    }
    ballMesh.position.set(ball.x, ball.y, ball.z);
    ballMesh.rotation.set(ball.rx, 0, ball.rz);

    // Pin-to-pin domino effect & settling
    let knockedCount = 0;
    for (let i = 0; i < pins.length; i++) {
      const p = pins[i];
      if (p.knocked) {
        knockedCount++;
        p.x += p.vx * dt;
        p.z += p.vz * dt;
        p.vy -= 19 * dt;
        p.y += p.vy * dt;
        const gy = groundHeightAt(p.x, p.z) + 0.13;
        if (p.y <= gy) {
          p.y = gy;
          p.vy = -p.vy * 0.3;
          if (Math.abs(p.vy) < 0.35) p.vy = 0;
          p.vx *= Math.exp(-3.8 * dt);
          p.vz *= Math.exp(-3.8 * dt);
        }
        p.rx += p.vz * dt * 1.8;
        p.rz -= p.vx * dt * 1.8;
        if (Math.abs(p.rx) < 0.7 && Math.abs(p.rz) < 0.7) {
          p.rx = 1.42;
        }

        // Domino collision with neighboring pins
        for (let j = 0; j < pins.length; j++) {
          if (i === j) continue;
          const o = pins[j];
          const dx = o.x - p.x;
          const dz = o.z - p.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 0.65 && dist > 0.001 && Math.hypot(p.vx, p.vz) > 1.2) {
            o.vx += (dx / dist) * 3.8;
            o.vz += (dz / dist) * 3.8;
            o.vy = Math.max(o.vy, 1.5);
            o.knocked = true;
          }
        }
      }
      pinMeshes[i].position.set(p.x, p.y, p.z);
      pinMeshes[i].rotation.set(p.rx, 0, p.rz);
    }

    return knockedCount;
  };

  return { group, pins, ball, resetPins, update };
}
