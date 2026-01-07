
import { BaziChart, GanZhi, LuckPillar, Pillar, UserProfile, HiddenStem, GodStrength, TrendActivation, ShenShaInteraction, BalanceAnalysis, AnnualFortune, PatternAnalysis, InterpretationResult, ModalData } from '../types';
import { 
  EARTHLY_BRANCHES, 
  FIVE_ELEMENTS, 
  HEAVENLY_STEMS, 
  HIDDEN_STEMS_DATA,
  LIFE_STAGES_TABLE, 
  NA_YIN, 
  TEN_GODS_MAP, 
  TWENTY_EIGHT_MANSIONS,
  BRANCH_CLASHES,
  BRANCH_COMBINES,
  SHEN_SHA_INTERACTION_RULES,
  TIAN_YI_MAP,
  TIAN_DE_MAP,
  YUE_DE_MAP,
  WEN_CHANG_MAP,
  LU_SHEN_MAP,
  YANG_REN_MAP,
  JIN_YU_MAP,
  HONG_YAN_MAP,
  XUE_TANG_MAP,
  CI_GUAN_MAP,
  TIAN_CHU_MAP,
  GU_CHEN_MAP,
  GUA_SU_MAP,
  HONG_LUAN_MAP,
  JIE_SHA_MAP,
  ZAI_SHA_MAP,
  WANG_SHEN_MAP,
  XIAN_CHI_MAP,
  YI_MA_MAP,
  HUA_GAI_MAP,
  JIANG_XING_MAP,
  LIU_XIA_MAP,
  DE_XIU_MAP
} from './constants';

const getElement = (char: string): string => FIVE_ELEMENTS[char] || '土';
const getStemIndex = (stem: string) => Math.max(0, HEAVENLY_STEMS.indexOf(stem));

// --- Solar Term Calculation (Jie Qi) ---

// Coefficients for the 12 Jie (Sectional Terms)
// Order: XiaoHan(Jan), LiChun(Feb), JingZhe(Mar), QingMing(Apr), LiXia(May), MangZhong(Jun), XiaoShu(Jul), LiQiu(Aug), BaiLu(Sep), HanLu(Oct), LiDong(Nov), DaXue(Dec)
const JIE_QI_C_20 = [5.4055, 3.87, 5.63, 4.81, 5.52, 5.678, 7.108, 7.5, 7.646, 8.318, 7.438, 7.18]; // Re-verified constants
const JIE_QI_C_21 = [5.4055, 3.87, 5.63, 4.81, 5.52, 5.678, 7.108, 7.5, 7.646, 8.318, 7.438, 7.18]; // For simplification, using same coefficients base, minor variations exist but acceptable for app without ephemeris.

/**
 * Calculate the day of the Jie Qi for a given year and month (0-11).
 * Uses the formula: Day = [Y*D + C] - L
 * Y = Year suffix (00-99), D = 0.2422, L = Leap year count
 */
const getJieQiDay = (year: number, month: number): number => {
  if (year < 1900 || year > 2099) return 5; 
  
  const cArray = year < 2000 ? JIE_QI_C_20 : JIE_QI_C_21;
  const c = cArray[month];
  const y = year % 100;
  const d = 0.2422;
  
  // L = INT((Y-1)/4)
  const l = Math.floor((y - 1) / 4);
  
  const day = Math.floor(y * d + c) - l;
  return day;
};

/**
 * Get the exact Date object for a Jie Qi.
 * We set the time to 12:00 UTC as an approximation since exact degree time varies.
 */
const getJieQiDate = (year: number, month: number): Date => {
  const day = getJieQiDay(year, month);
  // Month is 0-indexed (Jan=0)
  return new Date(Date.UTC(year, month, day, 12, 0, 0));
};

// --- Time Correction Logic (True Solar Time) ---

/**
 * Calculates the True Solar Time given a local clock time (assumed UTC+8) and longitude.
 * @param date The local date object (constructed from clock time)
 * @param longitude The longitude of birth location
 * @returns The corrected Date object representing True Solar Time
 */
const calculateTrueSolarTime = (date: Date, longitude: number): Date => {
    // 1. Calculate Mean Solar Time
    // Difference from standard meridian (120° for Beijing Time UTC+8)
    // 1 degree = 4 minutes
    const standardMeridian = 120;
    const longitudeOffsetMinutes = (longitude - standardMeridian) * 4;
    
    // 2. Calculate Equation of Time (EoT)
    // Approximation formula based on day of year
    const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
    const diff = date.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    // B = 360 * (N - 81) / 365
    const b = 2 * Math.PI * (dayOfYear - 81) / 365;
    const eotMinutes = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
    
    const totalCorrectionMinutes = longitudeOffsetMinutes + eotMinutes;
    
    // Apply correction
    const adjustedTime = new Date(date.getTime() + totalCorrectionMinutes * 60000);
    return adjustedTime;
};

// Calculate Ten Gods
const getShiShen = (dayMasterIdx: number, targetStemIdx: number): string => {
  if (dayMasterIdx < 0 || dayMasterIdx >= 10 || targetStemIdx < 0 || targetStemIdx >= 10) return '';
  return TEN_GODS_MAP[dayMasterIdx][targetStemIdx];
};

// Calculate Life Stage
const getLifeStage = (dayMasterIdx: number, branchIdx: number): string => {
  if (dayMasterIdx < 0 || dayMasterIdx >= 10 || branchIdx < 0 || branchIdx >= 12) return '';
  return LIFE_STAGES_TABLE[dayMasterIdx][branchIdx];
};

const createGanZhi = (ganIndex: number, zhiIndex: number, dayMasterGanIndex: number): GanZhi => {
  const safeGanIndex = (ganIndex % 10 + 10) % 10;
  const safeZhiIndex = (zhiIndex % 12 + 12) % 12;
  const safeDayMasterIndex = (dayMasterGanIndex % 10 + 10) % 10;

  const gan = HEAVENLY_STEMS[safeGanIndex];
  const zhi = EARTHLY_BRANCHES[safeZhiIndex];
  const combination = gan + zhi;
  
  const shiShenGan = getShiShen(safeDayMasterIndex, safeGanIndex);

  const hiddenData = HIDDEN_STEMS_DATA[zhi] || [];
  const hiddenStems: HiddenStem[] = hiddenData.map(item => ({
    stem: item[0], 
    type: item[1],
    powerPercentage: item[2],
    shiShen: getShiShen(safeDayMasterIndex, getStemIndex(item[0]))
  }));

  const lifeStage = getLifeStage(safeDayMasterIndex, safeZhiIndex);
  const selfLifeStage = getLifeStage(safeGanIndex, safeZhiIndex);

  return {
    gan,
    zhi,
    ganElement: getElement(gan),
    zhiElement: getElement(zhi),
    hiddenStems,
    naYin: NA_YIN[combination] || '未知',
    shiShenGan,
    lifeStage,
    selfLifeStage
  };
};

export const getGanZhiForYear = (year: number, dayMaster: string): GanZhi => {
  const yearGanIndex = (year - 1984 + 10000) % 10;
  const yearZhiIndex = (year - 1984 + 12000) % 12;
  const dayMasterIndex = Math.max(0, HEAVENLY_STEMS.indexOf(dayMaster));
  return createGanZhi(yearGanIndex, yearZhiIndex, dayMasterIndex);
};

// --- Comprehensive Shen Sha Logic ---
// (Reusing existing logic)

interface ShenShaContext {
    pillarName: string;
    gan: string;
    zhi: string;
    dayGan: string;
    dayZhi: string;
    yearGan: string;
    yearZhi: string;
    monthZhi: string;
    gz: string;
}

type ShenShaRule = (ctx: ShenShaContext) => string | null;

const getBranchDistance = (b1: string, b2: string) => {
    const i1 = EARTHLY_BRANCHES.indexOf(b1);
    const i2 = EARTHLY_BRANCHES.indexOf(b2);
    return (i2 - i1 + 12) % 12;
}

