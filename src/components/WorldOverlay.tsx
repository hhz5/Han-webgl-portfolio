import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Compass,
  Download,
  FileText,
  Mail,
  Map as MapIcon,
  Phone,
  RotateCcw,
  Settings,
  Sparkles,
  Sun,
  Volume2,
  X,
} from 'lucide-react';
import {
  getEnabledModules,
  type ResumeModuleId,
  type ResumeSiteConfig,
} from '../data/resumeConfig';
import { WORLD_ZONES, type AtmospherePresetId } from '../scene/worldLogic';
import type { WorldHudSnapshot } from '../scene/WorldScene';

export type OverlayModalId = ResumeModuleId | 'map' | 'full_resume' | null;

export interface WorldOverlayProps {
  config: ResumeSiteConfig;
  loadingProgress: number;
  loadingStage: string;
  isReady: boolean;
  hud: WorldHudSnapshot;
  cameraMode: 'follow' | 'free';
  activeModal: OverlayModalId;
  onSelectZone: (zoneId: ResumeModuleId) => void;
  onSetAtmosphere: (preset: AtmospherePresetId) => void;
  onSetCameraMode: (mode: 'follow' | 'free') => void;
  onRespawn: () => void;
  onOpenModal: (modal: OverlayModalId) => void;
  onOpenAdmin: () => void;
  onExportHtml: () => void;
  onHonk: () => void;
}

