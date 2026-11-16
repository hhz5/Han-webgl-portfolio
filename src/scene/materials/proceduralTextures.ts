import * as THREE from 'three';

export interface ProceduralTexturePack {
  groundMap: THREE.CanvasTexture;
  groundBump: THREE.CanvasTexture;
  woodMap: THREE.CanvasTexture;
  woodBump: THREE.CanvasTexture;
  lanternGlowMap: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  asphaltMap: THREE.CanvasTexture;
  runeCircleMap: THREE.CanvasTexture;
  dispose: () => void;
}

const CJK_FONT_STACK = '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", system-ui, sans-serif';

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2
): number {
  const chars = Array.from(text);
  let line = '';
  let linesDrawn = 0;

  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
      if (linesDrawn >= maxLines - 1) {
        const trimmed = line.slice(0, Math.max(1, line.length - 1)) + '…';
        ctx.fillText(trimmed, x, y + linesDrawn * lineHeight);
        return linesDrawn + 1;
      }
      ctx.fillText(line, x, y + linesDrawn * lineHeight);
      linesDrawn++;
      line = chars[i];
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, y + linesDrawn * lineHeight);
    linesDrawn++;
  }
  return linesDrawn;
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

  const [gbCanvas, gbCtx] = makeCanvas(256, 256);
  gbCtx.fillStyle = '#808080';
  gbCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const v = Math.floor(105 + rand() * 55);
    gbCtx.fillStyle = `rgb(${v},${v},${v})`;
    gbCtx.fillRect(rand() * 256, rand() * 256, 2 + rand() * 6, 2 + rand() * 6);
  }
  const groundBump = register(new THREE.CanvasTexture(gbCanvas), false, 24);

  // 2. Warm wooden planks
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
    wCtx.fillStyle = '#5a2d24';
    wCtx.fillRect(0, y0, 512, 3);
    wCtx.strokeStyle = 'rgba(92, 42, 30, 0.22)';
    wCtx.lineWidth = 1.5;
    for (let g = 0; g < 6; g++) {
      const gy = y0 + 8 + rand() * (plankH - 16);
      wCtx.beginPath();
      wCtx.moveTo(0, gy);
      wCtx.bezierCurveTo(170, gy + (rand() - 0.5) * 8, 340, gy + (rand() - 0.5) * 8, 512, gy);
      wCtx.stroke();
    }
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

  // 3. Stone Lantern glowing diamond lattice texture
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

  // 5. Plaza dark slate paving texture
  const [aCanvas, aCtx] = makeCanvas(256, 256);
  aCtx.fillStyle = '#383047';
  aCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) {
    const shade = 44 + Math.floor(rand() * 30);
    aCtx.fillStyle = `rgb(${shade}, ${shade - 4}, ${shade + 12})`;
    aCtx.fillRect(rand() * 256, rand() * 256, 2, 2);
  }
  const asphaltMap = register(new THREE.CanvasTexture(aCanvas), true, 8);

  // 6. Sanctuary rune circle texture
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

  return {
    groundMap,
    groundBump,
    woodMap,
    woodBump,
    lanternGlowMap,
    contactShadowMap,
    asphaltMap,
    runeCircleMap,
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
  stats: string,
  maxAniso: number
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 320);
  const bg = ctx.createLinearGradient(0, 0, 512, 320);
  bg.addColorStop(0, '#1f1832');
  bg.addColorStop(1, '#31234a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 320);

  // Accent corner glow
  ctx.fillStyle = accentHex;
  ctx.globalAlpha = 0.16;
  ctx.beginPath();
  ctx.arc(430, 88, 92, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Frame border + top accent bar
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, 480, 288);
  ctx.fillStyle = accentHex;
  ctx.fillRect(16, 16, 480, 10);

  // Category tag
  ctx.fillStyle = accentHex;
  ctx.font = `bold 18px ${CJK_FONT_STACK}`;
  ctx.fillText(category, 38, 62, 430);

  // Title (wrapped cleanly across up to 2 lines)
  ctx.fillStyle = '#fff6ef';
  ctx.font = `bold 32px ${CJK_FONT_STACK}`;
  const titleLines = drawWrappedText(ctx, title, 38, 108, 434, 40, 2);

  // Subtitle
  const subY = 108 + titleLines * 40 + 6;
  ctx.fillStyle = '#d9cbe6';
  ctx.font = `20px ${CJK_FONT_STACK}`;
  drawWrappedText(ctx, subtitle, 38, subY, 434, 28, 2);

  // Bottom stat pill
  ctx.fillStyle = accentHex;
  ctx.fillRect(38, 242, 434, 42);
  ctx.fillStyle = '#1b1429';
  ctx.font = `bold 17px ${CJK_FONT_STACK}`;
  ctx.fillText(stats, 52, 269, 406);

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
  const [canvas, ctx] = makeCanvas(384, 128);
  ctx.fillStyle = '#2d2142';
  ctx.fillRect(0, 0, 384, 128);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 376, 120);

  ctx.fillStyle = '#fff6ef';
  ctx.font = `bold 28px ${CJK_FONT_STACK}`;
  ctx.textAlign = 'center';
  ctx.fillText(label, 192, 54, 344);

  ctx.fillStyle = '#fcd34d';
  ctx.font = `bold 19px ${CJK_FONT_STACK}`;
  ctx.fillText(sublabel, 192, 92, 344);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  tex.needsUpdate = true;
  return tex;
}

export function createWelcomeMonolithTexture(
  name: string,
  title: string,
  experience: string,
  availability: string,
  contact: string,
  maxAniso: number
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 256);
  const bg = ctx.createLinearGradient(0, 0, 512, 256);
  bg.addColorStop(0, '#211835');
  bg.addColorStop(1, '#3a2752');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 492, 236);

  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(10, 10, 492, 10);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff6ef';
  ctx.font = `bold 44px ${CJK_FONT_STACK}`;
  ctx.fillText(`${name} · ${title}`, 256, 86, 456);

  ctx.fillStyle = '#fbd38d';
  ctx.font = `bold 24px ${CJK_FONT_STACK}`;
  ctx.fillText(`${experience} · ${availability}`, 256, 140, 456);

  ctx.fillStyle = '#38bdf8';
  ctx.font = `bold 22px ${CJK_FONT_STACK}`;
  ctx.fillText(contact, 256, 192, 456);

  ctx.fillStyle = '#d6c6e1';
  ctx.font = `16px ${CJK_FONT_STACK}`;
  ctx.fillText('WASD 驾驶探索 · 鼠标拖动旋转 / 滚轮缩放', 256, 228, 456);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  tex.needsUpdate = true;
  return tex;
}

export function createMetricPillarTexture(
  headline: string,
  label: string,
  detail: string,
  accentHex: string,
  maxAniso: number
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(384, 256);
  ctx.fillStyle = '#1f1632';
  ctx.fillRect(0, 0, 384, 256);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 368, 240);

  ctx.fillStyle = accentHex;
  ctx.font = `bold 42px ${CJK_FONT_STACK}`;
  ctx.textAlign = 'center';
  ctx.fillText(headline, 192, 82, 340);

  ctx.fillStyle = '#fff6ef';
  ctx.font = `bold 24px ${CJK_FONT_STACK}`;
  ctx.fillText(label, 192, 132, 340);

  ctx.fillStyle = '#d4c3e2';
  ctx.font = `18px ${CJK_FONT_STACK}`;
  drawWrappedText(ctx, detail, 192, 174, 320, 26, 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  tex.needsUpdate = true;
  return tex;
}
