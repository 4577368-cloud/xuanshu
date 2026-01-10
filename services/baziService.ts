
import { BaziChart, GanZhi, LuckPillar, Pillar, UserProfile, HiddenStem, GodStrength, TrendActivation, ShenShaInteraction, BalanceAnalysis, AnnualFortune, PatternAnalysis, InterpretationResult, ModalData, XiaoYun, PillarInterpretation } from '../types';
import { Solar, Lunar } from 'lunar-javascript';
import { 
  EARTHLY_BRANCHES, 
  FIVE_ELEMENTS, 
  HEAVENLY_STEMS, 
  HIDDEN_STEMS_DATA, 
  LIFE_STAGES_TABLE, 
  NA_YIN, 
  TEN_GODS_MAP, 
  BRANCH_CLASHES,
  LU_SHEN_MAP,
  YANG_REN_MAP,
  TIAN_YI_MAP,
  TIAN_DE_MAP,
  YUE_DE_MAP,
  WEN_CHANG_MAP,
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
  CHAR_MEANINGS,
  NA_YIN_DESCRIPTIONS
} from './constants';

const getElement = (char: string): string => FIVE_ELEMENTS[char] || '土';
const getStemIndex = (stem: string) => Math.max(0, HEAVENLY_STEMS.indexOf(stem));

const getRelation = (origin: string, target: string): '生' | '克' | '同' | '泄' | '耗' => {
  const map: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const ke: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
  if (origin === target) return '同';
  if (map[origin] === target) return '泄';
  if (map[target] === origin) return '生';
  if (ke[origin] === target) return '克';
  return '耗';
};

const getNaYinElement = (naYin: string): string => naYin.charAt(2);

const calculateTrueSolarTime = (date: Date, longitude: number): Date => {
    const standardMeridian = 120;
    const longitudeOffsetMinutes = (longitude - standardMeridian) * 4;
    const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
    const diff = date.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay) + 1;
    const b = 2 * Math.PI * (dayOfYear - 81) / 365;
    const eotMinutes = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
    return new Date(date.getTime() + (longitudeOffsetMinutes + eotMinutes) * 60000);
};

const getShiShen = (dayMasterIdx: number, targetStemIdx: number): string => {
  if (dayMasterIdx < 0 || dayMasterIdx >= 10 || targetStemIdx < 0 || targetStemIdx >= 10) return '';
  return TEN_GODS_MAP[dayMasterIdx][targetStemIdx];
};

const createGanZhi = (gan: string, zhi: string, dayMasterGanIndex: number): GanZhi => {
  const ganIndex = getStemIndex(gan);
  const zhiIndex = EARTHLY_BRANCHES.indexOf(zhi);
  const hiddenData = HIDDEN_STEMS_DATA[zhi] || [];
  return {
    gan, zhi,
    ganElement: getElement(gan),
    zhiElement: getElement(zhi),
    hiddenStems: hiddenData.map(item => ({
      stem: item[0], type: item[1], powerPercentage: item[2],
      shiShen: getShiShen(dayMasterGanIndex, getStemIndex(item[0]))
    })),
    naYin: NA_YIN[gan+zhi] || '未知',
    shiShenGan: getShiShen(dayMasterGanIndex, ganIndex),
    lifeStage: LIFE_STAGES_TABLE[dayMasterGanIndex][zhiIndex],
    selfLifeStage: LIFE_STAGES_TABLE[ganIndex][zhiIndex]
  };
};