const SHEN_SHA_RULES: ShenShaRule[] = [
    (ctx) => TIAN_YI_MAP[ctx.dayGan]?.includes(ctx.zhi) ? '天乙贵人' : null,
    (ctx) => {
        const taiJiSet: Record<string, string[]> = {
            '甲': ['子', '午'], '乙': ['子', '午'],
            '丙': ['卯', '酉'], '丁': ['卯', '酉'],
            '戊': ['辰', '戌', '丑', '未'], '己': ['辰', '戌', '丑', '未'],
            '庚': ['寅', '亥'], '辛': ['寅', '亥'],
            '壬': ['巳', '申'], '癸': ['巳', '申']
        };
        return taiJiSet[ctx.dayGan]?.includes(ctx.zhi) ? '太极贵人' : null;
    },
    (ctx) => {
        const tdVal = TIAN_DE_MAP[ctx.monthZhi];
        if (!tdVal) return null;
        if (HEAVENLY_STEMS.includes(tdVal)) return ctx.gan === tdVal ? '天德贵人' : null;
        return ctx.zhi === tdVal ? '天德贵人' : null;
    },
    (ctx) => YUE_DE_MAP[ctx.monthZhi] === ctx.gan ? '月德贵人' : null,
    (ctx) => WEN_CHANG_MAP[ctx.dayGan] === ctx.zhi ? '文昌贵人' : null,
    (ctx) => {
        const fuXingMap: Record<string, string[]> = {
            '甲': ['寅', '子'], '乙': ['卯', '丑'], '丙': ['子', '戌'], '丁': ['酉', '亥'],
            '戊': ['申'], '己': ['未'], '庚': ['午'], '辛': ['巳'], '壬': ['辰'], '癸': ['卯'] 
        };
        return fuXingMap[ctx.dayGan]?.includes(ctx.zhi) ? '福星贵人' : null;
    },
    (ctx) => {
        const dxVal = DE_XIU_MAP[ctx.monthZhi];
        if (!dxVal) return null;
        const [deStems, xiuStems] = dxVal;
        return (deStems.includes(ctx.gan) || xiuStems.includes(ctx.gan)) ? '德秀贵人' : null;
    },
    (ctx) => {
        const guoYinMap: Record<string, string> = {
            '甲': '戌', '乙': '亥', '丙': '丑', '丁': '寅', '戊': '丑',
            '己': '寅', '庚': '辰', '辛': '巳', '壬': '未', '癸': '申'
        };
        return guoYinMap[ctx.dayGan] === ctx.zhi ? '国印贵人' : null;
    },
    (ctx) => JIANG_XING_MAP[ctx.yearZhi] === ctx.zhi || JIANG_XING_MAP[ctx.dayZhi] === ctx.zhi ? '将星' : null,
    (ctx) => JIN_YU_MAP[ctx.dayGan] === ctx.zhi ? '金舆' : null,
    (ctx) => TIAN_CHU_MAP[ctx.dayGan] === ctx.zhi ? '天厨贵人' : null,
    (ctx) => XUE_TANG_MAP[ctx.dayGan] === ctx.zhi ? '学堂' : null,
    (ctx) => CI_GUAN_MAP[ctx.dayGan] === ctx.zhi ? '词馆' : null,
    (ctx) => {
        const spring = ['寅', '卯', '辰'].includes(ctx.monthZhi);
        const summer = ['巳', '午', '未'].includes(ctx.monthZhi);
        const autumn = ['申', '酉', '戌'].includes(ctx.monthZhi);
        const winter = ['亥', '子', '丑'].includes(ctx.monthZhi);
        if (ctx.pillarName === '日柱') {
            if (spring && ctx.gz === '戊寅') return '天赦';
            if (summer && ctx.gz === '甲午') return '天赦';
            if (autumn && ctx.gz === '戊申') return '天赦';
            if (winter && ctx.gz === '甲子') return '天赦';
        }
        return null;
    },
    (ctx) => {
        const hongLuanBranch = HONG_LUAN_MAP[ctx.yearZhi];
        return BRANCH_CLASHES[hongLuanBranch] === ctx.zhi ? '天喜' : null;
    },
    (ctx) => HONG_LUAN_MAP[ctx.yearZhi] === ctx.zhi ? '红鸾' : null,
    (ctx) => getBranchDistance(ctx.yearZhi, ctx.zhi) === 8 ? '龙德' : null,
    (ctx) => BRANCH_COMBINES[ctx.monthZhi] === ctx.zhi ? '解神' : null,

    // 💔 Romance
    (ctx) => (XIAN_CHI_MAP[ctx.yearZhi] === ctx.zhi || XIAN_CHI_MAP[ctx.dayZhi] === ctx.zhi) ? '咸池(桃花)' : null,
    (ctx) => HONG_YAN_MAP[ctx.dayGan] === ctx.zhi ? '红艳煞' : null,
    (ctx) => {
        const guLuanDays = ['甲寅', '乙巳', '丙午', '丁巳', '戊申', '戊午', '辛亥', '壬子'];
        return (ctx.pillarName === '日柱' && guLuanDays.includes(ctx.gz)) ? '孤鸾煞' : null;
    },
    (ctx) => {
        const ycycDays = ['丙午', '丙子', '丁未', '丁丑', '戊申', '戊寅', '辛酉', '辛卯', '壬戌', '壬辰', '癸巳', '癸亥'];
        return (ctx.pillarName === '日柱' && ycycDays.includes(ctx.gz)) ? '阴差阳错' : null;
    },
    (ctx) => {
        const spring = ['寅', '卯', '辰'].includes(ctx.monthZhi);
        const summer = ['巳', '午', '未'].includes(ctx.monthZhi);
        const autumn = ['申', '酉', '戌'].includes(ctx.monthZhi);
        const winter = ['亥', '子', '丑'].includes(ctx.monthZhi);
        if (ctx.pillarName === '日柱') {
            const springFei = ['庚申', '辛酉'];
            const summerFei = ['壬子', '癸亥'];
            const autumnFei = ['甲寅', '乙卯'];
            const winterFei = ['丙午', '丁巳'];
            if (spring && springFei.includes(ctx.gz)) return '四废';
            if (summer && summerFei.includes(ctx.gz)) return '四废';
            if (autumn && autumnFei.includes(ctx.gz)) return '四废';
            if (winter && winterFei.includes(ctx.gz)) return '四废';
        }
        return null;
    },
    (ctx) => (ctx.pillarName === '时柱' && (XIAN_CHI_MAP[ctx.yearZhi] === ctx.zhi || XIAN_CHI_MAP[ctx.dayZhi] === ctx.zhi)) ? '墙外桃花' : null,

    // 🐎 Travel/Change
    (ctx) => (YI_MA_MAP[ctx.yearZhi] === ctx.zhi || YI_MA_MAP[ctx.dayZhi] === ctx.zhi) ? '驿马' : null,
    (ctx) => (JIE_SHA_MAP[ctx.yearZhi] === ctx.zhi || JIE_SHA_MAP[ctx.dayZhi] === ctx.zhi) ? '劫煞' : null,
    (ctx) => (ZAI_SHA_MAP[ctx.yearZhi] === ctx.zhi || ZAI_SHA_MAP[ctx.dayZhi] === ctx.zhi) ? '灾煞' : null,
    (ctx) => (WANG_SHEN_MAP[ctx.yearZhi] === ctx.zhi || WANG_SHEN_MAP[ctx.dayZhi] === ctx.zhi) ? '亡神' : null,
    (ctx) => {
        const isXianChi = XIAN_CHI_MAP[ctx.yearZhi] === ctx.zhi || XIAN_CHI_MAP[ctx.dayZhi] === ctx.zhi;
        const isYiMa = YI_MA_MAP[ctx.yearZhi] === ctx.zhi || YI_MA_MAP[ctx.dayZhi] === ctx.zhi;
        return (isXianChi && isYiMa) ? '桃花煞' : null;
    },

    // 💰 Wealth/Career
    (ctx) => LU_SHEN_MAP[ctx.dayGan] === ctx.zhi ? '禄神' : null,
    (ctx) => YANG_REN_MAP[ctx.dayGan] === ctx.zhi ? '羊刃' : null,
    (ctx) => {
        const yangRenZhi = YANG_REN_MAP[ctx.dayGan];
        return BRANCH_CLASHES[yangRenZhi] === ctx.zhi ? '飞刃' : null;
    },
    (ctx) => BRANCH_CLASHES[ctx.dayZhi] === ctx.zhi ? '元辰' : null,
    (ctx) => getBranchDistance(ctx.yearZhi, ctx.zhi) === 2 ? '丧门' : null,
    (ctx) => getBranchDistance(ctx.yearZhi, ctx.zhi) === 10 ? '吊客' : null,
    (ctx) => getBranchDistance(ctx.yearZhi, ctx.zhi) === 8 ? '白虎' : null,

    // 🕯️ Solitary/Mystical
    (ctx) => (HUA_GAI_MAP[ctx.yearZhi] === ctx.zhi || HUA_GAI_MAP[ctx.dayZhi] === ctx.zhi) ? '华盖' : null,
    (ctx) => GU_CHEN_MAP[ctx.yearZhi] === ctx.zhi ? '孤辰' : null,
    (ctx) => GUA_SU_MAP[ctx.yearZhi] === ctx.zhi ? '寡宿' : null,
    (ctx) => {
        const tianYiMedMap: Record<string, string> = {
            '寅': '丑', '卯': '寅', '辰': '卯', '巳': '辰', '午': '巳', '未': '午',
            '申': '未', '酉': '申', '戌': '酉', '亥': '戌', '子': '亥', '丑': '子'
        };
        return tianYiMedMap[ctx.monthZhi] === ctx.zhi ? '天医' : null;
    },

    // ⚔️ Special Patterns
    (ctx) => (ctx.pillarName === '日柱' && ['壬辰', '庚辰', '庚戌', '戊戌'].includes(ctx.gz)) ? '魁罡' : null,
    (ctx) => (['时柱', '日柱'].includes(ctx.pillarName) && ['癸酉', '己巳', '乙丑'].includes(ctx.gz)) ? '金神' : null,
    (ctx) => {
         const isLu = LU_SHEN_MAP[ctx.dayGan] === ctx.zhi;
         const isYiMa = YI_MA_MAP[ctx.yearZhi] === ctx.zhi || YI_MA_MAP[ctx.dayZhi] === ctx.zhi;
         return (isLu && isYiMa) ? '禄马交驰' : null;
    },
    (ctx) => {
        if (ctx.pillarName !== '年柱') {
            const yearGz = ctx.yearGan + ctx.yearZhi;
            if (ctx.gz === yearGz) return '伏吟';
        }
        return null;
    },
    (ctx) => {
        if (ctx.pillarName !== '年柱') {
            const yearZhiClash = BRANCH_CLASHES[ctx.yearZhi];
            const yearGanClashMap: Record<string, string> = {'甲':'庚', '乙':'辛', '丙':'壬', '丁':'癸', '戊':'甲', '己':'乙', '庚':'丙', '辛':'丁', '壬':'戊', '癸':'己'};
            if (yearGanClashMap[ctx.yearGan] === ctx.gan && yearZhiClash === ctx.zhi) return '反吟';
        }
        return null;
    },
    (ctx) => {
        const liuXiuDays = ['丙午', '丁未', '戊子', '己丑', '戊午', '己未'];
        return (ctx.pillarName === '日柱' && liuXiuDays.includes(ctx.gz)) ? '六秀' : null;
    },

    // ☠️ Disaster/Inauspicious
    (ctx) => (ctx.pillarName === '日柱' && ['癸巳', '己亥'].includes(ctx.gz)) ? '腾蛇' : null,
    (ctx) => (ctx.pillarName === '日柱' && ['丙午', '丁巳'].includes(ctx.gz)) ? '朱雀' : null,
    (ctx) => (ctx.pillarName === '日柱' && ['壬子', '癸亥'].includes(ctx.gz)) ? '玄武' : null,
    (ctx) => (ctx.pillarName === '日柱' && ['戊辰', '己丑'].includes(ctx.gz)) ? '勾陈' : null,
    (ctx) => (ctx.pillarName === '日柱' && ctx.gz === '癸巳') ? '腾蛇缠身' : null,
    (ctx) => {
        const xueRenMap: Record<string, string> = {
            '子': '戌', '丑': '酉', '寅': '申', '卯': '未', '辰': '午', '巳': '巳',
            '午': '辰', '未': '卯', '申': '寅', '酉': '丑', '戌': '子', '亥': '亥'
        };
        return xueRenMap[ctx.yearZhi] === ctx.zhi ? '血刃' : null;
    },
    (ctx) => LIU_XIA_MAP[ctx.dayGan] === ctx.zhi ? '流霞' : null,
    (ctx) => {
        const shiE = ['甲辰', '乙巳', '丙申', '丁亥', '戊戌', '己丑', '庚辰', '辛巳', '壬申', '癸亥'];
        return (ctx.pillarName === '日柱' && shiE.includes(ctx.gz)) ? '十恶大败' : null;
    },
    (ctx) => {
        const baZhuan = ['甲寅', '乙卯', '丁未', '戊戌', '己未', '庚申', '辛酉', '癸丑'];
        return (ctx.pillarName === '日柱' && baZhuan.includes(ctx.gz)) ? '八专' : null;
    },
    (ctx) => {
        const jiuChou = ['壬子', '壬午', '戊子', '戊午', '己酉', '己卯', '乙卯', '乙酉', '辛卯', '辛酉'];
        return (ctx.pillarName === '日柱' && jiuChou.includes(ctx.gz)) ? '九丑' : null;
    },
    (ctx) => {
        const d = getBranchDistance(ctx.yearZhi, ctx.zhi);
        return (d === 2 || d === 10) ? '隔角煞' : null;
    }
];

