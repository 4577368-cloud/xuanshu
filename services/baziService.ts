
import { BaziChart, GanZhi, LuckPillar, Pillar, UserProfile, HiddenStem, GodStrength, TrendActivation, ShenShaInteraction, BalanceAnalysis, AnnualFortune, PatternAnalysis, InterpretationResult, ModalData, XiaoYun } from '../types';
import { Solar } from 'lunar-javascript';
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

// --- Time Correction Logic (True Solar Time) ---
const calculateTrueSolarTime = (date: Date, longitude: number): Date => {
    const standardMeridian = 120; // China Standard Time
    const longitudeOffsetMinutes = (longitude - standardMeridian) * 4;
    
    // Day of Year calculation for Equation of Time
    const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
    const diff = date.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay) + 1; // +1 is important
    
    // Equation of Time approximation (minutes)
    const b = 2 * Math.PI * (dayOfYear - 81) / 365;
    const eotMinutes = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
    
    const totalCorrectionMinutes = longitudeOffsetMinutes + eotMinutes;
    return new Date(date.getTime() + totalCorrectionMinutes * 60000);
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

const createGanZhi = (gan: string, zhi: string, dayMasterGanIndex: number): GanZhi => {
  const ganIndex = getStemIndex(gan);
  const zhiIndex = EARTHLY_BRANCHES.indexOf(zhi);
  
  const combination = gan + zhi;
  const shiShenGan = getShiShen(dayMasterGanIndex, ganIndex);

  const hiddenData = HIDDEN_STEMS_DATA[zhi] || [];
  const hiddenStems: HiddenStem[] = hiddenData.map(item => ({
    stem: item[0], 
    type: item[1],
    powerPercentage: item[2],
    shiShen: getShiShen(dayMasterGanIndex, getStemIndex(item[0]))
  }));

  const lifeStage = getLifeStage(dayMasterGanIndex, zhiIndex);
  const selfLifeStage = getLifeStage(ganIndex, zhiIndex);

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
  const offset = (year - 1984) % 60;
  const idx = (offset + 60) % 60; 
  
  const ganIndex = idx % 10;
  const zhiIndex = idx % 12;
  const dayMasterIndex = Math.max(0, HEAVENLY_STEMS.indexOf(dayMaster));
  
  const gan = HEAVENLY_STEMS[ganIndex];
  const zhi = EARTHLY_BRANCHES[zhiIndex];
  
  return createGanZhi(gan, zhi, dayMasterIndex);
};

// --- Comprehensive Shen Sha Logic ---
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

