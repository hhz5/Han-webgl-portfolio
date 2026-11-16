/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { AdminPage } from './components/AdminPage';
import { WorldOverlay, type OverlayModalId } from './components/WorldOverlay';
import {
  loadResumeConfig,
  resetResumeConfig,
  saveResumeConfig,
  type ResumeModuleId,
  type ResumeSiteConfig,
} from './data/resumeConfig';
import {
  mountWorldScene,
  type WorldHudSnapshot,
  type WorldSceneHandle,
} from './scene/WorldScene';
import { WORLD_ZONES, type AtmospherePresetId } from './scene/worldLogic';
import { buildSingleFileHtml } from './utils/exportSingleFileHtml';

const INITIAL_HUD: WorldHudSnapshot = {
  speedKmh: 0,
  distanceMeters: 0,
  nearestZone: WORLD_ZONES[0],
  insideZone: true,
  truckX: 0,
  truckZ: 3.5,
  truckHeading: Math.PI,
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneHandleRef = useRef<WorldSceneHandle | null>(null);

  const [config, setConfig] = useState<ResumeSiteConfig>(() => loadResumeConfig());
  const [viewMode, setViewMode] = useState<'world' | 'admin'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'admin' ? 'admin' : 'world';
  });

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('准备初始化 3D 简历场景...');
  const [isReady, setIsReady] = useState(false);
  const [hud, setHud] = useState<WorldHudSnapshot>(INITIAL_HUD);
  const [cameraMode, setCameraMode] = useState<'follow' | 'free'>('follow');
  const [activeModal, setActiveModal] = useState<OverlayModalId>(null);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const instantStart = params.get('autostart') === '1';

    const handle = mountWorldScene(
      container,
      config,
      {
        onProgress: (pct, stage) => {
          setLoadingProgress(pct);
          setLoadingStage(stage);
        },
        onReady: () => {
          setIsReady(true);
        },
        onHudUpdate: (snapshot) => {
          setHud(snapshot);
        },
        onZoneInteract: (zoneId) => {
          setActiveModal(zoneId);
        },
      },
      instantStart
    );

    sceneHandleRef.current = handle;

    return () => {
      handle.dispose();
      sceneHandleRef.current = null;
    };
    // Mount WebGL scene once on startup; subsequent config updates flow via applyConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyConfig = (next: ResumeSiteConfig) => {
    setConfig(next);
    saveResumeConfig(next);
    sceneHandleRef.current?.applyConfig(next);
  };

  const handleResetDefault = () => {
    const fresh = resetResumeConfig();
    setConfig(fresh);
    sceneHandleRef.current?.applyConfig(fresh);
    return fresh;
  };

  const handleSelectZone = (zoneId: ResumeModuleId) => {
    sceneHandleRef.current?.teleportToZone(zoneId);
  };

  const handleSetAtmosphere = (preset: AtmospherePresetId) => {
    const next: ResumeSiteConfig = {
      ...config,
      display: { ...config.display, atmosphere: preset },
    };
    setConfig(next);
    saveResumeConfig(next);
    sceneHandleRef.current?.setAtmosphere(preset);
  };

  const handleSetCameraMode = (mode: 'follow' | 'free') => {
    setCameraMode(mode);
    sceneHandleRef.current?.setCameraMode(mode);
  };

  const handleExportHtml = () => {
    const html = buildSingleFileHtml(config);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Han-webgl-portfolio.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main
      className="relative h-screen w-screen overflow-hidden bg-[#261b33]"
      data-state={isReady ? 'ready' : 'loading'}
    >
      <div
        ref={canvasMountRef}
        data-testid="world-canvas-container"
        className="h-full w-full"
      />

      {viewMode === 'world' ? (
        <WorldOverlay
          config={config}
          loadingProgress={loadingProgress}
          loadingStage={loadingStage}
          isReady={isReady}
          hud={hud}
          cameraMode={cameraMode}
          activeModal={activeModal}
          onSelectZone={handleSelectZone}
          onSetAtmosphere={handleSetAtmosphere}
          onSetCameraMode={handleSetCameraMode}
          onRespawn={() => sceneHandleRef.current?.respawnTruck()}
          onOpenModal={setActiveModal}
          onOpenAdmin={() => setViewMode('admin')}
          onExportHtml={handleExportHtml}
          onHonk={() => sceneHandleRef.current?.honk()}
        />
      ) : (
        <AdminPage
          config={config}
          onApplyConfig={handleApplyConfig}
          onResetDefault={handleResetDefault}
          onBackToWorld={() => setViewMode('world')}
        />
      )}
    </main>
  );
}
