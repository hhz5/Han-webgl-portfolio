import * as THREE from 'three';
import type { ProceduralTexturePack } from '../materials/proceduralTextures';
import type { VehicleState } from '../worldLogic';

export interface TruckComponent {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  contactShadow: THREE.Mesh;
  update: (state: VehicleState, elapsed: number) => void;
}

/**
 * Independent component: Bruno's iconic Red Off-Road Pickup Truck.
 * Multi-part procedural THREE.Group (12+ parts across silhouette, secondary, and accent detail).
 */
export function createOffroadTruck(textures: ProceduralTexturePack): TruckComponent {
  const root = new THREE.Group();
  root.name = 'OffroadTruck';

  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.42;
  root.add(bodyGroup);

  // Materials with strong roughness/metalness contrast
  const redPaintMat = new THREE.MeshPhysicalMaterial({
    color: 0xd43545,
    roughness: 0.28,
    metalness: 0.22,
    clearcoat: 0.85,
    clearcoatRoughness: 0.14,
  });

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x262230,
    roughness: 0.78,
    metalness: 0.18,
  });

  const metalCageMat = new THREE.MeshStandardMaterial({
    color: 0x1c1926,
    roughness: 0.42,
    metalness: 0.65,
  });

  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x1f1b2e,
    roughness: 0.12,
    metalness: 0.45,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffe49e,
    emissive: new THREE.Color(0xffb84d),
    emissiveIntensity: 2.6,
    roughness: 0.2,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    emissive: new THREE.Color(0xd946ef),
    emissiveIntensity: 2.2,
    roughness: 0.25,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x221f2b,
    roughness: 0.88,
    metalness: 0.05,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xc93647,
    roughness: 0.35,
    metalness: 0.45,
  });

  // 1. Chassis frame underbody
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.28, 3.65), darkTrimMat);
  chassis.position.set(0, 0.32, 0);
  chassis.castShadow = true;
  bodyGroup.add(chassis);

  // 2. Sculpted side profile lower body + hood + rear bed via ExtrudeGeometry
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-1.82, 0.25);
  hullShape.lineTo(1.82, 0.25);
  hullShape.lineTo(1.88, 0.62);
  hullShape.lineTo(1.75, 0.88); // front grille top
  hullShape.lineTo(0.85, 0.94); // hood rear
  hullShape.lineTo(0.45, 1.48); // windshield top
  hullShape.lineTo(-0.72, 1.48); // cab roof rear
  hullShape.lineTo(-0.88, 0.96); // cab back
  hullShape.lineTo(-1.82, 0.92); // truck bed top
  hullShape.closePath();

  const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
    depth: 1.56,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 2,
  });
  hullGeo.center();
  // Rotate so +Z is forward along profile X
  hullGeo.rotateY(-Math.PI / 2);
  const hullMesh = new THREE.Mesh(hullGeo, redPaintMat);
  hullMesh.position.set(0, 0.84, 0);
  hullMesh.castShadow = true;
  hullMesh.receiveShadow = true;
  bodyGroup.add(hullMesh);

  // 3. Hood scoop vent (matte dark accent)
  const hoodScoop = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.14, 0.68), darkTrimMat);
  hoodScoop.position.set(0, 1.18, 1.24);
  hoodScoop.castShadow = true;
  bodyGroup.add(hoodScoop);

  // 4. Windshield + Side Windows
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.42, 0.08), windowMat);
  windshield.position.set(0, 1.32, 0.64);
  windshield.rotation.x = -0.58;
  bodyGroup.add(windshield);

  const sideWinGeo = new THREE.BoxGeometry(1.68, 0.34, 0.94);
  const sideWindows = new THREE.Mesh(sideWinGeo, windowMat);
  sideWindows.position.set(0, 1.31, -0.05);
  bodyGroup.add(sideWindows);

  // 5. Front & Rear Heavy Off-Road Bumpers + Wheel Fender Flares
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.28, 0.34), darkTrimMat);
  frontBumper.position.set(0, 0.48, 1.94);
  frontBumper.castShadow = true;
  bodyGroup.add(frontBumper);

  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.24, 0.26), darkTrimMat);
  rearBumper.position.set(0, 0.48, -1.92);
  rearBumper.castShadow = true;
  bodyGroup.add(rearBumper);

  const fenderGeo = new THREE.BoxGeometry(0.28, 0.26, 0.95);
  for (const fx of [-0.94, 0.94]) {
    for (const fz of [1.18, -1.16]) {
      const fender = new THREE.Mesh(fenderGeo, darkTrimMat);
      fender.position.set(fx, 0.72, fz);
      fender.castShadow = true;
      bodyGroup.add(fender);
    }
  }

  // 6. Glowing Front LED Grille Bar & Taillights
  const frontGrille = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.24, 0.1), darkTrimMat);
  frontGrille.position.set(0, 0.84, 1.92);
  bodyGroup.add(frontGrille);

  const headlightLeft = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.12), headlightMat);
  headlightLeft.position.set(-0.5, 0.84, 1.93);
  bodyGroup.add(headlightLeft);

  const headlightRight = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.12), headlightMat);
  headlightRight.position.set(0.5, 0.84, 1.93);
  bodyGroup.add(headlightRight);

  const grilleLightBar = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, 0.11), headlightMat);
  grilleLightBar.position.set(0, 0.84, 1.93);
  bodyGroup.add(grilleLightBar);

  for (const tx of [-0.74, 0.74]) {
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.14), taillightMat);
    tail.position.set(tx, 0.88, -1.86);
    bodyGroup.add(tail);
  }

  // 7. Tubular Roof Rack & Bed Roll-Cage + 4 Glowing Roof Spotlights
  const rackBarGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.32, 8);
  rackBarGeo.rotateX(Math.PI / 2);
  for (const rx of [-0.58, 0.58]) {
    const rail = new THREE.Mesh(rackBarGeo, metalCageMat);
    rail.position.set(rx, 1.66, -0.15);
    rail.castShadow = true;
    bodyGroup.add(rail);
  }
  const crossBar = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.08, 0.16), metalCageMat);
  crossBar.position.set(0, 1.68, 0.42);
  bodyGroup.add(crossBar);

  // Diagonal roll-cage struts to rear bed
  const strutGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.15, 8);
  for (const rx of [-0.56, 0.56]) {
    const strut = new THREE.Mesh(strutGeo, metalCageMat);
    strut.position.set(rx, 1.32, -1.12);
    strut.rotation.x = 0.72;
    strut.castShadow = true;
    bodyGroup.add(strut);
  }

  // 4 roof spotlights
  for (const lx of [-0.42, -0.14, 0.14, 0.42]) {
    const pod = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.14), metalCageMat);
    pod.position.set(lx, 1.75, 0.44);
    bodyGroup.add(pod);

    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.04), headlightMat);
    lens.position.set(lx, 1.75, 0.5);
    bodyGroup.add(lens);
  }

  // Side mirrors
  for (const mx of [-0.94, 0.94]) {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.12), darkTrimMat);
    mirror.position.set(mx, 1.16, 0.54);
    bodyGroup.add(mirror);
  }

  // 8. Rear pickup bed cargo detail + exhaust tip
  const bedInterior = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.16, 0.95), darkTrimMat);
  bedInterior.position.set(0, 1.0, -1.28);
  bodyGroup.add(bedInterior);

  // 9. Four Chunky Knobby Off-Road Wheels (Steerable Front + Driven Rear)
  const wheelMeshes: THREE.Group[] = [];
  const frontSteerPivots: THREE.Group[] = [];

  const createWheel = (isLeft: boolean) => {
    const wheelGroup = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.44, 16), tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Knobby tread lugs around tire
    const lugGeo = new THREE.BoxGeometry(0.46, 0.09, 0.13);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const lug = new THREE.Mesh(lugGeo, tireMat);
      lug.position.set(0, Math.cos(a) * 0.53, Math.sin(a) * 0.53);
      lug.rotation.x = -a;
      wheelGroup.add(lug);
    }

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.46, 12), rimMat);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.49, 10), metalCageMat);
    hub.rotation.z = Math.PI / 2;
    wheelGroup.add(hub);

    if (isLeft) wheelGroup.rotation.y = Math.PI;
    return wheelGroup;
  };

  const wheelPositions: Array<{ x: number; z: number; front: boolean }> = [
    { x: -1.02, z: 1.18, front: true },
    { x: 1.02, z: 1.18, front: true },
    { x: -1.02, z: -1.16, front: false },
    { x: 1.02, z: -1.16, front: false },
  ];

  for (const wp of wheelPositions) {
    const pivot = new THREE.Group();
    pivot.position.set(wp.x, 0.54, wp.z);
    const wheel = createWheel(wp.x < 0);
    pivot.add(wheel);
    root.add(pivot);
    wheelMeshes.push(wheel);
    if (wp.front) frontSteerPivots.push(pivot);
  }

  // 10. Grounded Soft Contact Shadow Disc (always hugs ground)
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 5.4),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadowMap,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.03;
  root.add(contactShadow);

  const update = (state: VehicleState, elapsed: number) => {
    root.position.set(state.x, state.y, state.z);
    root.rotation.y = state.heading;

    // Suspension bounce + pitch + roll
    const engineVib = Math.sin(elapsed * 26) * (Math.abs(state.speed) > 0.3 ? 0.012 : 0.004);
    bodyGroup.position.y = 0.42 + engineVib;
    bodyGroup.rotation.x = state.pitch;
    bodyGroup.rotation.z = state.roll;

    // Steer front wheels
    for (const pivot of frontSteerPivots) {
      pivot.rotation.y = state.steerAngle;
    }

    // Spin all wheels matching travel distance
    for (let i = 0; i < wheelMeshes.length; i++) {
      const sign = i % 2 === 0 ? -1 : 1; // left side wheels are rotated PI
      wheelMeshes[i].rotation.x = state.wheelSpin * sign;
    }

    // Boost glow pulse on taillights & headlights
    taillightMat.emissiveIntensity = state.boosting ? 3.8 : 2.1;
    headlightMat.emissiveIntensity = state.boosting ? 3.2 : 2.4;

    // Fade contact shadow slightly when airborne
    const airHeight = Math.max(0, state.y);
    const shadowScale = 1 + Math.min(0.45, airHeight * 0.1);
    contactShadow.scale.setScalar(shadowScale);
    (contactShadow.material as THREE.MeshBasicMaterial).opacity = Math.max(
      0.18,
      0.62 - airHeight * 0.09
    );
  };

  return { root, bodyGroup, contactShadow, update };
}