const calculateBalance = (
    dayMaster: string,
    dayMasterElement: string,
    pillars: { year: Pillar, month: Pillar, day: Pillar, hour: Pillar },
    counts: Record<string, number>
): BalanceAnalysis => {
    let score = 0;
    const descriptions: string[] = [];
    const monthBranch = pillars.month.ganZhi.zhi;
    const monthElement = pillars.month.ganZhi.zhiElement;
    
    const ELEMENT_PRODUCE: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
    const ELEMENT_PRODUCED_BY: Record<string, string> = { '火': '木', '土': '火', '金': '土', '水': '金', '木': '水' };
    const ELEMENT_CONTROL: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
    const ELEMENT_CONTROLLED_BY: Record<string, string> = { '土': '木', '水': '土', '火': '水', '金': '火', '木': '金' };

    if (monthElement === dayMasterElement) { score += 2; descriptions.push("得令"); } 
    else if (ELEMENT_PRODUCE[monthElement] === dayMasterElement) { score += 2; descriptions.push("得令(印)"); }

    let rootScore = 0;
    [pillars.year, pillars.month, pillars.day, pillars.hour].forEach(p => {
        const mainQi = p.ganZhi.hiddenStems.find(h => h.type === '主气');
        if (mainQi) {
            const el = FIVE_ELEMENTS[mainQi.stem];
            if (el === dayMasterElement || ELEMENT_PRODUCE[el] === dayMasterElement) rootScore += 1.5;
        }
        const subQis = p.ganZhi.hiddenStems.filter(h => h.type !== '主气');
        subQis.forEach(sq => {
             const el = FIVE_ELEMENTS[sq.stem];
             if (el === dayMasterElement || ELEMENT_PRODUCE[el] === dayMasterElement) rootScore += 0.5;
        });
    });
    if (rootScore > 0) { score += rootScore; descriptions.push("得地"); }

    let stemScore = 0;
    [pillars.year, pillars.month, pillars.hour].forEach(p => {
        const el = p.ganZhi.ganElement;
        if (el === dayMasterElement || ELEMENT_PRODUCE[el] === dayMasterElement) stemScore += 1;
    });
    if (stemScore > 0) { score += stemScore; descriptions.push("得助"); }

    let level: '身强' | '身弱' | '中和' = '中和';
    if (score >= 5.5) level = '身强';
    else if (score < 3.5) level = '身弱';
    
    const isWinter = ['亥', '子', '丑'].includes(monthBranch);
    const isSummer = ['巳', '午', '未'].includes(monthBranch);
    let yongShen: string[] = [];
    let xiShen: string[] = [];
    let jiShen: string[] = [];
    let method: '调候' | '扶抑' | '通关' = '扶抑';
    let advice = '';
    const hasFire = counts['火'] > 0;
    const hasWater = counts['水'] > 0;

    if (isWinter && !hasFire) {
        method = '调候'; yongShen = ['火']; xiShen = ['木']; jiShen = ['水', '金'];
        advice = '生于冬月，局中金寒水冷，首取火暖局调候，喜木生火。忌金水增寒。';
    } else if (isSummer && !hasWater) {
        method = '调候'; yongShen = ['水']; xiShen = ['金']; jiShen = ['火', '木'];
        advice = '生于夏月，火炎土燥，急需水来滋润降温，喜金生水。忌木火助燃。';
    } else {
        const producing = ELEMENT_PRODUCED_BY[dayMasterElement]; 
        const same = dayMasterElement;
        const output = ELEMENT_PRODUCE[dayMasterElement];
        const wealth = ELEMENT_CONTROL[dayMasterElement];
        const officer = ELEMENT_CONTROLLED_BY[dayMasterElement];

        if (level === '身强') {
            yongShen = [output, officer]; xiShen = [wealth]; jiShen = [producing, same];
            advice = `日主${dayMasterElement}身强，宜泄（${output}）、克（${officer}）、耗（${wealth}）。忌印（${producing}）、比（${same}）。`;
        } else if (level === '身弱') {
            yongShen = [producing, same]; xiShen = []; jiShen = [output, wealth, officer];
            advice = `日主${dayMasterElement}身弱，宜印（${producing}）生扶、比劫（${same}）帮身。忌食伤（${output}）、财（${wealth}）、官杀（${officer}）。`;
        } else {
             advice = `日主${dayMasterElement}中和，五行流通为贵，视大运流年补偏救弊。`;
             yongShen = [output, wealth]; jiShen = [officer];
        }
    }

    return {
        dayMasterStrength: { score, level, description: descriptions.join('、') || '失令失地' },
        yongShen: Array.from(new Set(yongShen)),
        xiShen: Array.from(new Set(xiShen)),
        jiShen: Array.from(new Set(jiShen)),
        method,
        advice
    };
};

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
    
    let patternGod: string = '';
    let patternGodStem: string = '';
    
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
        const main = monthHiddenStems.find(h => h.type === '主气');
        if (main) { patternGod = main.shiShen; patternGodStem = main.stem; }
    }

    const isYangDM = ['甲', '丙', '戊', '庚', '壬'].includes(dm);
    const luBranch = LU_SHEN_MAP[dm];
    const yangRenBranch = YANG_REN_MAP[dm]; 

    if (monthBranch === luBranch) patternGod = '建禄';
    else if (isYangDM && monthBranch === yangRenBranch) patternGod = '月刃';

    let name = patternGod + '格';
    if (patternGod === '建禄') name = '建禄格';
    if (patternGod === '月刃') name = '月刃格';
    if (patternGod === '比肩') name = '建禄格'; 
    if (patternGod === '劫财') name = isYangDM ? '月刃格' : '月劫格';

    let isEstablished = true;
    let level: '上等' | '中等' | '下等' | '破格' = '中等';
    const beneficial: string[] = [];
    const destructive: string[] = [];
    let desc = `月令为${monthBranch}，日主${dm}，`;

    if (patternGod === '建禄' || patternGod === '月刃') {
        desc += `月令为禄刃，喜财官。`;
        level = '中等';
    } else {
        desc += `透出${patternGod}，定为${name}。`;
    }

    if (patternGod === '正官') {
        if (revealedStems.some(s => getShiShen(getStemIndex(dm), getStemIndex(s)) === '伤官')) {
            isEstablished = false; level = '破格'; destructive.push('伤官见官'); desc += '见伤官，格局受损。';
        } else {
            level = '上等'; beneficial.push('官星清纯');
        }
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
    const pillars = [chart.pillars.year, chart.pillars.month, chart.pillars.day, chart.pillars.hour];
    pillars.forEach(pillar => {
        if (BRANCH_CLASHES[pillar.ganZhi.zhi] === annualGanZhi.zhi) {
            activations.push({ pillarName: pillar.name, branch: pillar.ganZhi.zhi, method: '六冲', activatedStems: [], description: `流年冲${pillar.name}` });
        }
        if (BRANCH_COMBINES[pillar.ganZhi.zhi] === annualGanZhi.zhi) {
             activations.push({ pillarName: pillar.name, branch: pillar.ganZhi.zhi, method: '六合', activatedStems: [], description: `流年合${pillar.name}` });
        }
    });
    return activations;
}

