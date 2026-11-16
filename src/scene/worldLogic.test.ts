import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_RESUME_CONFIG,
  getEnabledModules,
} from '../data/resumeConfig';
import {
  bridgeDeckHeightAt,
  createInitialVehicleState,
  findNearestZone,
  groundHeightAt,
  resolveDynamicBodyCollision,
  riverCenterZ,
  stepVehiclePhysics,
  type DynamicBody,
  type VehicleInput,
} from './worldLogic';

const IDLE_INPUT: VehicleInput = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  boost: false,
  brake: false,
  jump: false,
};

test('bridge deck lifts over the river depression cleanly', () => {
  const cz = riverCenterZ(0);
  const deckH = bridgeDeckHeightAt(0, cz);
  const riverBedH = groundHeightAt(12, riverCenterZ(12));
  assert.ok(deckH > 0.45, `Expected bridge arch peak > 0.45m, got ${deckH}`);
  assert.ok(riverBedH < -0.5, `Expected river depression < -0.5m, got ${riverBedH}`);
  assert.ok(groundHeightAt(0, cz) >= deckH);
});

test('vehicle accelerates forward, steers, and jumps with gravity', () => {
  let state = createInitialVehicleState();
  const driveInput: VehicleInput = { ...IDLE_INPUT, forward: true, left: true };
  for (let i = 0; i < 40; i++) {
    state = stepVehiclePhysics(state, driveInput, 0.025);
  }
  assert.ok(state.speed > 5, 'Vehicle should accelerate when forward is pressed');
  assert.ok(state.distanceDriven > 2, 'Vehicle should accumulate driven distance');

  state = stepVehiclePhysics(state, { ...IDLE_INPUT, jump: true }, 0.025);
  assert.equal(state.grounded, false);
  assert.ok(state.vy > 5);
});

test('nearest zone detection respects enabled resume modules', () => {
  const landing = findNearestZone(0, 2);
  assert.equal(landing.zone.id, 'profile');
  assert.equal(landing.inside, true);

  const proj = findNearestZone(28, -14);
  assert.equal(proj.zone.id, 'projects');
  assert.equal(proj.inside, true);

  const onlyCareer = new Set<'career'>(['career']);
  const filtered = findNearestZone(28, -14, onlyCareer);
  assert.equal(filtered.zone.id, 'career');
});

test('dynamic collision imparts velocity to knockable props', () => {
  const crate: DynamicBody = {
    x: 1,
    y: 0.46,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    rx: 0,
    rz: 0,
    radius: 0.58,
    mass: 0.7,
    knocked: false,
  };
  const hit = resolveDynamicBodyCollision(crate, 0, 0, 12, 0, 1.65);
  assert.equal(hit, true);
  assert.equal(crate.knocked, true);
  assert.ok(crate.vx > 5);
});

test('default resume config matches Han Hongzhe PDF with all 6 modules enabled', () => {
  assert.equal(DEFAULT_RESUME_CONFIG.profile.name, '韩鸿哲');
  assert.equal(DEFAULT_RESUME_CONFIG.careers.length, 5);
  assert.equal(DEFAULT_RESUME_CONFIG.education.length, 3);
  assert.ok(DEFAULT_RESUME_CONFIG.projects.length >= 6);

  const cloned = structuredClone(DEFAULT_RESUME_CONFIG);
  cloned.modules[1].enabled = false;
  const enabled = getEnabledModules(cloned);
  assert.equal(enabled.length, 5);
  assert.ok(!enabled.some((m) => m.id === 'projects'));
});