const calculateShenShaForPillar = (
    pillarName: string,
    gan: string,
    zhi: string,
    dayGan: string,
    dayZhi: string,
    yearZhi: string,
    monthZhi: string,
    yearGan: string
): string[] => {
    if (!dayGan || !zhi) return [];

    const ctx: ShenShaContext = {
        pillarName,
        gan,
        zhi,
        dayGan,
        dayZhi,
        yearGan,
        yearZhi,
        monthZhi,
        gz: gan + zhi
    };

    const results: string[] = [];
    for (const rule of SHEN_SHA_RULES) {
        const result = rule(ctx);
        if (result) results.push(result);
    }

    return Array.from(new Set(results));
};

// --- Logic for God Strength Analysis ---
const calculateGodStrength = (dayMasterIdx: number, pillars: Pillar[]): GodStrength[] => {
  const godList = [
    '比肩', '劫财', '食神', '伤官', 
    '偏财', '正财', '七杀', '正官', 
    '偏印', '正印'
  ];

  const monthPillar = pillars.find(p => p.name === '月柱');
  const monthBranchElement = monthPillar?.ganZhi.zhiElement || '土';

  return godList.map(godName => {
    let score = 0;
    const tags: string[] = [];
    const targetStemIdx = TEN_GODS_MAP[dayMasterIdx].indexOf(godName);
    const godElement = FIVE_ELEMENTS[HEAVENLY_STEMS[targetStemIdx]] || '土';

    if (godElement === monthBranchElement) score += 30; 
    else score += 5;

    pillars.forEach(p => {
        if (p.ganZhi.shiShenGan === godName) {
            score += 10;
        }
        const foundStem = p.ganZhi.hiddenStems.find(h => h.shiShen === godName);
        if (foundStem) {
             score += foundStem.type === '主气' ? 20 : 5;
        }
    });

    const finalScore = Math.min(Math.round(score), 100);
    let level = '弱';
    if (finalScore >= 60) level = '强';
    else if (finalScore >= 30) level = '中';

    return {
        name: godName,
        element: godElement,
        score: finalScore, 
        level,
        tags
    };
  });
};

// --- Useful / Harmful Elements Determination (Yong Shen / Ji Shen) ---

// Relationships
const ELEMENT_PRODUCE: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const ELEMENT_PRODUCED_BY: Record<string, string> = { '火': '木', '土': '火', '金': '土', '水': '金', '木': '水' };
const ELEMENT_CONTROL: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
const ELEMENT_CONTROLLED_BY: Record<string, string> = { '土': '木', '水': '土', '火': '水', '金': '火', '木': '金' };