const calculateBalance = (dm: string, pillars: any, counts: Record<string, number>): BalanceAnalysis => {
  const dmEl = FIVE_ELEMENTS[dm];
  const monthZhi = pillars.month.ganZhi.zhi;
  const monthEl = pillars.month.ganZhi.zhiElement;
  let score = 0;
  
  const monthRelation = getRelation(monthEl, dmEl);
  if (monthRelation === '同') score += 40;
  else if (monthRelation === '生') score += 35;
  else if (monthRelation === '泄') score += 10;
  
  let supportiveScore = 0;
  const branches = [pillars.year.ganZhi.zhi, pillars.month.ganZhi.zhi, pillars.day.ganZhi.zhi, pillars.hour.ganZhi.zhi];
  branches.forEach((zhi) => {
    const hidden = HIDDEN_STEMS_DATA[zhi] || [];
    hidden.forEach(([stem, type]) => {
      const stemEl = getElement(stem);
      const rel = getRelation(stemEl, dmEl);
      if (rel === '同' || rel === '生') {
        let power = (type === '主气') ? 8 : 3;
        const isClashed = branches.some(other => BRANCH_CLASHES[zhi] === other);
        if (isClashed) power *= 0.3; 
        supportiveScore += power;
      }
    });
  });
  score += Math.min(35, supportiveScore);
  
  let stemScore = 0;
  [pillars.year.ganZhi.gan, pillars.month.ganZhi.gan, pillars.hour.ganZhi.gan].forEach(gan => {
    const rel = getRelation(getElement(gan), dmEl);
    if (rel === '同') stemScore += 8;
    if (rel === '生') stemScore += 7; 
  });
  score += Math.min(25, stemScore);
  
  const level = score >= 55 ? '身强' : (score <= 42 ? '身弱' : '中和');
  
  const order = ['木', '火', '土', '金', '水'];
  const dmPos = order.indexOf(dmEl);
  const sheng = order[(dmPos + 1) % 5];
  const ke = order[(dmPos + 2) % 5];
  const beiKe = order[(dmPos + 3) % 5];
  const shengWo = order[(dmPos + 4) % 5];

  let yongShen: string[] = [];
  let xiShen: string[] = [];
  let jiShen: string[] = [];

  if (level === '身强') {
    yongShen = [sheng, ke, beiKe];
    xiShen = [ke, beiKe];
    jiShen = [shengWo, dmEl];
  } else if (level === '身弱') {
    yongShen = [shengWo, dmEl];
    xiShen = [shengWo];
    jiShen = [beiKe, ke, sheng];
  } else {
    yongShen = [dmEl];
    xiShen = [shengWo];
    jiShen = [beiKe];
  }

  const tiaoHouMap: Record<string, { yong: string[], advice: string }> = { 
    '亥': { yong: ['丙'], advice: '冬令水冷，急需丙火调候。' },
    '子': { yong: ['丙'], advice: '冬令水冷，急需丙火调候。' },
    '丑': { yong: ['丙'], advice: '冬令水冷，急需丙火调候。' },
    '巳': { yong: ['癸', '壬'], advice: '夏令火燥，急需水气调候。' },
    '午': { yong: ['癸', '壬'], advice: '夏令火燥，急需水气调候。' },
    '未': { yong: ['癸', '壬'], advice: '夏令火燥，急需水气调候。' }
  };
  
  let method: '扶抑' | '调候' | '通关' = '扶抑';
  let advice = level === '身强' ? "身强宜泄，忌印比。" : "身弱宜扶，喜印比。";

  if (tiaoHouMap[monthZhi]) {
    method = '调候';
    const th = tiaoHouMap[monthZhi];
    th.yong.forEach(el => { if (!yongShen.includes(el)) yongShen.unshift(el); });
    advice = th.advice + " " + advice;
  }

  return {
    dayMasterStrength: { score, level, description: `得分:${score.toFixed(1)} (${level})` },
    yongShen, xiShen, jiShen, method, advice
  };
};

const calculatePattern = (dm: string, pillars: any, balance: BalanceAnalysis, counts: Record<string, number>): PatternAnalysis => {
  const monthZhi = pillars.month.ganZhi.zhi;
  const dmIdx = getStemIndex(dm);
  const revealedStems = [pillars.year.ganZhi.gan, pillars.month.ganZhi.gan, pillars.hour.ganZhi.gan];
  const hidden = pillars.month.ganZhi.hiddenStems;
  const dmEl = FIVE_ELEMENTS[dm];
  if (counts[dmEl] >= 6 && balance.dayMasterStrength.score > 65) {
    return { name: `从旺格(${dmEl})`, type: '外格', isEstablished: true, level: '上等', keyFactors: { beneficial: ['气势纯粹'], destructive: ['逢冲'] }, description: "全局五行气势极强。" };
  }
  if (monthZhi === LU_SHEN_MAP[dm]) return { name: "建禄格", type: '正格', isEstablished: true, level: '中等', keyFactors: { beneficial: ['财官透达'], destructive: ['比劫夺财'] }, description: "月令建禄。" };
  
  const benQi = hidden.find(h => h.type === '主气');
  const zhongYuStems = hidden.filter(h => h.type !== '主气').filter(h => revealedStems.includes(h.stem));
  let finalStem = (benQi && revealedStems.includes(benQi.stem)) ? benQi.stem : (zhongYuStems[0]?.stem || benQi?.stem || '');
  const god = getShiShen(dmIdx, getStemIndex(finalStem)) || "偏官";
  return {
    name: (['比肩', '劫财'].includes(god) ? '月劫' : god) + "格",
    type: '正格', isEstablished: true, level: '中等',
    keyFactors: { beneficial: ['用神有力'], destructive: ['忌神干扰'] },
    description: `以月令${monthZhi}定格。`
  };
};

