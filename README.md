# Han-webgl-portfolio

韩鸿哲（AI 产品总监 · 10 年以上经验）的纯代码程序化 Three.js 3D 交互式个人简历与后台管理系统。

- **GitHub 仓库**: https://github.com/hhz5/Han-webgl-portfolio
- **核心特性**:
  - **纯程序化 3D 场景**: 所有地形、跨河木桥、车辆、石灯笼、动态三环陀螺仪与中文展板贴图均由 Three.js 与 Canvas 2D 代码生成，无外部模型或图片资源依赖。
  - **六大简历展区**: 个人概况（4 大核心优势）、核心项目（影源大模型 MaaS / 创影 AIGC / 元宇宙数字空间等）、职业历程（2006–2025 五段经历）、AI 技术栈、教育背景、商业成果与联系方式。
  - **自由交互与驾驶**: 支持鼠标左键拖拽旋转视角、滚轮缩放、WASD 驾驶探索、三大氛围光影切换（日落余晖 / 暮色紫霞 / 晨曦暖阳）以及单文件 HTML 导出。
  - **后台管理系统**: 支持前端 3D 模块启用/停用、排序与重命名，及个人概况、核心亮点、工作经历、核心项目、教育与商业成果的全量编辑与实时同步。

## 本地开发

```bash
npm install
npm run dev
```

默认访问 `http://localhost:3000`。

## 验证与构建

```bash
npm run lint
npm run build
npx tsx --test src/scene/worldLogic.test.ts
```
