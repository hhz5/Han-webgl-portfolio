import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Briefcase,
  Check,
  FolderKanban,
  GraduationCap,
  Layers,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  User,
} from 'lucide-react';
import {
  cloneResumeConfig,
  DEFAULT_RESUME_CONFIG,
  type CareerMilestoneItem,
  type EducationItem,
  type ImpactMetricItem,
  type OverviewHighlight,
  type ProjectExperienceItem,
  type ResumeSiteConfig,
} from '../data/resumeConfig';

type AdminTab = 'profile' | 'modules' | 'careers' | 'projects' | 'education';

export interface AdminPageProps {
  config: ResumeSiteConfig;
  onApplyConfig: (next: ResumeSiteConfig) => void;
  onResetDefault: () => ResumeSiteConfig;
  onBackToWorld: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  config,
  onApplyConfig,
  onResetDefault,
  onBackToWorld,
}) => {
  const [draft, setDraft] = useState<ResumeSiteConfig>(() => cloneResumeConfig(config));
  const [activeTab, setActiveTab] = useState<AdminTab>('modules');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const flashNotice = (msg: string) => {
    setSavedNotice(msg);
    window.setTimeout(() => setSavedNotice(null), 2600);
  };

  const handleSave = () => {
    onApplyConfig(draft);
    flashNotice('已保存并实时同步至 3D 前端场景');
  };

  const handleReset = () => {
    const fresh = onResetDefault();
    setDraft(cloneResumeConfig(fresh));
    flashNotice('已恢复为韩鸿哲 PDF 简历默认配置');
  };

  const moveModule = (idx: number, dir: -1 | 1) => {
    const sorted = [...draft.modules].sort((a, b) => a.order - b.order);
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const temp = sorted[idx];
    sorted[idx] = sorted[targetIdx];
    sorted[targetIdx] = temp;
    const reordered = sorted.map((m, i) => ({ ...m, order: i + 1 }));
    setDraft({ ...draft, modules: reordered });
  };

  const navTabs: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'modules', label: '前端模块与场景开关', icon: <Layers className="h-4 w-4" /> },
    { id: 'profile', label: '个人概况与核心亮点', icon: <User className="h-4 w-4" /> },
    { id: 'careers', label: '工作经历管理', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'projects', label: '核心项目管理', icon: <FolderKanban className="h-4 w-4" /> },
    { id: 'education', label: '教育与商业成果', icon: <GraduationCap className="h-4 w-4" /> },
  ];

  const sortedModules = [...draft.modules].sort((a, b) => a.order - b.order);

  return (
    <div
      data-testid="admin-page"
      className="fixed inset-0 z-50 flex flex-col bg-[#150f22] text-[#fff6ef] overflow-hidden"
    >
      {/* Admin Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/12 bg-[#1f1632] px-6 py-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-[#fff6ef]">
              简历 3D 站点后台管理系统
            </h1>
            <span className="rounded-md bg-[#fbbf24]/20 px-2 py-0.5 text-xs font-semibold text-[#fbbf24]">
              {draft.profile.name} · {draft.profile.title}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#cdb8d4]">
            管理前端 3D 展示模块开关、排序、氛围光影及全部个人履历信息，保存后立即同步前端
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {savedNotice && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#065f46] px-3 py-1.5 text-xs font-semibold text-[#d1fae5]">
              <Check className="h-3.5 w-3.5" />
              {savedNotice}
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/6 px-3.5 py-2 text-xs font-semibold text-[#e6d6ea] transition hover:bg-white/12"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>恢复默认简历</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#e14d58] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#f05c67]"
          >
            <Save className="h-3.5 w-3.5" />
            <span>保存并应用到 3D 前台</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onApplyConfig(draft);
              onBackToWorld();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#38bdf8]/40 bg-[#1d3557] px-4 py-2 text-xs font-semibold text-[#e0f2fe] transition hover:bg-[#264673]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>返回 3D 展示前台</span>
          </button>
        </div>
      </header>

      {/* Main Split Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation */}
        <aside className="w-60 shrink-0 border-r border-white/10 bg-[#1a122a] p-4 space-y-1.5 overflow-y-auto">
          {navTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold transition ${
                activeTab === t.id
                  ? 'bg-[#e14d58] text-white'
                  : 'text-[#dec7bb] hover:bg-white/8'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}

          <div className="mt-6 rounded-xl border border-white/10 bg-[#140e21] p-3.5 text-xs text-[#bda7c4] space-y-1.5">
            <p className="font-bold text-[#fbbf24]">当前前台状态</p>
            <p>
              已启用模块：{draft.modules.filter((m) => m.enabled).length} /{' '}
              {draft.modules.length}
            </p>
            <p>工作经历：{draft.careers.length} 段</p>
            <p>项目展示：{draft.projects.filter((p) => p.featuredIn3D).length} 个 3D 展板</p>
          </div>
        </aside>

        {/* Right Scrollable Editor Panel */}
        <section className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* TAB 1: MODULES */}
            {activeTab === 'modules' && (
              <>
                <div className="rounded-2xl border border-white/12 bg-[#1f1632] p-5">
                  <h2 className="text-base font-bold text-[#fbbf24]">
                    全局展示与 3D 场景参数
                  </h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#dec7bb]">
                        默认光影氛围预设
                      </label>
                      <select
                        value={draft.display.atmosphere}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            display: {
                              ...draft.display,
                              atmosphere: e.target.value as ResumeSiteConfig['display']['atmosphere'],
                            },
                          })
                        }
                        className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#140e21] px-3 py-2 text-xs text-white"
                      >
                        <option value="sunset">日落余晖（经典黄金暖光）</option>
                        <option value="twilight">暮色紫霞（深邃科技暮光）</option>
                        <option value="dawn">晨曦暖阳（明亮通透清晨）</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-center gap-2.5 pt-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.display.showBottomDock}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              display: { ...draft.display, showBottomDock: e.target.checked },
                            })
                          }
                          className="h-4 w-4 accent-[#e14d58]"
                        />
                        <span>前端显示底部展区导航栏</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.display.showTopContact}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              display: { ...draft.display, showTopContact: e.target.checked },
                            })
                          }
                          className="h-4 w-4 accent-[#e14d58]"
                        />
                        <span>左上角信息栏显示手机号与邮箱</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.display.enableStuntProps}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              display: {
                                ...draft.display,
                                enableStuntProps: e.target.checked,
                              },
                            })
                          }
                          className="h-4 w-4 accent-[#e14d58]"
                        />
                        <span>3D 场景启用驾驶跳台与互动木箱</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/12 bg-[#1f1632] p-5">
                  <h2 className="text-base font-bold text-[#fbbf24]">
                    前端 3D 展区模块管理（支持开关、改名、排序）
                  </h2>
                  <p className="mt-1 text-xs text-[#bda7c4]">
                    关闭模块后，对应的 3D 建筑地标、导航按钮与地图标记会同步隐藏
                  </p>

                  <div className="mt-4 space-y-3">
                    {sortedModules.map((mod, idx) => (
                      <div
                        key={mod.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#140e21] p-4"
                      >
                        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[260px]">
                          <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={mod.enabled}
                              onChange={(e) => {
                                const updated = draft.modules.map((m) =>
                                  m.id === mod.id ? { ...m, enabled: e.target.checked } : m
                                );
                                setDraft({ ...draft, modules: updated });
                              }}
                              className="h-4 w-4 accent-[#e14d58]"
                            />
                            <span className={mod.enabled ? 'text-[#34d399]' : 'text-white/45'}>
                              {mod.enabled ? '已启用' : '已隐藏'}
                            </span>
                          </label>

                          <input
                            type="text"
                            value={mod.name}
                            onChange={(e) => {
                              const updated = draft.modules.map((m) =>
                                m.id === mod.id ? { ...m, name: e.target.value } : m
                              );
                              setDraft({ ...draft, modules: updated });
                            }}
                            className="w-32 rounded-lg border border-white/15 bg-[#1f1632] px-2.5 py-1.5 text-xs font-bold text-white"
                          />

                          <input
                            type="text"
                            value={mod.subtitle}
                            onChange={(e) => {
                              const updated = draft.modules.map((m) =>
                                m.id === mod.id ? { ...m, subtitle: e.target.value } : m
                              );
                              setDraft({ ...draft, modules: updated });
                            }}
                            className="flex-1 min-w-[200px] rounded-lg border border-white/15 bg-[#1f1632] px-2.5 py-1.5 text-xs text-[#e3cbbd]"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => moveModule(idx, -1)}
                            disabled={idx === 0}
                            className="rounded-lg bg-white/8 p-1.5 text-xs disabled:opacity-30 hover:bg-white/15"
                            title="上移"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveModule(idx, 1)}
                            disabled={idx === sortedModules.length - 1}
                            className="rounded-lg bg-white/8 p-1.5 text-xs disabled:opacity-30 hover:bg-white/15"
                            title="下移"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: PROFILE & OVERVIEW */}
            {activeTab === 'profile' && (
              <>
                <div className="rounded-2xl border border-white/12 bg-[#1f1632] p-5">
                  <h2 className="text-base font-bold text-[#fbbf24]">候选人基本信息</h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {(
                      [
                        ['name', '姓名'],
                        ['title', '求职头衔'],
                        ['experienceYears', '工作年限'],
                        ['availability', '到岗状态'],
                        ['phone', '联系电话'],
                        ['email', '电子邮箱'],
                        ['communityBadge', '社区与荣誉标签'],
                        ['heroTagline', '核心方向一句话'],
                      ] as const
                    ).map(([field, label]) => (
                      <div key={field}>
                        <label className="block text-xs font-semibold text-[#dec7bb]">
                          {label}
                        </label>
                        <input
                          type="text"
                          value={draft.profile[field]}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              profile: { ...draft.profile, [field]: e.target.value },
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-white/15 bg-[#140e21] px-3 py-2 text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/12 bg-[#1f1632] p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#fbbf24]">概况核心优势亮点</h2>
                    <button
                      type="button"
                      onClick={() => {
                        const next: OverviewHighlight = {
                          id: `ov-${Date.now()}`,
                          title: '新增核心优势',
                          summary: '请填写该优势的具体成果描述...',
                        };
                        setDraft({
                          ...draft,
                          overviewHighlights: [...draft.overviewHighlights, next],
                        });
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#e14d58] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>添加亮点</span>
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {draft.overviewHighlights.map((ov, idx) => (
                      <div
                        key={ov.id}
                        className="rounded-xl border border-white/10 bg-[#140e21] p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={ov.title}
                            onChange={(e) => {
                              const next = [...draft.overviewHighlights];
                              next[idx] = { ...ov, title: e.target.value };
                              setDraft({ ...draft, overviewHighlights: next });
                            }}
                            className="flex-1 rounded-lg border border-white/15 bg-[#1f1632] px-3 py-1.5 text-xs font-bold text-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                overviewHighlights: draft.overviewHighlights.filter(
                                  (item) => item.id !== ov.id
                                ),
                              })
                            }
                            className="rounded-lg bg-white/8 p-1.5 text-[#fb7185] hover:bg-white/15"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={ov.summary}
                          onChange={(e) => {
                            const next = [...draft.overviewHighlights];
                            next[idx] = { ...ov, summary: e.target.value };
                            setDraft({ ...draft, overviewHighlights: next });
                          }}
                          className="w-full rounded-lg border border-white/15 bg-[#1f1632] px-3 py-2 text-xs text-[#e3cbbd]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* TAB 3: CAREERS */}
            {activeTab === 'careers' && (
              <div className="rounded-2xl border border-white/12 bg-[#1f1632] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#fbbf24]">工作经历时间拱门管理</h2>
                    <p className="text-xs text-[#bda7c4]">
                      每条经历将在 3D 职业历程长廊生成对应的双面里程碑拱门
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next: CareerMilestoneItem = {
                        id: `c-${Date.now()}`,
                        company: '新增任职企业',
                        role: '产品总监',
                        period: '2025.06 - 至今',
                        domain: '人工智能',
                        companyScale: '团队与汇报结构说明',
                        highlights: ['核心产品规划与商业成果...'],
                      };
                      setDraft({ ...draft, careers: [next, ...draft.careers] });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#e14d58] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>添加经历</span>
                  </button>
                </div>

                {draft.careers.map((car, idx) => (
                  <div
                    key={car.id}
                    className="rounded-xl border border-white/10 bg-[#140e21] p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#38bdf8]">经历 #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            careers: draft.careers.filter((item) => item.id !== car.id),
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-white/8 px-2.5 py-1 text-xs text-[#fb7185] hover:bg-white/15"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>删除</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <input
                        type="text"
                        value={car.company}
                        placeholder="公司名称"
                        onChange={(e) => {
                          const next = [...draft.careers];
                          next[idx] = { ...car, company: e.target.value };
                          setDraft({ ...draft, careers: next });
                        }}
                        className="rounded-lg border border-white/15 bg-[#1f1632] px-3 py-1.5 text-xs font-bold text-white"
                      />
                      <input
                        type="text"
                        value={car.role}
                        placeholder="职位"
                        onChange={(e) => {
                          const next = [...draft.careers];
                          next[idx] = { ...car, role: e.target.value };
                          setDraft({ ...draft, careers: next });
                        }}
                        className="rounded-lg border border-white/15 bg-[#1f1632] px-3 py-1.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={car.period}
                        placeholder="起止时间"
                        onChange={(e) => {
                          const next = [...draft.careers];
                          next[idx] = { ...car, period: e.target.value };
                          setDraft({ ...draft, careers: next });
                        }}
                        className="rounded-lg border border-white/15 bg-[#1f1632] px-3 py-1.5 text-xs text-[#fbbf24]"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        value={car.domain}
                        placeholder="行业领域"
                        onChange={(e) => {
                          const next = [...draft.careers];
                          next[idx] = { ...car, domain: e.target.value };
                          setDraft({ ...draft, careers: next });
                        }}
                        className="rounded-lg border border-white/15 bg-[#1f1632] px-3 py-1.5 text-xs text-[#dec7bb]"
                      />
                      <input
                        type="text"
                        value={car.companyScale}
                        placeholder="公司规模与汇报关系"
                        onChange={(e) => {
                          const next = [...draft.careers];
                          next[idx] = { ...car, companyScale: e.target.value };
                          setDraft({ ...draft, careers: next });
                        }}
                        className="rounded-lg border border-white/15 bg-[#1f1632] px-3 py-1.5 text-xs text-[#dec7bb]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#bda7c4]">
                        工作职责与业绩亮点（每行一条）
                      </label>
                      <textarea
                        rows={4}
                        value={car.highlights.join('\n')}
                        onChange={(e) => {
                          const next = [...draft.careers];
                          next[idx] = {
                            ...car,
                            highlights: e.target.value.split('\n').filter((s) => s.trim()),
                          };
                          setDraft({ ...draft, careers: next });
                        }}
                        className="mt-1 w-full rounded-lg border border-white/15 bg-[#1f1632] px-3 py-2 text-xs text-[#e3cbbd]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: PROJECTS */}
            {activeTab === 'projects' && (
              <div className="rounded-2xl border border-white/12 bg-[#1f1632] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#fbbf24]">核心项目 3D 展板管理</h2>
                    <p className="text-xs text-[#bda7c4]">
                      勾选“在 3D 展区电子屏展示”的项目将自动生成在核心项目广场环形大屏上（最多 6 块）
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next: ProjectExperienceItem = {
                        id: `p-${Date.now()}`,
                        title: '新 AI 项目',
                        period: '2025',
                        category: '企业级 AI',
                        subtitle: '核心技术架构与场景亮点',
                        accentHex: '#38bdf8',
                        description: '项目背景、职责与落地成效描述...',
                        stats: '核心业绩指标',
                        featuredIn3D: true,
                      };
                      setDraft({ ...draft, projects: [next, ...draft.projects] });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#e14d58] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>添加项目</span>
                  </button>
                </div>

                {draft.projects.map((proj, idx) => (
                  <div
                    key={proj.id}
                    className="rounded-xl border border-white/10 bg-[#140e21] p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={proj.featuredIn3D}
                          onChange={(e) => {
                            const next = [...draft.projects];
                            next[idx] = { ...proj, featuredIn3D: e.target.checked };
                            setDraft({ ...draft, projects: next });
                          }}
                          className="h-4 w-4 accent-[#fbbf24]"
                        />
                        <span className="text-[#fbbf24]">在 3D 展区电子屏展示</span>
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            projects: draft.projects.filter((item) => item.id !== proj.id),
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-white/8 px-2.5 py-1 text-xs text-[#fb7185] hover:bg-white/15"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>删除</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <input
                        type="text"
                        value={proj.title}
                        placeholder="项目名称"
                        onChange={(e) => {
                          const next = [...draft.projects];
                          next[idx] = { ...proj, title: e.target.value };
                          setDraft({ ...draft, projects: next });
                        }}
                        className="rounded-lg border border-white/15 bg-[#1f1632] px-3 py-1.5 text-xs font-bold text-white"
                      />
                      <input
                        type="text"
                        value={proj.category}
                        placeholder="项目分类"
                        onChange={(e) => {
                          const next = [...draft.projects];
                          next[idx] = { ...proj, category: e.target.value };
                          setDraft({ ...draft, projects: next });
                        }}
                        className="rounded-lg border border-white/15 bg-[#1f1632] px-3 py-1.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={proj.period}
                        placeholder="项目周期"
                        onChange={(e) => {
                          const next = [...draft.projects];
                          next[idx] = { ...proj, period: e.target.value };
                          setDraft({ ...draft, projects: next });
                        }}
                        className="rounded-lg border border-white/15 bg-[#1f1632] px-3 py-1.5 text-xs text-[#38bdf8]"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        value={proj.subtitle}
                        placeholder="3D 展板副标题"
                        onChange={(e) => {
                          const next = [...draft.projects];
                          next[idx] = { ...proj, subtitle: e.target.value };
                          setDraft({ ...draft, projects: next });
                        }}
                        className="rounded-lg border border-white/15 bg-[#1f1632] px-3 py-1.5 text-xs text-[#dec7bb]"
                      />
                      <input
                        type="text"
                        value={proj.stats}
                        placeholder="量化成效"
                        onChange={(e) => {
                          const next = [...draft.projects];
                          next[idx] = { ...proj, stats: e.target.value };
                          setDraft({ ...draft, projects: next });
                        }}
                        className="rounded-lg border border-white/15 bg-[#1f1632] px-3 py-1.5 text-xs text-[#fbbf24]"
                      />
                    </div>

                    <textarea
                      rows={2}
                      value={proj.description}
                      onChange={(e) => {
                        const next = [...draft.projects];
                        next[idx] = { ...proj, description: e.target.value };
                        setDraft({ ...draft, projects: next });
                      }}
                      className="w-full rounded-lg border border-white/15 bg-[#1f1632] px-3 py-2 text-xs text-[#e3cbbd]"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: EDUCATION & IMPACT METRICS */}
            {activeTab === 'education' && (
              <>
                <div className="rounded-2xl border border-white/12 bg-[#1f1632] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#fbbf24]">教育经历（3D 方尖碑圣殿）</h2>
                    <button
                      type="button"
                      onClick={() => {
                        const next: EducationItem = {
                          id: `e-${Date.now()}`,
                          school: '新院校名称',
                          period: '2025',
                          major: '专业方向',
                          degree: '学历认证',
                        };
                        setDraft({ ...draft, education: [...draft.education, next] });
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#e14d58] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>添加学历</span>
                    </button>
                  </div>

                  {draft.education.map((edu, idx) => (
                    <div
                      key={edu.id}
                      className="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-[#140e21] p-3.5 sm:grid-cols-5 items-center"
                    >
                      <input
                        type="text"
                        value={edu.school}
                        onChange={(e) => {
                          const next = [...draft.education];
                          next[idx] = { ...edu, school: e.target.value };
                          setDraft({ ...draft, education: next });
                        }}
                        className="rounded-lg border border-white/15 bg-[#1f1632] px-2.5 py-1.5 text-xs font-bold text-white sm:col-span-2"
                      />
                      <input
                        type="text"
                        value={edu.major}
                        onChange={(e) => {
                          const next = [...draft.education];
                          next[idx] = { ...edu, major: e.target.value };
                          setDraft({ ...draft, education: next });
                        }}
                        className="rounded-lg border border-white/15 bg-[#1f1632] px-2.5 py-1.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={`${edu.period} · ${edu.degree}`}
                        onChange={(e) => {
                          const [period, ...rest] = e.target.value.split('·').map((s) => s.trim());
                          const next = [...draft.education];
                          next[idx] = {
                            ...edu,
                            period: period || edu.period,
                            degree: rest.join(' · ') || edu.degree,
                          };
                          setDraft({ ...draft, education: next });
                        }}
                        className="rounded-lg border border-white/15 bg-[#1f1632] px-2.5 py-1.5 text-xs text-[#d8b4fe]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            education: draft.education.filter((item) => item.id !== edu.id),
                          })
                        }
                        className="justify-self-end rounded-lg bg-white/8 p-1.5 text-[#fb7185] hover:bg-white/15"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/12 bg-[#1f1632] p-5 space-y-3">
                  <h2 className="text-base font-bold text-[#fbbf24]">
                    商业成果碑林（成果与联系展区）
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {draft.impactMetrics.map((m: ImpactMetricItem, idx) => (
                      <div
                        key={m.id}
                        className="rounded-xl border border-white/10 bg-[#140e21] p-3.5 space-y-2"
                      >
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={m.value}
                            onChange={(e) => {
                              const next = [...draft.impactMetrics];
                              next[idx] = { ...m, value: e.target.value };
                              setDraft({ ...draft, impactMetrics: next });
                            }}
                            className="w-28 rounded-lg border border-white/15 bg-[#1f1632] px-2.5 py-1.5 text-xs font-extrabold text-[#fbbf24]"
                          />
                          <input
                            type="text"
                            value={m.label}
                            onChange={(e) => {
                              const next = [...draft.impactMetrics];
                              next[idx] = { ...m, label: e.target.value };
                              setDraft({ ...draft, impactMetrics: next });
                            }}
                            className="flex-1 rounded-lg border border-white/15 bg-[#1f1632] px-2.5 py-1.5 text-xs font-bold text-white"
                          />
                        </div>
                        <input
                          type="text"
                          value={m.detail}
                          onChange={(e) => {
                            const next = [...draft.impactMetrics];
                            next[idx] = { ...m, detail: e.target.value };
                            setDraft({ ...draft, impactMetrics: next });
                          }}
                          className="w-full rounded-lg border border-white/15 bg-[#1f1632] px-2.5 py-1.5 text-xs text-[#dec7bb]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

void DEFAULT_RESUME_CONFIG;
