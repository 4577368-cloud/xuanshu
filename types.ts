

export type Gender = 'male' | 'female';

export interface AiReportRecord {
    id: string;
    date: number;
    content: string;
}

export interface UserProfile {
  id: string;
  name: string;
  birthDate: string; // ISO string YYYY-MM-DD
  birthTime: string; // HH:mm
  gender: Gender;
  isSolarTime: boolean;
  province?: string; // New: Province name
  city?: string;     // New: City name
  longitude?: number; // New: Longitude for solar time calculation
  createdAt: number;
  // New Archive Fields
  avatar?: string; // Icon name e.g., 'default', 'dragon', 'lotus'
  tags?: string[]; // e.g. ['self', 'family']
  aiReports?: AiReportRecord[]; // History of AI reports
  lastUpdated?: number;
}

export interface HiddenStem {
  stem: string;
  shiShen: string; // Ten God relative to DM
  type: '主气' | '中气' | '余气';
  powerPercentage: number; // 60, 30, or 10
}

export interface GanZhi {
  gan: string; // Heavenly Stem
  zhi: string; // Earthly Branch
  ganElement: string;
  zhiElement: string;
  hiddenStems: HiddenStem[]; // Detailed hidden stems
  naYin: string; // Melodic Element
  shiShenGan: string; // Ten God of the Stem
  lifeStage: string; // 12 Life Stages (Zhang Sheng, etc.) relative to DM
  selfLifeStage: string; // 12 Life Stages (Stem vs Branch)
}

export interface Pillar {
  name: string; // Year, Month, Day, Hour
  ganZhi: GanZhi;
  kongWang: boolean; // Empty Death
  shenSha: string[]; // Stars/Gods
}

export interface LuckPillar {
  index: number;
  startAge: number;
  startYear: number;
  endYear: number;
  ganZhi: GanZhi;
}

export interface GodStrength {
  name: string;
  element: string;
  score: number;
  level: string; // 强, 中, 弱
  tags: string[]; // e.g., "强根", "入墓", "空亡"
}

export interface TrendActivation {
  pillarName: string; // e.g., "月柱"
  branch: string; // e.g., "寅"
  method: '透干' | '六冲' | '六合' | '半合' | '刑'; // How it was activated
  activatedStems: {
    stem: string;
    shiShen: string;
    events: string[]; // Potential events
  }[];
  description: string; // e.g., "流年申冲月支寅，引动甲木偏财"
}

export interface ShenShaInteraction {
  name: string; // e.g. "德贵双全"
  stars: string[]; // The stars involved, e.g. ["天乙贵人", "天德贵人"]
  effect: string; // Description of the effect
  severity: '吉' | '凶' | '中平'; // For UI coloring
  description: string; // Detailed interpretation
}

export interface BalanceAnalysis {
  dayMasterStrength: {
    score: number;
    level: '身强' | '身弱' | '中和';
    description: string; // e.g., "得令,得地"
  };
  yongShen: string[]; // Useful Elements (e.g., ['水', '木'])
  xiShen: string[];   // Joyful Elements
  jiShen: string[];   // Harmful Elements
  method: '调候' | '扶抑' | '通关'; // The primary method used
  advice: string; // Brief advice string
  tiaoHouYongShen?: string[]; // Optional compatibility field
}

export interface PatternAnalysis {
  name: string; // e.g. "正官格"
  type: '正格' | '变格' | '外格';
  isEstablished: boolean; // 成格/破格
  level: '上等' | '中等' | '下等' | '破格';
  keyFactors: {
    beneficial: string[]; // Factors helping the pattern
    destructive: string[]; // Factors breaking the pattern
  };
  description: string; // Detailed analysis text
}

export interface AnnualFortune {
  year: number;
  ganZhi: GanZhi;
  rating: '吉' | '凶' | '平';
  reasons: string[];
  score: number;
}

export interface InterpretationResult {
  title: string;
  content: string;
  type: '吉' | '凶' | '中平' | '信息';
  category: '十神' | '流年' | '神煞' | '长生' | '纳音';
}

export interface BaziChart {
  profileId: string;
  gender: Gender;
  dayMaster: string; // The Day Stem
  dayMasterElement: string;
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar;
  };
  daLiu?: Array<{
    startAge: number;
    ganZhi: string;
    element: string;
    shiShen?: string;
  }>;
  
  shenSha?: {
    auspicious?: string[];
    inauspicious?: string[];
    noblemen?: string[];
  };
  
  kongWang?: string[];
  
  shiShenRelations?: {
    year: { gan: string; zhi: string };
    month: { gan: string; zhi: string };
    day: { gan: string; zhi: string };
    hour: { gan: string; zhi: string };
  };
  
  naYinElements?: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  
  taiYuanMingGong?: {
    taiYuan: string;
    mingGong: string;
    shenGong?: string;
  };
  
  specialPatterns?: Array<{
    name: string;
    description: string;
    level: string;
  }>;
  
  birthTime?: {
    year: number;
    month: number;
    day: number;
    hour: number;
  };

  currentDaYun?: string;
  keyYears?: string[];
  startYunAge?: number;
  mingGong: string; 
  taiYuan: string; 
  taiXi: string; 
  wuxingCounts: Record<string, number>;
  mangPai: string[]; 
  luckPillars: LuckPillar[];
  startLuckText: string; // e.g., "出生后1年5月开始行大运"
  godStrength: GodStrength[]; // New analysis field
  shenShaInteractions: ShenShaInteraction[]; // New Interaction Analysis
  balance: BalanceAnalysis; // New Yong Shen Analysis
  pattern: PatternAnalysis; // New Pattern Analysis
  originalTime?: string; // e.g. "12:00"
  solarTime?: string; // e.g. "12:33"
  solarTimeData?: { longitude: number; city: string };
}

export enum AppTab {
  HOME = 'home',
  CHART = 'chart',
  TIPS = 'tips',
  ARCHIVE = 'archive'
}

export enum ChartSubTab {
  BASIC = 'basic',
  VISUAL = 'visual',
  DETAIL = 'detail',
  LUCK = 'luck',
  ANALYSIS = 'analysis' // New sub-tab
}

export interface ModalData {
  title: string;
  pillarName: string;
  ganZhi: GanZhi;
  shenSha: string[];
  kongWang?: boolean;
}