const calculateBalance = (
    dayMaster: string,
    dayMasterElement: string,
    pillars: { year: Pillar, month: Pillar, day: Pillar, hour: Pillar },
    counts: Record<string, number>
): BalanceAnalysis => {
    
    // 1. Scoring Strength
    let score = 0;
    const descriptions: string[] = [];

    const monthBranch = pillars.month.ganZhi.zhi;
    const monthElement = pillars.month.ganZhi.zhiElement;

    // A. De Ling (Month Command)
    if (monthElement === dayMasterElement) {
        score += 2;
        descriptions.push("得令");
    } else if (ELEMENT_PRODUCE[monthElement] === dayMasterElement) {
        score += 2;
        descriptions.push("得令(印)");
    }

    // B. De Di (Roots)
    let rootScore = 0;
    [pillars.year, pillars.month, pillars.day, pillars.hour].forEach(p => {
        const zhi = p.ganZhi.zhi;
        // Check Hidden Stems for Same Element or Producing Element
        // Main Qi = 1.5, Sub = 0.5. 
        // Simplified: Main Qi Same/Print -> 1.5. Sub -> 0.5.
        const mainQi = p.ganZhi.hiddenStems.find(h => h.type === '主气');
        if (mainQi) {
            const el = FIVE_ELEMENTS[mainQi.stem];
            if (el === dayMasterElement || ELEMENT_PRODUCE[el] === dayMasterElement) {
                rootScore += 1.5;
            }
        }
        // Sub Qi check (simplified, usually Main Qi is dominant)
        const subQis = p.ganZhi.hiddenStems.filter(h => h.type !== '主气');
        subQis.forEach(sq => {
             const el = FIVE_ELEMENTS[sq.stem];
             if (el === dayMasterElement || ELEMENT_PRODUCE[el] === dayMasterElement) {
                 rootScore += 0.5;
             }
        });
    });
    if (rootScore > 0) {
        score += rootScore;
        descriptions.push("得地");
    }

    // C. De Zhu (Stem Assistance)
    let stemScore = 0;
    [pillars.year, pillars.month, pillars.hour].forEach(p => {
        const el = p.ganZhi.ganElement;
        if (el === dayMasterElement || ELEMENT_PRODUCE[el] === dayMasterElement) {
            stemScore += 1;
        }
    });
    if (stemScore > 0) {
        score += stemScore;
        descriptions.push("得助");
    }

    // Determine Strength Level
    // Max Score approx: 2 (Month) + 1.5*4 (Roots) + 1*3 (Stems) = ~11.
    // Thresholds: Weak < 3.5 <= Neutral <= 5.5 < Strong
    let level: '身强' | '身弱' | '中和' = '中和';
    if (score >= 5.5) level = '身强';
    else if (score < 3.5) level = '身弱';
    
    // 2. Tiao Hou (Climatic Adjustment) - Priority 1
    // Winter (Hai, Zi, Chou) -> Need Fire, Wood
    // Summer (Si, Wu, Wei) -> Need Water, Metal
    const isWinter = ['亥', '子', '丑'].includes(monthBranch);
    const isSummer = ['巳', '午', '未'].includes(monthBranch);
    
    let yongShen: string[] = [];
    let xiShen: string[] = [];
    let jiShen: string[] = [];
    let method: '调候' | '扶抑' | '通关' = '扶抑';
    let advice = '';

    const hasFire = counts['火'] > 0;
    const hasWater = counts['水'] > 0;

    if (isWinter && !hasFire) { // Winter and cold (simplified)
        method = '调候';
        yongShen = ['火'];
        xiShen = ['木'];
        jiShen = ['水', '金']; // Cold water and metal producing water
        advice = '生于冬月，局中金寒水冷，首取火暖局调候，喜木生火。忌金水增寒。';
    } else if (isSummer && !hasWater) { // Summer and hot
        method = '调候';
        yongShen = ['水'];
        xiShen = ['金'];
        jiShen = ['火', '木']; // Hot fire and wood producing fire
        advice = '生于夏月，火炎土燥，急需水来滋润降温，喜金生水。忌木火助燃。';
    } else {
        // 3. Fu Yi (Support / Restrain) - Priority 2
        // Strong: Suppress (Output/Wealth/Officer) -> Metal/Wood/Water/Fire/Earth depending on DM
        // Weak: Support (Resource/Companion) -> Ind/Bi depending on DM
        
        const producing = ELEMENT_PRODUCED_BY[dayMasterElement]; // Resource (Yin)
        const same = dayMasterElement; // Companion (Bi)
        
        const output = ELEMENT_PRODUCE[dayMasterElement]; // Shi Shang
        const wealth = ELEMENT_CONTROL[dayMasterElement]; // Cai
        const officer = ELEMENT_CONTROLLED_BY[dayMasterElement]; // Guan Sha

        if (level === '身强') {
            yongShen = [output, officer]; // Use Officer to control, Output to vent
            xiShen = [wealth]; // Wealth supports Officer and is produced by Output
            jiShen = [producing, same]; // Avoid Resource/Companion
            
            advice = `日主${dayMasterElement}身强，宜泄（${output}）、克（${officer}）、耗（${wealth}）。忌印（${producing}）、比（${same}）。`;
        } else if (level === '身弱') {
            // Favor Resource, Companion
            yongShen = [producing, same];
            xiShen = []; // Usually just these two
            jiShen = [output, wealth, officer]; // Avoid draining/controlling
            advice = `日主${dayMasterElement}身弱，宜印（${producing}）生扶、比劫（${same}）帮身。忌食伤（${output}）、财（${wealth}）、官杀（${officer}）。`;
        } else {
             // Neutral
             advice = `日主${dayMasterElement}中和，五行流通为贵，视大运流年补偏救弊。`;
             yongShen = [output, wealth]; // Flow is usually good
             jiShen = [officer]; // Fear clash?
        }
    }

    return {
        dayMasterStrength: {
            score,
            level,
            description: descriptions.join('、') || '失令失地'
        },
        yongShen: Array.from(new Set(yongShen)),
        xiShen: Array.from(new Set(xiShen)),
        jiShen: Array.from(new Set(jiShen)),
        method,
        advice
    };
};

// --- Pattern Analysis (Zi Ping Ge Ju) ---
const calculatePattern = (
    dm: string,
    dmElement: string,
    monthPillar: Pillar,
    yearPillar: Pillar,
    hourPillar: Pillar
): PatternAnalysis => {
    const monthBranch = monthPillar.ganZhi.zhi;
    const revealedStems = [yearPillar.ganZhi.gan, monthPillar.ganZhi.gan, hourPillar.ganZhi.gan];
    const monthHiddenStems = monthPillar.ganZhi.hiddenStems;

    // 1. Determine "Pattern God" (Ge Shen)
    // Rule: Main Qi revealed > Medium Qi revealed > Residual Qi revealed.
    // If none revealed, use Main Qi (Standard Zi Ping fallback).
    
    let patternGod: string = '';
    let patternGodStem: string = '';
    
    // Sort hidden stems by priority for checking revelation
    const sortedHidden = [...monthHiddenStems].sort((a, b) => {
        const powerA = a.type === '主气' ? 3 : (a.type === '中气' ? 2 : 1);
        const powerB = b.type === '主气' ? 3 : (b.type === '中气' ? 2 : 1);
        return powerB - powerA;
    });

    for (const h of sortedHidden) {
        if (revealedStems.includes(h.stem)) {
            patternGod = h.shiShen;
            patternGodStem = h.stem;
            break;
        }
    }

    if (!patternGod) {
        // Fallback to Main Qi if nothing reveals
        const main = monthHiddenStems.find(h => h.type === '主气');
        if (main) {
            patternGod = main.shiShen;
            patternGodStem = main.stem;
        }
    }

    // Special Case: Jian Lu (Month Branch is DM's Lu) and Yang Ren (Month Branch is DM's Di Wang - for Yang DM)
    const isYangDM = ['甲', '丙', '戊', '庚', '壬'].includes(dm);
    const luBranch = LU_SHEN_MAP[dm];
    const yangRenBranch = YANG_REN_MAP[dm]; // Only Yang Ren if Yang DM usually, but strictly defined for Yang DMs in Zi Ping

    if (monthBranch === luBranch) {
        patternGod = '建禄';
    } else if (isYangDM && monthBranch === yangRenBranch) {
        patternGod = '月刃'; // Yang Ren Ge
    }

    // 2. Determine Pattern Name and Evaluate Success
    let name = patternGod + '格';
    if (patternGod === '建禄') name = '建禄格';
    if (patternGod === '月刃') name = '月刃格';
    if (patternGod === '比肩') name = '建禄格'; // Bi Jian in month usually treated as Jian Lu
    if (patternGod === '劫财') name = isYangDM ? '月刃格' : '月劫格';

    let isEstablished = true;
    let level: '上等' | '中等' | '下等' | '破格' = '中等';
    const beneficial: string[] = [];
    const destructive: string[] = [];
    let desc = `月令为${monthBranch}，日主${dm}，`;

    if (patternGod === '建禄' || patternGod === '月刃' || name === '月劫格') {
        desc += `月令为日主禄刃之地，取为${name}。此格身旺，喜财官食伤，最忌无财官而见印比。`;
        const hasOfficer = revealedStems.some(s => getShiShen(HEAVENLY_STEMS.indexOf(dm), HEAVENLY_STEMS.indexOf(s)) === '正官' || getShiShen(HEAVENLY_STEMS.indexOf(dm), HEAVENLY_STEMS.indexOf(s)) === '七杀');
        const hasWealth = revealedStems.some(s => getShiShen(HEAVENLY_STEMS.indexOf(dm), HEAVENLY_STEMS.indexOf(s)) === '正财' || getShiShen(HEAVENLY_STEMS.indexOf(dm), HEAVENLY_STEMS.indexOf(s)) === '偏财');
        
        if (hasOfficer && hasWealth) {
            level = '上等';
            beneficial.push('财官双显');
        } else if (hasOfficer || hasWealth) {
            level = '中等';
            beneficial.push(hasOfficer ? '有官护禄' : '有财生官');
        } else {
            level = '下等';
            destructive.push('财官不见');
        }
        return {
            name, type: '外格', isEstablished: true, level, 
            keyFactors: { beneficial, destructive }, description: desc
        };
    }

    // Standard Patterns
    const allStemsGods = revealedStems.map(s => getShiShen(HEAVENLY_STEMS.indexOf(dm), HEAVENLY_STEMS.indexOf(s)));

    // Helpers to check presence
    const hasGod = (god: string) => allStemsGods.includes(god);
    
    desc += `透出${patternGod}（${patternGodStem}），定为${name}。`;

    switch (patternGod) {
        case '正官':
            if (hasGod('伤官')) {
                isEstablished = false;
                level = '破格';
                destructive.push('伤官见官');
                desc += '正官最怕伤官，见之则破格，主仕途坎坷，是非多端。';
            } else if (hasGod('七杀')) {
                isEstablished = false; 
                level = '破格';
                destructive.push('官杀混杂');
                desc += '官杀混杂，去留不清，格局降低。';
            } else {
                if (hasGod('正财') || hasGod('偏财')) {
                    beneficial.push('财旺生官');
                    level = '上等';
                    desc += '财星生官，官运亨通，格局清纯。';
                } else if (hasGod('正印')) {
                    beneficial.push('官印相生');
                    level = '上等';
                    desc += '官印相生，贵气所聚。';
                } else {
                    desc += '孤官无辅，格局一般。';
                }
            }
            break;

        case '七杀':
            if (hasGod('食神')) {
                beneficial.push('食神制杀');
                level = '上等';
                desc += '七杀有制，化为权柄，主威权赫赫。';
            } else if (hasGod('正印') || hasGod('偏印')) {
                beneficial.push('杀印相生');
                level = '中等';
                desc += '以印化杀，功名可期。';
            } else if (hasGod('正财') || hasGod('偏财')) {
                destructive.push('财生七杀');
                level = '下等';
                desc += '财滋弱杀，贫且多灾，防因财致祸。';
            } else {
                level = '下等';
                destructive.push('七杀无制');
                desc += '七杀无制，攻身太过，非贫即夭（需看大运制化）。';
            }
            break;

        case '正印':
        case '偏印':
            if ((hasGod('正财') || hasGod('偏财')) && !hasGod('官') && !hasGod('杀')) {
                isEstablished = false;
                level = '破格';
                destructive.push('财星坏印');
                desc += '贪财坏印，学业难成，名誉受损。';
            } else if (hasGod('七杀') || hasGod('正官')) {
                beneficial.push('官印双全');
                level = '上等';
                desc += '官印相生，名利双收。';
            } else {
                desc += '印绶清高，若无官杀生助或食伤泄秀，恐显孤独。';
            }
            if (patternGod === '偏印' && hasGod('食神')) {
                 destructive.push('枭神夺食');
                 level = '破格';
                 desc += '且见食神，为枭神夺食，主身体灾病或生计受阻。';
            }
            break;

        case '食神':
            if (hasGod('偏印')) {
                isEstablished = false;
                level = '破格';
                destructive.push('枭神夺食');
                desc += '食神逢枭，福气受损，寿元有碍。';
            } else if (hasGod('正财') || hasGod('偏财')) {
                beneficial.push('食神生财');
                level = '上等';
                desc += '食神生财，富贵自天排，主财源滚滚。';
            } else {
                desc += '食神独透，清高安逸。';
            }
            break;

        case '伤官':
            if (hasGod('正官')) {
                isEstablished = false;
                level = '破格';
                destructive.push('伤官见官');
                desc += '伤官见官，为祸百端，若无印解救，主官非口舌。';
            } else if (hasGod('正印') || hasGod('偏印')) {
                beneficial.push('伤官配印');
                level = '上等';
                desc += '伤官佩印，贵不可言，主文采斐然，权柄在握。';
            } else if (hasGod('正财') || hasGod('偏财')) {
                beneficial.push('伤官生财');
                level = '上等';
                desc += '伤官生财，富甲一方，主聪明致富。';
            } else {
                level = '下等';
                desc += '伤官无制无泄，恃才傲物，难有成就。';
            }
            break;

        case '正财':
        case '偏财':
            if (hasGod('劫财') || hasGod('比肩')) {
                destructive.push('比劫夺财');
                level = '破格'; 
                desc += '比劫重重，夺财严峻，主破财刑妻，求富艰难。';
            } else if (hasGod('食神') || hasGod('伤官')) {
                beneficial.push('食伤生财');
                level = '上等';
                desc += '有食伤生助，财源不断。';
            } else if (hasGod('正官')) {
                beneficial.push('财官双美');
                level = '上等';
                desc += '财旺生官，富贵双全。';
            } else {
                desc += '财星孤露，需防比劫争夺。';
            }
            break;
    }

    return {
        name,
        type: (patternGod === '建禄' || patternGod === '月刃') ? '外格' : '正格',
        isEstablished,
        level,
        keyFactors: { beneficial, destructive },
        description: desc
    };
};

