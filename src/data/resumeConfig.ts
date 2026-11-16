import type { AtmospherePresetId } from '../scene/worldLogic';

export type ResumeModuleId =
  | 'profile'
  | 'projects'
  | 'career'
  | 'ai_lab'
  | 'education'
  | 'contact';

export interface ProfileInfo {
  name: string;
  title: string;
  experienceYears: string;
  availability: string;
  phone: string;
  email: string;
  communityBadge: string;
  heroTagline: string;
}

export interface OverviewHighlight {
  id: string;
  title: string;
  summary: string;
}

export interface CareerMilestoneItem {
  id: string;
  company: string;
  role: string;
  period: string;
  domain: string;
  companyScale: string;
  highlights: string[];
}

export interface ProjectExperienceItem {
  id: string;
  title: string;
  period: string;
  category: string;
  subtitle: string;
  accentHex: string;
  description: string;
  stats: string;
  featuredIn3D: boolean;
}

export interface EducationItem {
  id: string;
  school: string;
  period: string;
  major: string;
  degree: string;
}

export interface ImpactMetricItem {
  id: string;
  value: string;
  label: string;
  detail: string;
  accentHex: string;
}

export interface TechLayerItem {
  id: string;
  title: string;
  stack: string;
  accentHex: string;
}

export interface FrontendModuleConfig {
  id: ResumeModuleId;
  name: string;
  subtitle: string;
  enabled: boolean;
  accentHex: string;
  order: number;
}

export interface SceneDisplaySettings {
  atmosphere: AtmospherePresetId;
  showBottomDock: boolean;
  showTopContact: boolean;
  enableStuntProps: boolean;
}

export interface ResumeSiteConfig {
  profile: ProfileInfo;
  overviewHighlights: OverviewHighlight[];
  careers: CareerMilestoneItem[];
  projects: ProjectExperienceItem[];
  education: EducationItem[];
  impactMetrics: ImpactMetricItem[];
  techLayers: TechLayerItem[];
  modules: FrontendModuleConfig[];
  display: SceneDisplaySettings;
}

