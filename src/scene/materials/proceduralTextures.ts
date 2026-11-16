import * as THREE from 'three';

export interface ProceduralTexturePack {
  groundMap: THREE.CanvasTexture;
  groundBump: THREE.CanvasTexture;
  woodMap: THREE.CanvasTexture;
  woodBump: THREE.CanvasTexture;
  lanternGlowMap: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  checkeredMap: THREE.CanvasTexture;
  asphaltMap: THREE.CanvasTexture;
  runeCircleMap: THREE.CanvasTexture;
  cookieMap: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

export function createProceduralTexturePack(maxAniso: number): ProceduralTexturePack {
  const created: THREE.Texture[] = [];
  const register = (tex: THREE.CanvasTexture, isColor: boolean, repeat = 1) => {
    if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    if (repeat !== 1) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeat, repeat);
    }
    tex.needsUpdate = true;
    created.push(tex);
    return tex;
  };

  // 1. Ground terracotta / warm sandstone cobble & organic soil
  const [gCanvas, gCtx] = makeCanvas(512, 512);
  gCtx.fillStyle = '#d97f5c';
  gCtx.fillRect(0, 0, 512, 512);

  // Subtle organic stone/earth patches
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 420; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 8 + rand() * 26;
    const shade = rand() > 0.5 ? 'rgba(248, 166, 120, 0.14)' : 'rgba(145, 74, 62, 0.12)';
    gCtx.fillStyle = shade;
    gCtx.beginPath();
    gCtx.ellipse(x, y, r, r * (0.65 + rand() * 0.5), rand() * Math.PI, 0, Math.PI * 2);
    gCtx.fill();
  }
  // Subtle paving cracks
  gCtx.strokeStyle = 'rgba(110, 52, 48, 0.16)';
  gCtx.lineWidth = 2;
  for (let i = 0; i < 65; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    gCtx.beginPath();
    gCtx.moveTo(x, y);
    gCtx.lineTo(x + (rand() - 0.5) * 48, y + (rand() - 0.5) * 48);
    gCtx.stroke();
  }
  const groundMap = register(new THREE.CanvasTexture(gCanvas), true, 24);

  // Ground micro-relief bump map (linear)
  const [gbCanvas, gbCtx] = makeCanvas(256, 256);
  gbCtx.fillStyle = '#808080';
  gbCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const v = Math.floor(105 + rand() * 55);
    gbCtx.fillStyle = `rgb(${v},${v},${v})`;
    gbCtx.fillRect(rand() * 256, rand() * 256, 2 + rand() * 6, 2 + rand() * 6);
  }
  const groundBump = register(new THREE.CanvasTexture(gbCanvas), false, 24);

  // 2. Warm wooden planks (Bridge, benches, crates, signposts)
  const [wCanvas, wCtx] = makeCanvas(512, 512);
  wCtx.fillStyle = '#cc704b';
  wCtx.fillRect(0, 0, 512, 512);
  const plankCount = 8;
  const plankH = 512 / plankCount;
  for (let p = 0; p < plankCount; p++) {
    const y0 = p * plankH;
    const tint = (rand() - 0.5) * 20;
    wCtx.fillStyle = `rgb(${204 + tint}, ${112 + tint * 0.6}, ${76 + tint * 0.4})`;
    wCtx.fillRect(0, y0 + 2, 512, plankH - 4);
    // Plank gap
    wCtx.fillStyle = '#5a2d24';
    wCtx.fillRect(0, y0, 512, 3);
    // Wood grain lines
    wCtx.strokeStyle = 'rgba(92, 42, 30, 0.22)';
    wCtx.lineWidth = 1.5;
    for (let g = 0; g < 6; g++) {
      const gy = y0 + 8 + rand() * (plankH - 16);
      wCtx.beginPath();
      wCtx.moveTo(0, gy);
      wCtx.bezierCurveTo(170, gy + (rand() - 0.5) * 8, 340, gy + (rand() - 0.5) * 8, 512, gy);
      wCtx.stroke();
    }
    // Nail heads
    wCtx.fillStyle = '#3b242c';
    for (const nx of [24, 488]) {
      wCtx.beginPath();
      wCtx.arc(nx, y0 + plankH * 0.3, 3.5, 0, Math.PI * 2);
      wCtx.arc(nx, y0 + plankH * 0.7, 3.5, 0, Math.PI * 2);
      wCtx.fill();
    }
  }
  const woodMap = register(new THREE.CanvasTexture(wCanvas), true, 1);

  const [wbCanvas, wbCtx] = makeCanvas(256, 256);
  wbCtx.fillStyle = '#909090';
  wbCtx.fillRect(0, 0, 256, 256);
  for (let p = 0; p < plankCount; p++) {
    wbCtx.fillStyle = '#202020';
    wbCtx.fillRect(0, p * (256 / plankCount), 256, 2);
  }
  const woodBump = register(new THREE.CanvasTexture(wbCanvas), false, 1);

  // 3. Stone Lantern glowing diamond lattice texture (matches Bruno's lanterns!)
  const [lCanvas, lCtx] = makeCanvas(256, 256);
  const grad = lCtx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#fff4b8');
  grad.addColorStop(0.5, '#ffba42');
  grad.addColorStop(1, '#ff7726');
  lCtx.fillStyle = grad;
  lCtx.fillRect(0, 0, 256, 256);

  lCtx.strokeStyle = '#3b2e4d';
  lCtx.lineWidth = 14;
  for (let i = -256; i <= 512; i += 64) {
    lCtx.beginPath();
    lCtx.moveTo(i, 0);
    lCtx.lineTo(i + 256, 256);
    lCtx.stroke();
    lCtx.beginPath();
    lCtx.moveTo(i + 256, 0);
    lCtx.lineTo(i, 256);
    lCtx.stroke();
  }
  lCtx.strokeRect(4, 4, 248, 248);
  const lanternGlowMap = register(new THREE.CanvasTexture(lCanvas), true, 1);

  // 4. Radial soft contact shadow disc
  const [sCanvas, sCtx] = makeCanvas(256, 256);
  const sGrad = sCtx.createRadialGradient(128, 128, 16, 128, 128, 124);
  sGrad.addColorStop(0, 'rgba(28, 16, 40, 0.72)');
  sGrad.addColorStop(0.55, 'rgba(28, 16, 40, 0.34)');
  sGrad.addColorStop(1, 'rgba(28, 16, 40, 0.0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 256, 256);
  const contactShadowMap = register(new THREE.CanvasTexture(sCanvas), true, 1);

  // 5. Checkered racing banner
  const [cCanvas, cCtx] = makeCanvas(256, 128);
  const sq = 32;
  for (let y = 0; y < 128; y += sq) {
    for (let x = 0; x < 256; x += sq) {
      cCtx.fillStyle = ((x / sq + y / sq) % 2 === 0) ? '#fff6ed' : '#262033';
      cCtx.fillRect(x, y, sq, sq);
    }
  }
  const checkeredMap = register(new THREE.CanvasTexture(cCanvas), true, 2);

  // 6. Warm asphalt road texture
  const [aCanvas, aCtx] = makeCanvas(256, 256);
  aCtx.fillStyle = '#383047';
  aCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1600; i++) {
    const shade = 44 + Math.floor(rand() * 34);
    aCtx.fillStyle = `rgb(${shade}, ${shade - 4}, ${shade + 12})`;
    aCtx.fillRect(rand() * 256, rand() * 256, 2, 2);
  }
  const asphaltMap = register(new THREE.CanvasTexture(aCanvas), true, 8);

  // 7. Altar star rune circle texture
  const [rCanvas, rCtx] = makeCanvas(512, 512);
  rCtx.clearRect(0, 0, 512, 512);
  rCtx.strokeStyle = '#c084fc';
  rCtx.lineWidth = 8;
  rCtx.beginPath();
  rCtx.arc(256, 256, 226, 0, Math.PI * 2);
  rCtx.stroke();
  rCtx.lineWidth = 4;
  rCtx.beginPath();
  rCtx.arc(256, 256, 184, 0, Math.PI * 2);
  rCtx.stroke();
  // 5-pointed geometric rune star
  rCtx.beginPath();
  for (let i = 0; i <= 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const rx = 256 + Math.cos(angle) * 210;
    const ry = 256 + Math.sin(angle) * 210;
    if (i === 0) rCtx.moveTo(rx, ry);
    else rCtx.lineTo(rx, ry);
  }
  rCtx.stroke();
  const runeCircleMap = register(new THREE.CanvasTexture(rCanvas), true, 1);

  // 8. Golden Cookie texture
  const [ckCanvas, ckCtx] = makeCanvas(256, 256);
  ckCtx.fillStyle = '#d99145';
  ckCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 140; i++) {
    ckCtx.fillStyle = rand() > 0.5 ? '#c47b35' : '#e6a55c';
    ckCtx.beginPath();
    ckCtx.arc(rand() * 256, rand() * 256, 3 + rand() * 8, 0, Math.PI * 2);
    ckCtx.fill();
  }
  // Chocolate chips
  ckCtx.fillStyle = '#3b211a';
  const chips = [
    [70, 75, 18],
    [175, 65, 22],
    [130, 128, 20],
    [68, 175, 19],
    [188, 168, 21],
    [122, 196, 15],
  ];
  for (const [cx, cy, cr] of chips) {
    ckCtx.beginPath();
    ckCtx.arc(cx, cy, cr, 0, Math.PI * 2);
    ckCtx.fill();
  }
  const cookieMap = register(new THREE.CanvasTexture(ckCanvas), true, 1);

  return {
    groundMap,
    groundBump,
    woodMap,
    woodBump,
    lanternGlowMap,
    contactShadowMap,
    checkeredMap,
    asphaltMap,
    runeCircleMap,
    cookieMap,
    dispose: () => {
      for (const t of created) t.dispose();
    },
  };
}

