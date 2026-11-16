export type AtmospherePresetId = 'sunset' | 'twilight' | 'dawn';

export interface WorldZoneDef {
  id:
    | 'landing'
    | 'projects'
    | 'lab'
    | 'career'
    | 'circuit'
    | 'bowling'
    | 'cookies'
    | 'altar';
  name: string;
  zhName: string;
  subtitle: string;
  x: number;
  z: number;
  radius: number;
  cameraOffset: [number, number, number];
  spawnHeading: number;
  accentHex: string;
}

export const WORLD_ZONES: WorldZoneDef[] = [
  {
    id: 'landing',
    name: 'Home Bridge',
    zhName: '木桥出生点',
    subtitle: '跨河木桥、石灯笼与红黑越野卡车起点',
    x: 0,
    z: 2,
    radius: 7,
    cameraOffset: [11, 7.5, 13],
    spawnHeading: Math.PI,
    accentHex: '#f59e0b',
  },
  {
    id: 'projects',
    name: 'Projects Plaza',
    zhName: '作品展区',
    subtitle: 'Fix the WiFi 信号塔与交互式 WebGL 项目展台',
    x: 28,
    z: -14,
    radius: 8,
    cameraOffset: [13, 8.5, 13],
    spawnHeading: -Math.PI * 0.65,
    accentHex: '#fb7185',
  },
  {
    id: 'lab',
    name: 'Science Lab',
    zhName: '实验工坊',
    subtitle: '动态陀螺仪、能量核心与着色器实验装置',
    x: 25,
    z: 24,
    radius: 7.5,
    cameraOffset: [12, 8, 12],
    spawnHeading: Math.PI * 0.75,
    accentHex: '#38bdf8',
  },
  {
    id: 'career',
    name: 'Career Avenue',
    zhName: '职业历程',
    subtitle: '从创意机构、自由职业到 Three.js Journey 的时间拱门',
    x: -26,
    z: -18,
    radius: 8,
    cameraOffset: [-13, 8, 13],
    spawnHeading: Math.PI * 0.35,
    accentHex: '#fbbf24',
  },
  {
    id: 'circuit',
    name: 'Speed Circuit',
    zhName: '极速赛道',
    subtitle: '弯道加速带、发车拱门与圈速计时挑战',
    x: -32,
    z: 18,
    radius: 9,
    cameraOffset: [-14, 9.5, 14],
    spawnHeading: 0,
    accentHex: '#ef4444',
  },
  {
    id: 'bowling',
    name: 'Bowling Alley',
    zhName: '巨型保龄球',
    subtitle: '驱动卡车撞击巨型保龄球，击倒十支球瓶触发全中',
    x: -4,
    z: -33,
    radius: 7.5,
    cameraOffset: [11, 7.5, 13],
    spawnHeading: Math.PI,
    accentHex: '#f97316',
  },
  {
    id: 'cookies',
    name: 'Cookie Stand',
    zhName: '饼干小站',
    subtitle: '金色曲奇摊位与沿途可收集的悬浮曲奇饼干',
    x: 13,
    z: 33,
    radius: 6.5,
    cameraOffset: [10, 7, 11],
    spawnHeading: Math.PI * 0.9,
    accentHex: '#eab308',
  },
  {
    id: 'altar',
    name: 'Altar & Waterfall',
    zhName: '祭坛与瀑布',
    subtitle: '玄武岩瀑布、悬浮成就方尖碑与紫光符文祭坛',
    x: -11,
    z: 36,
    radius: 8,
    cameraOffset: [-12, 8.5, 13],
    spawnHeading: Math.PI * 0.85,
    accentHex: '#a855f7',
  },
];

export interface RampDef {
  x: number;
  z: number;
  width: number;
  length: number;
  height: number;
  yaw: number;
}

