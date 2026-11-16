import type { ResumeSiteConfig } from '../data/resumeConfig';

/**
 * Generates a complete, self-contained single-file HTML webpage reflecting Han Hongzhe's
 * configured resume modules, modular Three.js components, OrbitControls, and golden-hour lighting.
 */
export function buildSingleFileHtml(config: ResumeSiteConfig): string {
  const safeJson = JSON.stringify(config).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${config.profile.name} · ${config.profile.title} — 3D 交互式简历</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #261b33; color: #fff6ef; font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; user-select: none; }
    #canvas-wrap { position: fixed; inset: 0; }
    #loader {
      position: fixed; inset: 0; z-index: 40; display: flex; flex-direction: column;
      align-items: center; justify-content: center; background: linear-gradient(160deg, #2d2040 0%, #5e3854 55%, #b86656 100%);
      transition: opacity 0.5s ease;
    }
    #loader.hidden { opacity: 0; pointer-events: none; }
    .loader-title { font-size: 28px; font-weight: 800; letter-spacing: 0.04em; margin-bottom: 14px; }
    .loader-bar { width: min(360px, 80vw); height: 8px; background: rgba(255,255,255,0.16); border-radius: 999px; overflow: hidden; }
    .loader-fill { height: 100%; width: 0%; background: linear-gradient(90deg, #fbbf24, #fb7185); transition: width 0.2s ease; }
    .loader-text { margin-top: 10px; font-size: 13px; color: #ffe8d6; }
    .hud-top {
      position: fixed; top: 16px; left: 16px; z-index: 20; padding: 10px 16px;
      background: rgba(28, 20, 42, 0.88); border: 1px solid rgba(255, 224, 194, 0.18); border-radius: 12px;
    }
    .hud-top h1 { font-size: 15px; font-weight: 700; }
    .hud-top p { font-size: 12px; color: #f6cdb3; margin-top: 3px; }
    .dock {
      position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 20;
      display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 14px; max-width: 94vw;
      background: rgba(28, 20, 42, 0.9); border: 1px solid rgba(255, 224, 194, 0.18); border-radius: 14px;
    }
    .dock button {
      border: 0; border-radius: 8px; padding: 7px 12px; font-size: 12px; font-weight: 600;
      cursor: pointer; color: #fff6ef; background: rgba(255, 255, 255, 0.1);
    }
    .dock button:hover { background: rgba(251, 191, 36, 0.28); }
    .dock button.active { background: #e14d58; color: #fff; }
  </style>
  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.174.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/"
      }
    }
  </script>
</head>
<body>
  <div id="canvas-wrap"></div>

  <div id="loader">
    <div class="loader-title">${config.profile.name} · ${config.profile.title}</div>
    <div class="loader-bar"><div id="loader-fill" class="loader-fill"></div></div>
    <div id="loader-text" class="loader-text">正在初始化 3D 简历世界... 0%</div>
  </div>

  <div class="hud-top">
    <h1>${config.profile.name} · ${config.profile.title} (${config.profile.experienceYears})</h1>
    <p id="hud-zone">${config.profile.phone} | ${config.profile.email} · 鼠标拖动旋转 · 滚轮缩放 · WASD 驾驶</p>
  </div>

  <div class="dock" id="dock"></div>

  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

    const RESUME = ${safeJson};
    const ZONES = {
      profile: { x: 0, z: 2, heading: Math.PI },
      projects: { x: 28, z: -14, heading: -2.2 },
      career: { x: -26, z: -18, heading: 2.6 },
      ai_lab: { x: 25, z: 24, heading: 2.3 },
      education: { x: -11, z: 36, heading: -0.7 },
      contact: { x: -28, z: 14, heading: Math.PI },
    };

    function riverCenterZ(x) {
      return -7.5 + Math.sin(x * 0.085) * 4.2 + Math.cos(x * 0.03) * 1.4;
    }

    function bridgeDeckHeightAt(x, z) {
      const cz = riverCenterZ(0);
      if (Math.abs(x) > 2.45 || Math.abs(z - cz) > 5.8) return 0;
      return 0.55 * Math.sin((1 - Math.abs(z - cz) / 5.8) * Math.PI * 0.5);
    }

    function groundHeightAt(x, z) {
      const cz = riverCenterZ(x);
      const dist = Math.abs(z - cz);
      const halfW = 4.1 + Math.sin(x * 0.14) * 0.6;
      let h = dist < halfW ? -1.25 * (1 - (dist / halfW) ** 2) : 0;
      const radial = Math.hypot(x, z);
      if (radial > 48) {
        const hf = Math.min(1, (radial - 48) / 36);
        h += hf * hf * (3.5 + Math.sin(x * 0.08) * Math.cos(z * 0.08) * 3.5);
      }
      if (Math.abs(x) <= 2.45 && Math.abs(z - riverCenterZ(0)) <= 5.8) {
        return Math.max(h, bridgeDeckHeightAt(x, z));
      }
      return h;
    }

    function makeCardTexture(title, sub, accent) {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#1f1832';
      ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = accent || '#fbbf24';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, 496, 240);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff6ef';
      ctx.font = 'bold 34px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(title, 256, 108, 456);
      ctx.fillStyle = '#fcd34d';
      ctx.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(sub, 256, 168, 456);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }

    const fillEl = document.getElementById('loader-fill');
    const textEl = document.getElementById('loader-text');
    const loaderEl = document.getElementById('loader');
    const setProgress = (p, msg) => { fillEl.style.width = p + '%'; textEl.textContent = msg + ' ' + p + '%'; };

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-wrap').appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xd98471, 0.0082);
    scene.background = new THREE.Color(0xf4a071);

    const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.4, 340);
    camera.position.set(11, 7.8, 15.5);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 6;
    controls.maxDistance = 48;
    controls.maxPolarAngle = Math.PI * 0.46;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const sun = new THREE.DirectionalLight(0xffd093, 2.35);
    sun.position.set(38, 28, 26);
    sun.castShadow = true;
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x9980cc, 0x733a3d, 1.05));

    setProgress(45, '生成地形、溪流与木桥...');
    const geo = new THREE.PlaneGeometry(170, 170, 88, 88);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, groundHeightAt(pos.getX(i), pos.getZ(i)));
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xd97f5c, roughness: 0.88 }));
    ground.receiveShadow = true;
    scene.add(ground);

    const waterGeo = new THREE.PlaneGeometry(160, 24, 48, 12);
    waterGeo.rotateX(-Math.PI / 2);
    const wp = waterGeo.attributes.position;
    for (let i = 0; i < wp.count; i++) wp.setZ(i, wp.getZ(i) + riverCenterZ(wp.getX(i)));
    const water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({ color: 0x2f5394, roughness: 0.16, metalness: 0.3, transparent: true, opacity: 0.9 }));
    water.position.y = -0.34;
    scene.add(water);

    setProgress(80, '构建简历 3D 展区与越野车辆...');
    const truck = new THREE.Group();
    const redMat = new THREE.MeshPhysicalMaterial({ color: 0xd43545, roughness: 0.28, clearcoat: 0.85 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x262230, roughness: 0.75 });
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.75, 3.55), redMat);
    hull.position.y = 1.0; hull.castShadow = true; truck.add(hull);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.55, 1.5), redMat);
    cab.position.set(0, 1.55, -0.15); cab.castShadow = true; truck.add(cab);
    const wGeo = new THREE.CylinderGeometry(0.54, 0.54, 0.42, 16);
    wGeo.rotateZ(Math.PI / 2);
    for (const [wx, wz] of [[-1, 1.15], [1, 1.15], [-1, -1.15], [1, -1.15]]) {
      const w = new THREE.Mesh(wGeo, darkMat); w.position.set(wx, 0.54, wz); truck.add(w);
    }
    scene.add(truck);

    const dock = document.getElementById('dock');
    const enabledMods = RESUME.modules.filter((m) => m.enabled).sort((a, b) => a.order - b.order);
    enabledMods.forEach((m) => {
      const z = ZONES[m.id];
      const pylon = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 2.2, 0.24),
        new THREE.MeshStandardMaterial({ map: makeCardTexture(m.name, m.subtitle, m.accentHex), roughness: 0.4 })
      );
      pylon.position.set(z.x, groundHeightAt(z.x, z.z) + 1.4, z.z);
      pylon.castShadow = true;
      scene.add(pylon);

      const btn = document.createElement('button');
      btn.textContent = m.name;
      btn.addEventListener('click', () => {
        state.x = z.x; state.z = z.z + 4.5; state.heading = z.heading; state.speed = 0;
        state.y = groundHeightAt(state.x, state.z);
        controls.target.set(z.x, state.y + 1.3, z.z);
        camera.position.set(z.x + 11, state.y + 7.5, z.z + 13);
      });
      dock.appendChild(btn);
    });

    setProgress(100, '准备就绪');
    await new Promise((r) => setTimeout(r, 120));
    loaderEl.classList.add('hidden');

    const keys = {};
    window.addEventListener('keydown', (e) => (keys[e.code] = true));
    window.addEventListener('keyup', (e) => (keys[e.code] = false));
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const state = { x: 0, y: 0, z: 3.5, heading: Math.PI, speed: 0 };
    const prevTarget = new THREE.Vector3();
    const desiredTarget = new THREE.Vector3();
    let last = performance.now();

    function animate() {
      requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const throttle = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
      const steer = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
      if (throttle) state.speed += throttle * 20 * dt;
      else state.speed *= Math.exp(-3.2 * dt);
      state.speed = Math.max(-10, Math.min(18, state.speed));
      state.heading += steer * 2.4 * Math.min(1, Math.abs(state.speed) / 3) * (state.speed >= 0 ? 1 : -1) * dt;
      state.x += Math.sin(state.heading) * state.speed * dt;
      state.z += Math.cos(state.heading) * state.speed * dt;
      state.y = groundHeightAt(state.x, state.z);
      truck.position.set(state.x, state.y, state.z);
      truck.rotation.y = state.heading;

      prevTarget.copy(controls.target);
      desiredTarget.set(state.x, state.y + 1.15, state.z);
      controls.target.lerp(desiredTarget, 1 - Math.exp(-7 * dt));
      camera.position.add(controls.target.clone().sub(prevTarget));
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
  </script>
</body>
</html>`;
}
