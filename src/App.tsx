/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { WorldOverlay, type WorldOverlayProps } from './components/WorldOverlay';
import {
  mountWorldScene,
  type WorldHudSnapshot,
  type WorldSceneHandle,
} from './scene/WorldScene';
import {
  WORLD_ZONES,
  type AtmospherePresetId,
  type WorldZoneDef,
} from './scene/worldLogic';
import { buildSingleFileHtml } from './utils/exportSingleFileHtml';

const INITIAL_HUD: WorldHudSnapshot = {
  speedKmh: 0,
  distanceMeters: 0,
  cookiesCollected: 0,
  totalCookies: 8,
  pinsKnocked: 0,
  nearestZone: WORLD_ZONES[0],
  insideZone: true,
  truckX: 0,
  truckZ: 3.5,
  truckHeading: Math.PI,
  circuit: {
    running: false,
    nextCheckpoint: 0,
    elapsedMs: 0,
    bestLapMs: null,
    lapsCompleted: 0,
  },
  unlockedAchievements: [],
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneHandleRef = useRef<WorldSceneHandle | null>(null);

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('准备初始化 3D 场景...');
  const [isReady, setIsReady] = useState(false);
  const [hud, setHud] = useState<WorldHudSnapshot>(INITIAL_HUD);
  const [atmosphere, setAtmosphere] = useState<AtmospherePresetId>('sunset');
  const [cameraMode, setCameraMode] = useState<'follow' | 'free'>('follow');
  const [activeModal, setActiveModal] =
    useState<WorldOverlayProps['activeModal']>(null);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const instantStart = params.get('autostart') === '1';

    const handle = mountWorldScene(
      container,
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
  }, []);

  const handleSelectZone = (zoneId: WorldZoneDef['id']) => {
    sceneHandleRef.current?.teleportToZone(zoneId);
  };

  const handleSetAtmosphere = (preset: AtmospherePresetId) => {
    setAtmosphere(preset);
    sceneHandleRef.current?.setAtmosphere(preset);
  };

  const handleSetCameraMode = (mode: 'follow' | 'free') => {
    setCameraMode(mode);
    sceneHandleRef.current?.setCameraMode(mode);
  };

  const handleExportHtml = () => {
    const html = buildSingleFileHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bruno-simon-3d-world.html';
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
      {/* Isolated WebGL mount container */}
      <div
        ref={canvasMountRef}
        data-testid="world-canvas-container"
        className="h-full w-full"
      />

      <WorldOverlay
        loadingProgress={loadingProgress}
        loadingStage={loadingStage}
        isReady={isReady}
        hud={hud}
        atmosphere={atmosphere}
        cameraMode={cameraMode}
        activeModal={activeModal}
        onSelectZone={handleSelectZone}
        onSetAtmosphere={handleSetAtmosphere}
        onSetCameraMode={handleSetCameraMode}
        onRespawn={() => sceneHandleRef.current?.respawnTruck()}
        onResetProps={() => sceneHandleRef.current?.resetProps()}
        onOpenModal={setActiveModal}
        onPlantWhisper={(author, msg) => sceneHandleRef.current?.plantWhisper(author, msg)}
        onExportHtml={handleExportHtml}
        onHonk={() => sceneHandleRef.current?.honk()}
      />
    </main>
  );
}