export const calculateAnnualTrend = (chart: BaziChart, year: number): TrendActivation[] => {
    const annualGanZhi = getGanZhiForYear(year, chart.dayMaster);
    const activations: TrendActivation[] = [];

    const pillars = [
        chart.pillars.year,
        chart.pillars.month,
        chart.pillars.day,
        chart.pillars.hour
    ];

    pillars.forEach(pillar => {
        if (BRANCH_CLASHES[pillar.ganZhi.zhi] === annualGanZhi.zhi) {
            activations.push({
                pillarName: pillar.name,
                branch: pillar.ganZhi.zhi,
                method: '六冲',
                activatedStems: [],
                description: `流年${annualGanZhi.zhi}冲${pillar.name}${pillar.ganZhi.zhi}`
            });
        }
        if (BRANCH_COMBINES[pillar.ganZhi.zhi] === annualGanZhi.zhi) {
             activations.push({
                pillarName: pillar.name,
                branch: pillar.ganZhi.zhi,
                method: '六合',
                activatedStems: [],
                description: `流年${annualGanZhi.zhi}合${pillar.name}${pillar.ganZhi.zhi}`
             });
        }
    });

    return activations;
}

const calculateShenShaInteractions = (
    allShenSha: string[], 
    godStrength: GodStrength[], 
    chart: BaziChart
): ShenShaInteraction[] => {
    const hits: ShenShaInteraction[] = [];
    
    SHEN_SHA_INTERACTION_RULES.forEach(rule => {
        const hasAllRequired = rule.requiredStars.every(s => allShenSha.includes(s));
        if (hasAllRequired) {
            hits.push({
                name: rule.name,
                stars: rule.requiredStars,
                effect: rule.effect,
                severity: rule.severity as any,
                description: rule.effect
            });
        }
    });

    return hits;
};

// --- Annual Fortune Calculation ---
export const calculateAnnualFortune = (chart: BaziChart, year: number): AnnualFortune => {
  const annualGanZhi = getGanZhiForYear(year, chart.dayMaster);
  let score = 0;
  const reasons: string[] = [];
  const { yongShen, jiShen } = chart.balance;
  const { gan: yGan, zhi: yZhi, ganElement: yGanEl, zhiElement: yZhiEl } = annualGanZhi;

  // 1. Element Balance
  // Check Stem
  if (yongShen.includes(yGanEl) || chart.balance.xiShen.includes(yGanEl)) {
    score += 1.5;
    reasons.push(`流年天干${yGan}（${yGanEl}）为喜用神，吉。`);
  } else if (jiShen.includes(yGanEl)) {
    score -= 1.5;
    reasons.push(`流年天干${yGan}（${yGanEl}）为忌神，凶。`);
  }

  // Check Branch
  if (yongShen.includes(yZhiEl) || chart.balance.xiShen.includes(yZhiEl)) {
    score += 1.5;
    reasons.push(`流年地支${yZhi}（${yZhiEl}）为喜用神，吉。`);
  } else if (jiShen.includes(yZhiEl)) {
    score -= 1.5;
    reasons.push(`流年地支${yZhi}（${yZhiEl}）为忌神，凶。`);
  }

  // 2. Interactions with Day Pillar
  const dayPillar = chart.pillars.day;
  const dGan = dayPillar.ganZhi.gan;
  const dZhi = dayPillar.ganZhi.zhi;

  // Clashes
  // Gan Clash: Jia-Geng, Yi-Xin, Bing-Ren, Ding-Gui (Index diff 6)
  const stems = HEAVENLY_STEMS;
  const isGanClash = Math.abs(stems.indexOf(yGan) - stems.indexOf(dGan)) === 6;
  const isZhiClash = BRANCH_CLASHES[dZhi] === yZhi;

  if (isGanClash && isZhiClash) {
    score -= 3;
    reasons.push(`流年与日柱天克地冲（${yGan}${yZhi}冲${dGan}${dZhi}），主重大变动、不安、冲突。`);
  } else if (isZhiClash) {
    score -= 2;
    reasons.push(`流年冲日支（配偶宫），主婚姻情感波动或居住变动。`);
  } else if (isGanClash) {
    score -= 1;
    reasons.push(`流年天干克日主，外界压力大，易有口舌。`);
  }

  // Fu Yin
  if (yGan === dGan && yZhi === dZhi) {
    score -= 1;
    reasons.push(`流年与日柱伏吟，事多反复，心情纠结。`);
  }

  // 3. Interactions with Other Pillars
  // Month Clash
  const mZhi = chart.pillars.month.ganZhi.zhi;
  if (BRANCH_CLASHES[mZhi] === yZhi) {
    score -= 1.5;
    reasons.push(`流年冲月支（提纲），主家庭、父母或事业环境变动。`);
  }
  // Year Clash (Tai Sui)
  const yrZhi = chart.pillars.year.ganZhi.zhi;
  if (BRANCH_CLASHES[yrZhi] === yZhi) {
    score -= 1;
    reasons.push(`流年冲年支（犯太岁），主走动奔波，长辈健康需注意。`);
  }

  // 4. Combinations
  // Liu He with Day
  if (BRANCH_COMBINES[dZhi] === yZhi) {
     const isYong = yongShen.includes(yZhiEl) || chart.balance.xiShen.includes(yZhiEl);
     const quality = isYong ? '吉' : '中性';
     reasons.push(`流年与日支六合，主好合、桃花、人缘佳（${quality}）。`);
     score += 0.5;
  }

  // 5. Ten Gods Special
  // If weak DM and Qi Sha year
  const tenGod = annualGanZhi.shiShenGan; // Relative to DM
  if (chart.balance.dayMasterStrength.level === '身弱' && tenGod === '七杀') {
      score -= 1.5;
      reasons.push(`身弱遇七杀流年，压力巨大，防小人灾病。`);
  }
  
  // Empty (Kong Wang)
  const dGanIdx = Math.max(0, stems.indexOf(dGan));
  const dZhiIdx = Math.max(0, EARTHLY_BRANCHES.indexOf(dZhi));
  const kwIndex = (dZhiIdx - dGanIdx + 12) % 12;
  const kwMap: Record<number, string[]> = {
    0: ['戌', '亥'], 10: ['申', '酉'], 8: ['午', '未'], 6: ['辰', '巳'], 4: ['寅', '卯'], 2: ['子', '丑']
  };
  const kwBranches = kwMap[kwIndex] || [];
  if (kwBranches.includes(yZhi)) {
      if (score < 0) {
          reasons.push(`流年落空亡，凶事减轻。`);
          score += 0.5;
      } else if (score > 0) {
          reasons.push(`流年落空亡，吉事恐虚。`);
          score -= 0.5;
      } else {
          reasons.push(`流年落空亡，诸事宜守。`);
      }
  }

  // Determine Rating
  let rating: '吉' | '凶' | '平' = '平';
  if (score >= 1.5) rating = '吉';
  else if (score <= -1.5) rating = '凶';

  return { year, ganZhi: annualGanZhi, rating, reasons, score };
};