export const DEFAULT_RESUME_CONFIG: ResumeSiteConfig = {
  profile: {
    name: '韩鸿哲',
    title: 'AI 产品总监',
    experienceYears: '10年以上工作经验',
    availability: '离职-随时到岗',
    phone: '13581848772',
    email: 'hhz5@163.com',
    communityBadge: 'AI 开源社区《通往AGI之路》共创者',
    heroTagline: 'AIGC · 企业级大模型 (MaaS) · 元宇宙数字空间 · 视觉孪生可视化',
  },
  overviewHighlights: [
    {
      id: 'ov1',
      title: '资深产品管理经验',
      summary:
        '10年以上互联网产品经验 AI 产品总监，在 AI 技术与产品生态体系战略规划方面具有深厚经验，制定并实施行业特定的 AI 应用规划，推动产品线收益增长。',
    },
    {
      id: 'ov2',
      title: '产品创新与市场化',
      summary:
        '精通将复杂 AI 产品从概念化到市场化全过程，主导创影 AIGC 数字化内容生产平台与影源企业级大模型解决方案（私有化 + MaaS）落地，实现 AI 组合产品线累计收益千万元。',
    },
    {
      id: 'ov3',
      title: '跨职能团队领导',
      summary:
        '领导跨职能团队，运用先进 AI 技术与市场分析工具推进数据可视化与数字化产品优化和迭代，确保项目按时按预算交付，累计创造数百万收益。',
    },
    {
      id: 'ov4',
      title: '前瞻性研究与创新设计',
      summary:
        '作为技术与市场趋势的专业分析师，前瞻性研究与创新产品设计获业界好评，主导内部 AI 培训与团队建设，AI 开源社区《通往AGI之路》共创者。',
    },
  ],
  careers: [
    {
      id: 'c1',
      company: '北京影谱科技有限公司',
      role: '产品总监',
      period: '2021.03 - 2025.06',
      domain: '人工智能 · 智能影像（拟IPO独角兽）',
      companyScale: '500人以上 | 汇报对象：数字商业中心总经理 | 下属：8人',
      highlights: [
        '制定战略级 AI 产品生态体系（AIGC 文图视频生成、元宇宙数字空间、数字要素可视化），带动产品线累计收益超 2000 万元。',
        '率先推出从 0 到 1 的 AIGC 创作 MVP，在政府及国央企事业单位完成交付，产品好评及推荐度 NPS 值超 70%。',
        '构建元宇宙数字空间、数字要素可视化平台与数字说明书等标准化产品，引入 30 余家合作伙伴、4 家企业客户复购，创收千万级，占年度创新业务收入 70% 以上。',
        '主导 10 余个数据可视化与数字化转型特需项目创收数百万；主导公司内部 AI 研讲、分享及培训 4 次获一致好评。',
      ],
    },
    {
      id: 'c2',
      company: '北京非影科技有限公司',
      role: '互联网项目部负责人',
      period: '2019.12 - 2021.01',
      domain: '视频/图像在线审阅 · 社区+课堂互动 (B2B/B2C)',
      companyScale: '50-100人 | 汇报对象：总裁 | 下属：30人（产品、设计、研发）',
      highlights: [
        '负责“幕童”系列产品差异化战略规划与市场推广，使产品收入提升 15% 并扩大市场份额。',
        '主导幕童云阅（多人协作预览，审评效率提升 70%）、幕童场记 APP（AI 电子场记，生产力提升 80%）与幕童服务项目管理（节省时间成本 20%+）。',
        '带领团队研发幕童 AI 超分解决方案，将标清视频素材自动转化为高清，使用用户数超 10 万，日均接口调用万次，平均节省剪辑时长 30%。',
        '建立合作伙伴网络并实施 OKR 绩效体系，确保项目按时按预算交付，客户满意度超过 95%。',
      ],
    },
    {
      id: 'c3',
      company: '北京瓦特比尔科技有限公司',
      role: '联合创始人',
      period: '2017.02 - 2019.10',
      domain: '服饰定制行业营销平台 + 智能系统（执·慕）',
      companyScale: '联合创始人 | 负责商业模式、供应链、产品与市场全链路',
      highlights: [
        '打造“执·慕”平台，实现 TO B（供应商）— TO B（定制企业）— TO C（个人用户）供需销整体闭环，破解推广难、管理无序与物料成本高三大痛点。',
        '结合市场数据与 AI 产品研发，使接入客户平均运营成本降低 5%、物料成本降低 10%、运营效率及用户复购率提升 10%。',
        '全面负责原型到市场推广的项目管理，客户满意度维持在 95% 以上，持续提升产品 NPS。',
      ],
    },
    {
      id: 'c4',
      company: '该亚中国',
      role: '产品总监',
      period: '2012.01 - 2017.01',
      domain: '互联网本地化综合门户（媒体、电商、社交、工具）',
      companyScale: '100-499人 | 汇报对象：COO | 下属：32人（产品、设计、研发）',
      highlights: [
        '负责产品矩阵商业规划与架构实施，推动产品从 0 至 1，实现月活跃用户增至 1000 万，年收入达 2000 万元，市场渗透率提升 5%+。',
        '使用 Jira 协调跨部门团队推进“掌门”“广电淘”等自研项目及 ERP 商业交付项目，客户满意度达 95%。',
        '结合销售数据优化 B2B 商业化与伙伴合作策略，主导团建与前沿技术创新。',
      ],
    },
    {
      id: 'c5',
      company: '利达智通',
      role: '项目组长',
      period: '2006.06 - 2011.12',
      domain: '对日计算机软件开发（金融、银行、证券、医疗）',
      companyScale: '100-499人 | 汇报对象：事业部部长 | 下属：5人',
      highlights: [
        '负责日本大型金融机构与银行证券系统从外部设计到内部设计的全流程推进与跨文化团队协作。',
        '在 UNIX 环境中运用 COBOL 开发维护“フロコン”与“CHECK业务”核心系统，保障高可靠性。',
        '建立按时交付率、响应与解决效率 KPI 监控机制，保持 97% 以上日本客户满意度。',
      ],
    },
  ],
  projects: [
    {
      id: 'p1',
      title: '影源企业级大模型解决方案',
      period: '2024.3 – 2025.6',
      category: '私有化 + MaaS',
      subtitle: 'Qwen/GLM 底座 · RAG · Agent 工作流',
      accentHex: '#fbbf24',
      description:
        '面向政企客户，以国产开源大模型（通义千问 Qwen、智谱 GLM）为底座，自研模型工程层（微调、RAG 知识库、量化压缩、私有化安全护栏）、产品层（AI 问答、AI 文创、AI 视创、Agent 智能体）与商业化层（License / 私有化 / MaaS），完成首批党政媒体客户从 0 到 1 私有化交付。',
      stats: '首批党政媒体私有化交付 · 安全不出域',
      featuredIn3D: true,
    },
    {
      id: 'p2',
      title: '创影 AIGC 内容生产平台',
      period: '2022.3 – 2022.7',
      category: '早期 AI 辅助程序化视频',
      subtitle: 'CV/OCR 感知 · NLP 规则 · 模板出片',
      accentHex: '#fb7185',
      description:
        '面向大消费领域打造感知层（CV、OCR、语音识别素材打标）、编排层（NLP 规则引擎与模板路由）与合成层（程序化视频引擎批量出片 + 人在回路微调），在商业提案中发挥关键演示作用并协助拿下 2 个大订单客户。',
      stats: '批量化出片降本 · 斩获 2 个核心大单',
      featuredIn3D: true,
    },
    {
      id: 'p3',
      title: '元宇宙党建联盟数字平台',
      period: '2022.8 – 2022.10',
      category: 'WebGL / Three.js 数字孪生',
      subtitle: '虚拟空间 + 数字人 + AIGC 问答',
      accentHex: '#38bdf8',
      description:
        '以 WebGL / Three.js / 数字孪生构建虚拟党建空间，叠加数字人讲解（语音合成 + 口型驱动）、AIGC 图文视频集锦生成与党务智能问答，已为第四范式、通明湖党支部、中国企业家协会、中国档案馆等标杆客户完成高质量交付。',
      stats: '标杆商业化复制 · NPS 超 70%',
      featuredIn3D: true,
    },
    {
      id: 'p4',
      title: '两会服务 · 元宇宙数字会展',
      period: '2023.1 – 2023.3',
      category: '政企重点商业交付',
      subtitle: 'AIGC 视频集锦 + 数字说明书 + 展厅',
      accentHex: '#a855f7',
      description:
        '担任产品项目第一负责人，在紧迫周期内完成售前提案与精准需求拆解，统筹 AIGC 智能视频集锦、数字说明书与元宇宙数字展厅三大子项目闭环交付，获客户高度评价并进入新一轮复购合作。',
      stats: '3 大子项目敏捷闭环 · 促成复购裂变',
      featuredIn3D: true,
    },
    {
      id: 'p5',
      title: '视觉指纹版权保护技术预研',
      period: '2024.1 – 2025.6',
      category: 'AIGC 内容安全 PoC',
      subtitle: '显式标识 + 隐式水印 + 感知哈希',
      accentHex: '#f97316',
      description:
        '系统验证隐式数字水印、显式内容标识与感知哈希指纹检索三条溯源路线，厘清不可感知性、鲁棒性与信息容量的“不可能三角”，跟踪国内合规与 C2PA 标准形成三层组合选型储备，并完成 ROI 评估合理收敛投入。',
      stats: '三层溯源技术选型 · 跟踪 C2PA 合规',
      featuredIn3D: true,
    },
    {
      id: 'p6',
      title: '幕童云阅 & 场记 & AI 超分',
      period: '2019.12 – 2021.01',
      category: '影视产业协同平台',
      subtitle: '多人云审阅 · AI 电子场记 · 标清转高清',
      accentHex: '#34d399',
      description:
        '构建幕童云阅在线协作平台（审评效率提升 70%）、幕童场记 APP（AI 元数据记录，生产力提升 80%）及幕童标清转高清 AI 解决方案（用户超 10 万、日均接口万次、节省剪辑时长 30%）。',
      stats: '用户 10万+ · 审评提效 70% · 客户满意度 95%+',
      featuredIn3D: true,
    },
  ],
  education: [
    {
      id: 'e1',
      school: '西班牙欧洲塞万提斯大学',
      period: '2024 – 2025',
      major: '心理学',
      degree: '研究生（已认证）',
    },
    {
      id: 'e2',
      school: '东北大学',
      period: '2022 – 2024',
      major: '工商管理',
      degree: '本科（双证）',
    },
    {
      id: 'e3',
      school: '沈阳农业大学',
      period: '2003 – 2006',
      major: '计算机科学与技术',
      degree: '专科',
    },
  ],
  impactMetrics: [
    {
      id: 'm1',
      value: '2000万+',
      label: 'AI 产品线累计收益',
      detail: '影谱科技战略级 AIGC、数字空间与可视化矩阵创收',
      accentHex: '#fbbf24',
    },
    {
      id: 'm2',
      value: '30+ 伙伴',
      label: '政企与商业化生态',
      detail: '占年度创新业务收入 70%+，多家客户复购',
      accentHex: '#fb7185',
    },
    {
      id: 'm3',
      value: '1000万 MAU',
      label: '亿级流量矩阵操盘',
      detail: '该亚中国从 0 到 1 打造年收 2000 万门户产品矩阵',
      accentHex: '#38bdf8',
    },
    {
      id: 'm4',
      value: '97% 满意度',
      label: '大型项目交付口碑',
      detail: '多阶段跨国与政企交付保持高 NPS 与复购率',
      accentHex: '#34d399',
    },
  ],
  techLayers: [
    {
      id: 't1',
      title: '多模态感知与生成',
      stack: 'CV / OCR / ASR · 数字人口型 · 程序化视频引擎',
      accentHex: '#38bdf8',
    },
    {
      id: 't2',
      title: '企业级大模型工程',
      stack: 'Qwen / GLM · 微调量化 · RAG · Agent 工作流',
      accentHex: '#fbbf24',
    },
    {
      id: 't3',
      title: '空间计算与数字孪生',
      stack: 'WebGL / Three.js · XR 空间映射 · 视觉孪生可视化',
      accentHex: '#a855f7',
    },
  ],
  modules: [
    {
      id: 'profile',
      name: '个人概况',
      subtitle: '韩鸿哲 · 10年+ AI 产品总监与核心优势总览',
      enabled: true,
      accentHex: '#f59e0b',
      order: 1,
    },
    {
      id: 'projects',
      name: '核心项目',
      subtitle: '影源大模型 MaaS、创影 AIGC、元宇宙空间与视觉指纹',
      enabled: true,
      accentHex: '#fb7185',
      order: 2,
    },
    {
      id: 'career',
      name: '职业历程',
      subtitle: '2006–2025 五段深耕经历：影谱、非影、瓦特比尔、该亚、利达智通',
      enabled: true,
      accentHex: '#fbbf24',
      order: 3,
    },
    {
      id: 'ai_lab',
      name: 'AI 技术栈',
      subtitle: '模型工程层、AIGC 生产管线与 WebGL/Three.js 空间技术',
      enabled: true,
      accentHex: '#38bdf8',
      order: 4,
    },
    {
      id: 'education',
      name: '教育背景',
      subtitle: '欧洲塞万提斯大学心理学硕士 · 东北大学工商管理 · 计算机科班',
      enabled: true,
      accentHex: '#a855f7',
      order: 5,
    },
    {
      id: 'contact',
      name: '成果与联系',
      subtitle: '2000万+ 商业成果碑林 · 13581848772 · hhz5@163.com',
      enabled: true,
      accentHex: '#34d399',
      order: 6,
    },
  ],
  display: {
    atmosphere: 'sunset',
    showBottomDock: true,
    showTopContact: true,
    enableStuntProps: true,
  },
};