export const WORLD_RAMPS: RampDef[] = [
  { x: 11, z: 6, width: 3.6, length: 6.0, height: 1.55, yaw: 0.25 },
  { x: -15, z: 8, width: 3.6, length: 6.0, height: 1.45, yaw: -0.45 },
  { x: 16, z: -24, width: 3.4, length: 5.5, height: 1.35, yaw: 0.8 },
];

export function riverCenterZ(x: number): number {
  return -7.5 + Math.sin(x * 0.085) * 4.2 + Math.cos(x * 0.03) * 1.4;
}

export function isOnBridge(x: number, z: number): boolean {
  const cz = riverCenterZ(0);
  return Math.abs(x) <= 2.45 && z >= cz - 5.8 && z <= cz + 5.8;
}

export function bridgeDeckHeightAt(x: number, z: number): number {
  const cz = riverCenterZ(0);
  if (Math.abs(x) > 2.45) return 0;
  const distFromCenter = Math.abs(z - cz);
  if (distFromCenter > 5.8) return 0;
  const t = 1 - distFromCenter / 5.8;
  // Gentle arch peaking at 0.55m above flat ground
  return 0.55 * Math.sin(t * Math.PI * 0.5);
}

export function rampHeightAt(x: number, z: number): number {
  let best = 0;
  for (const r of WORLD_RAMPS) {
    const dx = x - r.x;
    const dz = z - r.z;
    const cos = Math.cos(-r.yaw);
    const sin = Math.sin(-r.yaw);
    const lx = dx * cos - dz * sin;
    const lz = dx * sin + dz * cos;
    if (Math.abs(lx) <= r.width * 0.5 && Math.abs(lz) <= r.length * 0.5) {
      const progress = (lz + r.length * 0.5) / r.length; // 0 at base -> 1 at lip
      const h = Math.max(0, progress * r.height);
      if (h > best) best = h;
    }
  }
  return best;
}

/**
 * Continuous procedural ground height used by terrain mesh, props, trees, and vehicle suspension.
 */
export function groundHeightAt(x: number, z: number): number {
  const cz = riverCenterZ(x);
  const distToRiver = Math.abs(z - cz);
  const riverHalfWidth = 4.1 + Math.sin(x * 0.14) * 0.6;

  // River depression
  let baseH = 0;
  if (distToRiver < riverHalfWidth) {
    const t = distToRiver / riverHalfWidth;
    baseH = -1.25 * (1 - t * t);
  } else if (distToRiver < riverHalfWidth + 2.4) {
    const t = (distToRiver - riverHalfWidth) / 2.4;
    baseH = -0.05 * (1 - t);
  }

  // Gentle distant horizon hills beyond playable 48m radius
  const radial = Math.hypot(x, z);
  if (radial > 48) {
    const hillFactor = Math.min(1, (radial - 48) / 36);
    const rolling =
      (Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.5 + 0.5) * 6.5 +
      Math.sin(x * 0.04 + z * 0.05) * 2.0;
    baseH += hillFactor * hillFactor * (2.5 + rolling);
  }

  // Slight raised mound at Altar & Waterfall (-11, 36)
  const altarDist = Math.hypot(x + 11, z - 44);
  if (altarDist < 10) {
    const m = 1 - altarDist / 10;
    baseH += m * m * 2.2;
  }

  // Bridge deck overrides river depression cleanly at x in [-2.45, 2.45]
  if (isOnBridge(x, z)) {
    return Math.max(baseH, bridgeDeckHeightAt(x, z));
  }

  const rampH = rampHeightAt(x, z);
  return rampH > 0 ? Math.max(baseH, rampH) : baseH;
}

export interface VehicleState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  heading: number; // radians, 0 = +Z forward, Math.PI = -Z forward
  speed: number; // signed forward speed
  steerAngle: number;
  wheelSpin: number;
  pitch: number;
  roll: number;
  grounded: boolean;
  boosting: boolean;
  distanceDriven: number;
  airTime: number;
  jumpsCount: number;
}

export interface VehicleInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
  brake: boolean;
  jump: boolean;
}

