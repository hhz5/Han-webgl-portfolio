import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Compass,
  Download,
  Flag,
  Map as MapIcon,
  RotateCcw,
  Sparkles,
  Sun,
  Trophy,
  Volume2,
  X,
} from 'lucide-react';
import {
  WORLD_ZONES,
  type AtmospherePresetId,
  type WorldZoneDef,
} from '../scene/worldLogic';
import type { WorldHudSnapshot } from '../scene/WorldScene';
import { PORTFOLIO_PROJECTS } from '../scene/components/ProjectsZone';
import { CAREER_MILESTONES } from '../scene/components/CareerZone';

export interface WorldOverlayProps {
  loadingProgress: number;
  loadingStage: string;
  isReady: boolean;
  hud: WorldHudSnapshot;
  atmosphere: AtmospherePresetId;
  cameraMode: 'follow' | 'free';
  activeModal: WorldZoneDef['id'] | 'map' | 'whispers' | 'achievements' | null;
  onSelectZone: (zoneId: WorldZoneDef['id']) => void;
  onSetAtmosphere: (preset: AtmospherePresetId) => void;
  onSetCameraMode: (mode: 'follow' | 'free') => void;
  onRespawn: () => void;
  onResetProps: () => void;
  onOpenModal: (modal: WorldOverlayProps['activeModal']) => void;
  onPlantWhisper: (author: string, message: string) => void;
  onExportHtml: () => void;
  onHonk: () => void;
}

const ACHIEVEMENT_META: Array<{ id: string; title: string; desc: string }> = [
  { id: 'road_trip', title: '公路旅行者', desc: '累计驾驶超过 45 米' },
  { id: 'sky_jumper', title: '腾空飞跃', desc: '利用跳台或跳跃腾空超过 1.8 米' },
  { id: 'cookie_hunter', title: '曲奇猎人', desc: '在世界中收集金色巧克力曲奇' },
  { id: 'first_pin', title: '保龄新手', desc: '撞倒至少 1 支巨型保龄球瓶' },
  { id: 'strike', title: '全中大师', desc: '在保龄球道击倒全部 10 支球瓶' },
  { id: 'speed_racer', title: '赛道车手', desc: '完成极速赛道完整一圈' },
  { id: 'wrecker', title: '破坏王', desc: '撞飞木箱或便携式蓝房子彩蛋' },
  { id: 'whisperer', title: '微语留名', desc: '在草地上插下你的访客旗帜' },
  { id: 'world_explorer', title: '全境探索者', desc: '驾车造访全部 8 个核心区域' },
];

