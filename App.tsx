import React, { useState, useEffect, useMemo } from 'react';
import { BottomNav, Header } from './components/Layout';
import { AppTab, ChartSubTab, UserProfile, BaziChart, Gender, TrendActivation, Pillar, GanZhi, BalanceAnalysis, AnnualFortune, PatternAnalysis, InterpretationResult, AiReportRecord, ModalData } from './types';
import { calculateBazi, getGanZhiForYear, calculateAnnualTrend, getShenShaForDynamicPillar, calculateAnnualFortune, getAdvancedInterpretation } from './services/baziService';
import { analyzeBaziStructured, BaziReport } from './services/geminiService';
import { getArchives, saveArchive, deleteArchive, saveAiReportToArchive, updateArchiveTags, updateArchiveAvatar, updateArchiveName } from './services/storageService';
import { User, Calendar, ArrowRight, Activity, BrainCircuit, RotateCcw, ChevronDown, Info, BarChart3, Tag, Zap, ScrollText, Stars, Clock, X, BookOpen, Compass, AlertTriangle, CheckCircle, MinusCircle, Crown, Search, Key, Sparkles, Smile, Heart, Star, Sun, Moon, Cloud, Ghost, Flower2, Bird, Cat, Edit2, Trash2, Plus, Copy, FileText, ChevronRight, Play, MapPin, Check, History, ClipboardCopy, Building, Baby, GitCommitHorizontal, Eye, EyeOff, ShieldCheck, Quote, TrendingUp, CalendarDays, Briefcase, LayoutPanelLeft, FolderOpen } from 'lucide-react';
import { 
  interpretDayPillar, 
  interpretMonthPillar, 
  interpretYearPillar, 
  interpretHourPillar,
  interpretLuckPillar,
  interpretAnnualPillar
} from './services/baziService';
import { 
  HEAVENLY_STEMS, 
  EARTHLY_BRANCHES, 
  FIVE_ELEMENTS, 
  NA_YIN_DESCRIPTIONS, 
  SHEN_SHA_DESCRIPTIONS, 
  LIFE_STAGE_DESCRIPTIONS, 
  TEN_GODS_READING,
  CHAR_MEANINGS,
  CHINA_LOCATIONS
} from './services/constants';


// Fix: Define getStemIndex to resolve reference error in ChartInfoCard.
const getStemIndex = (stem: string) => Math.max(0, HEAVENLY_STEMS.indexOf(stem));

// --- Avatar Setup ---
const PRESET_AVATARS: Record<string, React.ElementType> = {
    'default': User,
    'star': Star,
    'heart': Heart,
    'smile': Smile,
    'sun': Sun,
    'moon': Moon,
    'flower': Flower2,
    'bird': Bird,
    'cat': Cat,
    'ghost': Ghost,
    'crown': Crown,
    'sparkles': Sparkles
};

const AVATAR_COLORS: Record<string, string> = {
    'default': 'bg-stone-200 text-stone-600',
    'star': 'bg-yellow-100 text-yellow-600',
    'heart': 'bg-red-100 text-red-600',
    'smile': 'bg-orange-100 text-orange-600',
    'sun': 'bg-amber-100 text-amber-600',
    'moon': 'bg-indigo-100 text-indigo-600',
    'flower': 'bg-pink-100 text-pink-600',
    'bird': 'bg-sky-100 text-sky-600',
    'cat': 'bg-stone-800 text-stone-100',
    'ghost': 'bg-purple-100 text-purple-600',
    'crown': 'bg-yellow-50 text-yellow-700',
    'sparkles': 'bg-cyan-100 text-cyan-600'
};

const AvatarIcon: React.FC<{ name?: string; size?: number; className?: string }> = ({ name = 'default', size = 20, className = '' }) => {
    const Icon = PRESET_AVATARS[name] || User;
    const colorClass = AVATAR_COLORS[name] || AVATAR_COLORS['default'];
    return (
        <div className={`rounded-full flex items-center justify-center shrink-0 ${colorClass} ${className}`} style={{ width: size * 1.8, height: size * 1.8 }}>
            <Icon size={size} />
        </div>
    );
};

// --- Helper Components for Chart Visualization ---

const ElementText: React.FC<{ text: string; type?: 'gan' | 'zhi' | 'text'; className?: string }> = ({ text, type = 'text', className = '' }) => {
  if (!text) return null;
  const getColor = (char: string) => {
    const map: Record<string, string> = {
      '甲': 'text-green-600', '乙': 'text-green-600', '寅': 'text-green-600', '卯': 'text-green-600',
      '丙': 'text-red-600', '丁': 'text-red-600', '巳': 'text-red-600', '午': 'text-red-600',
      '戊': 'text-amber-700', '己': 'text-amber-700', '辰': 'text-amber-700', '戌': 'text-amber-700', '丑': 'text-amber-700', '未': 'text-amber-700',
      '庚': 'text-orange-500', '辛': 'text-orange-500', '申': 'text-orange-500', '酉': 'text-orange-500',
      '壬': 'text-blue-600', '癸': 'text-blue-600', '亥': 'text-blue-600', '子': 'text-blue-600',
      '木': 'text-green-600', '火': 'text-red-600', '土': 'text-amber-700', '金': 'text-orange-500', '水': 'text-blue-600'
    };
    return map[char] || 'text-stone-800';
  };

  return <span className={`${getColor(text)} ${className}`}>{text}</span>;
};

const ChartInfoCard: React.FC<{ chart: BaziChart }> = ({ chart }) => {
    const kongWangBranches = useMemo(() => {
        let branches: string[] = [];
        if (chart.pillars.year.kongWang) branches.push(chart.pillars.year.ganZhi.zhi);
        if (chart.pillars.month.kongWang) branches.push(chart.pillars.month.ganZhi.zhi);
        if (chart.pillars.day.kongWang) branches.push(chart.pillars.day.ganZhi.zhi);
        if (chart.pillars.hour.kongWang) branches.push(chart.pillars.hour.ganZhi.zhi);
        // From day pillar
        const dayGanIdx = getStemIndex(chart.pillars.day.ganZhi.gan);
        const dayZhiIdx = EARTHLY_BRANCHES.indexOf(chart.pillars.day.ganZhi.zhi);
        const kwIndex = (dayZhiIdx - dayGanIdx + 12) % 12;
        const kwMap: Record<number, string[]> = { 0: ['戌', '亥'], 10: ['申', '酉'], 8: ['午', '未'], 6: ['辰', '巳'], 4: ['寅', '卯'], 2: ['子', '丑'] };
        const dayKW = kwMap[kwIndex] || [];
        return { day: dayKW.join(''), inChart: Array.from(new Set(branches)) };
    }, [chart]);

    return (
        <div className="bg-white border border-stone-300 rounded-lg overflow-hidden shadow-sm font-serif">
            <div className="bg-stone-50 border-b border-stone-200 px-3 py-2 flex items-center gap-2">
                <Info size={16} className="text-stone-600" />
                <span className="font-bold text-sm text-stone-800">命盘信息</span>
            </div>
            <div className="p-3.5 text-xs text-stone-700 space-y-2.5">
                <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-lg border border-stone-100"><Building size={14} className="text-indigo-500" /><span className="font-medium">命宫:</span><span className="font-bold">{chart.mingGong}</span></div>
                    <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-lg border border-stone-100"><GitCommitHorizontal size={14} className="text-teal-500" /><span className="font-medium">身宫:</span><span className="font-bold">{chart.shenGong}</span></div>
                    <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-lg border border-stone-100"><Baby size={14} className="text-rose-500" /><span className="font-medium">胎元:</span><span className="font-bold">{chart.taiYuan}</span></div>
                </div>
                <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-lg border border-stone-100">
                    <span className="font-medium">空亡:</span><span className="font-bold">{kongWangBranches.day}</span>
                    {kongWangBranches.inChart.length > 0 && <span className="text-[10px] text-stone-400">(命中见: {kongWangBranches.inChart.join(',')})</span>}
                </div>
                <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-lg border border-stone-100">
                    <span className="font-medium">起运:</span><span className="font-bold text-amber-800">{chart.startLuckText}</span>
                </div>
                {chart.solarTimeData && (
                     <div className="flex items-center gap-2 bg-indigo-50 p-2 rounded-lg border border-indigo-100 text-indigo-800">
                         <Sun size={14} />
                         <span className="font-medium">真太阳时:</span>
                         <span className="font-bold">{chart.solarTime}</span>
                         <span className="text-[10px] opacity-70">(原: {chart.originalTime})</span>
                     </div>
                )}
            </div>
        </div>
    );
};

