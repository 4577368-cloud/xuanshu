import React, { useState, useEffect, useMemo } from 'react';
import { BottomNav, Header } from './components/Layout';
import { AppTab, ChartSubTab, UserProfile, BaziChart, Gender, TrendActivation, Pillar, GanZhi, BalanceAnalysis, AnnualFortune, PatternAnalysis, InterpretationResult, AiReportRecord, ModalData } from './types';
import { calculateBazi, getGanZhiForYear, calculateAnnualTrend, getShenShaForDynamicPillar, calculateAnnualFortune, getAdvancedInterpretation } from './services/baziService';
import { analyzeBaziStructured, BaziReport } from './services/geminiService';
import { getArchives, saveArchive, deleteArchive, saveAiReportToArchive, updateArchiveTags, updateArchiveAvatar, updateArchiveName } from './services/storageService';
import { User, Calendar, ArrowRight, Activity, BrainCircuit, RotateCcw, ChevronDown, Info, BarChart3, Tag, Zap, ScrollText, Stars, Clock, X, BookOpen, Compass, AlertTriangle, CheckCircle, MinusCircle, Crown, Search, Key, Sparkles, Smile, Heart, Star, Sun, Moon, Cloud, Ghost, Flower2, Bird, Cat, Edit2, Trash2, Plus, Copy, FileText, ChevronRight, Play, MapPin, Check, History, ClipboardCopy, Building, Baby, GitCommitHorizontal, Eye, EyeOff, ShieldCheck, Quote, TrendingUp, CalendarDays, Briefcase, LayoutPanelLeft } from 'lucide-react';
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

