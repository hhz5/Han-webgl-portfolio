import * as THREE from 'three';
import { createSignpostTexture } from '../materials/proceduralTextures';
import { groundHeightAt } from '../worldLogic';

export const CAREER_MILESTONES = [
  {
    year: '2014–2017',
    role: 'Creative Lead · Agencies',
    detail: '在巴黎创意数字机构主导多项 WebGL 与互动品牌项目开发，荣获多项 Awwwards & FWA 奖项。',
  },
  {
    year: '2018–2020',
    role: 'Independent Creative Dev',
    detail: '转型独立创意开发者，发布首版经典橙色沙漠赛车作品集，在全球前端与 3D 社区引发轰动。',
  },
  {
    year: '2021–2024',
    role: 'Three.js Journey Founder',
    detail: '创立全球最受欢迎的 Three.js 系统化在线课程，帮助数万名开发者掌握 WebGL 与着色器艺术。',
  },
  {
    year: '2025–2026',
    role: 'WebGPU & TSL Open World',
    detail: '以全新 TSL 与 Rapier 物理架构重构个人数字游乐场，打造可自由驾驶、探索与社交的 3D 世界。',
  },
];

/**
 * Independent component: Career Timeline Avenue with 4 monumental arches & year plaques.
 */
export function createCareerZone(maxAniso: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'CareerZone';
  const cx = -26;
  const cz = -18;
  group.position.set(cx, groundHeightAt(cx, cz), cz);
  group.rotation.y = 0.35;

  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0xd9805b,
    roughness: 0.72,
    metalness: 0.08,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x3b3152,
    roughness: 0.5,
    metalness: 0.28,
  });

  // Runway floor strip
  const walkway = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.14, 17.5), trimMat);
  walkway.position.set(0, 0.05, 0);
  walkway.receiveShadow = true;
  group.add(walkway);

  // 4 Timeline Milestone Arches spaced along Z
  CAREER_MILESTONES.forEach((m, idx) => {
    const zOffset = -6.0 + idx * 4.0;
    const arch = new THREE.Group();
    arch.position.set(0, 0.1, zOffset);

    // Left & right columns
    for (const sx of [-2.4, 2.4]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.58, 3.3, 0.58), pillarMat);
      col.position.set(sx, 1.65, 0);
      col.castShadow = true;
      arch.add(col);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.22, 0.74), trimMat);
      cap.position.set(sx, 3.35, 0);
      arch.add(cap);
    }

    // Arch lintel beam
    const beam = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.55, 0.62), pillarMat);
    beam.position.set(0, 3.65, 0);
    beam.castShadow = true;
    arch.add(beam);

    // Milestone plaque mounted on lintel
    const signTex = createSignpostTexture(m.year, m.role, maxAniso);
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 1.15),
      new THREE.MeshStandardMaterial({
        map: signTex,
        emissiveMap: signTex,
        emissive: new THREE.Color(0xffcfa0),
        emissiveIntensity: 0.25,
        roughness: 0.4,
      })
    );
    plaque.position.set(0, 3.65, 0.33);
    arch.add(plaque);

    const plaqueBack = plaque.clone();
    plaqueBack.rotation.y = Math.PI;
    plaqueBack.position.z = -0.33;
    arch.add(plaqueBack);

    group.add(arch);
  });

  return group;
}