const calculateShenShaInteractions = (allShenSha: string[], godStrength: GodStrength[], chart: BaziChart): ShenShaInteraction[] => {
    const hits: ShenShaInteraction[] = [];
    SHEN_SHA_INTERACTION_RULES.forEach(rule => {
        if (rule.requiredStars.every(s => allShenSha.includes(s))) {
            hits.push({ name: rule.name, stars: rule.requiredStars, effect: rule.effect, severity: rule.severity as any, description: rule.effect });
        }
    });
    return hits;
};

export const calculateAnnualFortune = (chart: BaziChart, year: number): AnnualFortune => {
  const annualGanZhi = getGanZhiForYear(year, chart.dayMaster);
  let score = 0;
  const reasons: string[] = [];
  const { yongShen, jiShen } = chart.balance;
  const { gan: yGan, zhi: yZhi, ganElement: yGanEl, zhiElement: yZhiEl } = annualGanZhi;

  if (yongShen.includes(yGanEl) || chart.balance.xiShen.includes(yGanEl)) { score += 1.5; reasons.push(`流年天干${yGan}为喜用。`); }
  else if (jiShen.includes(yGanEl)) { score -= 1.5; reasons.push(`流年天干${yGan}为忌。`); }
  if (yongShen.includes(yZhiEl) || chart.balance.xiShen.includes(yZhiEl)) { score += 1.5; reasons.push(`流年地支${yZhi}为喜用。`); }
  else if (jiShen.includes(yZhiEl)) { score -= 1.5; reasons.push(`流年地支${yZhi}为忌。`); }

  const dayPillar = chart.pillars.day;
  if (BRANCH_CLASHES[dayPillar.ganZhi.zhi] === yZhi) { score -= 2; reasons.push(`流年冲日支。`); }
  if (BRANCH_COMBINES[dayPillar.ganZhi.zhi] === yZhi) { score += 0.5; reasons.push(`流年合日支。`); }

  let rating: '吉' | '凶' | '平' = '平';
  if (score >= 1.5) rating = '吉';
  else if (score <= -1.5) rating = '凶';

  return { year, ganZhi: annualGanZhi, rating, reasons, score };
};