// --- Pillar Interpretation Functions ---

const getGanSymbolism = (gan: string) => CHAR_MEANINGS[gan] || '';
const getNaYinSymbolism = (naYin: string) => NA_YIN_DESCRIPTIONS[naYin] || '';
const getShiShenBrief = (ss: string) => {
    const map: Record<string, string> = {
        '比肩': '竞争、合作、自我', '劫财': '破财、冲动、义气', '食神': '才华、享受、口福',
        '伤官': '傲慢、叛逆、名声', '正财': '勤勉、稳定、妻子', '偏财': '投机、横财、父亲',
        '正官': '地位、自律、丈夫', '七杀': '压力、霸气、权威', '正印': '贵人、仁慈、学问',
        '偏印': '领悟、孤独、偏门'
    };
    return map[ss] || '';
};

const isSignificantHidden = (h: HiddenStem, revealed: string[]) => h.type === '主气' || revealed.includes(h.stem);

export const interpretDayPillar = (chart: BaziChart): PillarInterpretation => {
  const pillar = chart.pillars.day;
  const gz = pillar.ganZhi;
  const revealedStems = [chart.pillars.year.ganZhi.gan, chart.pillars.month.ganZhi.gan, chart.pillars.hour.ganZhi.gan];
  const coreSymbolism = getGanSymbolism(gz.gan);
  let hiddenDynamics = '';
  const significantHiddens = gz.hiddenStems.filter(h => isSignificantHidden(h, revealedStems));
  if (significantHiddens.length > 0) {
    const parts = significantHiddens.map(h => `${h.stem}（${h.shiShen}，${getShiShenBrief(h.shiShen)}）`);
    hiddenDynamics = `地支藏干 ${parts.join('；')}，深刻影响内在性格与潜能。`;
  }
  const naYinInfluence = getNaYinSymbolism(gz.naYin);
  let lifeStageEffect = '';
  if (gz.lifeStage) {
    const baseDesc = gz.lifeStage;
    if (['死', '绝', '病'].includes(gz.lifeStage) && chart.balance.dayMasterStrength.level === '身弱') {
      lifeStageEffect = `日主处${baseDesc}地且身弱，能量内敛，需防行动力不足或思虑过重。`;
    } else {
      lifeStageEffect = `日主处${baseDesc}地，此为蓄势待发之象，非衰绝之兆。`;
    }
  }
  const descMap: Record<string, string> = {
    '天乙贵人': '一生多逢凶化吉，得长辈或异性贵人助',
    '文昌贵人': '聪明好学，利考试、文职、艺术',
    '禄神': '自我实现力强，衣食无忧',
    '羊刃': '精力旺盛，但易冲动争斗（女命不利婚姻）',
    '红鸾': '异性缘佳，感情活跃',
    '华盖': '艺术玄学天赋，略带孤高',
    '驿马': '主变动、远行、奔波求财',
    '孤辰': '内心孤独，喜独处思考'
  };
  const shenShaEffects = pillar.shenSha.map(star => `${star}：${descMap[star] || '带来特殊机遇或挑战'}`);
  const roleInDestiny = '日柱代表命主自身，是八字核心，反映性格、婚姻、健康及人生主线。';
  const summaryParts = [coreSymbolism, hiddenDynamics, naYinInfluence, lifeStageEffect, ...shenShaEffects].filter(Boolean);
  const integratedSummary = summaryParts.length ? `日柱综合：${summaryParts.join(' ')}。` : '信息不足，暂无法深度解读。';

  return { pillarName: '日柱', coreSymbolism, hiddenDynamics, naYinInfluence, lifeStageEffect, shenShaEffects, roleInDestiny, integratedSummary };
};

