import type { ResumeModuleId } from '../data/resumeConfig';

export type AtmospherePresetId = 'sunset' | 'twilight' | 'dawn';

export interface WorldZoneDef {
  id: ResumeModuleId;
  name: string;
  zhName: string;
  subtitle: string;
  x: number;
  z: number;
  radius: number;
  cameraOffset: [number, number, number];
  spawnOffset: [number, number];
  spawnHeading: number;
  accentHex: string;
}

export const WORLD_ZONES: WorldZoneDef[] = [
  {
    id: 'profile',
    name: 'Profile Bridge',
    zhName: '个人概况',
    subtitle: '韩鸿哲 · 10年+ AI 产品总监与核心优势总览',
    x: 0,
    z: 2,
    radius: 7.5,
    cameraOffset: [12.5, 8.6, 16.8],
    spawnOffset: [0, 1.5],
    spawnHeading: Math.PI,
    accentHex: '#f59e0b',
  },
  {
    id: 'projects',
    name: 'AI Projects Plaza',
    zhName: '核心项目',
    subtitle: '影源大模型 MaaS、创影 AIGC、元宇宙空间与视觉指纹',
    x: 28,
    z: -14,
    radius: 9.0,
    cameraOffset: [9.5, 10.6, 15.5],
    spawnOffset: [-2.2, 6.2],
    spawnHeading: -Math.PI * 0.72,
    accentHex: '#fb7185',
  },
  {
    id: 'career',
    name: 'Career Avenue',
    zhName: '职业历程',
    subtitle: '2006–2025 五段深耕经历：影谱、非影、瓦特比尔、该亚、利达智通',
    x: -26,
    z: -25,
    radius: 10.0,
    cameraOffset: [-15.5, 9.2, 13.5],
    spawnOffset: [-3.5, 9.5],
    spawnHeading: Math.PI * 0.88,
    accentHex: '#fbbf24',
  },
  {
    id: 'ai_lab',
    name: 'AI & Twin Lab',
    zhName: 'AI 技术栈',
    subtitle: '模型工程层、AIGC 生产管线与 WebGL/Three.js 空间技术',
    x: 25,
    z: 24,
    radius: 8.0,
    cameraOffset: [10.5, 8.8, 14.5],
    spawnOffset: [-3.8, 4.6],
    spawnHeading: Math.PI * 0.75,
    accentHex: '#38bdf8',
  },
  {
    id: 'education',
    name: 'Education Sanctuary',
    zhName: '教育背景',
    subtitle: '欧洲塞万提斯大学心理学硕士 · 东北大学工商管理 · 计算机科班',
    x: -11,
    z: 36,
    radius: 8.5,
    cameraOffset: [8.5, 7.6, -12.5],
    spawnOffset: [4.2, -5.8],
    spawnHeading: -Math.PI * 0.25,
    accentHex: '#a855f7',
  },
  {
    id: 'contact',
    name: 'Impact & Contact',
    zhName: '成果与联系',
    subtitle: '2000万+ 商业成果碑林 · 13581848772 · hhz5@163.com',
    x: -28,
    z: 14,
    radius: 8.5,
    cameraOffset: [-10.5, 8.6, 15.0],
    spawnOffset: [-1.2, 6.2],
    spawnHeading: Math.PI,
    accentHex: '#34d399',
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
  { x: 16, z: 9, width: 3.4, length: 5.8, height: 1.45, yaw: 0.25 },
  { x: -16, z: -2, width: 3.4, length: 5.8, height: 1.4, yaw: -0.45 },
  { x: 12, z: -24, width: 3.4, length: 5.5, height: 1.35, yaw: 0.8 },
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
  return 0.55 * Math.sin(t * Math.PI * 0.5);
}

export function rampHeightAt(x: number, z: number, enableRamps = true): number {
  if (!enableRamps) return 0;
  let best = 0;
  for (const r of WORLD_RAMPS) {
    const dx = x - r.x;
    const dz = z - r.z;
    const cos = Math.cos(-r.yaw);
    const sin = Math.sin(-r.yaw);
    const lx = dx * cos - dz * sin;
    const lz = dx * sin + dz * cos;
    if (Math.abs(lx) <= r.width * 0.5 && Math.abs(lz) <= r.length * 0.5) {
      const progress = (lz + r.length * 0.5) / r.length;
      const h = Math.max(0, progress * r.height);
      if (h > best) best = h;
    }
  }
  return best;
}

/**
 * Continuous procedural ground height used by terrain mesh, props, trees, and vehicle suspension.
 */
export function groundHeightAt(x: number, z: number, enableRamps = true): number {
  const cz = riverCenterZ(x);
  const distToRiver = Math.abs(z - cz);
  const riverHalfWidth = 4.1 + Math.sin(x * 0.14) * 0.6;

  let baseH = 0;
  if (distToRiver < riverHalfWidth) {
    const t = distToRiver / riverHalfWidth;
    baseH = -1.25 * (1 - t * t);
  } else if (distToRiver < riverHalfWidth + 2.4) {
    const t = (distToRiver - riverHalfWidth) / 2.4;
    baseH = -0.05 * (1 - t);
  }

  const radial = Math.hypot(x, z);
  if (radial > 48) {
    const hillFactor = Math.min(1, (radial - 48) / 36);
    const rolling =
      (Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.5 + 0.5) * 6.5 +
      Math.sin(x * 0.04 + z * 0.05) * 2.0;
    baseH += hillFactor * hillFactor * (2.5 + rolling);
  }

  // Slight raised mound behind Education Waterfall (-11, 44)
  const altarDist = Math.hypot(x + 11, z - 44);
  if (altarDist < 10) {
    const m = 1 - altarDist / 10;
    baseH += m * m * 2.2;
  }

  if (isOnBridge(x, z)) {
    return Math.max(baseH, bridgeDeckHeightAt(x, z));
  }

  const rampH = rampHeightAt(x, z, enableRamps);
  return rampH > 0 ? Math.max(baseH, rampH) : baseH;
}

export interface VehicleState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  heading: number;
  speed: number;
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
    heading: Math.PI,
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
  worldRadius = 56,
  enableRamps = true
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
    const drag = Math.exp(-3.2 * clampedDt);
    next.speed *= drag;
    if (Math.abs(next.speed) < 0.05) next.speed = 0;
  }

  if (input.brake) {
    next.speed *= Math.exp(-8.5 * clampedDt);
  }

  next.speed = Math.max(-maxSpeed * 0.55, Math.min(maxSpeed, next.speed));

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

  const floorY = groundHeightAt(next.x, next.z, enableRamps);
  const prevFloorY = groundHeightAt(prevX, prevZ, enableRamps);

  if (next.grounded && input.jump) {
    next.vy = 8.4;
    next.grounded = false;
    next.jumpsCount += 1;
  } else if (next.grounded && prevFloorY - floorY > 0.28 && Math.abs(next.speed) > 9) {
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
  z: number,
  enabledZoneIds?: Set<ResumeModuleId>
): { zone: WorldZoneDef; distance: number; inside: boolean } {
  const candidates =
    enabledZoneIds && enabledZoneIds.size > 0
      ? WORLD_ZONES.filter((zDef) => enabledZoneIds.has(zDef.id))
      : WORLD_ZONES;
  const pool = candidates.length > 0 ? candidates : WORLD_ZONES;

  let nearest = pool[0];
  let bestDist = Infinity;
  for (const zDef of pool) {
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