// Calculate Xiao Yun (Small Luck)
const calculateXiaoYun = (
    birthYear: number, 
    startLuckAge: number, 
    hourPillar: Pillar, 
    gender: 'male' | 'female',
    yearGan: string,
    dayMasterIdx: number
): XiaoYun[] => {
    const xiaoYuns: XiaoYun[] = [];
    const isYangYear = ['甲', '丙', '戊', '庚', '壬'].includes(yearGan);
    
    // Direction: Yang Male/Yin Female = Forward (+1), Yin Male/Yang Female = Backward (-1)
    let direction = 1;
    if (gender === 'male' && !isYangYear) direction = -1;
    if (gender === 'female' && isYangYear) direction = -1;

    let currentGanIdx = HEAVENLY_STEMS.indexOf(hourPillar.ganZhi.gan);
    let currentZhiIdx = EARTHLY_BRANCHES.indexOf(hourPillar.ganZhi.zhi);

    for (let age = 1; age < startLuckAge; age++) { // Only calculate for ages BEFORE DaYun starts
        // Calculate next pillar based on direction
        currentGanIdx = (currentGanIdx + direction + 10) % 10;
        currentZhiIdx = (currentZhiIdx + direction + 12) % 12;
        
        const gan = HEAVENLY_STEMS[currentGanIdx];
        const zhi = EARTHLY_BRANCHES[currentZhiIdx];
        
        xiaoYuns.push({
            age,
            year: birthYear + age - 1,
            ganZhi: createGanZhi(gan, zhi, dayMasterIdx)
        });
    }
    return xiaoYuns;
};

