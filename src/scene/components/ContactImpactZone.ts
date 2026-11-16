import * as THREE from 'three';
import type { ImpactMetricItem, ProfileInfo } from '../../data/resumeConfig';
import {
  createMetricPillarTexture,
  createSignpostTexture,
} from '../materials/proceduralTextures';
import { groundHeightAt } from '../worldLogic';

export interface ContactImpactZoneComponent {
  group: THREE.Group;
  update: (elapsed: number) => void;
  dispose: () => void;
}

/**
 * Independent component: Commercial Impact Totems & Direct Contact Hub at (-28, 14).
 * Showcases revenue/scale KPIs (2000万+, 30+ 伙伴, 1000万 MAU, 97% 满意度) + Contact Beacon.
 */
export function createContactImpactZone(
  metrics: ImpactMetricItem[],
  profile: ProfileInfo,
  maxAniso: number
): ContactImpactZoneComponent {
  const group = new THREE.Group();
  group.name = 'ContactImpactZone';
  const cx = -28;
  const cz = 14;
  group.position.set(cx, groundHeightAt(cx, cz), cz);

  const createdTextures: THREE.Texture[] = [];

  const slateMat = new THREE.MeshStandardMaterial({
    color: 0x2f2645,
    roughness: 0.55,
    metalness: 0.3,
  });

  // Circular Plaza Base
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.6, 0.24, 24), slateMat);
  dais.position.y = 0.1;
  dais.receiveShadow = true;
  group.add(dais);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(6.7, 7.0, 32),
    new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.23;
  group.add(ring);

  // Side-Foreground Contact Monument so rear metric totems remain 100% clear
  const contactGroup = new THREE.Group();
  contactGroup.position.set(3.4, 0, 2.8);
  contactGroup.lookAt(-7, 0, 14);
  group.add(contactGroup);

  const hubBase = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.6, 8), slateMat);
  hubBase.position.y = 0.42;
  hubBase.castShadow = true;
  contactGroup.add(hubBase);

  const contactTex = createSignpostTexture(
    `${profile.name} · ${profile.availability}`,
    `${profile.phone} | ${profile.email}`,
    maxAniso
  );
  createdTextures.push(contactTex);

  const contactBoard = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 1.15, 0.2),
    new THREE.MeshStandardMaterial({
      map: contactTex,
      emissiveMap: contactTex,
      emissive: new THREE.Color(0x6ee7b7),
      emissiveIntensity: 0.25,
      roughness: 0.35,
    })
  );
  contactBoard.position.set(0, 1.45, 0);
  contactBoard.castShadow = true;
  contactGroup.add(contactBoard);

  const beaconOrb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.38, 0),
    new THREE.MeshStandardMaterial({
      color: 0x6ee7b7,
      emissive: new THREE.Color(0x10b981),
      emissiveIntensity: 2.0,
    })
  );
  beaconOrb.position.set(3.4, 2.65, 2.8);
  group.add(beaconOrb);

  // 4 Commercial Impact Metric Totems along the back semicircle facing the approach camera
  const arcAngles = [-Math.PI * 0.88, -Math.PI * 0.64, -Math.PI * 0.38, -Math.PI * 0.14];
  metrics.slice(0, 4).forEach((m, idx) => {
    const a = arcAngles[idx] ?? -Math.PI * 0.5;
    const px = Math.cos(a) * 5.6;
    const pz = Math.sin(a) * 5.4;

    const totem = new THREE.Group();
    totem.position.set(px, 0.2, pz);
    totem.lookAt(-8, 0.2, 14);

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.6, 0.6), slateMat);
    plinth.position.y = 0.3;
    plinth.castShadow = true;
    totem.add(plinth);

    const tex = createMetricPillarTexture(
      m.value,
      m.label,
      m.detail,
      m.accentHex,
      maxAniso
    );
    createdTextures.push(tex);

    const card = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.6, 0.16),
      new THREE.MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.35,
        roughness: 0.35,
      })
    );
    card.position.set(0, 1.5, 0);
    card.castShadow = true;
    totem.add(card);

    group.add(totem);
  });

  const update = (elapsed: number) => {
    beaconOrb.rotation.y = elapsed * 1.1;
    beaconOrb.position.y = 2.65 + Math.sin(elapsed * 2.5) * 0.14;
  };

  const dispose = () => {
    for (const t of createdTextures) t.dispose();
  };

  return { group, update, dispose };
}