export function createInitialVehicleState(): VehicleState {
  const startX = 0;
  const startZ = 3.5;
  return {
    x: startX,
    y: groundHeightAt(startX, startZ),
    z: startZ,
    vx: 0,
    vy: 0,
    vz: 0,
    heading: Math.PI, // facing the wooden bridge and lanterns
    speed: 0,
    steerAngle: 0,
    wheelSpin: 0,
    pitch: 0,
    roll: 0,
    grounded: true,
    boosting: false,
    distanceDriven: 0,
    airTime: 0,
    jumpsCount: 0,
  };
}

export function stepVehiclePhysics(
  state: VehicleState,
  input: VehicleInput,
  dt: number,
  worldRadius = 56
): VehicleState {
  const clampedDt = Math.min(Math.max(dt, 0.001), 0.05);
  const next = { ...state };

  const throttle = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
  const steerInput = (input.left ? 1 : 0) - (input.right ? 1 : 0);

  next.boosting = Boolean(input.boost && throttle > 0);
  const maxSpeed = next.boosting ? 26 : 16.5;
  const accel = next.boosting ? 32 : 20;

  if (throttle !== 0) {
    next.speed += throttle * accel * clampedDt;
  } else {
    // Natural rolling resistance
    const drag = Math.exp(-3.2 * clampedDt);
    next.speed *= drag;
    if (Math.abs(next.speed) < 0.05) next.speed = 0;
  }

  if (input.brake) {
    next.speed *= Math.exp(-8.5 * clampedDt);
  }

  next.speed = Math.max(-maxSpeed * 0.55, Math.min(maxSpeed, next.speed));

  // Smooth steering
  const targetSteer = steerInput * 0.52;
  next.steerAngle += (targetSteer - next.steerAngle) * Math.min(1, 10 * clampedDt);

  const speedFactor = Math.min(1, Math.abs(next.speed) / 3.5);
  const directionSign = next.speed >= -0.05 ? 1 : -1;
  next.heading += next.steerAngle * 2.9 * speedFactor * directionSign * clampedDt;

  const sinH = Math.sin(next.heading);
  const cosH = Math.cos(next.heading);
  next.vx = sinH * next.speed;
  next.vz = cosH * next.speed;

  const prevX = next.x;
  const prevZ = next.z;
  next.x += next.vx * clampedDt;
  next.z += next.vz * clampedDt;

  // Soft boundary pushback so the truck stays inside the scenic world
  const distFromOrigin = Math.hypot(next.x, next.z);
  if (distFromOrigin > worldRadius) {
    const scale = worldRadius / distFromOrigin;
    next.x *= scale;
    next.z *= scale;
    next.speed *= 0.65;
  }

  const moved = Math.hypot(next.x - prevX, next.z - prevZ);
  next.distanceDriven += moved;
  next.wheelSpin += (next.speed * clampedDt) / 0.55;

  // Vertical terrain / jump / ramp physics
  const floorY = groundHeightAt(next.x, next.z);
  const prevFloorY = groundHeightAt(prevX, prevZ);

  if (next.grounded && input.jump) {
    next.vy = 8.4;
    next.grounded = false;
    next.jumpsCount += 1;
  } else if (next.grounded && prevFloorY - floorY > 0.28 && Math.abs(next.speed) > 9) {
    // Launch off ramp lip!
    next.vy = Math.max(2.5, Math.abs(next.speed) * 0.28);
    next.grounded = false;
  }

  if (!next.grounded) {
    next.vy -= 21 * clampedDt;
    next.y += next.vy * clampedDt;
    next.airTime += clampedDt;
    if (next.y <= floorY) {
      next.y = floorY;
      next.vy = 0;
      next.grounded = true;
    }
  } else {
    next.y += (floorY - next.y) * Math.min(1, 18 * clampedDt);
  }

  // Suspension pitch (accel/brake) and body roll (steering)
  const targetPitch = -throttle * 0.055 + (input.brake ? 0.07 : 0);
  const targetRoll = -next.steerAngle * speedFactor * 0.14;
  next.pitch += (targetPitch - next.pitch) * Math.min(1, 9 * clampedDt);
  next.roll += (targetRoll - next.roll) * Math.min(1, 9 * clampedDt);

  return next;
}