export const interpretMonthPillar = (chart: BaziChart): PillarInterpretation => {
  const pillar = chart.pillars.month;
  const gz = pillar.ganZhi;
  const coreSymbolism = getGanSymbolism(gz.gan);
  const naYinInfluence = getNaYinSymbolism(gz.naYin);
  const roleInDestiny = '月柱为提纲，主青年运势、事业方向、兄弟姐妹及社会环境，是格局成败的关键。';
  let patternInsight = '';
  if (chart.pattern.isEstablished) {
    patternInsight = `此柱构成${chart.pattern.name}，${chart.pattern.description}。`;
  } else if (chart.pattern.keyFactors.destructive.length > 0) {
    patternInsight = `本可成${chart.pattern.name}，但因${chart.pattern.keyFactors.destructive.join('、')}而破格。`;
  }
  const lifeStageEffect = `月令处${gz.lifeStage}，主导全局五行旺衰。`;
  const shenShaEffects = pillar.shenSha.map(s => `${s}：月柱见${s}，主青年时期相关影响`);
  const integratedSummary = [`月柱${gz.gan}${gz.zhi}（${gz.naYin}）`, coreSymbolism, patternInsight, naYinInfluence, lifeStageEffect].filter(Boolean).join(' ');
  return { pillarName: '月柱', coreSymbolism, hiddenDynamics: '', naYinInfluence, lifeStageEffect, shenShaEffects, roleInDestiny, integratedSummary };
};

export const interpretYearPillar = (chart: BaziChart): PillarInterpretation => {
  const pillar = chart.pillars.year;
  const gz = pillar.ganZhi;
  const coreSymbolism = getGanSymbolism(gz.gan);
  const naYinInfluence = getNaYinSymbolism(gz.naYin);
  const roleInDestiny = '年柱代表祖业、父母、童年环境及社会背景，影响人生起点与根基。';
  let parentInsight = '';
  const yearGanShiShen = gz.shiShenGan;
  if (['正财', '偏财'].includes(yearGanShiShen)) {
    parentInsight = `年干为${yearGanShiShen}，通常代表父亲缘分较显。`;
  } else if (['正印', '偏印'].includes(yearGanShiShen)) {
    parentInsight = `年干为${yearGanShiShen}，通常代表母亲缘分较显。`;
  }
  const lifeStageEffect = `年柱处${gz.lifeStage}，反映家族气运传承。`;
  const shenShaEffects = pillar.shenSha.map(s => `${s}：年柱见${s}，主祖上或早年影响`);
  const integratedSummary = [`年柱${gz.gan}${gz.zhi}（${gz.naYin}）`, coreSymbolism, parentInsight, naYinInfluence, lifeStageEffect].filter(Boolean).join(' ');
  return { pillarName: '年柱', coreSymbolism, hiddenDynamics: '', naYinInfluence, lifeStageEffect, shenShaEffects, roleInDestiny, integratedSummary };
};

export const interpretHourPillar = (chart: BaziChart): PillarInterpretation => {
  const pillar = chart.pillars.hour;
  const gz = pillar.ganZhi;
  const coreSymbolism = getGanSymbolism(gz.gan);
  const naYinInfluence = getNaYinSymbolism(gz.naYin);
  const roleInDestiny = '时柱代表子女、晚年运势、技术才能及最终成就，又称“归宿宫”。';
  let childrenInsight = '';
  const hourGanShiShen = gz.shiShenGan;
  if (chart.gender === 'male') {
    if (['正官', '七杀'].includes(hourGanShiShen)) childrenInsight = '时干为官杀，主子女性别或管教严格。';
    if (['食神', '伤官'].includes(hourGanShiShen)) childrenInsight = '时干为食伤，主子女聪慧或有才华。';
  } else {
    if (['食神', '伤官'].includes(hourGanShiShen)) childrenInsight = '时干为食伤，主子女缘分明显。';
    if (['正官', '七杀'].includes(hourGanShiShen)) childrenInsight = '时干为官杀，主夫缘或事业收尾。';
  }
  const lifeStageEffect = `时柱处${gz.lifeStage}，预示晚年状态与成果。`;
  const shenShaEffects = pillar.shenSha.map(s => `${s}：时柱见${s}，主晚年或子女相关影响`);
  const integratedSummary = [`时柱${gz.gan}${gz.zhi}（${gz.naYin}）`, coreSymbolism, childrenInsight, naYinInfluence, lifeStageEffect].filter(Boolean).join(' ');
  return { pillarName: '时柱', coreSymbolism, hiddenDynamics: '', naYinInfluence, lifeStageEffect, shenShaEffects, roleInDestiny, integratedSummary };
};