export function createProjectScreenTexture(
  title: string,
  category: string,
  accentHex: string,
  subtitle: string,
  maxAniso: number
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 320);
  const bg = ctx.createLinearGradient(0, 0, 512, 320);
  bg.addColorStop(0, '#231c36');
  bg.addColorStop(1, '#36274f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 320);

  // Decorative geometric preview graphic
  ctx.fillStyle = accentHex;
  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  ctx.arc(410, 110, 96, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 472, 280);

  ctx.fillStyle = accentHex;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(category.toUpperCase(), 42, 68);

  ctx.fillStyle = '#fff6ef';
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText(title, 42, 132);

  ctx.fillStyle = '#d6c6e1';
  ctx.font = '22px sans-serif';
  ctx.fillText(subtitle, 42, 182);

  ctx.fillStyle = accentHex;
  ctx.fillRect(42, 224, 150, 42);
  ctx.fillStyle = '#1b1528';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('PRESS ENTER', 58, 251);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  tex.needsUpdate = true;
  return tex;
}

export function createSignpostTexture(
  label: string,
  sublabel: string,
  maxAniso: number
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 96);
  ctx.fillStyle = '#c46845';
  ctx.fillRect(0, 0, 256, 96);
  ctx.strokeStyle = '#4e2926';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 250, 90);

  ctx.fillStyle = '#fff5e6';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, 128, 44, 224);

  ctx.fillStyle = '#ffd59e';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(sublabel, 128, 72, 224);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  tex.needsUpdate = true;
  return tex;
}