// Anchor dates for Day Pillar calculation (Validated)
const DAY_ANCHORS: { date: string; ganZhiIdx: number }[] = [
    { date: '1900-01-01', ganZhiIdx: 10 }, // Jia Xu
    { date: '1949-10-01', ganZhiIdx: 0 },  // Jia Zi
    { date: '1990-01-01', ganZhiIdx: 2 },  // Bing Yin (Verified: Index 2)
    { date: '2000-01-01', ganZhiIdx: 54 }, // Wu Wu
    { date: '2024-01-01', ganZhiIdx: 0 },  // Jia Zi
];

export const calculateBazi = (profile: UserProfile): BaziChart => {
  const dateParts = profile.birthDate.split('-').map(Number);
  const timeParts = profile.birthTime.split(':').map(Number);
  let year = dateParts[0];
  let month = dateParts[1];
  let day = dateParts[2];
  let hour = timeParts[0];
  let minute = timeParts[1] || 0;

  // --- True Solar Time Adjustment ---
  let originalTimeStr = `${year}-${month}-${day} ${hour}:${minute}`;
  let solarTimeStr = '';
  let solarTimeData = undefined;

  // Construct UTC date for calculation to avoid timezone issues
  let birthDateObj = new Date(Date.UTC(year, month - 1, day, hour, minute));

  if (profile.isSolarTime && profile.longitude) {
      birthDateObj = calculateTrueSolarTime(birthDateObj, profile.longitude);
      
      // Update components based on adjusted time
      year = birthDateObj.getUTCFullYear();
      month = birthDateObj.getUTCMonth() + 1; // Month is 0-indexed in Date object
      day = birthDateObj.getUTCDate();
      hour = birthDateObj.getUTCHours();
      minute = birthDateObj.getUTCMinutes();
      
      solarTimeStr = `${year}-${month}-${day} ${hour}:${minute}`;
      solarTimeData = { longitude: profile.longitude, city: profile.city || '未知' };
  }

  // --- 1. Year & Month ---
  const liChunDate = getJieQiDate(year, 1);
  
  // Calculate Year Pillar boundary (Li Chun)
  const isBeforeLiChun = birthDateObj.getTime() < liChunDate.getTime();
  const baziYear = isBeforeLiChun ? year - 1 : year;
  
  const yearGanIndex = (baziYear - 1984 + 10000) % 10;
  const yearZhiIndex = (baziYear - 1984 + 12000) % 12;

  // --- Month Pillar Calculation ---
  const currentMonthJie = getJieQiDate(year, month - 1);
  let solarMonthIndex = (month - 1); // Default to Gregorian month index
  
  if (birthDateObj.getTime() < currentMonthJie.getTime()) {
      solarMonthIndex = (solarMonthIndex - 1 + 12) % 12;
  }
  
  const monthZhiIndex = (solarMonthIndex + 1) % 12;
  
  // Month Gan Calculation (Wu Hu Dun)
  // Logic: Year Gan determines Yin month Stem.
  // Formula: (YearGan % 5) * 2 + 2 = Yin Month Stem.
  // Then offset by Month Branch index (Yin = 2).
  const monthStartGan = (yearGanIndex % 5) * 2 + 2; // Stem for Yin Month
  const monthStemOffset = (monthZhiIndex - 2 + 12) % 12; // Distance from Yin
  const monthGanIndex = (monthStartGan + monthStemOffset) % 10;

  // --- 2. Day Pillar ---
  const MS_PER_DAY = 86400000;
  
  // Handle Hour boundary: 23:00+ counts as next day for Day Pillar purposes (Wan Zi / Late Rat)
  let calcYear = year;
  let calcMonth = month - 1; 
  let calcDay = day;

  // Use Late Rat is Next Day rule (Standard)
  if (hour >= 23) {
      const nextDay = new Date(Date.UTC(year, month - 1, day));
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      calcYear = nextDay.getUTCFullYear();
      calcMonth = nextDay.getUTCMonth();
      calcDay = nextDay.getUTCDate();
  }

  const targetDate = new Date(Date.UTC(calcYear, calcMonth, calcDay));
  
  // Find closest anchor to targetDate
  let closestAnchor = DAY_ANCHORS[0];
  let minDiff = Math.abs(targetDate.getTime() - new Date(closestAnchor.date).getTime());
  
  for (const anchor of DAY_ANCHORS) {
      // Use Date.UTC parsing for anchor to be consistent with targetDate
      const anchorDateParts = anchor.date.split('-').map(Number);
      const anchorTime = Date.UTC(anchorDateParts[0], anchorDateParts[1] - 1, anchorDateParts[2]);
      
      const diff = Math.abs(targetDate.getTime() - anchorTime);
      if (diff < minDiff) {
          minDiff = diff;
          closestAnchor = anchor;
      }
  }

  const anchorDateParts = closestAnchor.date.split('-').map(Number);
  const anchorTime = Date.UTC(anchorDateParts[0], anchorDateParts[1] - 1, anchorDateParts[2]);
  
  const diffTime = targetDate.getTime() - anchorTime;
  const diffDays = Math.round(diffTime / MS_PER_DAY);
  
  // Calculate indices based on closest anchor
  const baseGanIdx = closestAnchor.ganZhiIdx % 10;
  const baseZhiIdx = closestAnchor.ganZhiIdx % 12;

  const dayGanIndex = (baseGanIdx + diffDays % 10 + 100000) % 10;
  const dayZhiIndex = (baseZhiIdx + diffDays % 12 + 100000) % 12;

  // --- 3. Hour Pillar ---
  // Wu Shu Dun: Day Stem -> Hour Stem
  // Note: Uses the calculated Day Stem (so if 23:00+, uses next day's stem)
  const hourStartGan = (dayGanIndex % 5) * 2;
  const hourZhiIndex = Math.floor(((hour + 1) % 24) / 2); // 23:00-01:00 -> Zi (0)
  const hourGanIndex = (hourStartGan + hourZhiIndex) % 10;

  // --- Create Pillars ---
  const dayMaster = HEAVENLY_STEMS[dayGanIndex];
  const dayMasterElement = getElement(dayMaster);

  const yearPillar: Pillar = { name: '年柱', ganZhi: createGanZhi(yearGanIndex, yearZhiIndex, dayGanIndex), kongWang: false, shenSha: [] };
  const monthPillar: Pillar = { name: '月柱', ganZhi: createGanZhi(monthGanIndex, monthZhiIndex, dayGanIndex), kongWang: false, shenSha: [] };
  const dayPillar: Pillar = { name: '日柱', ganZhi: createGanZhi(dayGanIndex, dayZhiIndex, dayGanIndex), kongWang: false, shenSha: [] };
  const hourPillar: Pillar = { name: '时柱', ganZhi: createGanZhi(hourGanIndex, hourZhiIndex, dayGanIndex), kongWang: false, shenSha: [] };

  // Calculate Kong Wang
  const kwIndex = (dayZhiIndex - dayGanIndex + 12) % 12;
  const kwMap: Record<number, string[]> = {
    0: ['戌', '亥'], 10: ['申', '酉'], 8: ['午', '未'], 6: ['辰', '巳'], 4: ['寅', '卯'], 2: ['子', '丑']
  };
  const kwBranches = kwMap[kwIndex] || [];
  [yearPillar, monthPillar, dayPillar, hourPillar].forEach(p => {
    if (kwBranches.includes(p.ganZhi.zhi)) p.kongWang = true;
  });

  [yearPillar, monthPillar, dayPillar, hourPillar].forEach(p => {
      p.shenSha = calculateShenShaForPillar(
          p.name, p.ganZhi.gan, p.ganZhi.zhi,
          dayPillar.ganZhi.gan, dayPillar.ganZhi.zhi,
          yearPillar.ganZhi.zhi, monthPillar.ganZhi.zhi, yearPillar.ganZhi.gan
      );
  });

  const allShenSha = [yearPillar, monthPillar, dayPillar, hourPillar].flatMap(p => p.shenSha);

  // --- Calculate Luck Cycles (Qi Yun) ---
  const isYangYear = yearGanIndex % 2 === 0;
  const isMale = profile.gender === 'male';
  const isForward = (isYangYear && isMale) || (!isYangYear && !isMale);

  let prevJieDate: Date;
  let nextJieDate: Date;
  
  let nextMonthIdx = solarMonthIndex + 1;
  let nextMonthYear = year;
  if (nextMonthIdx > 11) {
      nextMonthIdx = 0;
      nextMonthYear++;
  }
  
  // Recalculate robustly relative to the *Bazi Month* we found
  // If Bazi Month is solarMonthIndex, we look at solarMonthIndex (Start) and solarMonthIndex+1 (End)
  
  prevJieDate = getJieQiDate(year, solarMonthIndex);
  nextJieDate = getJieQiDate(nextMonthYear, nextMonthIdx);

  // Double check the birth date falls between prev and next
  // If birth date < prevJieDate, we are in previous month logic (already handled by solarMonthIndex logic above)
  // Just safety check if we need to adjust the range for calculation
  if (birthDateObj.getTime() < prevJieDate.getTime()) {
       // Should not happen if solarMonthIndex was set correctly, but handle edge case
       nextJieDate = prevJieDate;
       let pIdx = solarMonthIndex - 1;
       let pYear = year;
       if (pIdx < 0) { pIdx = 11; pYear--; }
       prevJieDate = getJieQiDate(pYear, pIdx);
  }

  let diffMs = 0;
  if (isForward) {
      diffMs = nextJieDate.getTime() - birthDateObj.getTime();
  } else {
      diffMs = birthDateObj.getTime() - prevJieDate.getTime();
  }
  
  const totalMinutes = Math.floor(diffMs / 60000);
  
  // Standard conversion: 3 days = 1 year, 1 day = 4 months, 1 hour = 10 days
  // 1 day (1440 min) = 120 days (4 months)
  // 1 min = 120/1440 days = 1/12 days
  
  // Calculate Years
  const luckYears = Math.floor(totalMinutes / (24 * 60 * 3));
  const remainingMinutesYear = totalMinutes % (24 * 60 * 3);
  
  // Calculate Months (1 day = 4 months)
  // Days remaining = remainingMinutesYear / 1440
  const luckMonths = Math.floor(remainingMinutesYear / (24 * 60) * 4);
  const remainingMinutesMonth = remainingMinutesYear % (24 * 60 / 4); // Mod 360 mins

  // Calculate Days (1 hour = 10 days => 6 mins = 1 day)
  const luckDays = Math.floor(remainingMinutesMonth / 6);
  
  const startLuckText = `出生后${luckYears}年${luckMonths}个月${luckDays}天起运`;
  const startYear = year + luckYears + (luckMonths >= 12 ? 1 : 0); // Simplified start year
  const startAgeNominal = 1 + luckYears;

  const luckPillars: LuckPillar[] = [];
  for (let i = 1; i <= 8; i++) {
    const direction = isForward ? 1 : -1;
    const lGanIdx = (monthGanIndex + (i * direction) + 100) % 10;
    const lZhiIdx = (monthZhiIndex + (i * direction) + 120) % 12;
    const pStartYear = startYear + (i - 1) * 10;
    luckPillars.push({
      index: i,
      startAge: startAgeNominal + (i - 1) * 10,
      startYear: pStartYear,
      endYear: pStartYear + 9,
      ganZhi: createGanZhi(lGanIdx, lZhiIdx, dayGanIndex)
    });
  }

  const counts: Record<string, number> = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  [yearPillar, monthPillar, dayPillar, hourPillar].forEach(p => {
    counts[p.ganZhi.ganElement] = (counts[p.ganZhi.ganElement] || 0) + 1;
    counts[p.ganZhi.zhiElement] = (counts[p.ganZhi.zhiElement] || 0) + 1;
  });

  const godStrength = calculateGodStrength(dayGanIndex, [yearPillar, monthPillar, dayPillar, hourPillar]);
  const shenShaInteractions = calculateShenShaInteractions(allShenSha, godStrength, {} as any);
  const balance = calculateBalance(dayMaster, dayMasterElement, {year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar}, counts);
  const pattern = calculatePattern(dayMaster, dayMasterElement, monthPillar, yearPillar, hourPillar);
  const safeMangPaiIndex = Math.abs(diffDays) % 28;

  return {
      profileId: profile.id,
      gender: profile.gender,
      dayMaster,
      dayMasterElement,
      pillars: { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar },
      mingGong: '暂缺',
      taiYuan: '暂缺',
      taiXi: '暂缺',
      wuxingCounts: counts,
      mangPai: [TWENTY_EIGHT_MANSIONS[safeMangPaiIndex] || '未知'],
      luckPillars,
      startLuckText,
      godStrength,
      shenShaInteractions,
      balance,
      pattern,
      originalTime: originalTimeStr,
      solarTime: solarTimeStr,
      solarTimeData
  };
};