// --- Core Service Functions ---

export const calculateBazi = (profile: UserProfile): BaziChart => {
  const d = profile.birthDate.split('-').map(Number);
  const t = profile.birthTime.split(':').map(Number);
  let solar = Solar.fromYmdHms(d[0], d[1], d[2], t[0], t[1], 0);
  if (profile.isSolarTime && profile.longitude) {
      const std = new Date(Date.UTC(d[0], d[1]-1, d[2], t[0], t[1]));
      const tst = calculateTrueSolarTime(std, profile.longitude);
      solar = Solar.fromYmdHms(tst.getUTCFullYear(), tst.getUTCMonth() + 1, tst.getUTCDate(), tst.getUTCHours(), tst.getUTCMinutes(), 0);
  }
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  eightChar.setSect(1);
  const dm = eightChar.getDayGan();
  const dmIdx = getStemIndex(dm);
  
  const getKW = (gan: string, zhi: string) => {
    const kwIdx = (EARTHLY_BRANCHES.indexOf(zhi) - getStemIndex(gan) + 12) % 12;
    const kwMap: Record<number, string[]> = { 0: ['戌', '亥'], 10: ['申', '酉'], 8: ['午', '未'], 6: ['辰', '巳'], 4: ['寅', '卯'], 2: ['子', '丑'] };
    return kwMap[kwIdx] || [];
  };
  const dayKW = getKW(eightChar.getDayGan(), eightChar.getDayZhi());
  const yearKW = getKW(eightChar.getYearGan(), eightChar.getYearZhi());

  const pillarsRaw = {
    year: { name: '年柱', ganZhi: createGanZhi(eightChar.getYearGan(), eightChar.getYearZhi(), dmIdx) },
    month: { name: '月柱', ganZhi: createGanZhi(eightChar.getMonthGan(), eightChar.getMonthZhi(), dmIdx) },
    day: { name: '日柱', ganZhi: createGanZhi(eightChar.getDayGan(), eightChar.getDayZhi(), dmIdx) },
    hour: { name: '时柱', ganZhi: createGanZhi(eightChar.getTimeGan(), eightChar.getTimeZhi(), dmIdx) }
  };

  const pillars: any = {};
  Object.keys(pillarsRaw).forEach(k => {
    const p = pillarsRaw[k as keyof typeof pillarsRaw];
    const kw = dayKW.includes(p.ganZhi.zhi) || yearKW.includes(p.ganZhi.zhi);
    pillars[k] = { ...p, shenSha: [], kongWang: kw };
  });

  const counts: Record<string, number> = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  Object.values(pillars).forEach((p: any) => { counts[p.ganZhi.ganElement]++; counts[p.ganZhi.zhiElement]++; });
  const balance = calculateBalance(dm, pillars, counts);
  
  const yun = eightChar.getYun(profile.gender === 'male' ? 1 : 0);
  const luckPillars: LuckPillar[] = yun.getDaYun().map((dy, i) => {
    if (i === 0) return null;
    const gz = dy.getGanZhi();
    return { index: i, startAge: dy.getStartAge(), startYear: dy.getStartYear(), endYear: dy.getEndYear(), ganZhi: createGanZhi(gz.charAt(0), gz.charAt(1), dmIdx) };
  }).filter(Boolean) as LuckPillar[];

  const xiaoYun: XiaoYun[] = [];
  const startAge = 1;
  const startYear = d[0];
  const isForward = (getStemIndex(eightChar.getYearGan()) % 2 === 0) === (profile.gender === 'male');
  let currentGanIdx = getStemIndex(eightChar.getTimeGan());
  let currentZhiIdx = EARTHLY_BRANCHES.indexOf(eightChar.getTimeZhi());

  for (let age = startAge; age <= (luckPillars[0]?.startAge || 10); age++) {
    const step = isForward ? 1 : -1;
    currentGanIdx = (currentGanIdx + step + 10) % 10;
    currentZhiIdx = (currentZhiIdx + step + 12) % 12;
    xiaoYun.push({
      age,
      year: startYear + age - 1,
      ganZhi: createGanZhi(HEAVENLY_STEMS[currentGanIdx], EARTHLY_BRANCHES[currentZhiIdx], dmIdx)
    });
  }

  return {
    profileId: profile.id, gender: profile.gender, dayMaster: dm, dayMasterElement: FIVE_ELEMENTS[dm],
    pillars: pillars as any, mingGong: eightChar.getMingGong(), shenGong: eightChar.getShenGong(),
    taiYuan: eightChar.getTaiYuan(), taiXi: '暂缺', wuxingCounts: counts,
    luckPillars, xiaoYun, startLuckText: `起运：${yun.getStartYear()}岁${yun.getStartMonth()}月`,
    godStrength: [], shenShaInteractions: [], balance, pattern: calculatePattern(dm, pillars, balance, counts),
    originalTime: solar.toYmdHms(), mangPai: []
  };
};