export const WorldOverlay: React.FC<WorldOverlayProps> = ({
  loadingProgress,
  loadingStage,
  isReady,
  hud,
  atmosphere,
  cameraMode,
  activeModal,
  onSelectZone,
  onSetAtmosphere,
  onSetCameraMode,
  onRespawn,
  onResetProps,
  onOpenModal,
  onPlantWhisper,
  onExportHtml,
  onHonk,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [whisperAuthor, setWhisperAuthor] = useState('');
  const [whisperMsg, setWhisperMsg] = useState('');
  const [whisperError, setWhisperError] = useState('');

  const formatLap = (ms: number | null) => {
    if (ms === null) return '--:--.---';
    const totalSec = ms / 1000;
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    const rem = Math.floor(ms % 1000);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(rem).padStart(3, '0')}`;
  };

  const handleWhisperSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whisperMsg.trim()) {
      setWhisperError('请输入留言内容后再插旗');
      return;
    }
    setWhisperError('');
    onPlantWhisper(whisperAuthor.trim() || '访客', whisperMsg.trim());
    setWhisperMsg('');
    onOpenModal(null);
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between">
      {/* Loading Screen */}
      {!isReady && (
        <div
          data-testid="loading-overlay"
          className="pointer-events-auto fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#2a1f3d] via-[#5c3654] to-[#b56355] px-6"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#ffd8b8]/20 bg-[#221833]/92 p-7 shadow-2xl">
            <p className="text-xs font-semibold tracking-wider text-[#f7b277]">
              PROCEDURAL THREE.JS WORLD
            </p>
            <h1 className="mt-1.5 text-2xl font-bold text-[#fff6ef]">
              Bruno&apos;s 3D 交互世界
            </h1>
            <p className="mt-2 text-sm text-[#e7cfc2]">
              全代码实时生成模型、贴图与日落光影，正在为您的设备优化加载...
            </p>

            <div className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#fbbf24] to-[#fb7185] transition-all duration-200"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-[#f6d9c6]">
              <span>{loadingStage}</span>
              <span className="tabular-nums font-bold">{loadingProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Row: Minimal Brand & Telemetry (Top-Left) + Quick Utility Triggers (Top-Right) */}
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="pointer-events-auto rounded-xl border border-[#ffd8b8]/18 bg-[#1e152e]/88 px-4 py-2.5 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-bold text-[#fff6ef]">
            <span>Bruno&apos;s World</span>
            <span aria-hidden="true" className="text-[#f7b277]">
              ·
            </span>
            <span className="text-[#fbbf24]">{hud.nearestZone.zhName}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#e3cbbd] tabular-nums">
            <span>{hud.speedKmh} km/h</span>
            <span aria-hidden="true">·</span>
            <span>里程 {hud.distanceMeters} m</span>
            <span aria-hidden="true">·</span>
            <span>
              曲奇 {hud.cookiesCollected}/{hud.totalCookies}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              球瓶 {hud.pinsKnocked}/10
            </span>
          </div>
          {hud.insideZone && (
            <button
              type="button"
              onClick={() => onOpenModal(hud.nearestZone.id)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#e14d58] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#f05c67] whitespace-nowrap"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>查看 {hud.nearestZone.zhName} 详情 (Enter)</span>
            </button>
          )}
        </div>

        {/* Top-Right Compact Action Cluster */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenModal('map')}
            aria-label="世界地图"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#ffd8b8]/18 bg-[#1e152e]/88 px-3 py-2 text-xs font-semibold text-[#fff6ef] transition hover:bg-[#34254d] whitespace-nowrap"
          >
            <MapIcon className="h-4 w-4 text-[#fbbf24]" />
            <span>地图</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('achievements')}
            aria-label="成就进度"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#ffd8b8]/18 bg-[#1e152e]/88 px-3 py-2 text-xs font-semibold text-[#fff6ef] transition hover:bg-[#34254d] whitespace-nowrap tabular-nums"
          >
            <Trophy className="h-4 w-4 text-[#fb7185]" />
            <span>
              成就 {hud.unlockedAchievements.length}/{ACHIEVEMENT_META.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('whispers')}
            aria-label="留下微语旗帜"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#ffd8b8]/18 bg-[#1e152e]/88 px-3 py-2 text-xs font-semibold text-[#fff6ef] transition hover:bg-[#34254d] whitespace-nowrap"
          >
            <Flag className="h-4 w-4 text-[#38bdf8]" />
            <span>插旗留言</span>
          </button>

          <button
            type="button"
            onClick={onExportHtml}
            aria-label="导出单文件HTML"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#fbbf24]/35 bg-[#e14d58] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#f05c67] whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>导出单文件 HTML</span>
          </button>
        </div>
      </div>

      {/* Collapsible Bottom Control Dock (Zero Center Occlusion) */}
      <div className="pointer-events-none flex flex-col items-center pb-4 px-3">
        <button
          type="button"
          onClick={() => setDockCollapsed((c) => !c)}
          className="pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 rounded-t-xl border border-b-0 border-[#ffd8b8]/20 bg-[#1e152e]/90 px-3.5 py-1 text-xs font-medium text-[#f7d8c4] transition hover:text-white"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              <span>展开控制栏</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              <span>收起控制栏 · 鼠标拖动旋转 / 滚轮缩放 / WASD 驾驶</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="pointer-events-auto flex w-full max-w-[960px] flex-col gap-2 rounded-2xl border border-[#ffd8b8]/20 bg-[#1e152e]/92 p-3 shadow-2xl">
            {/* Row 1: Zone Teleport Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {WORLD_ZONES.map((z) => {
                const active = hud.nearestZone.id === z.id;
                return (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => onSelectZone(z.id)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                      active
                        ? 'bg-[#e14d58] text-white shadow-sm'
                        : 'bg-white/8 text-[#f2ddd0] hover:bg-white/15'
                    }`}
                  >
                    {z.zhName}
                  </button>
                );
              })}
            </div>

            {/* Row 2: Atmosphere, Camera Mode, Utilities */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="mr-1 inline-flex items-center gap-1 text-[#e3cbbd]">
                  <Sun className="h-3.5 w-3.5 text-[#fbbf24]" />
                  <span>光影氛围</span>
                </span>
                {(
                  [
                    { id: 'sunset', label: '日落余晖' },
                    { id: 'twilight', label: '暮色紫霞' },
                    { id: 'dawn', label: '晨曦暖阳' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSetAtmosphere(p.id)}
                    className={`rounded-md px-2.5 py-1 font-medium transition whitespace-nowrap ${
                      atmosphere === p.id
                        ? 'bg-[#fbbf24] text-[#21152b]'
                        : 'bg-white/8 text-[#f2ddd0] hover:bg-white/15'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSetCameraMode(cameraMode === 'follow' ? 'free' : 'follow')}
                  className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 font-medium text-[#fff6ef] transition hover:bg-white/20 whitespace-nowrap"
                >
                  <Compass className="h-3.5 w-3.5 text-[#38bdf8]" />
                  <span>{cameraMode === 'follow' ? '相机：跟随车辆' : '相机：自由环绕'}</span>
                </button>

                <button
                  type="button"
                  onClick={onHonk}
                  className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 font-medium text-[#fff6ef] transition hover:bg-white/20 whitespace-nowrap"
                >
                  <Volume2 className="h-3.5 w-3.5 text-[#fbbf24]" />
                  <span>鸣笛 (H)</span>
                </button>

                <button
                  type="button"
                  onClick={onRespawn}
                  className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 font-medium text-[#fff6ef] transition hover:bg-white/20 whitespace-nowrap"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>重置车辆 (R)</span>
                </button>

                <button
                  type="button"
                  onClick={onResetProps}
                  className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 font-medium text-[#fff6ef] transition hover:bg-white/20 whitespace-nowrap"
                >
                  <span>重置保龄球与道具</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Zone & Map Modals */}
      {activeModal && (
        <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/55 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-[#ffd8b8]/22 bg-[#231936] p-6 text-[#fff6ef] shadow-2xl max-h-[84vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => onOpenModal(null)}
              aria-label="关闭窗口"
              className="absolute right-4 top-4 rounded-lg bg-white/10 p-2 text-[#f2ddd0] transition hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>

            {activeModal === 'map' && (
              <div>
                <h2 className="text-xl font-bold">世界全览地图</h2>
                <p className="mt-1 text-sm text-[#dec7bb]">
                  点击任意区域地标即可传送至该景区近距离观察与驾驶体验
                </p>

                <div className="relative mt-4 h-[340px] w-full overflow-hidden rounded-xl border border-white/12 bg-gradient-to-b from-[#45315c] to-[#9b5856]">
                  {/* Stylized River S-Curve matching riverCenterZ(x) */}
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-0 h-full w-full"
                  >
                    <path
                      d="M 0 47 Q 25 36, 50 45 T 100 48"
                      fill="none"
                      stroke="#2d5399"
                      strokeWidth="9"
                      strokeLinecap="round"
                      opacity="0.82"
                    />
                  </svg>

                  {WORLD_ZONES.map((z) => {
                    const leftPct = 50 + (z.x / 52) * 42;
                    const topPct = 50 + (z.z / 52) * 42;
                    return (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => {
                          onSelectZone(z.id);
                          onOpenModal(null);
                        }}
                        style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/25 bg-[#1d142c]/90 px-2.5 py-1 text-xs font-semibold text-white shadow transition hover:scale-105 hover:bg-[#e14d58] whitespace-nowrap"
                      >
                        {z.zhName}
                      </button>
                    );
                  })}

                  {/* Live Truck Indicator */}
                  <div
                    style={{
                      left: `${50 + (hud.truckX / 52) * 42}%`,
                      top: `${50 + (hud.truckZ / 52) * 42}%`,
                    }}
                    className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#fbbf24]"
                    title="当前车辆位置"
                  />
                </div>
              </div>
            )}

            {activeModal === 'achievements' && (
              <div>
                <h2 className="text-xl font-bold">
                  探索成就 ({hud.unlockedAchievements.length} / {ACHIEVEMENT_META.length})
                </h2>
                <p className="mt-1 text-sm text-[#dec7bb]">
                  自由驾驶并碰撞保龄球、赛道、曲奇饼干或插下留言旗即可解锁成就
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {ACHIEVEMENT_META.map((a) => {
                    const unlocked = hud.unlockedAchievements.includes(a.id);
                    return (
                      <div
                        key={a.id}
                        className={`rounded-xl border p-3.5 ${
                          unlocked
                            ? 'border-[#fbbf24]/45 bg-[#36274f]'
                            : 'border-white/10 bg-white/5 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span>{a.title}</span>
                          <span className={unlocked ? 'text-[#fbbf24]' : 'text-white/45'}>
                            {unlocked ? '已解锁' : '未解锁'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#dec7bb]">{a.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeModal === 'whispers' && (
              <div>
                <h2 className="text-xl font-bold">插下微语旗帜 (Whispers)</h2>
                <p className="mt-1 text-sm text-[#dec7bb]">
                  在车辆当前所处位置立起一面带有你专属文字的 3D 纪念小旗帜
                </p>
                <form onSubmit={handleWhisperSubmit} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#f2ddd0]" htmlFor="whisper-author">
                      署名
                    </label>
                    <input
                      id="whisper-author"
                      type="text"
                      maxLength={14}
                      value={whisperAuthor}
                      onChange={(e) => setWhisperAuthor(e.target.value)}
                      placeholder="例如：Explorer"
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#160f24] px-3 py-2 text-sm text-white outline-none focus:border-[#fbbf24]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#f2ddd0]" htmlFor="whisper-msg">
                      留言内容（最多 20 字）
                    </label>
                    <input
                      id="whisper-msg"
                      type="text"
                      maxLength={20}
                      value={whisperMsg}
                      onChange={(e) => setWhisperMsg(e.target.value)}
                      placeholder="写下你的探索足迹..."
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#160f24] px-3 py-2 text-sm text-white outline-none focus:border-[#fbbf24]"
                    />
                  </div>
                  {whisperError && <p className="text-xs text-[#fb7185]">{whisperError}</p>}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => onOpenModal(null)}
                      className="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-[#e14d58] px-4 py-2 text-xs font-semibold text-white hover:bg-[#f05c67]"
                    >
                      在当前位置插旗
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeModal === 'projects' && (
              <div>
                <h2 className="text-xl font-bold">作品展区 · Fix the WiFi</h2>
                <p className="mt-1 text-sm text-[#dec7bb]">
                  所有 3D 展台画面的文字与图形均为 Canvas 程序化绘制
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {PORTFOLIO_PROJECTS.map((proj) => (
                    <div
                      key={proj.title}
                      className="rounded-xl border border-white/12 bg-[#1b122b] p-4"
                    >
                      <p className="text-xs font-semibold" style={{ color: proj.accent }}>
                        {proj.category}
                      </p>
                      <h3 className="mt-1 text-base font-bold">{proj.title}</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#dec7bb]">
                        {proj.description}
                      </p>
                      <p className="mt-2 text-xs font-medium text-[#f7b277]">{proj.stats}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeModal === 'career' && (
              <div>
                <h2 className="text-xl font-bold">职业历程时间拱门</h2>
                <div className="mt-4 space-y-3">
                  {CAREER_MILESTONES.map((m) => (
                    <div
                      key={m.year}
                      className="rounded-xl border border-white/12 bg-[#1b122b] p-4"
                    >
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <span className="text-[#fbbf24]">{m.year}</span>
                        <span aria-hidden="true">·</span>
                        <span>{m.role}</span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#dec7bb]">{m.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(activeModal === 'landing' ||
              activeModal === 'lab' ||
              activeModal === 'circuit' ||
              activeModal === 'bowling' ||
              activeModal === 'cookies' ||
              activeModal === 'altar') && (
              <div>
                <h2 className="text-xl font-bold">
                  {WORLD_ZONES.find((z) => z.id === activeModal)?.zhName}
                </h2>
                <p className="mt-1 text-sm text-[#dec7bb]">
                  {WORLD_ZONES.find((z) => z.id === activeModal)?.subtitle}
                </p>

                {activeModal === 'circuit' && (
                  <div className="mt-4 rounded-xl border border-white/12 bg-[#1b122b] p-4 text-sm tabular-nums">
                    <div className="flex justify-between">
                      <span>当前圈速</span>
                      <span className="font-bold text-[#fbbf24]">
                        {formatLap(hud.circuit.running ? hud.circuit.elapsedMs : null)}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span>最快圈速</span>
                      <span className="font-bold text-[#38bdf8]">
                        {formatLap(hud.circuit.bestLapMs)}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span>已完成圈数</span>
                      <span className="font-bold">{hud.circuit.lapsCompleted} 圈</span>
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-xl border border-white/12 bg-[#1b122b] p-4 text-xs leading-relaxed text-[#e3cbbd]">
                  <p>交互指南：</p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4">
                    <li>鼠标左键拖动：360° 旋转视角；滚轮：拉近或拉远焦距。</li>
                    <li>WASD 或方向键：驾驶越野卡车；Shift：涡轮加速；Space：跳跃；H：鸣笛。</li>
                    <li>组件化结构：每个主要地标均在独立模块中构建，可随时单独修改。</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