export interface DynamicBody {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  rz: number;
  radius: number;
  mass: number;
  knocked: boolean;
}

export function resolveDynamicBodyCollision(
  body: DynamicBody,
  truckX: number,
  truckZ: number,
  truckVx: number,
  truckVz: number,
  truckRadius = 1.65
): boolean {
  const dx = body.x - truckX;
  const dz = body.z - truckZ;
  const dist = Math.hypot(dx, dz);
  const minDist = truckRadius + body.radius;

  if (dist < minDist && dist > 0.0001) {
    const nx = dx / dist;
    const nz = dz / dist;
    const overlap = minDist - dist;
    body.x += nx * overlap;
    body.z += nz * overlap;

    const impactSpeed = Math.hypot(truckVx, truckVz);
    const impulse = Math.max(4.5, impactSpeed * 1.15) / Math.max(0.5, body.mass);
    body.vx += nx * impulse + truckVx * 0.35;
    body.vz += nz * impulse + truckVz * 0.35;
    body.vy = Math.max(body.vy, Math.min(6.5, impactSpeed * 0.25 + 1.8));
    body.knocked = true;
    return true;
  }
  return false;
}

export function findNearestZone(
  x: number,
  z: number
): { zone: WorldZoneDef; distance: number; inside: boolean } {
  let nearest = WORLD_ZONES[0];
  let bestDist = Infinity;
  for (const zDef of WORLD_ZONES) {
    const d = Math.hypot(x - zDef.x, z - zDef.z);
    if (d < bestDist) {
      bestDist = d;
      nearest = zDef;
    }
  }
  return {
    zone: nearest,
    distance: bestDist,
    inside: bestDist <= nearest.radius,
  };
}

export interface CircuitState {
  running: boolean;
  nextCheckpoint: number;
  elapsedMs: number;
  bestLapMs: number | null;
  lapsCompleted: number;
}

export const CIRCUIT_CHECKPOINTS: Array<{ x: number; z: number; radius: number }> = [
  { x: -32, z: 18, radius: 5.5 }, // Start/Finish gantry
  { x: -42, z: 8, radius: 5.5 },
  { x: -42, z: -6, radius: 5.5 },
  { x: -24, z: -2, radius: 5.5 },
];

export function updateCircuitProgress(
  circuit: CircuitState,
  x: number,
  z: number,
  dtMs: number
): { state: CircuitState; event: 'none' | 'started' | 'checkpoint' | 'lap_finished' } {
  const next = { ...circuit };
  let event: 'none' | 'started' | 'checkpoint' | 'lap_finished' = 'none';

  if (next.running) {
    next.elapsedMs += dtMs;
  }

  const targetCp = CIRCUIT_CHECKPOINTS[next.nextCheckpoint];
  const dist = Math.hypot(x - targetCp.x, z - targetCp.z);

  if (dist <= targetCp.radius) {
    if (!next.running && next.nextCheckpoint === 0) {
      next.running = true;
      next.elapsedMs = 0;
      next.nextCheckpoint = 1;
      event = 'started';
    } else if (next.running) {
      if (next.nextCheckpoint === 0) {
        // Completed full lap!
        next.lapsCompleted += 1;
        if (next.bestLapMs === null || next.elapsedMs < next.bestLapMs) {
          next.bestLapMs = next.elapsedMs;
        }
        next.elapsedMs = 0;
        next.nextCheckpoint = 1;
        event = 'lap_finished';
      } else {
        next.nextCheckpoint = (next.nextCheckpoint + 1) % CIRCUIT_CHECKPOINTS.length;
        event = 'checkpoint';
      }
    }
  }

  return { state: next, event };
}