export const getGanZhiForYear = (year: number, dayMaster: string): GanZhi => {
  const bazi = Solar.fromYmdHms(year, 6, 1, 12, 0, 0).getLunar().getEightChar();
  return createGanZhi(bazi.getYearGan(), bazi.getYearZhi(), getStemIndex(dayMaster));
};

export const calculateAnnualFortune = (chart: BaziChart, year: number): AnnualFortune => {
  const annualGz = getGanZhiForYear(year, chart.dayMaster);
  const reasons: string[] = [];
  let score = 50;
  
  const yearZhi = chart.pillars.year.ganZhi.zhi;
  const dayZhi = chart.pillars.day.ganZhi.zhi;
  const currentLuck = chart.luckPillars.find(l => year >= l.startYear && year <= l.endYear);

  if (currentLuck && annualGz.gan === currentLuck.ganZhi.gan && annualGz.zhi === currentLuck.ganZhi.zhi) {
    reasons.push("流年与大运岁运并临，所谓“不死自己死他人”，多主大起大落，需谨慎。");
    score = score < 50 ? score - 20 : score + 10;
  }

  if (currentLuck) {
    const luckEl = currentLuck.ganZhi.ganElement;
    if (chart.balance.yongShen.includes(luckEl)) {
      reasons.push(`当前大运处于${luckEl}喜用运中，增强了流年的正面能量。`);
      score += 10;
    } else if (chart.balance.jiShen.includes(luckEl)) {
      reasons.push(`当前大运处于${luckEl}忌神运中，放大了流年的负面压力。`);
      score -= 10;
    }
  }

  if (annualGz.zhi === yearZhi) {
    reasons.push(`流年值太岁（${annualGz.zhi}），本命年运势起伏，宜守不宜进。`);
    score -= 10;
  }
  if (BRANCH_CLASHES[annualGz.zhi] === yearZhi) {
    reasons.push(`流年冲太岁（${annualGz.zhi}冲${yearZhi}），凡事多变，防意外。`);
    score -= 15;
  }
  if (BRANCH_CLASHES[annualGz.zhi] === dayZhi) {
    reasons.push(`流年冲日支（婚姻宫），感情生活或个人健康易生变数。`);
    score -= 10;
  }
  
  if (chart.balance.yongShen.includes(annualGz.ganElement)) {
    reasons.push(`流年天干${annualGz.gan}为喜用神，诸事顺遂，多有贵人助。`);
    score += 20;
  } else if (chart.balance.jiShen.includes(annualGz.ganElement)) {
    reasons.push(`流年天干${annualGz.gan}为忌神，需防财损、口舌或身体微恙。`);
    score -= 15;
  }

  if (HONG_LUAN_MAP[yearZhi] === annualGz.zhi) {
    reasons.push("流年逢红鸾，异性缘佳，适合社交与感情发展。");
    score += 5;
  }
  if (YI_MA_MAP[yearZhi] === annualGz.zhi) {
    reasons.push("流年逢驿马，主变动、出差或远行。");
    score += 3;
  }

  const rating = score >= 65 ? '吉' : (score <= 42 ? '凶' : '平');
  return { year, ganZhi: annualGz, rating, reasons, score };
};

export const calculateAnnualTrend = (chart: BaziChart, year: number): TrendActivation[] => [];
export const getAdvancedInterpretation = (chart: BaziChart, data: ModalData): InterpretationResult[] => [];