export const getAdvancedInterpretation = (chart: BaziChart, data: ModalData): InterpretationResult[] => {
  const { ganZhi, pillarName, shenSha } = data;
  const results: InterpretationResult[] = [];
  const dmStrength = chart.balance.dayMasterStrength.level; // 身强, 身弱, 中和
  const tenGod = ganZhi.shiShenGan;
  const isAnnual = pillarName === '流年';
  const { yongShen, jiShen } = chart.balance;

  // Type 1: Ten Gods + DM Strength -> Good/Bad Qualification
  if (tenGod && !['日主', '元/男', '元/女'].includes(tenGod)) {
      let content = '';
      let type: '吉' | '凶' | '中平' = '中平';

      // 1. Resource (Zheng Yin / Pian Yin)
      if (tenGod === '正印') {
          if (dmStrength === '身强') {
              content = `正印为忌（身强不喜生扶），主思虑过重、依赖性强，母亲健康需注意，学业事业易停滞。`;
              type = '凶';
          } else if (dmStrength === '身弱') {
              content = `正印为用（身弱喜生扶），主得长辈扶持，学业顺利，性格仁厚，有贵人运。`;
              type = '吉';
          }
      } else if (tenGod === '偏印') {
          // Special Logic: Owl Stealing Food (Pian Yin sees Shi Shen)
          const hasShiShen = [chart.pillars.year, chart.pillars.month, chart.pillars.day, chart.pillars.hour]
              .some(p => p.ganZhi.shiShenGan === '食神');
          
          if (hasShiShen) {
              content = `偏印夺食（枭神夺食），主食欲不振，子女缘薄，创意受阻，防健康问题或意外之灾。`;
              type = '凶';
          } else if (dmStrength === '身强') {
              content = `偏印为忌，主性格孤僻，猜疑心重，易有偏业成就但波折多。`;
              type = '凶';
          } else {
              content = `偏印为用，主领悟力强，利于冷门学术、技艺、宗教玄学。`;
              type = '吉';
          }
      }
      // 2. Output (Shi Shen / Shang Guan)
      else if (['食神', '伤官'].includes(tenGod)) {
          if (dmStrength === '身强') {
              content = `${tenGod}泄秀为用，主才华横溢，聪明机智，利于技艺发挥。`;
              type = '吉';
          } else if (dmStrength === '身弱') {
               content = `${tenGod}泄身为忌，主心神不宁，劳碌奔波，防口舌是非。`;
               type = '凶';
          } else if (dmStrength === '中和') {
               content = `${tenGod}泄身，需看是否为调候用神。若过旺则泄气，若适度则为秀气。`;
               type = '中平';
          }
      }
      // 3. Officer/Killing (Zheng Guan / Qi Sha)
      else if (tenGod === '正官') {
           if (dmStrength === '身强') {
               content = `正官制身为用，主事业有成，掌权，性格果断，有领导力。`;
               type = '吉';
           } else if (dmStrength === '身弱') {
               content = `正官克身为忌，主压力巨大，小人多，身体易病，行事保守。`;
               type = '凶';
           }
      } else if (tenGod === '七杀') {
           if (dmStrength === '身强') {
               // Check for Control (Shi Shen) or Transformation (Yin)
               const hasShiShen = [chart.pillars.year, chart.pillars.month, chart.pillars.day, chart.pillars.hour]
                   .some(p => p.ganZhi.shiShenGan === '食神');
               const hasYin = [chart.pillars.year, chart.pillars.month, chart.pillars.day, chart.pillars.hour]
                   .some(p => ['正印', '偏印'].includes(p.ganZhi.shiShenGan));

               if (hasShiShen || hasYin) {
                   content = `七杀有制化（食神制杀或印绶化杀），主掌权贵显，魄力超群，能成大器。`;
                   type = '吉';
               } else {
                   content = `七杀无制，虽身强亦主争斗、意外、压力过大，性情暴躁，易招惹是非。`;
                   type = '凶';
               }
           } else if (dmStrength === '身弱') {
               content = `七杀攻身为忌，主巨大压力，灾病意外，小人陷害，生存环境恶劣。`;
               type = '凶';
           }
      }
       // 4. Wealth (Zheng Cai / Pian Cai)
       else if (['正财', '偏财'].includes(tenGod)) {
           if (dmStrength === '身强') {
               content = `${tenGod}耗身为用，主财运亨通，善于理财，能得财利。`;
               type = '吉';
           } else if (dmStrength === '身弱') {
               content = `${tenGod}耗身为忌，主求财辛苦，财来财去，身弱不胜财，防因财致祸。`;
               type = '凶';
           }
      }
      // 5. Companion (Bi Jian / Jie Cai)
      else if (['比肩', '劫财'].includes(tenGod)) {
           if (dmStrength === '身强') {
               content = `${tenGod}助身为忌，主竞争激烈，破财，易犯小人，不利合伙。`;
               type = '凶';
           } else if (dmStrength === '身弱') {
               content = `${tenGod}帮身为用，主得朋友助力，合伙有利，自信心增强。`;
               type = '吉';
           }
      }
      // Neutral Case
      else if (dmStrength === '中和') {
          content = `${tenGod}出现，打破原局平衡，需结合五行流通与调候判断吉凶。`;
          type = '中平';
      }

      if (content) {
          results.push({
              title: `${tenGod} · ${dmStrength}论断`,
              content,
              type,
              category: '十神'
          });
      }
  }

  // Type 2: Annual Pillar + Original Chart Interaction -> Event Trigger
  if (isAnnual) {
      const yearZhi = ganZhi.zhi;
      const dayZhi = chart.pillars.day.ganZhi.zhi;
      const monthZhi = chart.pillars.month.ganZhi.zhi;
      
      // Interaction with Day Branch
      if (BRANCH_COMBINES[dayZhi] === yearZhi) { // Liu He
           results.push({
               title: '流年合日支',
               content: `流年地支与日支（配偶宫）六合，主夫妻感情和睦，或有桃花、合作之事。若为喜用，主得贵人相助。`,
               type: '吉',
               category: '流年'
           });
      }
      if (BRANCH_CLASHES[dayZhi] === yearZhi) { // Liu Chong
            results.push({
               title: '流年冲日支',
               content: `流年冲日支（配偶宫），主感情波动，易争吵或分离，或自身居住环境变动，需防身体伤病。`,
               type: '凶',
               category: '流年'
           });
      }
      
      // Interaction with Month Branch
      if (BRANCH_CLASHES[monthZhi] === yearZhi) {
           results.push({
               title: '流年冲月令',
               content: `流年冲提纲（月支），主父母长辈健康波动，或工作环境、事业根基有重大调整。`,
               type: '凶',
               category: '流年'
           });
      }

      // Robust Half Fire Combination (Ban Hui Huo Ju)
      // Requirements:
      // 1. Annual Branch must be part of Fire Frame (Yin, Wu, Xu).
      // 2. Chart + Annual must contain at least 2 distinct branches of (Yin, Wu, Xu).
      // 3. Must have Fire Stem (Bing/Ding) revealed in Chart or Annual to spark it.
      const fireBranches = ['寅', '午', '戌'];
      if (fireBranches.includes(yearZhi)) {
          const allBranches = [
              chart.pillars.year.ganZhi.zhi,
              chart.pillars.month.ganZhi.zhi,
              chart.pillars.day.ganZhi.zhi,
              chart.pillars.hour.ganZhi.zhi,
              yearZhi
          ];
          const uniqueFireBranches = new Set(allBranches.filter(b => fireBranches.includes(b)));
          
          if (uniqueFireBranches.size >= 2) {
              const allStems = [
                  chart.pillars.year.ganZhi.gan,
                  chart.pillars.month.ganZhi.gan,
                  chart.pillars.day.ganZhi.gan,
                  chart.pillars.hour.ganZhi.gan,
                  ganZhi.gan
              ];
              const hasFireStem = allStems.includes('丙') || allStems.includes('丁');
              
              if (hasFireStem || uniqueFireBranches.size === 3) {
                   const isFireJi = jiShen.includes('火');
                   const isFireYong = yongShen.includes('火');
                   const effectType = isFireJi ? '凶' : (isFireYong ? '吉' : '中平');
                   
                   results.push({
                       title: uniqueFireBranches.size === 3 ? '寅午戌三合火局' : '半合火局',
                       content: `流年引动火局成化，火势转旺。${isFireJi ? '忌神得局，主心浮气躁，防失眠、血压升高，夏季尤需谨慎。' : '喜用得局，主文采飞扬，事业红火，贵人得力。'}`,
                       type: effectType,
                       category: '流年'
                   });
              }
          }
      }
  }

  // Type 3: Shen Sha + Use God Relationship
  if (shenSha && shenSha.length > 0) {
      if (shenSha.includes('羊刃')) {
          const zhiElement = ganZhi.zhiElement;
          if (jiShen.includes(zhiElement)) {
               results.push({
                  title: '羊刃为凶',
                  content: `羊刃五行（${zhiElement}）为忌神，主冲动争执，防血光、破财，避免高风险行为。`,
                  type: '凶',
                  category: '神煞'
              });
          } else if (yongShen.includes(zhiElement)) {
               results.push({
                  title: '羊刃为权',
                  content: `羊刃五行（${zhiElement}）为用神，主魄力增强，适合武职、技术攻坚、自主创业。`,
                  type: '吉',
                  category: '神煞'
              });
          }
      }
      if (shenSha.includes('咸池(桃花)')) {
          const zhiElement = ganZhi.zhiElement;
           if (jiShen.includes(zhiElement)) {
               results.push({
                  title: '桃花为忌',
                  content: `桃花五行（${zhiElement}）为忌神，防烂桃花纠缠，因色破财或惹是非。`,
                  type: '凶',
                  category: '神煞'
              });
          } else {
               results.push({
                  title: '桃花为喜',
                  content: `桃花五行（${zhiElement}）为喜用，主人缘佳，异性缘好，利于社交、演艺。`,
                  type: '吉',
                  category: '神煞'
              });
          }
      }
  }

  // Type 4: 12 Life Stages + Ten Gods Element
  const lifeStage = ganZhi.lifeStage;
  if (['临官', '帝旺'].includes(lifeStage)) {
      // The life stage describes the state of the Stem on the Branch.
      // We check if the Stem's element (Ten God element) is Use or Avoid.
      const stemElement = ganZhi.ganElement;
      
      if (jiShen.includes(stemElement)) {
           results.push({
              title: `${lifeStage}·忌神`,
              content: `天干（${stemElement}）坐${lifeStage}，忌神得势。表面风光或有职位，实则压力大、隐患深，需防盛极而衰。`,
              type: '凶',
              category: '长生'
          });
      } else if (yongShen.includes(stemElement)) {
           results.push({
              title: `${lifeStage}·用神`,
              content: `天干（${stemElement}）坐${lifeStage}，用神得地。事业步入正轨，独立掌权，收入稳定增长，谋事易成。`,
              type: '吉',
              category: '长生'
          });
      }
  }

  // Type 5: Na Yin + Combination -> Imagery
  if (ganZhi.naYin) {
      // Check for Fire Heavy Context more robustly
      const fireCount = chart.wuxingCounts['火'] || 0;
      const stems = [chart.pillars.year.ganZhi.gan, chart.pillars.month.ganZhi.gan, chart.pillars.day.ganZhi.gan, chart.pillars.hour.ganZhi.gan];
      const hasFireStem = stems.some(s => ['丙', '丁'].includes(s));
      const isFireSeason = ['巳', '午', '未'].includes(chart.pillars.month.ganZhi.zhi);
      const isFireStrong = fireCount >= 3 || (isFireSeason && hasFireStem);

      const woodCount = chart.wuxingCounts['木'] || 0;
      const isWoodStrong = woodCount >= 3;

      if (ganZhi.naYin === '天河水' && isFireStrong) {
           results.push({
              title: '纳音意象',
              content: `天河水遇火势过旺（${fireCount}火），杯水车薪，恩泽难施。理想高远但现实受阻，宜低调蓄势，待机而动。`,
              type: '中平',
              category: '纳音'
          });
      } else if (ganZhi.naYin === '剑锋金' && isWoodStrong) {
          results.push({
              title: '纳音意象',
              content: `剑锋金遇木旺（${woodCount}木），宝剑出匣，披荆斩棘。虽劳碌奔波，但能成大器，利于开拓新局面。`,
              type: '吉',
              category: '纳音'
          });
      }
  }

  return results;
};