export const calculateBazi = (profile: UserProfile): BaziChart => {
  const dateParts = profile.birthDate.split('-').map(Number);
  const timeParts = profile.birthTime.split(':').map(Number);
  
  // --- 1. Standard Time Object (For Year, Month, Luck, Lunar Date) ---
  const solarStd = Solar.fromYmdHms(dateParts[0], dateParts[1], dateParts[2], timeParts[0], timeParts[1], 0);
  const lunarStd = solarStd.getLunar();
  const baziStd = lunarStd.getEightChar();
  baziStd.setSect(1);

  // --- 2. True Solar Time Object (For Day, Hour) ---
  let solarTST = solarStd;
  let originalTimeStr = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]} ${timeParts[0]}:${timeParts[1]}`;
  let solarTimeStr = '';
  let solarTimeData = undefined;

  if (profile.isSolarTime && profile.longitude) {
      const stdDate = new Date(Date.UTC(dateParts[0], dateParts[1]-1, dateParts[2], timeParts[0], timeParts[1]));
      const tstDate = calculateTrueSolarTime(stdDate, profile.longitude);
      
      solarTST = Solar.fromYmdHms(
        tstDate.getUTCFullYear(), 
        tstDate.getUTCMonth() + 1, 
        tstDate.getUTCDate(), 
        tstDate.getUTCHours(), 
        tstDate.getUTCMinutes(), 
        tstDate.getUTCSeconds()
      );
      
      solarTimeStr = `${tstDate.getUTCFullYear()}-${tstDate.getUTCMonth()+1}-${tstDate.getUTCDate()} ${tstDate.getUTCHours()}:${tstDate.getUTCMinutes()}`;
      solarTimeData = { longitude: profile.longitude, city: profile.city || '未知' };
  }

  const baziTST = solarTST.getLunar().getEightChar();
  baziTST.setSect(1);

  // --- 3. Compose Pillars (Hybrid Approach) ---
  const yearGan = baziStd.getYearGan();
  const yearZhi = baziStd.getYearZhi();
  const monthGan = baziStd.getMonthGan();
  const monthZhi = baziStd.getMonthZhi();
  const dayGan = baziTST.getDayGan();
  const dayZhi = baziTST.getDayZhi();
  const hourGan = baziTST.getTimeGan();
  const hourZhi = baziTST.getTimeZhi();

  const dayMaster = dayGan;
  const dayMasterIdx = getStemIndex(dayMaster);
  const dayMasterElement = getElement(dayMaster);

  const yearPillar: Pillar = { name: '年柱', ganZhi: createGanZhi(yearGan, yearZhi, dayMasterIdx), kongWang: false, shenSha: [] };
  const monthPillar: Pillar = { name: '月柱', ganZhi: createGanZhi(monthGan, monthZhi, dayMasterIdx), kongWang: false, shenSha: [] };
  const dayPillar: Pillar = { name: '日柱', ganZhi: createGanZhi(dayGan, dayZhi, dayMasterIdx), kongWang: false, shenSha: [] };
  const hourPillar: Pillar = { name: '时柱', ganZhi: createGanZhi(hourGan, hourZhi, dayMasterIdx), kongWang: false, shenSha: [] };

  const dayGanIdx = getStemIndex(dayGan);
  const dayZhiIdx = EARTHLY_BRANCHES.indexOf(dayZhi);
  const kwIndex = (dayZhiIdx - dayGanIdx + 12) % 12;
  const kwMap: Record<number, string[]> = {
    0: ['戌', '亥'], 10: ['申', '酉'], 8: ['午', '未'], 6: ['辰', '巳'], 4: ['寅', '卯'], 2: ['子', '丑']
  };
  const kwBranches = kwMap[kwIndex] || [];
  [yearPillar, monthPillar, dayPillar, hourPillar].forEach(p => {
    if (kwBranches.includes(p.ganZhi.zhi)) p.kongWang = true;
  });

  [yearPillar, monthPillar, dayPillar, hourPillar].forEach(p => {
      p.shenSha = calculateShenShaForPillar(p.name, p.ganZhi.gan, p.ganZhi.zhi, dayGan, dayZhi, yearZhi, monthZhi, yearGan);
  });
  const allShenSha = [yearPillar, monthPillar, dayPillar, hourPillar].flatMap(p => p.shenSha);
  
  // --- 4. Luck Pillars & Advanced Palaces (from Standard Time) ---
  const genderType = profile.gender === 'male' ? 1 : 0;
  const yun = baziStd.getYun(genderType);
  const startYearNum = yun.getStartYear();
  const startMonthNum = yun.getStartMonth();
  const startDayNum = yun.getStartDay();
  const startLuckText = `出生后${startYearNum}年${startMonthNum}个月${startDayNum}天起运`;
  
  const daYunArr = yun.getDaYun();
  const startAge = daYunArr.length > 0 ? daYunArr[0].getStartAge() : 0;

  const luckPillars: LuckPillar[] = [];
  for (let i = 1; i <= 8; i++) {
      const dy = daYunArr[i - 1]; 
      if (dy) {
          const dyGanZhi = dy.getGanZhi();
          const dyStartAge = dy.getStartAge();
          const dyStartYear = dy.getStartYear();
          const dyEndYear = dy.getEndYear();
          luckPillars.push({
              index: i,
              startAge: dyStartAge,
              startYear: dyStartYear,
              endYear: dyEndYear,
              ganZhi: createGanZhi(dyGanZhi.substring(0, 1), dyGanZhi.substring(1, 2), dayMasterIdx)
          });
      }
  }

  const xiaoYun = calculateXiaoYun(dateParts[0], startAge, hourPillar, profile.gender, yearGan, dayMasterIdx);
  const counts: Record<string, number> = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  [yearPillar, monthPillar, dayPillar, hourPillar].forEach(p => {
    counts[p.ganZhi.ganElement] = (counts[p.ganZhi.ganElement] || 0) + 1;
    counts[p.ganZhi.zhiElement] = (counts[p.ganZhi.zhiElement] || 0) + 1;
  });

  const godStrength = calculateGodStrength(dayMasterIdx, [yearPillar, monthPillar, dayPillar, hourPillar]);
  const shenShaInteractions = calculateShenShaInteractions(allShenSha, godStrength, {} as any);
  const balance = calculateBalance(dayMaster, dayMasterElement, {year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar}, counts);
  const pattern = calculatePattern(dayMaster, dayMasterElement, monthPillar, yearPillar, hourPillar);
  const safeMangPaiIndex = Math.abs(dateParts[2]) % 28;

  return {
      profileId: profile.id,
      gender: profile.gender,
      dayMaster,
      dayMasterElement,
      pillars: { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar },
      mingGong: baziStd.getMingGong(),
      shenGong: baziStd.getShenGong(),
      taiYuan: baziStd.getTaiYuan(),
      taiXi: '暂缺',
      wuxingCounts: counts,
      mangPai: [TWENTY_EIGHT_MANSIONS[safeMangPaiIndex] || '未知'],
      luckPillars,
      xiaoYun,
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
  const dmStrength = chart.balance.dayMasterStrength.level; 
  const tenGod = ganZhi.shiShenGan;
  const { yongShen, jiShen } = chart.balance;

  if (tenGod && !['日主', '元/男', '元/女'].includes(tenGod)) {
      let content = '';
      let type: '吉' | '凶' | '中平' = '中平';

      // 1. Resource (Zheng Yin / Pian Yin)
      if (tenGod === '正印') {
          if (dmStrength === '身强') {
              content = `正印为忌（身强不喜生扶），主思虑过重、依赖性强。`; type = '凶';
          } else if (dmStrength === '身弱') {
              content = `正印为用（身弱喜生扶），主得长辈扶持，学业顺利。`; type = '吉';
          }
      } else if (tenGod === '偏印') {
          const hasShiShen = [chart.pillars.year, chart.pillars.month, chart.pillars.day, chart.pillars.hour].some(p => p.ganZhi.shiShenGan === '食神');
          if (hasShiShen) {
              content = `偏印夺食（枭神夺食），主食欲不振，子女缘薄。`; type = '凶';
          } else if (dmStrength === '身强') {
              content = `偏印为忌，主性格孤僻，猜疑心重。`; type = '凶';
          } else {
              content = `偏印为用，主领悟力强，利于冷门学术。`; type = '吉';
          }
      }
      // 2. Output
      else if (['食神', '伤官'].includes(tenGod)) {
          if (dmStrength === '身强') {
              content = `${tenGod}泄秀为用，主才华横溢，聪明机智。`; type = '吉';
          } else if (dmStrength === '身弱') {
               content = `${tenGod}泄身为忌，主心神不宁，劳碌奔波。`; type = '凶';
          }
      }
      // 3. Officer/Killing
      else if (['正官', '七杀'].includes(tenGod)) {
           if (dmStrength === '身强') {
               content = `${tenGod}制身为用，主事业有成，掌权。`; type = '吉';
           } else if (dmStrength === '身弱') {
               content = `${tenGod}攻身为忌，主压力巨大，小人多。`; type = '凶';
           }
      }
       // 4. Wealth
       else if (['正财', '偏财'].includes(tenGod)) {
           if (dmStrength === '身强') {
               content = `${tenGod}耗身为用，主财运亨通。`; type = '吉';
           } else if (dmStrength === '身弱') {
               content = `${tenGod}耗身为忌，主求财辛苦，财来财去。`; type = '凶';
           }
      }
      // 5. Companion
      else if (['比肩', '劫财'].includes(tenGod)) {
           if (dmStrength === '身强') {
               content = `${tenGod}助身为忌，主竞争激烈，破财。`; type = '凶';
           } else if (dmStrength === '身弱') {
               content = `${tenGod}帮身为用，主得朋友助力，合伙有利。`; type = '吉';
           }
      }

      if (content) {
          results.push({
              title: `${tenGod}论断`,
              content,
              type,
              category: '十神'
          });
      }
  }

  // Basic Shen Sha Checks
  if (shenSha && shenSha.length > 0) {
      if (shenSha.includes('羊刃')) {
          const zhiElement = ganZhi.zhiElement;
          if (jiShen.includes(zhiElement)) {
               results.push({ title: '羊刃为凶', content: `羊刃为忌，主冲动争执，防意外。`, type: '凶', category: '神煞' });
          } else if (yongShen.includes(zhiElement)) {
               results.push({ title: '羊刃为权', content: `羊刃为用，主魄力增强，适合武职。`, type: '吉', category: '神煞' });
          }
      }
      if (shenSha.includes('咸池(桃花)')) {
           results.push({ title: '桃花运', content: `命带桃花，异性缘佳。需防烂桃花。`, type: '中平', category: '神煞' });
      }
  }

  return results;
};