const BalanceCard: React.FC<{ balance: BalanceAnalysis; dm: string }> = ({ balance, dm }) => {
  const { dayMasterStrength, yongShen, xiShen, jiShen, method, advice } = balance;
  const scorePercent = Math.min(100, Math.max(0, (dayMasterStrength.score / 10) * 100));
  return (
    <div className="bg-white border border-stone-300 rounded-lg overflow-hidden shadow-sm font-serif">
      <div className="bg-stone-50 border-b border-stone-200 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Compass size={16} className="text-amber-700" />
           <span className="font-bold text-sm text-stone-800">局势判断</span>
        </div>
        <div className="text-[10px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full">{method}法则</div>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-stone-800">日主{dm}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded border ${
                    dayMasterStrength.level === '身强' ? 'bg-red-50 text-red-700 border-red-100' :
                    dayMasterStrength.level === '身弱' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    'bg-green-50 text-green-700 border-green-100'
                }`}>{dayMasterStrength.level}</span>
            </div>
            <span className="text-[10px] text-stone-500">{dayMasterStrength.description}</span>
        </div>
        <div className="relative h-2 bg-stone-100 rounded-full overflow-hidden">
             <div className="absolute inset-0 opacity-20" style={{background: 'linear-gradient(to right, #3b82f6, #22c55e, #ef4444)'}}></div>
             <div className="absolute top-0 bottom-0 w-1 bg-stone-800 shadow-md transform -translate-x-1/2 transition-all duration-500" style={{ left: `${scorePercent}%` }}></div>
        </div>
        <div className="flex justify-between text-[10px] text-stone-400"><span>弱</span><span>中</span><span>强</span></div>
        <div className="h-px bg-stone-100"></div>
        <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                 <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span><span className="text-xs font-bold text-stone-700">喜用神</span></div>
                 <div className="flex flex-wrap gap-1.5">{yongShen.map(el => (<div key={el} className="w-8 h-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center shadow-sm"><ElementText text={el} className="font-bold text-sm" /></div>))}{xiShen.map(el => (<div key={el} className="w-8 h-8 rounded-lg bg-green-50/50 border border-green-100/50 flex items-center justify-center border-dashed"><ElementText text={el} className="font-bold text-xs opacity-80" /></div>))}</div>
             </div>
             <div className="space-y-2">
                 <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-xs font-bold text-stone-700">忌神</span></div>
                 <div className="flex flex-wrap gap-1.5">{jiShen.map(el => (<div key={el} className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shadow-sm"><ElementText text={el} className="font-bold text-sm" /></div>))}</div>
             </div>
        </div>
        <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 text-xs text-stone-600 leading-relaxed italic"><Info size={12} className="inline mr-1 -mt-0.5 text-stone-400" />{advice}</div>
      </div>
    </div>
  );
};

const PatternCard: React.FC<{ pattern: PatternAnalysis }> = ({ pattern }) => {
  const { name, type, isEstablished, level, keyFactors, description } = pattern;
  return (
    <div className="bg-white border border-stone-300 rounded-lg overflow-hidden shadow-sm font-serif">
      <div className="bg-stone-50 border-b border-stone-200 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2"><Crown size={16} className="text-purple-700" /><span className="font-bold text-sm text-stone-800">完整格局判定</span></div>
        <div className="flex items-center gap-2"><span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">{type}</span><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isEstablished ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{isEstablished ? '成格' : '破格'}</span></div>
      </div>
      <div className="p-4 space-y-4">
          <div className="flex items-baseline justify-between"><h3 className="text-xl font-bold text-stone-800">{name}</h3><span className={`text-xs font-bold px-2 py-1 rounded ${level === '上等' ? 'bg-yellow-100 text-yellow-800' : level === '中等' ? 'bg-stone-100 text-stone-600' : level === '下等' ? 'bg-stone-100 text-stone-400' : 'bg-red-50 text-red-500'}`}>层次：{level}</span></div>
          <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-100 italic">{description}</p>
          <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><span className="text-[10px] font-bold text-stone-400 uppercase">成格有利因素</span><div className="flex flex-wrap gap-1">{keyFactors.beneficial.length > 0 ? keyFactors.beneficial.map((f, i) => (<span key={i} className="text-[10px] bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 rounded">{f}</span>)) : <span className="text-[10px] text-stone-300">-</span>}</div></div>
              <div className="space-y-1"><span className="text-[10px] font-bold text-stone-400 uppercase">破格/不利因素</span><div className="flex flex-wrap gap-1">{keyFactors.destructive.length > 0 ? keyFactors.destructive.map((f, i) => (<span key={i} className="text-[10px] bg-red-50 text-red-700 border-red-100 px-1.5 py-0.5 rounded">{f}</span>)) : <span className="text-[10px] text-stone-300">-</span>}</div></div>
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
                 <div className="flex-1 bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200 rounded-lg p-3 flex flex-col items-center"><span className="text-[10px] text-stone-400 font-bold uppercase mb-1">地支</span><ElementText text={branch} className="text-4xl font-serif font-bold mb-1" /><span className="text-xs text-stone-500">{branchElement} · {ganZhi.zhiElement}</span></div>
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

const TipsView: React.FC<{ chart: BaziChart | null }> = ({ chart }) => {
  if (!chart) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <div className="bg-stone-200 p-4 rounded-full">
           <Sparkles size={32} className="text-stone-400" />
        </div>
        <h3 className="text-lg font-bold text-stone-600">命理提示</h3>
        <p className="text-sm text-stone-400">
          请先在首页进行【排盘推演】，<br/>此处将展示您的五行强弱、神煞布局等深度资讯。
        </p>
      </div>
    );
  }

  // Collect all unique Shen Sha with pillar info
  const allShenShaMap = new Map<string, string[]>();
  ['year', 'month', 'day', 'hour'].forEach(key => {
      const p = chart.pillars[key as keyof typeof chart.pillars];
      p.shenSha.forEach(ss => {
          const cleanName = ss.replace(/\(.*\)/, '');
          if (!allShenShaMap.has(cleanName)) allShenShaMap.set(cleanName, []);
          allShenShaMap.get(cleanName)?.push(p.name);
      });
  });

  const getShenShaConfig = (name: string) => {
      if (name.includes('贵人') || name.includes('德') || name.includes('喜') || name.includes('红鸾') || name.includes('解神') || name.includes('天赦') || name.includes('将星') || name.includes('金舆') || name.includes('学堂') || name.includes('词馆')) {
          return { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-800', tagBg: 'bg-amber-100', tagText: 'text-amber-700', desc: 'text-amber-900/70', icon: Star };
      }
      if (name.includes('桃花') || name.includes('咸池') || name.includes('红艳') || name.includes('孤鸾') || name.includes('阴差') || name.includes('四废') || name.includes('八专') || name.includes('九丑')) {
          return { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-800', tagBg: 'bg-rose-100', tagText: 'text-rose-700', desc: 'text-rose-900/70', icon: Heart };
      }
      if (name.includes('驿马') || name.includes('劫煞') || name.includes('灾煞') || name.includes('亡神')) {
          return { bg: 'bg-sky-50', border: 'border-sky-100', text: 'text-sky-800', tagBg: 'bg-sky-100', tagText: 'text-sky-700', desc: 'text-sky-900/70', icon: Zap };
      }
      if (name.includes('禄') || name.includes('羊刃') || name.includes('飞刃') || name.includes('金神') || name.includes('魁罡') || name.includes('国印')) {
          return { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-800', tagBg: 'bg-emerald-100', tagText: 'text-emerald-700', desc: 'text-amber-900/70', icon: Crown };
      }
      if (name.includes('华盖') || name.includes('孤辰') || name.includes('寡宿') || name.includes('天医') || name.includes('六秀') || name.includes('太极')) {
          return { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-800', tagBg: 'bg-violet-100', tagText: 'text-violet-700', desc: 'text-violet-900/70', icon: BookOpen };
      }
      return { bg: 'bg-stone-100', border: 'border-stone-200', text: 'text-stone-700', tagBg: 'bg-stone-200', tagText: 'text-stone-500', desc: 'text-stone-500', icon: Sparkles };
  };

  return (
    <div className="flex flex-col h-full bg-stone-100 overflow-y-auto p-4 custom-scrollbar pb-24">
        {/* Five Elements */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm mb-4">
            <h4 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><BarChart3 size={16} /> 五行强弱分布</h4>
            <div className="space-y-3">
                {['木', '火', '土', '金', '水'].map(el => {
                    const count = chart.wuxingCounts[el] || 0;
                    const max = Math.max(...Object.values(chart.wuxingCounts));
                    const percent = max > 0 ? (count / max) * 100 : 0;
                    const colors: Record<string, string> = {'木':'bg-green-500','火':'bg-red-500','土':'bg-amber-600','金':'bg-orange-400','水':'bg-blue-500'};
                    return (
                        <div key={el} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${colors[el].replace('500','100').replace('600','100').replace('400','100')} flex items-center justify-center font-bold text-sm ${colors[el].replace('bg-','text-')}`}>
                                {el}
                            </div>
                            <div className="flex-1 h-3 bg-stone-100 rounded-full overflow-hidden">
                                <div className={`h-full ${colors[el]} transition-all duration-500`} style={{width: `${percent}%`}}></div>
                            </div>
                            <span className="font-bold text-stone-700 w-6 text-right">{count}</span>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Hidden Stems */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm mb-4">
            <h4 className="font-bold text-stone-800 mb-3 flex items-center gap-2"><Search size={16} /> 藏干深浅</h4>
            <div className="space-y-3">
                {['year', 'month', 'day', 'hour'].map(key => {
                    const p = chart.pillars[key as keyof typeof chart.pillars];
                    return (
                        <div key={key} className="flex items-start gap-3 border-b border-stone-50 last:border-0 pb-2 last:pb-0">
                            <div className="w-8 text-[10px] text-stone-400 pt-1 uppercase">{p.name}</div>
                            <div className="flex-1 flex flex-wrap gap-2">
                                {p.ganZhi.hiddenStems.map((hs, i) => (
                                    <div key={i} className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${hs.type === '主气' ? 'bg-stone-800 text-white border-stone-800' : 'bg-stone-50 text-stone-600 border-stone-200'}`}>
                                        <span className="font-serif font-bold">{hs.stem}</span>
                                        <span className="opacity-70 scale-90 text-[10px]">({hs.shiShen})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Shen Sha Layout */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm mb-4">
            <div className="bg-stone-50 px-4 py-3 border-b border-stone-100 font-bold text-sm text-stone-800 flex items-center gap-2">
                <Stars size={16} className="text-purple-600" /> 神煞布局
            </div>
            <div className="divide-y divide-stone-100">
                {['year', 'month', 'day', 'hour'].map(key => {
                    const p = chart.pillars[key as keyof typeof chart.pillars];
                    return (
                        <div key={key} className="p-3 flex gap-3">
                            <div className="w-10 shrink-0 flex flex-col items-center justify-center bg-stone-50 rounded-lg h-12">
                                <span className="text-[10px] text-stone-400">{p.name}</span>
                                <span className="font-bold text-stone-800">{p.ganZhi.zhi}</span>
                            </div>
                            <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                                {p.shenSha.length > 0 ? p.shenSha.map(s => {
                                    const style = getShenShaConfig(s);
                                    return (
                                        <span key={s} className={`text-[10px] px-2 py-1 rounded border ${style.bg} ${style.border} ${style.text}`}>{s}</span>
                                    );
                                }) : <span className="text-xs text-stone-300 italic">无明显神煞</span>}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Shen Sha Detailed List */}
        {allShenShaMap.size > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm mb-4">
                <h4 className="font-bold text-sm text-stone-800 mb-3 flex items-center gap-2"><BookOpen size={16} className="text-indigo-500" /> 神煞详解</h4>
                <div className="grid grid-cols-1 gap-2">
                    {Array.from(allShenShaMap.entries()).map(([name, pillars]) => {
                        const desc = SHEN_SHA_DESCRIPTIONS[name] || '吉凶参半，需视全局而定。';
                        const style = getShenShaConfig(name);
                        const Icon = style.icon;
                        return (
                            <div key={name} className={`flex flex-col rounded-lg p-3 border transition-colors ${style.bg} ${style.border}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2">
                                        {Icon && <Icon size={14} className={style.text} />}
                                        <span className={`font-bold text-sm ${style.text}`}>{name}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {pillars.map(p => (
                                            <span key={p} className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${style.tagBg} ${style.tagText}`}>
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <p className={`text-xs leading-relaxed ${style.desc}`}>{desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Interactions */}
        {chart.shenShaInteractions.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm mb-4">
                <h4 className="font-bold text-sm text-stone-800 mb-3 flex items-center gap-2"><Zap size={16} className="text-amber-500" /> 组合吉凶</h4>
                <div className="space-y-2">
                    {chart.shenShaInteractions.map((inter, i) => (
                        <div key={i} className={`p-3 rounded-lg border text-xs flex justify-between items-start ${inter.severity === '吉' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                            <div>
                                <div className="font-bold mb-1">{inter.name}</div>
                                <div className="opacity-80">{inter.description}</div>
                            </div>
                            <div className="font-bold text-[10px] uppercase tracking-wider opacity-60 bg-white/50 px-1 rounded">{inter.severity}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  )
}

const HomeView: React.FC<{ onGenerate: (profile: UserProfile, subTab?: ChartSubTab) => void }> = ({ onGenerate }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  // 核心修改：允许自由输入的日期 State，不强求标准格式
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [birthTime, setBirthTime] = useState('12:00');
  const [isSolarTime, setIsSolarTime] = useState(false);
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  // Handle Province Change
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setProvince(e.target.value);
      setCity(''); // Reset city
      setLongitude(undefined); // Reset longitude
  };

  // Handle City Change
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const cityName = e.target.value;
      setCity(cityName);
      const provData = CHINA_LOCATIONS.find(p => p.name === province);
      const cityData = provData?.cities.find(c => c.name === cityName);
      if (cityData) {
          setLongitude(cityData.longitude);
      }
  };

  // 1. onChange: 只负责接收用户输入，不做任何“自作聪明”的修改
  // 允许用户输入 1986、19868、198682... 等中间状态
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // 允许输入数字和横杠，禁止其他字符
    if (/^[\d-]*$/.test(val)) {
      setBirthDate(val); 
    }
  };

  // 2. onBlur: 当用户输完离开时，才进行“强力格式化”
  const handleDateBlur = () => {
    // 去除横杠，只看数字
    let raw = birthDate.replace(/\D/g, '');
    
    // 情况 A: 用户输入了完整 8 位 (19860827) -> 完美，转为 1986-08-27
    if (raw.length === 8) {
      setBirthDate(`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`);
    }
    // 情况 B: 用户输入了 7 位 (1986827) -> 可能是 1986-8-27，尝试补全
    // 逻辑：年份4位 + 月份1位 + 日期2位 (通常是月份缺0)
    else if (raw.length === 7) {
      const y = raw.slice(0, 4);
      const m = raw.slice(4, 5); // 取1位作为月份
      const d = raw.slice(5, 7);
      setBirthDate(`${y}-0${m}-${d}`); // 补全为 1986-08-27
    }
    // 情况 C: 用户输入了 6 位 (198681) -> 可能是 1986-8-1
    else if (raw.length === 6) {
        const y = raw.slice(0, 4);
        const m = raw.slice(4, 5);
        const d = raw.slice(5, 6);
        setBirthDate(`${y}-0${m}-0${d}`); // 补全为 1986-08-01
    }
    // 其他情况不做处理，保留原样让用户自己看
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate || !birthTime) return; // 只要求时间和日期

    const profile: UserProfile = {
      id: Date.now().toString(),
      name,
      gender,
      birthDate,
      birthTime,
      isSolarTime,
      province,
      city,
      longitude, // Pass longitude to service
      createdAt: Date.now(),
      avatar: 'default'
    };
    onGenerate(profile);
  };

  return (
    <div className="flex flex-col h-full bg-white p-6 overflow-y-auto pb-24">
       <div className="text-center mb-6 mt-4">
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
                  inputMode="numeric" // 手机端弹出数字键盘
                  value={birthDate} 
                  onChange={handleDateChange} // 👈 只有纯粹的更新，无干扰
                  onBlur={handleDateBlur}     // 👈 离开时才格式化
                  placeholder="如: 19860827 (支持连写)" 
                  maxLength={10} 
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 font-sans text-sm tracking-widest"
                  required
                />
                
                {/* 只有当格式完全正确时 (YYYY-MM-DD)，才显示绿色对勾 */}
                {/^\d{4}-\d{2}-\d{2}$/.test(birthDate) && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 animate-in zoom-in duration-300">
                    <Check size={16} />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-stone-400 mt-1 pl-1">
                支持 8 位纯数字连写 (推荐)，如 <b>19900101</b>
              </p>
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

          <button 
            type="submit" 
            className="w-full bg-stone-900 text-white font-bold py-4 rounded-xl shadow-xl shadow-stone-200 hover:bg-stone-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
          >
            <Compass size={20} />
            排盘推演
          </button>
       </form>
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
  
  // AI API KEY State
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
         <ChartInfoCard chart={chart} />
         <div className="bg-white border border-stone-300 rounded-lg overflow-hidden shadow-sm">
            <div className="grid grid-cols-5 divide-x divide-stone-200 bg-stone-100 border-b border-stone-300 text-center text-sm font-bold text-stone-700"><div className="py-2 bg-stone-200/50"></div>{pillars.map(p => <div key={p.key} className="py-2">{p.label}</div>)}</div>
            {rows.map((row, idx) => (<div key={idx} className={`grid grid-cols-5 divide-x divide-stone-200 border-b border-stone-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}`}><div className="flex items-center justify-center font-bold text-xs text-stone-500 bg-stone-100/30 p-2">{row.label}</div>{pillars.map(p => (<div key={p.key} className="flex flex-col items-center justify-center p-1.5 text-center min-h-[2.5rem] relative">{row.render(p.data)}</div>))}</div>))}
         </div>
         <PatternCard pattern={chart.pattern} />
         <BalanceCard balance={chart.balance} dm={chart.dayMaster} />
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

const columns = [
        { title: '时柱', ganZhi: chart.pillars.hour.ganZhi, data: chart.pillars.hour },
        { title: '日柱', ganZhi: chart.pillars.day.ganZhi, data: chart.pillars.day },
        { title: '月柱', ganZhi: chart.pillars.month.ganZhi, data: chart.pillars.month },
        { title: '年柱', ganZhi: chart.pillars.year.ganZhi, data: chart.pillars.year },
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

// Tag Management Modal
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

// Report History Modal
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
    setArchives(getArchives());
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
        return <HomeView onGenerate={handleGenerate} />;
      case AppTab.CHART:
        if (!currentProfile || !chart) {
            return <HomeView onGenerate={handleGenerate} />;
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
      case AppTab.TIPS:
        return <TipsView chart={chart} />;
      case AppTab.ARCHIVE:
        return <ArchiveView archives={archives} onSelect={handleSelectArchive} setArchives={setArchives} />;
      default:
        return <HomeView onGenerate={handleGenerate} />;
    }
  };

  const getTitle = () => {
      switch (currentTab) {
          case AppTab.HOME: return '玄枢命理';
          case AppTab.CHART: return currentProfile ? `${currentProfile.name}命盘` : '命盘推演';
          case AppTab.TIPS: return '命理提示';
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