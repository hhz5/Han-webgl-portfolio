/**
 * Generates a complete, self-contained single-file HTML webpage with modular Three.js components,
 * procedural textures, OrbitControls, WASD driving, golden-hour lighting/fog, and loading progress.
 */
export function buildSingleFileHtml(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bruno's 3D Interactive World — Single File Three.js</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #261b33; color: #fff6ef; font-family: system-ui, -apple-system, "PingFang SC", sans-serif; user-select: none; }
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
      background: rgba(28, 20, 42, 0.85); border: 1px solid rgba(255, 224, 194, 0.16); border-radius: 12px;
    }
    .hud-top h1 { font-size: 15px; font-weight: 700; }
    .hud-top p { font-size: 12px; color: #f6cdb3; margin-top: 2px; }
    .dock {
      position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 20;
      display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 14px; max-width: 94vw;
      background: rgba(28, 20, 42, 0.88); border: 1px solid rgba(255, 224, 194, 0.18); border-radius: 14px;
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
    <div class="loader-title">BRUNO'S 3D WORLD</div>
    <div class="loader-bar"><div id="loader-fill" class="loader-fill"></div></div>
    <div id="loader-text" class="loader-text">正在初始化程序化 3D 世界... 0%</div>
  </div>

  <div class="hud-top">
    <h1>Bruno's Interactive World (单文件独立版)</h1>
    <p id="hud-zone">位置：木桥出生点 · 鼠标左键拖动旋转 · 滚轮缩放 · WASD 驾驶</p>
  </div>

  <div class="dock" id="dock">
    <button data-zone="landing" class="active">出生木桥</button>
    <button data-zone="projects">作品展区</button>
    <button data-zone="lab">实验工坊</button>
    <button data-zone="career">职业历程</button>
    <button data-zone="circuit">极速赛道</button>
    <button data-zone="bowling">保龄球</button>
    <button data-zone="altar">祭坛瀑布</button>
    <button id="btn-preset">切换光影氛围</button>
    <button id="btn-reset">重置车辆</button>
  </div>

  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

    // =========================================================================
    // 1. 纯数学地形与物理高度函数 (Terrain & Bridge Heightfield)
    // =========================================================================
    const ZONES = {
      landing: { name: '木桥出生点', x: 0, z: 2, heading: Math.PI },
      projects: { name: '作品展区', x: 28, z: -14, heading: -2.0 },
      lab: { name: '实验工坊', x: 25, z: 24, heading: 2.3 },
      career: { name: '职业历程', x: -26, z: -18, heading: 1.1 },
      circuit: { name: '极速赛道', x: -32, z: 18, heading: 0 },
      bowling: { name: '保龄球道', x: -4, z: -33, heading: Math.PI },
      altar: { name: '祭坛瀑布', x: -11, z: 36, heading: 2.6 },
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
      let h = 0;
      if (dist < halfW) h = -1.25 * (1 - (dist / halfW) ** 2);
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

    // =========================================================================
    // 2. 程序化贴图生成器 (Procedural CanvasTexture Factory)
    // =========================================================================
    function createProceduralTextures(maxAniso) {
      const makeTex = (w, h, draw, isColor = true, repeat = 1) => {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        draw(c.getContext('2d'), w, h);
        const t = new THREE.CanvasTexture(c);
        if (isColor) t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = maxAniso;
        if (repeat > 1) {
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.repeat.set(repeat, repeat);
        }
        return t;
      };

      const groundMap = makeTex(512, 512, (ctx) => {
        ctx.fillStyle = '#d97f5c';
        ctx.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 360; i++) {
          ctx.fillStyle = i % 2 === 0 ? 'rgba(248,166,120,0.14)' : 'rgba(130,62,54,0.12)';
          ctx.beginPath();
          ctx.arc((i * 73) % 512, (i * 137) % 512, 10 + (i % 18), 0, Math.PI * 2);
          ctx.fill();
        }
      }, true, 24);

      const woodMap = makeTex(512, 512, (ctx) => {
        ctx.fillStyle = '#cc704b';
        ctx.fillRect(0, 0, 512, 512);
        for (let p = 0; p < 8; p++) {
          ctx.fillStyle = '#5a2d24';
          ctx.fillRect(0, p * 64, 512, 3);
        }
      });

      const lanternMap = makeTex(256, 256, (ctx) => {
        const g = ctx.createLinearGradient(0, 0, 0, 256);
        g.addColorStop(0, '#fff4b8'); g.addColorStop(0.5, '#ffba42'); g.addColorStop(1, '#ff7726');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = '#3b2e4d'; ctx.lineWidth = 14;
        for (let i = -256; i <= 512; i += 64) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 256, 256); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(i + 256, 0); ctx.lineTo(i, 256); ctx.stroke();
        }
      });

      const shadowMap = makeTex(256, 256, (ctx) => {
        const g = ctx.createRadialGradient(128, 128, 16, 128, 128, 124);
        g.addColorStop(0, 'rgba(28,16,40,0.72)'); g.addColorStop(1, 'rgba(28,16,40,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
      });

      return { groundMap, woodMap, lanternMap, shadowMap };
    }

    // =========================================================================
    // 3. 独立组件模块 (Modular Scene Object Components)
    // =========================================================================

    // [组件 A] 天空氛围、雾气与三点光照系统
    class SkyAtmosphereComponent {
      constructor(scene) {
        this.presets = [
          { top: 0x4b386b, mid: 0xa45d7b, hor: 0xf4a071, fog: 0xd98471, sun: 0xffd093 },
          { top: 0x1a1838, mid: 0x4d346b, hor: 0xb85b7f, fog: 0x6f436e, sun: 0xd8a8ff },
          { top: 0x4c78a8, mid: 0xd1928c, hor: 0xffe0a8, fog: 0xf2c299, sun: 0xfff0c2 },
        ];
        this.idx = 0;
        this.uniforms = {
          uTop: { value: new THREE.Color(this.presets[0].top) },
          uMid: { value: new THREE.Color(this.presets[0].mid) },
          uHor: { value: new THREE.Color(this.presets[0].hor) },
        };
        const sky = new THREE.Mesh(
          new THREE.SphereGeometry(220, 32, 18),
          new THREE.ShaderMaterial({
            uniforms: this.uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
            vertexShader: 'varying vec3 vW; void main(){ vW=(modelMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.0); }',
            fragmentShader: 'uniform vec3 uTop,uMid,uHor; varying vec3 vW; void main(){ float h=clamp(normalize(vW).y,0.0,1.0); vec3 c=mix(uHor,uMid,smoothstep(0.0,0.28,h)); c=mix(c,uTop,smoothstep(0.24,0.85,h)); gl_FragColor=vec4(c,1.0); }',
          })
        );
        scene.add(sky);
        scene.fog = new THREE.FogExp2(this.presets[0].fog, 0.0082);
        scene.background = new THREE.Color(this.presets[0].hor);

        this.sun = new THREE.DirectionalLight(0xffd093, 2.35);
        this.sun.position.set(38, 28, 26);
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.set(1024, 1024);
        const d = 34;
        Object.assign(this.sun.shadow.camera, { left: -d, right: d, top: d, bottom: -d, near: 2, far: 120 });
        this.sun.shadow.bias = -0.0005;
        scene.add(this.sun);
        scene.add(new THREE.HemisphereLight(0x9980cc, 0x733a3d, 1.05));
      }
      cycle(scene) {
        this.idx = (this.idx + 1) % this.presets.length;
        const p = this.presets[this.idx];
        this.uniforms.uTop.value.setHex(p.top);
        this.uniforms.uMid.value.setHex(p.mid);
        this.uniforms.uHor.value.setHex(p.hor);
        scene.fog.color.setHex(p.fog);
        scene.background.setHex(p.hor);
        this.sun.color.setHex(p.sun);
      }
    }

    // [组件 B] 石灯笼组件
    class StoneLanternComponent {
      static create(tex, x, z) {
        const g = new THREE.Group();
        const stone = new THREE.MeshStandardMaterial({ color: 0xd9836a, roughness: 0.78 });
        const dark = new THREE.MeshStandardMaterial({ color: 0x3b3152, roughness: 0.55 });
        const glow = new THREE.MeshStandardMaterial({
          map: tex.lanternMap, emissiveMap: tex.lanternMap, emissive: 0xffa73b, emissiveIntensity: 1.9,
        });
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.24, 0.92), dark);
        base.position.y = 0.12; g.add(base);
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.78, 0.56), glow);
        body.position.y = 0.75; g.add(body);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.54, 0.34, 4), dark);
        roof.rotation.y = Math.PI * 0.25; roof.position.y = 1.4; g.add(roof);
        g.position.set(x, groundHeightAt(x, z), z);
        return g;
      }
    }

    // [组件 C] 木桥组件
    class WoodenBridgeComponent {
      static create(tex) {
        const g = new THREE.Group();
        const cz = riverCenterZ(0);
        const mat = new THREE.MeshStandardMaterial({ map: tex.woodMap, roughness: 0.72 });
        const geo = new THREE.BoxGeometry(4.6, 0.16, 0.46);
        for (let i = 0; i < 22; i++) {
          const z = cz - 5.8 + (i + 0.5) * (11.6 / 22);
          const m = new THREE.Mesh(geo, mat);
          m.position.set(0, bridgeDeckHeightAt(0, z) - 0.06, z);
          m.castShadow = m.receiveShadow = true;
          g.add(m);
        }
        g.add(StoneLanternComponent.create(tex, -3.3, cz + 5.8));
        g.add(StoneLanternComponent.create(tex, 3.3, cz - 5.8));
        return g;
      }
    }

    // [组件 D] 红黑越野卡车组件
    class OffroadTruckComponent {
      constructor(tex) {
        this.root = new THREE.Group();
        this.body = new THREE.Group();
        this.body.position.y = 0.42;
        this.root.add(this.body);
        const red = new THREE.MeshPhysicalMaterial({ color: 0xd43545, roughness: 0.28, metalness: 0.2, clearcoat: 0.85 });
        const dark = new THREE.MeshStandardMaterial({ color: 0x262230, roughness: 0.78 });
        const glow = new THREE.MeshStandardMaterial({ color: 0xffe49e, emissive: 0xffb84d, emissiveIntensity: 2.5 });
        const hull = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.75, 3.55), red);
        hull.position.y = 0.58; hull.castShadow = true; this.body.add(hull);
        const cab = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.55, 1.5), red);
        cab.position.set(0, 1.15, -0.15); cab.castShadow = true; this.body.add(cab);
        const headlights = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 0.1), glow);
        headlights.position.set(0, 0.68, 1.78); this.body.add(headlights);
        this.wheels = [];
        const wheelGeo = new THREE.CylinderGeometry(0.54, 0.54, 0.42, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        for (const [wx, wz] of [[-1, 1.15], [1, 1.15], [-1, -1.15], [1, -1.15]]) {
          const w = new THREE.Mesh(wheelGeo, dark);
          w.position.set(wx, 0.54, wz); w.castShadow = true;
          this.root.add(w); this.wheels.push(w);
        }
        const shadow = new THREE.Mesh(
          new THREE.PlaneGeometry(4.2, 5.2),
          new THREE.MeshBasicMaterial({ map: tex.shadowMap, transparent: true, opacity: 0.6, depthWrite: false })
        );
        shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.03; this.root.add(shadow);
      }
      update(state) {
        this.root.position.set(state.x, state.y, state.z);
        this.root.rotation.y = state.heading;
        for (const w of this.wheels) w.rotation.x = state.wheelSpin;
      }
    }

    // [组件 E] 地形、河流、玄武岩柱与草地
    class TerrainWaterComponent {
      static create(tex) {
        const g = new THREE.Group();
        const geo = new THREE.PlaneGeometry(170, 170, 96, 96);
        geo.rotateX(-Math.PI / 2);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), z = pos.getZ(i);
          const cz = riverCenterZ(x), d = Math.abs(z - cz), hw = 4.1 + Math.sin(x * 0.14) * 0.6;
          let y = d < hw ? -1.25 * (1 - (d / hw) ** 2) : 0;
          const rad = Math.hypot(x, z);
          if (rad > 48) y += Math.min(1, (rad - 48) / 36) ** 2 * 4.5;
          pos.setY(i, y);
        }
        geo.computeVertexNormals();
        const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex.groundMap, roughness: 0.88 }));
        ground.receiveShadow = true;
        g.add(ground);

        const waterGeo = new THREE.PlaneGeometry(160, 24, 48, 12);
        waterGeo.rotateX(-Math.PI / 2);
        const wp = waterGeo.attributes.position;
        for (let i = 0; i < wp.count; i++) wp.setZ(i, wp.getZ(i) + riverCenterZ(wp.getX(i)));
        const water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({ color: 0x2f5394, roughness: 0.16, metalness: 0.3, transparent: true, opacity: 0.9 }));
        water.position.y = -0.34;
        g.add(water);
        return g;
      }
    }

    // =========================================================================
    // 4. 主程序与渐进加载流程
    // =========================================================================
    const fillEl = document.getElementById('loader-fill');
    const textEl = document.getElementById('loader-text');
    const loaderEl = document.getElementById('loader');
    const setProgress = (p, msg) => {
      fillEl.style.width = p + '%';
      textEl.textContent = msg + ' ' + p + '%';
    };

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-wrap').appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.4, 340);
    camera.position.set(11, 7.8, 15.5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 6;
    controls.maxDistance = 45;
    controls.maxPolarAngle = Math.PI * 0.46;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    setProgress(25, '构建光影与雾气系统...');
    const atmosphere = new SkyAtmosphereComponent(scene);
    await new Promise(r => setTimeout(r, 30));

    setProgress(55, '生成程序化贴图与地形河流...');
    const tex = createProceduralTextures(Math.min(8, renderer.capabilities.getMaxAnisotropy()));
    scene.add(TerrainWaterComponent.create(tex));
    scene.add(WoodenBridgeComponent.create(tex));
    await new Promise(r => setTimeout(r, 30));

    setProgress(85, '装配越野卡车与世界各功能区...');
    const truck = new OffroadTruckComponent(tex);
    scene.add(truck.root);

    // 简易区域地标柱（作品/实验/职业/赛道/保龄球/祭坛）
    for (const [key, z] of Object.entries(ZONES)) {
      if (key === 'landing') continue;
      const pylon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 1.2, 3.2, 6),
        new THREE.MeshStandardMaterial({ color: 0x3b3157, roughness: 0.6 })
      );
      pylon.position.set(z.x, groundHeightAt(z.x, z.z) + 1.6, z.z);
      pylon.castShadow = true;
      scene.add(pylon);
      scene.add(StoneLanternComponent.create(tex, z.x + 2.4, z.z + 2.4));
    }

    setProgress(100, '启动 3D 世界...');
    await new Promise(r => setTimeout(r, 120));
    loaderEl.classList.add('hidden');

    const keys = {};
    window.addEventListener('keydown', e => keys[e.code] = true);
    window.addEventListener('keyup', e => keys[e.code] = false);
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const state = { x: 0, y: 0, z: 3.5, heading: Math.PI, speed: 0, wheelSpin: 0 };
    const prevTarget = new THREE.Vector3();
    const desiredTarget = new THREE.Vector3();

    document.querySelectorAll('#dock button[data-zone]').forEach(btn => {
      btn.addEventListener('click', () => {
        const z = ZONES[btn.dataset.zone];
        state.x = z.x; state.z = z.z; state.heading = z.heading; state.speed = 0;
        state.y = groundHeightAt(z.x, z.z);
        controls.target.set(z.x, state.y + 1.1, z.z);
        camera.position.set(z.x + 11, state.y + 7.8, z.z + 13);
        document.getElementById('hud-zone').textContent = '位置：' + z.name + ' · 鼠标左键拖动旋转 · 滚轮缩放 · WASD 驾驶';
      });
    });
    document.getElementById('btn-preset').addEventListener('click', () => atmosphere.cycle(scene));
    document.getElementById('btn-reset').addEventListener('click', () => {
      state.x = 0; state.z = 3.5; state.heading = Math.PI; state.speed = 0;
    });

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
      state.wheelSpin += state.speed * dt / 0.54;
      truck.update(state);

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
