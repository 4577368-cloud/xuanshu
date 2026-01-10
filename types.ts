
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
  province?: string;
  city?: string;
  longitude?: number;
  createdAt: number;
  avatar?: string;
  tags?: string[];
  aiReports?: AiReportRecord[];
  lastUpdated?: number;
}

export interface HiddenStem {
  stem: string;
  shiShen: string;
  type: '主气' | '中气' | '余气';
  powerPercentage: number;
}

export interface GanZhi {
  gan: string;
  zhi: string;
  ganElement: string;
  zhiElement: string;
  hiddenStems: HiddenStem[];
  naYin: string;
  shiShenGan: string;
  lifeStage: string;
  selfLifeStage: string;
}

export interface Pillar {
  name: string;
  ganZhi: GanZhi;
  kongWang: boolean;
  shenSha: string[];
}

export interface PillarInterpretation {
  pillarName: string;
  coreSymbolism: string;
  hiddenDynamics: string;
  naYinInfluence: string;
  lifeStageEffect: string;
  shenShaEffects: string[];
  roleInDestiny: string;
  integratedSummary: string;
}

export interface LuckPillar {
  index: number;
  startAge: number;
  startYear: number;
  endYear: number;
  ganZhi: GanZhi;
}

export interface XiaoYun {
  age: number;
  year: number;
  ganZhi: GanZhi;
}

export interface GodStrength {
  name: string;
  element: string;
  score: number;
  level: string;
  tags: string[];
}

export interface TrendActivation {
  pillarName: string;
  branch: string;
  method: '透干' | '六冲' | '六合' | '半合' | '刑';
  activatedStems: {
    stem: string;
    shiShen: string;
    events: string[];
  }[];
  description: string;
}

export interface ShenShaInteraction {
  name: string;
  stars: string[];
  effect: string;
  severity: '吉' | '凶' | '中平';
  description: string;
}

export interface BalanceAnalysis {
  dayMasterStrength: {
    score: number;
    level: '身强' | '身弱' | '中和';
    description: string;
  };
  yongShen: string[];
  xiShen: string[];
  jiShen: string[];
  method: '调候' | '扶抑' | '通关';
  advice: string;
  tiaoHouYongShen?: string[];
}

export interface PatternAnalysis {
  name: string;
  type: '正格' | '变格' | '外格';
  isEstablished: boolean;
  level: '上等' | '中等' | '下等' | '破格';
  keyFactors: {
    beneficial: string[];
    destructive: string[];
  };
  description: string;
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
  dayMaster: string;
  dayMasterElement: string;
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar;
  };
  mingGong: string; 
  shenGong: string;
  taiYuan: string; 
  taiXi: string; 
  wuxingCounts: Record<string, number>;
  mangPai: string[]; 
  luckPillars: LuckPillar[];
  xiaoYun: XiaoYun[];
  startLuckText: string;
  godStrength: GodStrength[];
  shenShaInteractions: ShenShaInteraction[];
  balance: BalanceAnalysis;
  pattern: PatternAnalysis;
  originalTime?: string;
  solarTime?: string;
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
  ANALYSIS = 'analysis'
}

export interface ModalData {
  title: string;
  pillarName: string;
  ganZhi: GanZhi;
  shenSha: string[];
  kongWang?: boolean;
}