// 🎨 [新组件] 紧凑型五行直方图 (带智能解读)
const FiveElementsCompact: React.FC<{ chart: BaziChart }> = ({ chart }) => {
  const max = Math.max(...Object.values(chart.wuxingCounts), 1);
  const colors: Record<string, string> = { '木': 'bg-emerald-500', '火': 'bg-rose-500', '土': 'bg-amber-500', '金': 'bg-slate-400', '水': 'bg-blue-500' };
  const textColors: Record<string, string> = { '木': 'text-emerald-600', '火': 'text-rose-600', '土': 'text-amber-600', '金': 'text-slate-500', '水': 'text-blue-600' };

  // 智能解读逻辑
  const getComment = () => {
    const entries = Object.entries(chart.wuxingCounts);
    const sorted = [...entries].sort((a, b) => b[1] - a[1]);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];
    
    const descriptions: Record<string, { strong: string, weak: string }> = {
        '木': { strong: '仁慈但固执，需防好心办坏事。', weak: '意志薄弱，缺乏主见，容易动摇。' },
        '火': { strong: '热情急躁，做事冲动，爆发力强。', weak: '缺乏动力，冷淡消极，行动力差。' },
        '土': { strong: '诚实厚重，但也固执死板，不懂变通。', weak: '信用不足，虚浮不实，根基不稳。' },
        '金': { strong: '刚毅果决，讲义气但好勇斗狠。', weak: '优柔寡断，缺乏决断力，容易受欺。' },
        '水': { strong: '聪明机智，但也多变狡诈，随波逐流。', weak: '反应迟钝，缺乏谋略，适应力差。' }
    };

    return (
        <div className="mt-3 text-xs text-stone-600 bg-stone-50 p-2 rounded border border-stone-100 space-y-1">
            <div className="flex gap-2">
                <span className="font-bold text-stone-800 shrink-0">✨ 最旺五行 [{strongest[0]}]:</span>
                <span>{descriptions[strongest[0]].strong}</span>
            </div>
            {weakest[1] === 0 && (
                <div className="flex gap-2">
                    <span className="font-bold text-stone-400 shrink-0">⚠️ 缺失五行 [{weakest[0]}]:</span>
                    <span className="text-stone-500">{descriptions[weakest[0]].weak}</span>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-sm text-stone-800 flex items-center gap-2">
          <BarChart3 size={16} className="text-stone-400"/> 五行能量分布
        </h4>
      </div>
      <div className="flex justify-around items-end h-24 pt-2 border-b border-stone-100 pb-2">
        {['木', '火', '土', '金', '水'].map(el => {
          const count = chart.wuxingCounts[el] || 0;
          const heightPercent = (count / max) * 100;
          return (
            <div key={el} className="flex flex-col items-center gap-1 group w-1/5">
              <span className={`text-xs font-bold ${textColors[el]}`}>{count}</span>
              <div className="w-full max-w-[24px] bg-stone-100 rounded-t-lg h-16 relative overflow-hidden flex items-end">
                 <div 
                    className={`w-full ${colors[el]} transition-all duration-700 ease-out rounded-t-sm opacity-80 group-hover:opacity-100`} 
                    style={{ height: `${heightPercent || 5}%` }}
                 ></div>
              </div>
              <span className="text-[10px] font-bold text-stone-500">{el}</span>
            </div>
          )
        })}
      </div>
      {getComment()}
    </div>
  );
};

// 🎨 [新组件] 紧凑型藏干网格 (带内心解读)
const HiddenStemsCompact: React.FC<{ chart: BaziChart }> = ({ chart }) => {
  // 获取日支（夫妻宫/内心宫）的主气
  const dayPillar = chart.pillars.day;
  const mainQi = dayPillar.ganZhi.hiddenStems.find(h => h.type === '主气');
  
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
      <h4 className="font-bold text-sm text-stone-800 mb-3 flex items-center gap-2">
        <Search size={16} className="text-stone-400"/> 藏干透视 (内心潜能)
      </h4>
      <div className="grid grid-cols-4 divide-x divide-stone-100 mb-3">
        {['year', 'month', 'day', 'hour'].map(key => {
            const p = chart.pillars[key as keyof typeof chart.pillars];
            return (
                <div key={key} className="flex flex-col items-center px-1">
                    <span className="text-[9px] text-stone-400 uppercase mb-1 tracking-wider">{p.name}</span>
                    <div className="flex flex-col gap-1 w-full items-center">
                        {p.ganZhi.hiddenStems.map((hs, i) => (
                            <div key={i} className={`w-full flex items-center justify-between px-1.5 py-0.5 rounded text-[10px] ${hs.type === '主气' ? 'bg-stone-800 text-stone-50' : 'bg-stone-50 text-stone-500'}`}>
                                <span className="font-serif font-bold scale-90">{hs.stem}</span>
                                <span className="scale-75 opacity-80">{hs.shiShen}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        })}
      </div>
      
      {/* 内心解读区域 */}
      <div className="bg-stone-50 p-2.5 rounded border border-stone-100 flex items-start gap-2">
          <BrainCircuit size={14} className="text-indigo-500 mt-0.5 shrink-0" />
          <div className="text-xs text-stone-600 leading-relaxed">
              <span className="font-bold text-stone-800">内心真我 (日支): </span>
              {mainQi ? (
                  <span>
                      你内心深处隐藏着 <b>{mainQi.shiShen}</b> 的特质。
                      {mainQi.shiShen === '比肩' && '这代表你自尊心强，内心坚定，不愿随波逐流。'}
                      {mainQi.shiShen === '劫财' && '这代表你内心热情冲动，讲义气，但也容易固执。'}
                      {mainQi.shiShen === '食神' && '这代表你内心温和浪漫，向往自由，不喜欢被约束。'}
                      {mainQi.shiShen === '伤官' && '这代表你内心傲气，才思敏捷，不喜传统束缚。'}
                      {mainQi.shiShen === '偏财' && '这代表你慷慨豪爽，善于交际，对金钱有掌控欲。'}
                      {mainQi.shiShen === '正财' && '这代表你踏实稳重，重视家庭，做事按部就班。'}
                      {mainQi.shiShen === '七杀' && '这代表你内心危机感强，有野心，对自己要求严格。'}
                      {mainQi.shiShen === '正官' && '这代表你正直自律，重视名誉，内心有道德底线。'}
                      {mainQi.shiShen === '偏印' && '这代表你内心孤独敏感，直觉强，喜钻研冷门事物。'}
                      {mainQi.shiShen === '正印' && '这代表你心地善良，依赖心较重，喜欢被照顾。'}
                  </span>
              ) : '格局平和。'}
          </div>
      </div>
    </div>
  );
};
// 🎨 [修改] 增强版局势判断 (带评分标准说明 + 强弱策略解读)
const BalanceCard: React.FC<{ balance: BalanceAnalysis; dm: string }> = ({ balance, dm }) => {
  const { dayMasterStrength, yongShen, xiShen, jiShen, method, advice } = balance;
  const scorePercent = Math.min(95, Math.max(5, (dayMasterStrength.score / 100) * 100)); 
  
  // 🔥 核心新增：基于分数的标准断语
  const getStrategy = (level: string) => {
      if (level === '身强') {
          return {
              character: '性格主观，抗压能力强，但也容易固执己见，刚愎自用。',
              action: '✅ 宜：发挥才华(食伤)、自我约束(官杀)。 ❌ 忌：盲目自信、固步自封。'
          };
      } else if (level === '身弱') {
          return {
              character: '性格随和，善于配合，包容心强，但也容易缺乏魄力，依赖心重。',
              action: '✅ 宜：学习充电(印枭)、寻求合作(比劫)。 ❌ 忌：孤军奋战、逞强冒进。'
          };
      } else {
          return {
              character: '性格中庸平和，不偏不倚，处事圆融。',
              action: '✅ 宜：根据流年运势灵活调整。'
          };
      }
  };

  const strategy = getStrategy(dayMasterStrength.level);

  return (
    <div className="bg-white border border-stone-300 rounded-lg overflow-hidden shadow-sm font-serif">
      <div className="bg-stone-50 border-b border-stone-200 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Compass size={16} className="text-amber-700" />
           <span className="font-bold text-sm text-stone-800">局势判断</span>
        </div>
        <div className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">{method}法则</div>
      </div>
      <div className="p-4">
        {/* 顶部状态栏 */}
        <div className="flex items-end justify-between mb-2">
            <div className="flex flex-col">
                <span className="text-[10px] text-stone-400 mb-0.5">日元强弱</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-stone-800">日主 {dm}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                        dayMasterStrength.level === '身强' ? 'bg-red-100 text-red-700' :
                        dayMasterStrength.level === '身弱' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                    }`}>{dayMasterStrength.level}</span>
                </div>
            </div>
            <div className="text-right">
                <span className="text-2xl font-bold text-stone-300">{dayMasterStrength.score.toFixed(0)}</span>
                <span className="text-[10px] text-stone-400 ml-1">分</span>
            </div>
        </div>

        {/* 仪表盘刻度条 */}
        <div className="relative h-6 w-full mb-2 select-none">
             <div className="absolute top-2 left-0 right-0 h-2 rounded-full bg-gradient-to-r from-blue-400 via-green-400 to-red-400 opacity-30"></div>
             <div className="absolute top-2 left-[40%] h-2 w-0.5 bg-white z-10"></div>
             <div className="absolute top-2 left-[60%] h-2 w-0.5 bg-white z-10"></div>
             <div 
                className="absolute top-0 w-1 h-6 bg-stone-800 shadow-lg z-20 transition-all duration-700 ease-out flex flex-col items-center"
                style={{ left: `${scorePercent}%` }}
             >
                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-stone-800 mt-6"></div>
             </div>
        </div>
        
        {/* 评分标准说明 */}
        <div className="flex justify-between text-[9px] text-stone-400 border-b border-stone-50 pb-3 mb-3">
            <span>&lt;40分: 偏弱 (喜印比)</span>
            <span>40-60分: 中和 (平衡)</span>
            <span>&gt;60分: 偏强 (喜克泄)</span>
        </div>

        {/* 🔥 新增：策略解读区 */}
        <div className="bg-amber-50/50 rounded-lg p-3 border border-amber-100 mb-4 space-y-2">
             <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">性格优缺</span>
                  <span className="text-xs text-stone-700">{strategy.character}</span>
             </div>
             <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">行动指南</span>
                  <span className="text-xs text-stone-700">{strategy.action}</span>
             </div>
        </div>

        {/* 喜忌神作战室 */}
        <div className="flex gap-4">
             <div className="flex-1 bg-green-50/50 rounded-lg p-2 border border-green-100">
                 <div className="flex items-center gap-1.5 mb-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                     <span className="text-xs font-bold text-green-800">喜用 (帮手)</span>
                 </div>
                 <div className="flex flex-wrap gap-1.5">
                    {yongShen.map(el => (<div key={el} className="w-7 h-7 rounded bg-white border border-green-200 flex items-center justify-center shadow-sm text-green-700 font-bold text-sm">{el}</div>))}
                    {xiShen.map(el => (<div key={el} className="w-7 h-7 rounded bg-green-50 border border-green-200 border-dashed flex items-center justify-center text-green-600/70 text-xs">{el}</div>))}
                 </div>
             </div>
             <div className="flex-1 bg-red-50/50 rounded-lg p-2 border border-red-100">
                 <div className="flex items-center gap-1.5 mb-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                     <span className="text-xs font-bold text-red-800">忌神 (压力)</span>
                 </div>
                 <div className="flex flex-wrap gap-1.5">
                    {jiShen.map(el => (<div key={el} className="w-7 h-7 rounded bg-white border border-red-200 flex items-center justify-center shadow-sm text-red-700 font-bold text-sm">{el}</div>))}
                 </div>
             </div>
        </div>
        
        {/* 保留原有的详细建议 */}
        <div className="mt-3 text-xs text-stone-600 leading-relaxed italic bg-stone-50 p-2.5 rounded border border-stone-100 flex gap-2">
            <Info size={14} className="shrink-0 text-stone-400 mt-0.5" />
            <span>{advice}</span>
        </div>
      </div>
    </div>
  );
};
// 🎨 [修改] 增强版格局判定 (带事业与性格断语)
const PatternCard: React.FC<{ pattern: PatternAnalysis }> = ({ pattern }) => {
  const { name, type, isEstablished, level, keyFactors, description } = pattern;

  // 🔥 核心新增：格局对应的标准解读库
  const getPatternGuidance = (patternName: string) => {
    if (patternName.includes('官')) return { trait: '正直自律，重视名誉，有管理才能。', career: '公务员、行政管理、法律、大型企业。' };
    if (patternName.includes('杀')) return { trait: '刚毅果决，有魄力，危机感强，喜挑战。', career: '军警、司法、高管、创业、外科医生。' };
    if (patternName.includes('印') || patternName.includes('枭')) return { trait: '聪明好学，重精神世界，善于思考。', career: '学术研究、教育、艺术、咨询、宗教。' };
    if (patternName.includes('财')) return { trait: '务实勤奋，对金钱敏感，善于交际。', career: '经商、金融、销售、财务、投资。' };
    if (patternName.includes('食')) return { trait: '温和儒雅，才华横溢，注重生活品质。', career: '餐饮、服务、设计、演艺、自由职业。' };
    if (patternName.includes('伤')) return { trait: '才思敏捷，傲气叛逆，不喜束缚。', career: '创意、科技、演说、律师、艺术创作。' };
    if (patternName.includes('刃') || patternName.includes('禄')) return { trait: '意志坚定，竞争心强，讲义气。', career: '合伙生意、独立经营、技术、体力相关。' };
    return { trait: '格局特殊，性格复杂多变。', career: '需视具体组合而定，灵活发展。' };
  };

  const guidance = getPatternGuidance(name);

  return (
    <div className="bg-white border border-stone-300 rounded-lg overflow-hidden shadow-sm font-serif">
      <div className="bg-stone-50 border-b border-stone-200 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2"><Crown size={16} className="text-purple-700" /><span className="font-bold text-sm text-stone-800">命格判定</span></div>
        <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isEstablished ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-stone-100 text-stone-500 border-stone-200'}`}>
                {isEstablished ? '成格' : '破格'}
            </span>
        </div>
      </div>
      <div className="p-4">
          <div className="flex items-center justify-between mb-3">
              <h3 className="text-2xl font-bold text-stone-800">{name}</h3>
              <div className="text-right">
                   <span className="block text-[10px] text-stone-400">格局层次</span>
                   <span className={`text-sm font-bold ${level === '上等' ? 'text-amber-600' : level === '中等' ? 'text-blue-600' : 'text-stone-500'}`}>{level}</span>
              </div>
          </div>
          
          <div className="relative pl-3 border-l-2 border-purple-200 py-1 mb-4">
              <p className="text-xs text-stone-600 leading-relaxed">{description}</p>
          </div>

          {/* 🔥 新增：标准解读区 */}
          <div className="bg-purple-50/50 rounded-lg p-3 border border-purple-100 mb-4 space-y-2">
              <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded shrink-0">性格特质</span>
                  <span className="text-xs text-stone-700">{guidance.trait}</span>
              </div>
              <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded shrink-0">事业方向</span>
                  <span className="text-xs text-stone-700">{guidance.career}</span>
              </div>
          </div>

          <div className="flex gap-2">
              {keyFactors.beneficial.length > 0 && (
                  <div className="flex-1 bg-green-50 rounded px-2 py-1.5">
                      <span className="text-[9px] text-green-800/60 block mb-1">有利因素 (成格条件)</span>
                      <div className="flex flex-wrap gap-1">
                        {keyFactors.beneficial.map((f,i) => <span key={i} className="text-[10px] font-bold text-green-700 bg-white px-1 rounded border border-green-100">{f}</span>)}
                      </div>
                  </div>
              )}
              {keyFactors.destructive.length > 0 && (
                  <div className="flex-1 bg-red-50 rounded px-2 py-1.5">
                      <span className="text-[9px] text-red-800/60 block mb-1">破坏因素 (破格原因)</span>
                      <div className="flex flex-wrap gap-1">
                        {keyFactors.destructive.map((f,i) => <span key={i} className="text-[10px] font-bold text-red-700 bg-white px-1 rounded border border-red-100">{f}</span>)}
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

const AnnualFortuneCard: React.FC<{ fortune: AnnualFortune }> = ({ fortune }) => {
    const { rating, reasons, score, year, ganZhi } = fortune;
    let bgClass = 'bg-stone-50 border-stone-200'; let icon = <MinusCircle className="text-stone-500" size={18} />; let textClass = 'text-stone-700';
    if (rating === '吉') { bgClass = 'bg-green-50 border-green-100'; icon = <CheckCircle className="text-green-600" size={18} />; textClass = 'text-green-800'; } 
    else if (rating === '凶') { bgClass = 'bg-red-50 border-red-100'; icon = <AlertTriangle className="text-red-600" size={18} />; textClass = 'text-red-800'; }
    return (
        <div className={`mt-4 rounded-lg border p-4 ${bgClass} shadow-sm`}>
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2">{icon}<span className={`font-bold text-base ${textClass}`}>{year}年 ({ganZhi.gan}{ganZhi.zhi}) 运势：{rating}</span></div></div>
            <div className="space-y-2">{reasons.map((r, i) => (<div key={i} className="flex items-start gap-2 text-xs text-stone-700"><span className="mt-1 w-1 h-1 rounded-full bg-stone-400 shrink-0"></span><span className="leading-relaxed">{r}</span></div>))}{reasons.length === 0 && (<div className="text-xs text-stone-500 italic">流年平稳，无显著冲合。</div>)}</div>
        </div>
    );
}

// Modal Component
const InfoModal: React.FC<{ data: ModalData | null; chart?: BaziChart | null; onClose: () => void }> = ({ data, chart, onClose }) => {
  if (!data) return null;
  const { ganZhi, pillarName, shenSha, kongWang } = data;
  const stem = ganZhi.gan; const branch = ganZhi.zhi; const stemElement = ganZhi.ganElement; const branchElement = ganZhi.zhiElement;
  const tenGod = pillarName === '日柱' ? '日主' : ganZhi.shiShenGan;
  const tenGodInfo = TEN_GODS_READING.find(t => t.name === tenGod);
  const stemBasic = CHAR_MEANINGS[stem];
  let posReading = null; if (tenGodInfo) posReading = tenGodInfo.positions.find(p => p.pos === pillarName);
  const isDayMaster = pillarName === '日柱'; const branchBasic = CHAR_MEANINGS[branch];
  const advancedReadings: InterpretationResult[] = React.useMemo(() => { if (!chart || !data) return []; return getAdvancedInterpretation(chart, data); }, [chart, data]);

  // 🔥 修复：生肖显示
  const ZODIAC_MAP: Record<string, string> = {
    '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
    '辰': '龙', '巳': '蛇', '午': '马', '未': '羊',
    '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
  };
  const zodiac = ZODIAC_MAP[branch] || '';

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}/>
      <div className="relative z-10 bg-white w-full sm:w-[90%] max-w-md sm:rounded-xl rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh] transition-all transform duration-300">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 shrink-0 bg-stone-50/50 sm:rounded-t-xl">
           <div><h3 className="font-bold text-stone-800 text-base">{data.title}</h3><p className="text-xs text-stone-500">{ganZhi.naYin} · {ganZhi.lifeStage} {kongWang ? <span className="text-stone-400">· 空亡</span> : ''}</p></div>
           <button onClick={onClose} className="p-2 bg-stone-100 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-4 space-y-4 no-scrollbar flex-1">
            <div className="flex gap-3">
                 <div className="flex-1 bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200 rounded-lg p-3 flex flex-col items-center"><span className="text-[10px] text-stone-400 font-bold uppercase mb-1">天干</span><ElementText text={stem} className="text-4xl font-serif font-bold mb-1" /><span className="text-xs text-stone-500">{stemElement} · {tenGod}</span></div>
                 <div className="flex-1 bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200 rounded-lg p-3 flex flex-col items-center"><span className="text-[10px] text-stone-400 font-bold uppercase mb-1">地支</span><ElementText text={branch} className="text-4xl font-serif font-bold mb-1" /><span className="text-xs text-stone-500">{branchElement} · {zodiac}</span></div>
            </div>
            {/* --- 新增：四柱及运势深度解读卡片 --- */}
            {chart && (
              <div className="bg-white border border-stone-100 rounded-lg p-3 shadow-sm ring-1 ring-stone-900/5">
                <div className="flex items-center gap-2 mb-2">
                  <BrainCircuit size={14} className="text-indigo-600" />
                  <span className="font-bold text-sm text-stone-800">本柱解读</span>
                </div>
                <div className="text-xs text-stone-600 leading-relaxed space-y-2 bg-stone-50 p-2 rounded border border-stone-100 italic">
                  {(() => {
                    // 根据 pillarName 调用不同的解读函数
                    let interpretation;
                    switch (pillarName) {
                      case '日柱':
                        interpretation = interpretDayPillar(chart);
                        break;
                      case '月柱':
                        interpretation = interpretMonthPillar(chart);
                        break;
                      case '年柱':
                        interpretation = interpretYearPillar(chart);
                        break;
                      case '时柱':
                        interpretation = interpretHourPillar(chart);
                        break;
                      case '大运':
                      case '小运': // 小运暂用大运逻辑或显示通用
                        interpretation = interpretLuckPillar(chart, ganZhi);
                        break;
                      case '流年':
                        interpretation = interpretAnnualPillar(chart, ganZhi);
                        break;
                      default:
                        // 如果包含年份信息（如“大运 (2024)”），尝试匹配
                        if (pillarName.includes('大运')) interpretation = interpretLuckPillar(chart, ganZhi);
                        else if (pillarName.includes('流年')) interpretation = interpretAnnualPillar(chart, ganZhi);
                        else return "暂无深度解读";
                    }
                    return interpretation.integratedSummary || "暂无深度解读";
                  })()}
                </div>
              </div>
            )}
            {advancedReadings.length > 0 && (<div className="space-y-2"><div className="flex items-center gap-2 mb-1"><Search size={14} className="text-amber-600" /><span className="text-xs font-bold text-stone-500 uppercase">深度解读</span></div>{advancedReadings.map((reading, idx) => (<div key={idx} className={`rounded-lg p-3 border text-xs leading-relaxed ${reading.type === '吉' ? 'bg-green-50 border-green-100 text-green-900' : reading.type === '凶' ? 'bg-red-50 border-red-100 text-red-900' : 'bg-stone-50 border-stone-100 text-stone-700'}`}><div className="flex items-center justify-between mb-1"><span className="font-bold">{reading.title}</span><span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${reading.type === '吉' ? 'bg-green-100 border-green-200 text-green-700' : reading.type === '凶' ? 'bg-red-100 border-red-200 text-red-700' : 'bg-stone-200 border-stone-300 text-stone-600'}`}>{reading.type}</span></div><p>{reading.content}</p></div>))}</div>)}
            <div className="bg-white border border-stone-100 rounded-lg p-3 shadow-sm ring-1 ring-stone-900/5"><div className="flex items-center gap-2 mb-2"><div className="w-1 h-4 bg-amber-500 rounded-full"></div><span className="font-bold text-sm text-stone-800">天干 · {stem}</span></div><div className="text-xs text-stone-600 leading-relaxed space-y-2"><p>{stemBasic}</p>{tenGodInfo && (<div className="bg-amber-50 p-2 rounded border border-amber-100 mt-2"><span className="font-bold text-amber-800 block mb-1">{tenGod}：</span><p className="mb-1">{tenGodInfo.summary}</p>{posReading && (<p className="text-amber-900/80 italic mt-1 border-t border-amber-200/50 pt-1">"{posReading.desc}"</p>)}</div>)}{isDayMaster && (<div className="bg-amber-50 p-2 rounded border border-amber-100 mt-2"><span className="font-bold text-amber-800">日元心性：</span><p>此为命主元神，代表最核心的自我性格与潜意识。</p></div>)}</div></div>
            <div className="bg-white border border-stone-100 rounded-lg p-3 shadow-sm ring-1 ring-stone-900/5"><div className="flex items-center gap-2 mb-2"><div className="w-1 h-4 bg-stone-500 rounded-full"></div><span className="font-bold text-sm text-stone-800">地支 · {branch}</span></div><p className="text-xs text-stone-600 leading-relaxed">{branchBasic}</p><div className="mt-3 bg-stone-50 p-2 rounded border border-stone-100"><span className="text-[10px] font-bold text-stone-400 uppercase block mb-1">支中藏干</span><div className="flex gap-2">{ganZhi.hiddenStems.map((hs, i) => (<div key={i} className="flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm border border-stone-200"><ElementText text={hs.stem} className="font-bold text-sm" /><div className="flex flex-col leading-none"><span className="text-[10px] text-stone-500">{hs.shiShen}</span><span className="text-[9px] text-stone-300 scale-90 origin-left">{hs.type}</span></div></div>))}</div></div></div>
            {shenSha && shenSha.length > 0 && (<div className="bg-white border border-stone-100 rounded-lg p-3 shadow-sm ring-1 ring-stone-900/5"><div className="flex items-center gap-2 mb-2"><Stars size={14} className="text-purple-600"/><span className="font-bold text-sm text-stone-800">神煞</span></div><div className="space-y-2">{shenSha.map((star, idx) => { const cleanName = star.replace(/\(.*\)/, ''); const desc = SHEN_SHA_DESCRIPTIONS[star] || SHEN_SHA_DESCRIPTIONS[cleanName] || '吉凶参半。'; return (<div key={idx} className="text-xs flex gap-2"><span className="font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded shrink-0 h-fit">{star}</span><span className="text-stone-500">{desc}</span></div>); })}</div></div>)}
            <div className="grid grid-cols-2 gap-3"><div className="bg-stone-50 p-2 rounded border border-stone-100"><span className="text-[10px] text-stone-400 block mb-0.5">纳音</span><span className="text-xs font-bold text-stone-700">{ganZhi.naYin}</span><p className="text-[9px] text-stone-500 mt-1 leading-tight">{NA_YIN_DESCRIPTIONS[ganZhi.naYin]}</p></div><div className="bg-stone-50 p-2 rounded border border-stone-100"><span className="text-[10px] text-stone-400 block mb-0.5">十二运</span><span className="text-xs font-bold text-stone-700">{ganZhi.lifeStage}</span><p className="text-[9px] text-stone-500 mt-1 leading-tight">{LIFE_STAGE_DESCRIPTIONS[ganZhi.lifeStage]}</p></div></div>
        </div>
      </div>
    </div>
  );
};

// --- 🔥 HomeView: 按钮位置调整版 ---
const HomeView: React.FC<{ 
  onGenerate: (profile: UserProfile, subTab?: ChartSubTab) => void;
  archives: UserProfile[]; 
}> = ({ onGenerate, archives }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [birthDate, setBirthDate] = useState(''); // 默认值
  const [birthTime, setBirthTime] = useState('12:00');
  const [isSolarTime, setIsSolarTime] = useState(false);
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  
  // 弹窗状态
  const [showArchiveList, setShowArchiveList] = useState(false);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setProvince(e.target.value);
      setCity('');
      setLongitude(undefined);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const cityName = e.target.value;
      setCity(cityName);
      const provData = CHINA_LOCATIONS.find(p => p.name === province);
      const cityData = provData?.cities.find(c => c.name === cityName);
      if (cityData) {
          setLongitude(cityData.longitude);
      }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[\d-]*$/.test(val)) {
      setBirthDate(val); 
    }
  };

  const handleDateBlur = () => {
    let raw = birthDate.replace(/\D/g, '');
    if (raw.length === 8) {
      setBirthDate(`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`);
    } else if (raw.length === 7) {
      const y = raw.slice(0, 4);
      const m = raw.slice(4, 5); 
      const d = raw.slice(5, 7);
      setBirthDate(`${y}-0${m}-${d}`);
    } else if (raw.length === 6) {
        const y = raw.slice(0, 4);
        const m = raw.slice(4, 5);
        const d = raw.slice(5, 6);
        setBirthDate(`${y}-0${m}-0${d}`);
    }
  };

  const handleLoadProfile = (p: UserProfile) => {
    setName(p.name);
    setGender(p.gender);
    setBirthDate(p.birthDate);
    setBirthTime(p.birthTime);
    setIsSolarTime(p.isSolarTime);
    setProvince(p.province || '');
    setCity(p.city || '');
    setLongitude(p.longitude);
    setShowArchiveList(false); 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate || !birthTime) return;

    const profile: UserProfile = {
      id: Date.now().toString(),
      name,
      gender,
      birthDate,
      birthTime,
      isSolarTime,
      province,
      city,
      longitude,
      createdAt: Date.now(),
      avatar: 'default'
    };
    onGenerate(profile);
  };

  return (
    <div className="flex flex-col h-full bg-white p-6 overflow-y-auto pb-24">
       <div className="text-center mb-6 mt-4 relative">
           <div className="w-16 h-16 mx-auto mb-3 shadow-lg">
                <img src="https://imgus.tangbuy.com/static/images/2026-01-10/631ac4d3602b4f508bb0cad516683714-176803435086117897846087613804795.png" className="w-full h-full object-contain rounded-2xl" alt="Logo" />
           </div>   
           <h2 className="text-2xl font-serif font-bold text-stone-800 tracking-wider">玄枢命理</h2>
           <p className="text-xs text-stone-400 mt-1 tracking-widest uppercase">传统八字 · 深度解析</p>
       </div>

       <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">姓名</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all font-serif"
              placeholder="请输入姓名"       
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">性别</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => setGender('male')}
                className={`py-3 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${gender === 'male' ? 'bg-stone-800 border-stone-800 text-white shadow-md' : 'bg-stone-50 border-stone-200 text-stone-400 hover:bg-stone-100'}`}
              >
                乾造 (男)
              </button>
              <button 
                type="button"
                onClick={() => setGender('female')}
                className={`py-3 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${gender === 'female' ? 'bg-stone-800 border-stone-800 text-white shadow-md' : 'bg-stone-50 border-stone-200 text-stone-400 hover:bg-stone-100'}`}
              >
                坤造 (女)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">公历日期</label>
              <div className="relative">
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={birthDate} 
                  onChange={handleDateChange} 
                  onBlur={handleDateBlur} 
                  placeholder="如: 19900101" 
                  maxLength={10} 
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 font-sans text-sm tracking-widest"
                  required
                />
                
                {/^\d{4}-\d{2}-\d{2}$/.test(birthDate) && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 animate-in zoom-in duration-300">
                    <Check size={16} />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">出生时间</label>
              <input 
                type="time" 
                value={birthTime} 
                onChange={e => setBirthTime(e.target.value)} 
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 font-sans text-sm"
                required
              />
            </div>
          </div>

          <div className="bg-stone-50 rounded-xl border border-stone-100 overflow-hidden transition-all">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-stone-100 transition-colors" 
                onClick={() => setIsSolarTime(!isSolarTime)}
              >
                 <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-full ${isSolarTime ? 'bg-amber-100 text-amber-600' : 'bg-stone-200 text-stone-400'}`}>
                       <Sun size={18} />
                   </div>
                   <div>
                       <span className="text-sm font-bold text-stone-700 block">真太阳时</span>
                       <span className="text-[10px] text-stone-400">经纬度校准时间 (推荐开启)</span>
                   </div>
                 </div>
                 <div className={`w-10 h-6 rounded-full transition-colors relative ${isSolarTime ? 'bg-amber-500' : 'bg-stone-300'}`}>
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${isSolarTime ? 'left-5' : 'left-1'}`}></div>
                 </div>
              </div>

              {isSolarTime && (
                  <div className="px-4 pb-4 pt-0 border-t border-stone-100/50 space-y-3 bg-stone-50/50 animate-in slide-in-from-top-2 duration-200">
                      <div className="pt-3">
                          <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">出生地点 (自动匹配经度)</label>
                          <div className="grid grid-cols-2 gap-3">
                              <select 
                                value={province} 
                                onChange={handleProvinceChange}
                                className="w-full bg-white border border-stone-200 rounded-lg px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-stone-300"
                              >
                                  <option value="">选择省份/直辖市</option>
                                  {CHINA_LOCATIONS.map(p => (
                                      <option key={p.name} value={p.name}>{p.name}</option>
                                  ))}
                              </select>
                              <select 
                                value={city} 
                                onChange={handleCityChange}
                                disabled={!province}
                                className="w-full bg-white border border-stone-200 rounded-lg px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-stone-300 disabled:opacity-50 disabled:bg-stone-100"
                              >
                                  <option value="">选择城市</option>
                                  {province && CHINA_LOCATIONS.find(p => p.name === province)?.cities.map(c => (
                                      <option key={c.name} value={c.name}>{c.name}</option>
                                  ))}
                              </select>
                          </div>
                      </div>
                      {longitude && (
                          <div className="flex items-center gap-2 text-[10px] text-stone-500 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                              <MapPin size={12} className="text-amber-500" />
                              经度: {longitude}° (将用于计算真太阳时)
                          </div>
                      )}
                  </div>
              )}
          </div>

          <div className="space-y-3 pt-2">
            <button 
                type="submit" 
                className="w-full bg-stone-900 text-white font-bold py-4 rounded-xl shadow-xl shadow-stone-200 hover:bg-stone-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                <Compass size={20} />
                排盘推演
            </button>

            {/* 🔥 已移动：调用存档按钮放在这里 (下方) */}
            {archives.length > 0 && (
                <button 
                type="button" // 关键：防止触发表单提交
                onClick={() => setShowArchiveList(true)}
                className="w-full bg-white border border-stone-200 text-stone-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-stone-50 transition-colors"
                >
                <FolderOpen size={18} />
                调用已有存档 ({archives.length})
                </button>
            )}
          </div>
       </form>

       {/* 🔥 存档选择弹窗 */}
       {showArchiveList && (
         <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setShowArchiveList(false)} />
           <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col max-h-[70vh]">
             <div className="flex items-center justify-between p-4 border-b border-stone-100">
               <h3 className="font-bold text-stone-800">选择存档</h3>
               <button onClick={() => setShowArchiveList(false)} className="p-1 rounded-full hover:bg-stone-100 text-stone-400"><X size={20}/></button>
             </div>
             <div className="overflow-y-auto p-2 space-y-2 flex-1">
               {archives.map(p => (
                 <div key={p.id} onClick={() => handleLoadProfile(p)} className="flex items-center p-3 hover:bg-stone-50 rounded-xl cursor-pointer border border-transparent hover:border-stone-100 transition-all">
                   <AvatarIcon name={p.avatar} size={16} className="mr-3" />
                   <div className="flex-1">
                     <div className="flex justify-between items-center">
                       <span className="font-bold text-stone-800 text-sm">{p.name}</span>
                       <span className="text-[10px] text-stone-400">{p.gender === 'male' ? '男' : '女'}</span>
                     </div>
                     <div className="text-xs text-stone-500 mt-0.5">
                       {p.birthDate} {p.birthTime}
                     </div>
                   </div>
                   <ChevronRight size={16} className="text-stone-300" />
                 </div>
               ))}
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

const ChartView: React.FC<{ 
  profile: UserProfile; 
  chart: BaziChart; 
  onReset: () => void; 
  onShowModal: (data: ModalData) => void;
  initialSubTab?: ChartSubTab;
  onSaveReport: (report: string) => void;
}> = ({ profile, chart, onReset, onShowModal, initialSubTab, onSaveReport }) => {
  const [activeSubTab, setActiveSubTab] = useState<ChartSubTab>(initialSubTab || ChartSubTab.BASIC);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiReportStructured, setAiReportStructured] = useState<BaziReport | null>(null);
  const [selectedLuckIdx, setSelectedLuckIdx] = useState(0);
  const [analysisYear, setAnalysisYear] = useState(new Date().getFullYear());
  const [annualFortune, setAnnualFortune] = useState<AnnualFortune | null>(null);
  
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ai_api_key') || '');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    // If there's an existing report in the profile, we don't have its structured format,
    // so we'll just show the text if available.
  }, [profile.id]);

  useEffect(() => {
    if (chart && chart.luckPillars) {
        const currentYr = new Date().getFullYear();
        const foundLuckIdx = chart.luckPillars.findIndex(l => currentYr >= l.startYear && currentYr <= l.endYear);
        if (foundLuckIdx !== -1) {
            setSelectedLuckIdx(foundLuckIdx);
        }
        setAnalysisYear(currentYr);
    }
  }, [chart]);

  useEffect(() => {
      setAnnualFortune(calculateAnnualFortune(chart, analysisYear));
  }, [analysisYear, chart]);

  const handleAiAnalysis = async () => {
    if (!apiKey.trim()) {
      alert("请先填入 API KEY 才可以开始深度分析。");
      return;
    }
    setLoadingAi(true);
    try {
        const result = await analyzeBaziStructured(chart, apiKey);
        setAiReportStructured(result);
        onSaveReport(result.copyText);
    } catch (error) {
        console.error("AI Analysis failed:", error);
    } finally {
        setLoadingAi(false);
    }
  };

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem('ai_api_key', val);
  };

  // Helper to detect platform
  const detectedPlatform = useMemo(() => {
    if (!apiKey) return null;
    if (apiKey.includes('ali') || apiKey.length > 45) return { name: '阿里云百炼', color: 'text-orange-600 bg-orange-50' };
    if (apiKey.startsWith('sk-')) return { name: 'DeepSeek', color: 'text-blue-600 bg-blue-50' };
    return null;
  }, [apiKey]);

  const openModal = (
      pillarName: string,
      ganZhi: GanZhi,
      shenSha: string[] = [],
      kongWang: boolean = false
  ) => {
    onShowModal({
        title: `${pillarName} (${ganZhi.gan}${ganZhi.zhi})`,
        pillarName,
        ganZhi,
        shenSha,
        kongWang
    });
  };

  const tabs = [
    { id: ChartSubTab.BASIC, label: '八字' },
    { id: ChartSubTab.DETAIL, label: '大运流年' },
    { id: ChartSubTab.ANALYSIS, label: '大师解读' }
  ];
 // --- Grid Renderers ---
  const renderBasicGrid = () => {
    const dayGan = chart.pillars.day.ganZhi.gan;
  const dayZhi = chart.pillars.day.ganZhi.zhi;
  const dayGanIdx = getStemIndex(dayGan);
  const dayZhiIdx = EARTHLY_BRANCHES.indexOf(dayZhi);
  const kwIndex = (dayZhiIdx - dayGanIdx + 12) % 12;
  const kwMap: Record<number, string[]> = { 
    0: ['戌', '亥'], 10: ['申', '酉'], 8: ['午', '未'], 
    6: ['辰', '巳'], 4: ['寅', '卯'], 2: ['子', '丑'] 
  };
  const dayKongWangBranches = kwMap[kwIndex] || [];
  const isKongWang = (zhi: string) => dayKongWangBranches.includes(zhi);
    const pillars = [
      { key: 'year', label: '年柱', data: chart.pillars.year },
      { key: 'month', label: '月柱', data: chart.pillars.month },
      { key: 'day', label: '日柱', data: chart.pillars.day },
      { key: 'hour', label: '时柱', data: chart.pillars.hour },
    ];

  const rows = [
  { label: '主星', render: (p: Pillar) => p.name === '日柱' ? '日元' : (p.ganZhi.shiShenGan || '-') },
  { label: '天干', render: (p: Pillar) => (<div onClick={() => openModal(p.name, p.ganZhi, p.shenSha, p.kongWang)} className="cursor-pointer active:scale-95 transition-transform"><ElementText text={p.ganZhi.gan} className="text-2xl font-bold font-serif" /></div>) },
  { label: '地支', render: (p: Pillar) => (<div onClick={() => openModal(p.name, p.ganZhi, p.shenSha, p.kongWang)} className="cursor-pointer active:scale-95 transition-transform"><ElementText text={p.ganZhi.zhi} className="text-2xl font-bold font-serif" /></div>) },
  { label: '藏干', render: (p: Pillar) => (<div className="flex flex-col text-[10px] space-y-0.5 leading-none items-center">{p.ganZhi.hiddenStems.map((h, i) => (<span key={i} className={h.type === '主气' ? 'font-bold text-stone-800' : 'text-stone-500 scale-90'}>{h.stem}{FIVE_ELEMENTS[h.stem]}</span>))}</div>) },
  { label: '副星', render: (p: Pillar) => (<div className="flex flex-col text-[10px] space-y-0.5 leading-none text-stone-500 items-center">{p.ganZhi.hiddenStems.map((h, i) => <span key={i} className="whitespace-nowrap scale-90">{h.shiShen}</span>)}</div>) },
  { label: '纳音', render: (p: Pillar) => <span className="text-[10px] scale-90 whitespace-nowrap text-stone-500">{p.ganZhi.naYin}</span> },
  { label: '星运', render: (p: Pillar) => <span className="text-xs text-stone-600">{p.ganZhi.lifeStage}</span> },
  { label: '自坐', render: (p: Pillar) => <span className="text-xs text-stone-500">{p.ganZhi.selfLifeStage}</span> },
  { 
    label: '空亡', 
    render: (p: Pillar) => 
      isKongWang(p.ganZhi.zhi) ? 
        <span className="text-[10px] bg-stone-200 px-1 rounded text-stone-600">空</span> : 
        <span className="text-stone-200">—</span> 
  }, // 👈👈👈 这里加逗号！
  { 
    label: '神煞',
    render: (p: Pillar) => (
      <div className="flex flex-wrap justify-center gap-1 w-full px-1 py-0.5 min-h-[24px]">
        {p.shenSha.length === 0 ? (
          <span className="text-[9px] text-stone-400">—</span>
        ) : (
          p.shenSha.map((s, i) => {
            const isAuspicious = ['天乙', '太极', '文昌', '文星', '福星', '天德', '月德', '将星', '华盖', '金舆', '禄'].some(k => s.includes(k));
            const isInauspicious = ['劫煞', '灾煞', '天煞', '地煞', '孤辰', '寡宿', '阴差阳错', '空亡'].some(k => s.includes(k));
            const isPeachBlossom = ['桃花', '咸池', '红艳'].some(k => s.includes(k));

            let bgColor = 'bg-stone-100';
            let textColor = 'text-stone-600';
            let borderColor = 'border-stone-200';

            if (isAuspicious) {
              bgColor = 'bg-emerald-50';
              textColor = 'text-emerald-700';
              borderColor = 'border-emerald-200';
            } else if (isInauspicious) {
              bgColor = 'bg-rose-50';
              textColor = 'text-rose-700';
              borderColor = 'border-rose-200';
            } else if (isPeachBlossom) {
              bgColor = 'bg-amber-50';
              textColor = 'text-amber-700';
              borderColor = 'border-amber-200';
            }

            return (
              <span
                key={i}
                className={`text-[8px] px-1 py-0.5 rounded border whitespace-nowrap ${bgColor} ${textColor} ${borderColor} leading-none`}
                title={s}
              >
                {s}
              </span>
            );
          })
        )}
      </div>
    )
  }   
];
    return (
      <div className="space-y-4">
         {/* 1. 命盘信息卡片 (保持不变) */}
         <ChartInfoCard chart={chart} />
         
         {/* 2. 四柱列表 (保持不变) */}
         <div className="bg-white border border-stone-300 rounded-lg overflow-hidden shadow-sm">
            <div className="grid grid-cols-5 divide-x divide-stone-200 bg-stone-100 border-b border-stone-300 text-center text-sm font-bold text-stone-700"><div className="py-2 bg-stone-200/50"></div>{pillars.map(p => <div key={p.key} className="py-2">{p.label}</div>)}</div>
            {rows.map((row, idx) => (<div key={idx} className={`grid grid-cols-5 divide-x divide-stone-200 border-b border-stone-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}`}><div className="flex items-center justify-center font-bold text-xs text-stone-500 bg-stone-100/30 p-2">{row.label}</div>{pillars.map(p => (<div key={p.key} className="flex flex-col items-center justify-center p-1.5 text-center min-h-[2.5rem] relative">{row.render(p.data)}</div>))}</div>))}
         </div>

         {/* 🔥 3. 命格判定 (优先展示定性) */}
         <PatternCard pattern={chart.pattern} />

         {/* 🔥 4. 局势判断 (带刻度条的增强版) */}
         <BalanceCard balance={chart.balance} dm={chart.dayMaster} />

         {/* 🔥 5. 紧凑型 - 五行与藏干并排 (或上下排，视屏幕宽度而定，这里用Grid布局节省空间) */}
         <div className="grid grid-cols-1 gap-4">
             <FiveElementsCompact chart={chart} />
             <HiddenStemsCompact chart={chart} />
         </div>
      </div>
    );
  };

 
  const renderDetailGrid = () => {
    const currentLuck = chart.luckPillars[selectedLuckIdx];
    const annualGanZhi = getGanZhiForYear(analysisYear, chart.dayMaster);
    
    const birthYear = parseInt(profile.birthDate.split('-')[0]);
    const ageInYear = analysisYear - birthYear + 1; // Nominal Age (虚岁)
    
    const startDaYunAge = chart.luckPillars[0]?.startAge || 999;
    const isXiaoYun = ageInYear < startDaYunAge;
    
    const xiaoYunData = chart.xiaoYun.find(x => x.age === ageInYear);

// 🔥 排序修正：年-月-日-时-运-流
const columns = [
        { title: '年柱', ganZhi: chart.pillars.year.ganZhi, data: chart.pillars.year },
        { title: '月柱', ganZhi: chart.pillars.month.ganZhi, data: chart.pillars.month },
        { title: '日柱', ganZhi: chart.pillars.day.ganZhi, data: chart.pillars.day },
        { title: '时柱', ganZhi: chart.pillars.hour.ganZhi, data: chart.pillars.hour },
        { title: isXiaoYun ? '小运' : '大运', isDynamic: true, ganZhi: isXiaoYun ? xiaoYunData?.ganZhi : currentLuck?.ganZhi, age: isXiaoYun ? xiaoYunData?.age : currentLuck?.startAge, year: isXiaoYun ? xiaoYunData?.year : currentLuck?.startYear },
        { title: '流年', isDynamic: true, ganZhi: annualGanZhi, age: ageInYear, year: analysisYear }
    ];

    return (
        <div className="space-y-4">
            <div className="bg-white border border-stone-300 rounded-lg overflow-hidden shadow-sm">
                <div className="grid grid-cols-[2.5rem_repeat(6,1fr)] divide-x divide-stone-200 divide-y border-b border-stone-200">
                     <div className="bg-stone-700 text-stone-50 flex items-center justify-center text-xs font-bold p-1">日期</div>
                     {columns.map((col, i) => <div key={i} className={`text-center py-1 text-sm font-bold ${col.isDynamic ? 'bg-blue-800 text-white' : 'bg-stone-700 text-stone-50'}`}>{col.title}</div>)}

                     <div className="bg-stone-100 flex items-center justify-center text-[10px] text-stone-500 font-medium leading-tight">岁/年</div>
                     {columns.map((col, i) => (<div key={i} className="text-center py-1 text-xs text-stone-600 h-9 flex flex-col justify-center bg-stone-50">{col.isDynamic ? (<><span className="text-blue-700 font-bold scale-90 block">{col.age}岁</span><span className="scale-75 text-stone-400 block -mt-0.5">{col.year}</span></>) : <span className="text-stone-300">-</span>}</div>))}

                     <div className="bg-stone-100 flex items-center justify-center text-sm font-bold text-stone-600">天干</div>
                     {columns.map((col, i) => <div key={i} className="h-16 bg-white">{col.ganZhi && (<div className="flex flex-col items-center justify-center h-full relative w-full cursor-pointer active:scale-95 transition-transform" onClick={() => openModal(col.title, col.ganZhi, [], false)}><span className="absolute top-1 right-0.5 text-[10px] text-stone-500 font-medium scale-90">{col.title === '日柱' ? (profile.gender === 'male' ? '元/男' : '元/女') : col.ganZhi.shiShenGan}</span><span className="text-3xl font-serif font-bold mt-2"><ElementText text={col.ganZhi.gan} /></span><span className="text-[10px] -mt-0.5 font-bold text-stone-400">(<ElementText text={col.ganZhi.ganElement} />)</span></div>)}</div>)}

                     <div className="bg-stone-100 flex items-center justify-center text-sm font-bold text-stone-600">地支</div>
                     {columns.map((col, i) => <div key={i} className="h-16 bg-white">{col.ganZhi && (<div className="flex flex-col items-center justify-center h-full relative w-full cursor-pointer active:scale-95 transition-transform" onClick={() => openModal(col.title, col.ganZhi, [], false)}><span className="text-3xl font-serif font-bold"><ElementText text={col.ganZhi.zhi} /></span><span className="text-[10px] -mt-0.5 font-bold text-stone-400">(<ElementText text={col.ganZhi.zhiElement} />)</span></div>)}</div>)}

                     <div className="bg-stone-100 flex items-center justify-center text-[10px] text-stone-500 font-bold">藏干</div>
                     {columns.map((col, i) => <div key={i} className="h-16 bg-white">{col.ganZhi && (<div className="flex flex-col items-center justify-center h-full w-full py-1 gap-0.5 px-0.5">{col.ganZhi.hiddenStems.map((h: any, j: number) => (<div key={j} className="flex items-center justify-between w-full max-w-[3.5rem] gap-1 leading-none"><span className="text-[10px] font-bold shrink-0"><ElementText text={h.stem} /></span><span className="text-[10px] text-stone-500 whitespace-nowrap scale-90">{h.shiShen}</span></div>))}</div>)}</div>)}

 {/* === 神煞 行 === */}
<div className="bg-stone-100 flex items-center justify-center text-[10px] text-stone-500 font-bold">神煞</div>
{columns.map((col, i) => {
  // 🔥 核心修改：动态计算神煞
  let shenShaList: string[] = [];
  
  if (col.data && col.data.shenSha) {
    // 1. 如果是四柱（有 data 属性），直接使用已有的神煞
    shenShaList = col.data.shenSha;
  } else if (col.ganZhi) {
    // 2. 如果是大运或流年（没有 data 属性，但有 ganZhi），实时计算
    shenShaList = getShenShaForDynamicPillar(col.ganZhi.gan, col.ganZhi.zhi, chart);
  }

  return (
    <div key={i} className="h-16 bg-white">
      {shenShaList.length > 0 ? (
        <div className="flex flex-wrap gap-1 justify-center items-center h-full px-1 overflow-y-auto no-scrollbar content-center">
          {shenShaList.slice(0, 3).map((ss: string, idx: number) => (
            <span
              key={idx}
              className={`text-[9px] px-1 rounded border whitespace-nowrap ${
                ss.includes('贵人') || ss.includes('禄') ? 'bg-amber-50 text-amber-700 border-amber-100' :
                ss.includes('桃花') || ss.includes('红艳') ? 'bg-rose-50 text-rose-700 border-rose-100' :
                'bg-stone-100 text-stone-600 border-stone-200'
              }`}
            >
              {ss}
            </span>
          ))}
          {/* 如果超过3个神煞，显示+号 */}
          {shenShaList.length > 3 && <span className="text-[8px] text-stone-400">+{shenShaList.length - 3}</span>}
        </div>
      ) : (
        <div className="text-center text-[10px] text-stone-300 h-full flex items-center justify-center">
          —
        </div>
      )}
    </div>
  );
})}                    
                     <div className="bg-stone-100 flex items-center justify-center text-[10px] text-stone-500">纳音</div>
                     {columns.map((col, i) => <div key={i} className="text-center py-1 text-[10px] text-stone-600 scale-90 whitespace-nowrap bg-stone-50/30 flex items-center justify-center">{col.ganZhi?.naYin}</div>)}

                     <div className="bg-stone-100 flex items-center justify-center text-[10px] text-stone-500">星运</div>
                     {columns.map((col, i) => <div key={i} className="text-center py-1 text-xs text-stone-700 bg-stone-50/30 flex items-center justify-center">{col.ganZhi?.lifeStage}</div>)}
                </div>
            </div>


<div className="flex overflow-x-auto divide-x divide-stone-200 no-scrollbar">
  {chart.luckPillars.map(l => {
    const isActive = !isXiaoYun && selectedLuckIdx === l.index - 1;
    return (
      <div
        key={l.index}
        onClick={() => {
          setSelectedLuckIdx(l.index - 1);
          setAnalysisYear(l.startYear);
        }}
        className={`flex-1 min-w-[3rem] py-2 cursor-pointer transition-colors flex flex-col items-center ${
          isActive ? 'bg-amber-100 ring-inset ring-2 ring-amber-400' : 'bg-white hover:bg-stone-50'
        }`}
      >
        <span className="text-[9px] text-stone-400 mb-1">{l.startAge}岁</span>
        <div className="font-serif font-bold text-sm"><ElementText text={l.ganZhi.gan} /></div>
        <div className="font-serif font-bold text-sm"><ElementText text={l.ganZhi.zhi} /></div>
        <span className="text-[9px] text-stone-400 mt-1">{l.startYear}</span>
      </div>
    );
  })}
</div>
            <div className="bg-white border border-stone-300 rounded-lg overflow-hidden shadow-sm p-2">
                <div className="text-xs font-bold text-stone-500 mb-2 px-1">流年选择 ({analysisYear})</div>
                <div className="grid grid-cols-5 gap-1">
                    {Array.from({length: 10}).map((_, i) => {
                        const lp = isXiaoYun ? { startYear: chart.xiaoYun[0]?.year || new Date().getFullYear() - 5 } : chart.luckPillars[selectedLuckIdx];
                        if (!lp) return <div key={i}></div>;
                        const y = (lp.startYear as number) + i;
                        const gz = getGanZhiForYear(y, chart.dayMaster);
                        const isSelected = analysisYear === y;
                        
                        const fortune = calculateAnnualFortune(chart, y);
                        let borderColor = 'border-stone-200';
                        let bgColor = 'bg-stone-50';
                        
                        if (isSelected) {
                            borderColor = 'border-amber-400';
                            bgColor = 'bg-amber-50';
                        } else if (fortune.rating === '吉') {
                            borderColor = 'border-green-200';
                            bgColor = 'bg-green-50/50';
                        } else if (fortune.rating === '凶') {
                            borderColor = 'border-red-200';
                            bgColor = 'bg-red-50/50';
                        }

                        return (
                            <div key={y} onClick={() => setAnalysisYear(y)} className={`py-1 rounded border text-center cursor-pointer transition-colors relative ${bgColor} ${borderColor} hover:border-stone-300`}>
                                <div className="text-[9px] text-stone-400">{y}</div>
                                <div className="font-serif font-bold text-sm"><ElementText text={gz.gan} /><ElementText text={gz.zhi} /></div>
                                {fortune.rating !== '平' && (
                                    <div className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${fortune.rating === '吉' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {annualFortune && <AnnualFortuneCard fortune={annualFortune} />}
        </div>
    );
  };

  const getSectionIcon = (id: string) => {
    switch (id) {
        case 'overview': return <Quote className="text-indigo-400" size={18} />;
        case 'investment_style': return <TrendingUp className="text-emerald-500" size={18} />;
        case 'market_industry': return <Briefcase className="text-amber-500" size={18} />;
        case 'stock_picks': return <Stars className="text-purple-500" size={18} />;
        case 'timing': return <Clock className="text-rose-400" size={18} />;
        case 'monthly_plan': return <CalendarDays className="text-sky-500" size={18} />;
        default: return <LayoutPanelLeft className="text-stone-400" size={18} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Sub Tabs */}
      <div className="flex border-b border-stone-200 overflow-x-auto no-scrollbar shrink-0">
        {tabs.map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveSubTab(tab.id)}
             className={`flex-1 py-3 text-sm font-bold whitespace-nowrap px-4 border-b-2 transition-colors ${activeSubTab === tab.id ? 'border-stone-800 text-stone-900' : 'border-transparent text-stone-400'}`}
           >
             {tab.label}
           </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-stone-50 p-4 custom-scrollbar pb-24">
         {activeSubTab === ChartSubTab.BASIC && renderBasicGrid()}
         
         {activeSubTab === ChartSubTab.DETAIL && renderDetailGrid()}

         {activeSubTab === ChartSubTab.ANALYSIS && (
             <div className="space-y-4 pb-12">
                 {/* API KEY Input Section */}
                 <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm mb-4">
                     <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center gap-2">
                             <Key size={16} className="text-amber-600" />
                             <h4 className="text-sm font-bold text-stone-800 font-serif">设置 AI 密令</h4>
                         </div>
                         {detectedPlatform && (
                             <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border ${detectedPlatform.color}`}>
                                 <ShieldCheck size={10} />
                                 {detectedPlatform.name}
                             </div>
                         )}
                     </div>
                     <div className="relative">
                         <input 
                             type={showApiKey ? "text" : "password"} 
                             value={apiKey}
                             onChange={(e) => handleApiKeyChange(e.target.value)}
                             placeholder="填入 DeepSeek 或 百炼 API KEY..."
                             className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-200 pr-10 font-mono"
                         />
                         <button 
                             onClick={() => setShowApiKey(!showApiKey)}
                             className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                         >
                             {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                         </button>
                     </div>
                     <p className="text-[10px] text-stone-400 mt-2 italic leading-tight">
                         * 填写后启用 AI 深度投资命理分析。识别 DeepSeek 或 阿里云百炼。
                     </p>
                 </div>

                 {!aiReportStructured && !loadingAi && (
                     <div className="mt-2">
                        <button
                            onClick={handleAiAnalysis}
                            disabled={!apiKey.trim()}
                            className={`w-full font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${apiKey.trim() ? 'bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98]' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
                        >
                            <BrainCircuit size={20} />
                            开启结构化深度报告
                        </button>
                        {!apiKey.trim() && <p className="text-center text-xs text-rose-500 mt-3 font-medium animate-pulse">需填写上方 API KEY 后开启推演</p>}
                     </div>
                 )}

                 {loadingAi && (
                     <div className="mt-6 flex flex-col items-center justify-center py-12 text-stone-400">
                         <Activity className="animate-spin mb-4 text-indigo-500" size={32} />
                         <p className="font-serif">正在融合传统命理与投资数据...</p>
                         <p className="text-[10px] mt-2 opacity-60">调用大师模型中，请耐心等待</p>
                     </div>
                 )}

                 {!loadingAi && aiReportStructured && (
                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                         <div className="bg-white border border-indigo-100 rounded-xl p-5 shadow-sm ring-4 ring-indigo-50/50">
                             <div className="flex items-center justify-between mb-6 border-b border-indigo-50 pb-4">
                                 <div className="flex items-center gap-2">
                                     <Sparkles size={20} className="text-amber-500" />
                                     <h3 className="font-bold text-stone-800 font-serif">深度财富推演报告</h3>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <button 
                                        onClick={handleAiAnalysis}
                                        className="text-xs flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-600 px-2 py-1 rounded-lg transition-colors font-medium"
                                    >
                                        <RotateCcw size={12} />
                                        重推
                                    </button>
                                 </div>
                             </div>
                             
                             <div className="space-y-8">
                                {aiReportStructured.sections.map((section) => (
                                    <div key={section.id} className="group">
                                        <div className="flex items-center gap-2 mb-3">
                                            {getSectionIcon(section.id)}
                                            <h4 className="font-bold text-stone-800 text-base font-serif">
                                                {section.title}
                                            </h4>
                                        </div>
                                        
                                        {section.type === 'text' && (
                                            <div className="text-sm text-stone-600 leading-relaxed font-serif bg-stone-50/50 p-4 rounded-xl border border-stone-100 italic relative">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-200 rounded-l-xl"></div>
                                                {section.content as string}
                                            </div>
                                        )}
                                        
                                        {section.type === 'list' && (
                                            <div className="space-y-3">
                                                {(section.content as any[]).map((item, idx) => (
                                                    <div key={idx} className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm hover:border-indigo-200 transition-colors">
                                                        <span className="text-[10px] font-bold text-stone-400 block mb-1 uppercase tracking-widest">{item.label}</span>
                                                        <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">{item.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {section.type === 'table' && (
                                            <div className="overflow-hidden rounded-xl border border-stone-200 shadow-sm">
                                                <div className="overflow-x-auto no-scrollbar">
                                                    <table className="w-full text-xs text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-stone-50 text-stone-500 font-bold uppercase tracking-tight">
                                                                {Object.keys((section.content as any[])[0] || {}).map((key) => (
                                                                    <th key={key} className="px-4 py-3 border-b border-stone-100">{key}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-stone-50">
                                                            {(section.content as any[]).map((row, idx) => (
                                                                <tr key={idx} className="bg-white hover:bg-stone-50 transition-colors">
                                                                    {Object.values(row).map((val: any, vIdx) => (
                                                                        <td key={vIdx} className="px-4 py-3 text-stone-700 font-medium">
                                                                            {val}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                             </div>
                             
                             <div className="mt-10 pt-6 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400 italic">
                                <div className="flex items-center gap-1">
                                    <CalendarDays size={10} />
                                    <span>推演于: {new Date(aiReportStructured.meta.generatedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Activity size={10} />
                                    <span>驱动: {aiReportStructured.meta.platform}</span>
                                </div>
                             </div>
                         </div>
                         
                         <button 
                            onClick={() => {
                                navigator.clipboard.writeText(aiReportStructured.copyText);
                                alert("深度报告已复制到剪贴板，建议保存至笔记应用。");
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-stone-900 text-stone-100 py-4 rounded-xl font-bold hover:bg-stone-800 transition-all shadow-lg active:scale-[0.98]"
                         >
                             <ClipboardCopy size={18} />
                             一键保存完整文本报告
                         </button>
                    </div>
                 )}
             </div>
         )}
      </div>
    </div>
  );
};

const TagEditModal: React.FC<{ 
    profile: UserProfile; 
    onClose: () => void; 
    onSave: (tags: string[]) => void; 
}> = ({ profile, onClose, onSave }) => {
    const [tags, setTags] = useState<string[]>(profile.tags || []);
    const [inputValue, setInputValue] = useState('');
    const presets = ['家人', '朋友', '同事', '客户', '自己'];

    const addTag = (tag: string) => {
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag]);
        }
        setInputValue('');
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleSave = () => {
        onSave(tags);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-xs rounded-2xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-stone-800 text-lg">编辑标签</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-100 text-stone-400"><X size={20}/></button>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 bg-stone-100 text-stone-600 px-2 py-1 rounded-lg text-sm border border-stone-200">
                            #{tag}
                            <button onClick={() => removeTag(tag)} className="ml-1 text-stone-400 hover:text-red-500"><X size={12}/></button>
                        </span>
                    ))}
                    {tags.length === 0 && <span className="text-stone-300 text-sm italic">暂无标签</span>}
                </div>

                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addTag(inputValue)}
                        className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-200"
                        placeholder="输入新标签..."
                    />
                    <button onClick={() => addTag(inputValue)} className="bg-stone-800 text-white rounded-xl px-3"><Plus size={18}/></button>
                </div>

                <div>
                    <span className="text-xs text-stone-400 font-bold mb-2 block">快捷预设</span>
                    <div className="flex flex-wrap gap-2">
                        {presets.map(p => (
                            <button 
                                key={p} 
                                onClick={() => addTag(p)}
                                disabled={tags.includes(p)}
                                className="px-2 py-1 rounded border text-xs border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-30"
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <button onClick={handleSave} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors">
                    保存更改
                </button>
            </div>
        </div>
    );
};

const ReportHistoryModal: React.FC<{
    profile: UserProfile;
    onClose: () => void;
}> = ({ profile, onClose }) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (content: string, id: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const reports = profile.aiReports ? [...profile.aiReports].sort((a, b) => b.date - a.date) : [];

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-stone-100">
                    <h3 className="font-bold text-stone-800 flex items-center gap-2">
                        <History size={18} className="text-indigo-500" /> 
                        历史解读存档
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-100 text-stone-400"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {reports.length === 0 ? (
                        <div className="text-center text-stone-400 py-8">暂无历史解读记录</div>
                    ) : (
                        reports.map((report) => (
                            <div key={report.id} className="bg-stone-50 border border-stone-100 rounded-xl p-3 hover:border-indigo-100 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-stone-500">
                                        {new Date(report.date).toLocaleString()}
                                    </span>
                                    <button 
                                        onClick={() => handleCopy(report.content, report.id)}
                                        className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full transition-all ${copiedId === report.id ? 'bg-green-100 text-green-700' : 'bg-white border text-stone-500 hover:bg-stone-100'}`}
                                    >
                                        {copiedId === report.id ? <Check size={12} /> : <ClipboardCopy size={12} />}
                                        {copiedId === report.id ? '已复制' : '复制全文'}
                                    </button>
                                </div>
                                <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed opacity-80 whitespace-pre-wrap font-serif">
                                    {report.content}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const ArchiveView: React.FC<{
  archives: UserProfile[];
  onSelect: (profile: UserProfile) => void;
  setArchives: (archives: UserProfile[]) => void;
}> = ({ archives, onSelect, setArchives }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTagsProfile, setEditingTagsProfile] = useState<UserProfile | null>(null);
  const [viewingHistoryProfile, setViewingHistoryProfile] = useState<UserProfile | null>(null);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这条档案吗？')) {
      const newArchives = deleteArchive(id);
      setArchives(newArchives);
    }
  };

  const handleTagsSave = (newTags: string[]) => {
      if (editingTagsProfile) {
          const updatedArchives = updateArchiveTags(editingTagsProfile.id, newTags);
          setArchives(updatedArchives);
      }
  };

  const filteredArchives = archives.filter(p => 
    p.name.includes(searchTerm) || 
    p.tags?.some(t => t.includes(searchTerm))
  ).sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));

  return (
    <div className="bg-stone-50 min-h-full flex flex-col">
        {/* Search Bar */}
        <div className="p-4 bg-white border-b border-stone-200 sticky top-0 z-10">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input 
                    type="text" 
                    placeholder="搜索姓名或标签..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-stone-100 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm text-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-stone-200 outline-none transition-all"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-24 custom-scrollbar">
            {filteredArchives.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                    <FileText size={24} className="opacity-30" />
                </div>
                <p className="text-sm">
                    {searchTerm ? '未找到匹配的档案' : '暂无存档记录'}
                </p>
                </div>
            ) : (
                <div className="space-y-3">
                {filteredArchives.map(profile => (
                    <div 
                    key={profile.id}
                    onClick={() => onSelect(profile)}
                    className="group bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:shadow-md hover:border-amber-200 transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-stone-200 group-hover:bg-amber-400 transition-colors"></div>
                        <div className="flex items-start gap-4 pl-2">
                            <AvatarIcon name={profile.avatar} size={20} className="mt-1" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-stone-800 truncate text-base">{profile.name}</h4>
                                    <span className="text-[10px] text-stone-400 shrink-0">
                                        {new Date(profile.lastUpdated || profile.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${profile.gender === 'male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                                        {profile.gender === 'male' ? '乾造' : '坤造'}
                                    </span>
                                    <span>{profile.birthDate}</span>
                                    <span>{profile.birthTime}</span>
                                    {profile.isSolarTime && <Sun size={10} className="text-amber-500" />}
                                </div>

                                <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                                    {/* Action Buttons inside Card */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingTagsProfile(profile); }}
                                        className="flex items-center gap-1 text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-500 px-2 py-0.5 rounded-full border border-stone-200 transition-colors"
                                    >
                                        <Tag size={10} />
                                        {profile.tags && profile.tags.length > 0 ? profile.tags.join(', ') : '添加标签'}
                                    </button>

                                    {profile.aiReports && profile.aiReports.length > 0 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setViewingHistoryProfile(profile); }}
                                            className="flex items-center gap-1 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 transition-colors"
                                        >
                                            <Sparkles size={10} />
                                            历史解读 ({profile.aiReports.length})
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <button 
                                onClick={(e) => handleDelete(e, profile.id)}
                                className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                </div>
            )}
        </div>

        {/* Modals */}
        {editingTagsProfile && (
            <TagEditModal 
                profile={editingTagsProfile} 
                onClose={() => setEditingTagsProfile(null)} 
                onSave={handleTagsSave} 
            />
        )}

        {viewingHistoryProfile && (
            <ReportHistoryModal 
                profile={viewingHistoryProfile} 
                onClose={() => setViewingHistoryProfile(null)} 
            />
        )}
    </div>
  );
};

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AppTab>(AppTab.HOME);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [chart, setChart] = useState<BaziChart | null>(null);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [archives, setArchives] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. 加载存档
    setArchives(getArchives());

    // 2. 紧急修复：注销所有 Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          console.log('Unregistering SW:', registration);
          registration.unregister();
        });
      }).catch(err => console.warn('SW Cleanup failed:', err));
    }
  }, []);

  const handleGenerate = (profile: UserProfile, subTab?: ChartSubTab) => {
    try {
        const newChart = calculateBazi(profile);
        const updatedArchives = saveArchive(profile);
        setArchives(updatedArchives);
        
        setCurrentProfile(profile);
        setChart(newChart);
        setCurrentTab(AppTab.CHART);
    } catch (error) {
        console.error("Failed to generate Bazi chart:", error);
        alert(`生成命盘时出错: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleSelectArchive = (profile: UserProfile) => {
    try {
        const newChart = calculateBazi(profile);
        setCurrentProfile(profile);
        setChart(newChart);
        setCurrentTab(AppTab.CHART);
    } catch (error) {
        console.error("Failed to generate Bazi chart from archive:", error);
        alert(`从存档加载命盘时出错: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleSaveReport = (report: string) => {
    if (currentProfile) {
      const updatedArchives = saveAiReportToArchive(currentProfile.id, report);
      setArchives(updatedArchives);
      // Also update current profile to reflect new report
      const updatedProfile = updatedArchives.find(p => p.id === currentProfile.id);
      if (updatedProfile) {
          setCurrentProfile(updatedProfile);
      }
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case AppTab.HOME:
        return <HomeView onGenerate={handleGenerate} archives={archives} />;
      case AppTab.CHART:
        if (!currentProfile || !chart) {
            return <HomeView onGenerate={handleGenerate} archives={archives} />;
        }
        return (
          <ChartView 
            profile={currentProfile} 
            chart={chart} 
            onReset={() => {
                setChart(null);
                setCurrentProfile(null);
                setCurrentTab(AppTab.HOME);
            }} 
            onShowModal={setModalData}
            onSaveReport={handleSaveReport}
          />
        );
      case AppTab.ARCHIVE:
        return <ArchiveView archives={archives} onSelect={handleSelectArchive} setArchives={setArchives} />;
      default:
        // Removed TIPS view fallthrough
        return <HomeView onGenerate={handleGenerate} archives={archives} />;
    }
  };

  const getTitle = () => {
      switch (currentTab) {
          case AppTab.HOME: return '玄枢命理';
          case AppTab.CHART: return currentProfile ? `${currentProfile.name}命盘` : '命盘推演';
          case AppTab.ARCHIVE: return '档案管理';
          default: return '玄枢命理';
      }
  };

  return (
    <div className="flex flex-col h-screen bg-stone-50 overflow-hidden font-sans text-stone-900">
      <Header 
        title={getTitle()} 
        rightAction={
            currentTab === AppTab.CHART && currentProfile ? (
                <button onClick={() => {
                    setChart(null);
                    setCurrentProfile(null);
                    setCurrentTab(AppTab.HOME);
                }} className="p-2 text-stone-400 hover:text-stone-700">
                    <RotateCcw size={18} />
                </button>
            ) : null
        }
      />
      
      <div className="flex-1 overflow-hidden relative">
         {renderContent()}
      </div>

      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />

      {modalData && (
          <InfoModal 
             data={modalData} 
             chart={chart} 
             onClose={() => setModalData(null)} 
          />
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center transition-opacity">
            <Activity className="animate-spin text-indigo-500" size={48} />
            <p className="mt-4 text-stone-600 font-medium animate-pulse">AI 排盘中，请稍候...</p>
        </div>
      )}
    </div>
  );
};

export default App;