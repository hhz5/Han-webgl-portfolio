import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialVehicleState,
  stepVehiclePhysics,
  groundHeightAt,
  isOnBridge,
  riverCenterZ,
  findNearestZone,
  resolveDynamicBodyCollision,
  updateCircuitProgress,
  CIRCUIT_CHECKPOINTS,
} from './worldLogic';

test('bridge deck lifts over the river depression cleanly', () => {
  const riverBed = groundHeightAt(12, riverCenterZ(12));
  assert.ok(riverBed < -0.5, `Expected river depression < -0.5, got ${riverBed}`);

  const cz0 = riverCenterZ(0);
  assert.equal(isOnBridge(0, cz0), true);
  const bridgeCenter = groundHeightAt(0, cz0);
  assert.ok(bridgeCenter > 0.3, `Expected bridge arch > 0.3, got ${bridgeCenter}`);
});

test('vehicle accelerates forward, steers, and jumps with gravity', () => {
  let state = createInitialVehicleState();
  const initialZ = state.z;

  const accelInput = {
    forward: true,
    backward: false,
    left: false,
    right: false,
    boost: false,
    brake: false,
    jump: false,
  };

  for (let i = 0; i < 20; i++) {
    state = stepVehiclePhysics(state, accelInput, 0.03);
  }
  assert.ok(state.speed > 5, 'Vehicle should accelerate forward');
  assert.ok(state.z < initialZ, 'Heading PI moves toward -Z (bridge)');
  assert.ok(state.distanceDriven > 1, 'Distance driven should accumulate');

  // Jump test
  state = stepVehiclePhysics(state, { ...accelInput, jump: true }, 0.016);
  assert.equal(state.grounded, false);
  assert.ok(state.vy > 5);
});

test('nearest zone detection identifies landing and projects plazas accurately', () => {
  const atSpawn = findNearestZone(0, 2);
  assert.equal(atSpawn.zone.id, 'landing');
  assert.equal(atSpawn.inside, true);

  const atProjects = findNearestZone(28, -14);
  assert.equal(atProjects.zone.id, 'projects');
  assert.equal(atProjects.inside, true);
});

test('dynamic collision knocks bowling pins and imparts velocity', () => {
  const pin = {
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    rx: 0,
    rz: 0,
    radius: 0.35,
    mass: 1,
    knocked: false,
  };

  const hit = resolveDynamicBodyCollision(pin, 0, 1.0, 0, -12, 1.5);
  assert.equal(hit, true);
  assert.equal(pin.knocked, true);
  assert.ok(pin.vz < -2, 'Pin should be pushed forward by truck impact');
});

test('circuit lap progression starts, advances checkpoints, and records best lap', () => {
  let circuit = {
    running: false,
    nextCheckpoint: 0,
    elapsedMs: 0,
    bestLapMs: null as number | null,
    lapsCompleted: 0,
  };

  const start = updateCircuitProgress(
    circuit,
    CIRCUIT_CHECKPOINTS[0].x,
    CIRCUIT_CHECKPOINTS[0].z,
    16
  );
  assert.equal(start.event, 'started');
  circuit = start.state;

  for (let i = 1; i < CIRCUIT_CHECKPOINTS.length; i++) {
    const cp = updateCircuitProgress(
      circuit,
      CIRCUIT_CHECKPOINTS[i].x,
      CIRCUIT_CHECKPOINTS[i].z,
      2500
    );
    assert.equal(cp.event, 'checkpoint');
    circuit = cp.state;
  }

  const finish = updateCircuitProgress(
    circuit,
    CIRCUIT_CHECKPOINTS[0].x,
    CIRCUIT_CHECKPOINTS[0].z,
    2500
  );
  assert.equal(finish.event, 'lap_finished');
  assert.equal(finish.state.lapsCompleted, 1);
  assert.ok(finish.state.bestLapMs !== null && finish.state.bestLapMs > 0);
});