export const WorldOverlay: React.FC<WorldOverlayProps> = ({
  config,
  loadingProgress,
  loadingStage,
  isReady,
  hud,
  cameraMode,
  activeModal,
  onSelectZone,
  onSetAtmosphere,
  onSetCameraMode,
  onRespawn,
  onOpenModal,
  onOpenAdmin,
  onExportHtml,
  onHonk,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const enabledModules = getEnabledModules(config);
  const currentModule =
    enabledModules.find((m) => m.id === hud.nearestZone.id) ?? enabledModules[0];

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
              3D INTERACTIVE PORTFOLIO
            </p>
            <h1 className="mt-1.5 text-2xl font-bold text-[#fff6ef]">
              {config.profile.name} · {config.profile.title}
            </h1>
            <p className="mt-2 text-sm text-[#e7cfc2]">
              {config.profile.heroTagline}
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

      {/* Top Row: Candidate Identity (Top-Left) + Utility Actions (Top-Right) */}
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="pointer-events-auto rounded-xl border border-[#ffd8b8]/18 bg-[#1e152e]/90 px-4 py-2.5 shadow-lg">
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#fff6ef]">
            <span>
              {config.profile.name} · {config.profile.title}
            </span>
            <span aria-hidden="true" className="text-[#f7b277]">
              ·
            </span>
            <span className="text-[#fbbf24]">
              {currentModule ? currentModule.name : hud.nearestZone.zhName}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#e3cbbd] tabular-nums">
            <span>{config.profile.experienceYears}</span>
            <span aria-hidden="true">·</span>
            <span>{config.profile.availability}</span>
            {config.display.showTopContact && (
              <>
                <span aria-hidden="true">·</span>
                <span>{config.profile.phone}</span>
                <span aria-hidden="true">·</span>
                <span>{config.profile.email}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{hud.speedKmh} km/h</span>
          </div>

          {hud.insideZone && currentModule && (
            <button
              type="button"
              onClick={() => onOpenModal(currentModule.id)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#e14d58] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#f05c67] whitespace-nowrap"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>查看 {currentModule.name} 详情 (Enter)</span>
            </button>
          )}
        </div>

        {/* Top-Right Compact Action Cluster */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenModal('full_resume')}
            aria-label="完整简历总览"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#ffd8b8]/18 bg-[#1e152e]/90 px-3 py-2 text-xs font-semibold text-[#fff6ef] transition hover:bg-[#34254d] whitespace-nowrap"
          >
            <FileText className="h-4 w-4 text-[#fbbf24]" />
            <span>简历总览</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('map')}
            aria-label="世界地图"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#ffd8b8]/18 bg-[#1e152e]/90 px-3 py-2 text-xs font-semibold text-[#fff6ef] transition hover:bg-[#34254d] whitespace-nowrap"
          >
            <MapIcon className="h-4 w-4 text-[#38bdf8]" />
            <span>展区地图</span>
          </button>

          <button
            type="button"
            onClick={onOpenAdmin}
            aria-label="后台管理"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#fbbf24]/35 bg-[#31224a] px-3 py-2 text-xs font-semibold text-[#fde68a] transition hover:bg-[#412e61] whitespace-nowrap"
          >
            <Settings className="h-4 w-4" />
            <span>后台管理</span>
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

      {/* Collapsible Bottom Control Dock */}
      {config.display.showBottomDock && (
        <div className="pointer-events-none flex flex-col items-center pb-4 px-3">
          <button
            type="button"
            onClick={() => setDockCollapsed((c) => !c)}
            className="pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 rounded-t-xl border border-b-0 border-[#ffd8b8]/20 bg-[#1e152e]/92 px-3.5 py-1 text-xs font-medium text-[#f7d8c4] transition hover:text-white"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>展开导航控制栏</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>收起控制栏 · 鼠标左键拖动旋转 / 滚轮缩放 / WASD 驾驶</span>
              </>
            )}
          </button>

          {!dockCollapsed && (
            <div className="pointer-events-auto flex w-full max-w-[940px] flex-col gap-2 rounded-2xl border border-[#ffd8b8]/20 bg-[#1e152e]/92 p-3 shadow-2xl">
              {/* Row 1: Enabled Resume Module Teleport Tabs */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {enabledModules.map((mod) => {
                  const active = hud.nearestZone.id === mod.id;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => onSelectZone(mod.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                        active
                          ? 'bg-[#e14d58] text-white shadow-sm'
                          : 'bg-white/8 text-[#f2ddd0] hover:bg-white/15'
                      }`}
                    >
                      {mod.name}
                    </button>
                  );
                })}
              </div>

              {/* Row 2: Atmosphere, Camera Mode, Utilities */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="mr-1 inline-flex items-center gap-1 text-[#e3cbbd]">
                    <Sun className="h-3.5 w-3.5 text-[#fbbf24]" />
                    <span>氛围光影</span>
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
                        config.display.atmosphere === p.id
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
                    onClick={() =>
                      onSetCameraMode(cameraMode === 'follow' ? 'free' : 'follow')
                    }
                    className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 font-medium text-[#fff6ef] transition hover:bg-white/20 whitespace-nowrap"
                  >
                    <Compass className="h-3.5 w-3.5 text-[#38bdf8]" />
                    <span>
                      {cameraMode === 'follow' ? '相机：跟随车辆' : '相机：自由环绕'}
                    </span>
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
                    <span>回到起点 (R)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modals */}
      {activeModal && (
        <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-3xl rounded-2xl border border-[#ffd8b8]/22 bg-[#231936] p-6 text-[#fff6ef] shadow-2xl max-h-[85vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => onOpenModal(null)}
              aria-label="关闭窗口"
              className="sticky float-right top-0 rounded-lg bg-white/10 p-2 text-[#f2ddd0] transition hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>

            {activeModal === 'map' && (
              <div>
                <h2 className="text-xl font-bold">3D 简历展区总览地图</h2>
                <p className="mt-1 text-sm text-[#dec7bb]">
                  点击已启用的简历展区即可直接传送查看（可在后台管理开关或修改各模块）
                </p>

                <div className="relative mt-4 h-[340px] w-full overflow-hidden rounded-xl border border-white/12 bg-gradient-to-b from-[#45315c] to-[#9b5856]">
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

                  {enabledModules.map((mod) => {
                    const z = WORLD_ZONES.find((item) => item.id === mod.id);
                    if (!z) return null;
                    const leftPct = 50 + (z.x / 52) * 42;
                    const topPct = 50 + (z.z / 52) * 42;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => {
                          onSelectZone(mod.id);
                          onOpenModal(null);
                        }}
                        style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/25 bg-[#1d142c]/90 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:scale-105 hover:bg-[#e14d58] whitespace-nowrap"
                      >
                        {mod.name}
                      </button>
                    );
                  })}

                  <div
                    style={{
                      left: `${50 + (hud.truckX / 52) * 42}%`,
                      top: `${50 + (hud.truckZ / 52) * 42}%`,
                    }}
                    className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#fbbf24]"
                    title="当前位置"
                  />
                </div>
              </div>
            )}

            {activeModal === 'profile' && (
              <div>
                <h2 className="text-xl font-bold">
                  {config.profile.name} · {config.profile.title}
                </h2>
                <p className="mt-1 text-sm text-[#fbbf24]">
                  {config.profile.experienceYears} · {config.profile.availability} ·{' '}
                  {config.profile.communityBadge}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#e3cbbd]">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/8 px-3 py-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#34d399]" />
                    {config.profile.phone}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/8 px-3 py-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#38bdf8]" />
                    {config.profile.email}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {config.overviewHighlights.map((ov, i) => (
                    <div
                      key={ov.id}
                      className="rounded-xl border border-white/12 bg-[#1b122b] p-4"
                    >
                      <p className="text-xs font-bold text-[#fbbf24]">0{i + 1} · {ov.title}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#dec7bb]">
                        {ov.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeModal === 'projects' && (
              <div>
                <h2 className="text-xl font-bold">核心 AI 产品与项目经验</h2>
                <p className="mt-1 text-sm text-[#dec7bb]">
                  涵盖企业级大模型 MaaS、AIGC 内容生产、元宇宙数字空间与数字孪生项目
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {config.projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="rounded-xl border border-white/12 bg-[#1b122b] p-4"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold" style={{ color: proj.accentHex }}>
                          {proj.category}
                        </span>
                        <span className="text-[#bda7c4]">{proj.period}</span>
                      </div>
                      <h3 className="mt-1 text-base font-bold">{proj.title}</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#dec7bb]">
                        {proj.description}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-[#f7b277]">
                        {proj.stats}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeModal === 'career' && (
              <div>
                <h2 className="text-xl font-bold">工作经历（2006 – 2025）</h2>
                <div className="mt-4 space-y-3">
                  {config.careers.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl border border-white/12 bg-[#1b122b] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-bold">
                          <span className="text-[#fbbf24]">{m.company}</span>
                          <span className="mx-2 text-white/40">|</span>
                          <span>{m.role}</span>
                        </div>
                        <span className="text-xs font-semibold text-[#38bdf8]">
                          {m.period}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#cbb5d1]">
                        {m.domain} · {m.companyScale}
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-[#e6d6ea]">
                        {m.highlights.map((hl, idx) => (
                          <li key={idx}>{hl}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeModal === 'ai_lab' && (
              <div>
                <h2 className="text-xl font-bold">AI 技术栈与产品工程架构</h2>
                <p className="mt-1 text-sm text-[#dec7bb]">
                  从多模态感知生成、国产开源大模型私有化工程到 WebGL/Three.js 空间交互全栈统筹
                </p>
                <div className="mt-4 space-y-3">
                  {config.techLayers.map((layer) => (
                    <div
                      key={layer.id}
                      className="rounded-xl border border-white/12 bg-[#1b122b] p-4"
                    >
                      <h3 className="text-sm font-bold" style={{ color: layer.accentHex }}>
                        {layer.title}
                      </h3>
                      <p className="mt-1 text-xs text-[#e6d6ea]">{layer.stack}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeModal === 'education' && (
              <div>
                <h2 className="text-xl font-bold">教育背景</h2>
                <div className="mt-4 space-y-3">
                  {config.education.map((edu) => (
                    <div
                      key={edu.id}
                      className="flex items-center justify-between rounded-xl border border-white/12 bg-[#1b122b] p-4"
                    >
                      <div>
                        <h3 className="text-base font-bold text-[#fff6ef]">
                          {edu.school}
                        </h3>
                        <p className="mt-1 text-xs text-[#dec7bb]">
                          {edu.major} · {edu.degree}
                        </p>
                      </div>
                      <span className="rounded-lg bg-white/8 px-3 py-1 text-xs font-semibold text-[#d8b4fe]">
                        {edu.period}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeModal === 'contact' && (
              <div>
                <h2 className="text-xl font-bold">核心商业成果与联系合作</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {config.impactMetrics.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl border border-white/12 bg-[#1b122b] p-4"
                    >
                      <p className="text-2xl font-extrabold" style={{ color: m.accentHex }}>
                        {m.value}
                      </p>
                      <p className="mt-1 text-sm font-bold">{m.label}</p>
                      <p className="mt-1 text-xs text-[#dec7bb]">{m.detail}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-[#34d399]/30 bg-[#19282b] p-4 text-sm">
                  <p className="font-bold text-[#6ee7b7]">
                    {config.profile.name} · {config.profile.title}（{config.profile.availability}）
                  </p>
                  <p className="mt-1 text-xs text-[#d1fae5]">
                    手机：{config.profile.phone} ｜ 邮箱：{config.profile.email}
                  </p>
                </div>
              </div>
            )}

            {activeModal === 'full_resume' && (
              <div className="space-y-6">
                <div className="border-b border-white/12 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <BookOpen className="h-5 w-5 text-[#fbbf24]" />
                    <h2 className="text-2xl font-bold">
                      {config.profile.name} — {config.profile.title}
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-[#f7b277]">
                    {config.profile.experienceYears} ｜ {config.profile.availability} ｜{' '}
                    {config.profile.phone} ｜ {config.profile.email}
                  </p>
                  <p className="mt-1 text-xs text-[#38bdf8]">{config.profile.communityBadge}</p>
                </div>

                {enabledModules.some((m) => m.id === 'profile') && (
                  <section>
                    <h3 className="text-sm font-bold text-[#fbbf24]">一、个人概况</h3>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {config.overviewHighlights.map((ov) => (
                        <div key={ov.id} className="rounded-xl bg-[#1b122b] p-3 text-xs">
                          <p className="font-bold text-[#fff6ef]">{ov.title}</p>
                          <p className="mt-1 leading-relaxed text-[#d6c6e1]">{ov.summary}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {enabledModules.some((m) => m.id === 'career') && (
                  <section>
                    <h3 className="text-sm font-bold text-[#fbbf24]">二、工作经历</h3>
                    <div className="mt-2 space-y-2.5">
                      {config.careers.map((c) => (
                        <div key={c.id} className="rounded-xl bg-[#1b122b] p-3.5 text-xs">
                          <div className="flex flex-wrap justify-between font-bold text-[#fff6ef]">
                            <span>
                              {c.company} · {c.role}
                            </span>
                            <span className="text-[#38bdf8]">{c.period}</span>
                          </div>
                          <p className="mt-0.5 text-[#bda7c4]">{c.companyScale}</p>
                          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[#e2d4ea]">
                            {c.highlights.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {enabledModules.some((m) => m.id === 'projects') && (
                  <section>
                    <h3 className="text-sm font-bold text-[#fbbf24]">三、主要项目经验</h3>
                    <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {config.projects.map((p) => (
                        <div key={p.id} className="rounded-xl bg-[#1b122b] p-3 text-xs">
                          <div className="flex justify-between font-bold">
                            <span style={{ color: p.accentHex }}>{p.title}</span>
                            <span className="text-[#bda7c4]">{p.period}</span>
                          </div>
                          <p className="mt-1 leading-relaxed text-[#d6c6e1]">{p.description}</p>
                          <p className="mt-1.5 font-semibold text-[#f7b277]">{p.stats}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {enabledModules.some((m) => m.id === 'education') && (
                  <section>
                    <h3 className="text-sm font-bold text-[#fbbf24]">四、教育经历</h3>
                    <div className="mt-2 space-y-1.5">
                      {config.education.map((e) => (
                        <div
                          key={e.id}
                          className="flex justify-between rounded-lg bg-[#1b122b] px-3.5 py-2.5 text-xs"
                        >
                          <span className="font-semibold">
                            {e.school} · {e.major}（{e.degree}）
                          </span>
                          <span className="text-[#d8b4fe]">{e.period}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