const STORAGE_KEY = 'hhz_3d_resume_config_v1';

export function cloneResumeConfig(cfg: ResumeSiteConfig): ResumeSiteConfig {
  return JSON.parse(JSON.stringify(cfg)) as ResumeSiteConfig;
}

export function loadResumeConfig(): ResumeSiteConfig {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return cloneResumeConfig(DEFAULT_RESUME_CONFIG);
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneResumeConfig(DEFAULT_RESUME_CONFIG);
    const parsed = JSON.parse(raw) as Partial<ResumeSiteConfig>;
    return {
      ...cloneResumeConfig(DEFAULT_RESUME_CONFIG),
      ...parsed,
      profile: {
        ...DEFAULT_RESUME_CONFIG.profile,
        ...(parsed.profile ?? {}),
      },
      display: {
        ...DEFAULT_RESUME_CONFIG.display,
        ...(parsed.display ?? {}),
      },
      overviewHighlights: Array.isArray(parsed.overviewHighlights)
        ? parsed.overviewHighlights
        : cloneResumeConfig(DEFAULT_RESUME_CONFIG).overviewHighlights,
      careers: Array.isArray(parsed.careers)
        ? parsed.careers
        : cloneResumeConfig(DEFAULT_RESUME_CONFIG).careers,
      projects: Array.isArray(parsed.projects)
        ? parsed.projects
        : cloneResumeConfig(DEFAULT_RESUME_CONFIG).projects,
      education: Array.isArray(parsed.education)
        ? parsed.education
        : cloneResumeConfig(DEFAULT_RESUME_CONFIG).education,
      impactMetrics: Array.isArray(parsed.impactMetrics)
        ? parsed.impactMetrics
        : cloneResumeConfig(DEFAULT_RESUME_CONFIG).impactMetrics,
      techLayers: Array.isArray(parsed.techLayers)
        ? parsed.techLayers
        : cloneResumeConfig(DEFAULT_RESUME_CONFIG).techLayers,
      modules: Array.isArray(parsed.modules) && parsed.modules.length > 0
        ? parsed.modules
        : cloneResumeConfig(DEFAULT_RESUME_CONFIG).modules,
    };
  } catch {
    return cloneResumeConfig(DEFAULT_RESUME_CONFIG);
  }
}

export function saveResumeConfig(cfg: ResumeSiteConfig): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function resetResumeConfig(): ResumeSiteConfig {
  const fresh = cloneResumeConfig(DEFAULT_RESUME_CONFIG);
  saveResumeConfig(fresh);
  return fresh;
}

export function getEnabledModules(cfg: ResumeSiteConfig): FrontendModuleConfig[] {
  return [...cfg.modules]
    .filter((m) => m.enabled)
    .sort((a, b) => a.order - b.order);
}
