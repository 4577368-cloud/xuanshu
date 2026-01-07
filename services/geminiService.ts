import { GoogleGenAI } from "@google/genai";
import { BaziChart } from "../types";

export const analyzeBazi = async (chart: BaziChart, question?: string): Promise<string> => {
  try {
    // Initialize Google GenAI client
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Helper to format Luck Pillars (Da Yun)
    const formatDaLiu = () => {
      if (chart.luckPillars && chart.luckPillars.length > 0) {
        return chart.luckPillars.map(lp => 
           `${lp.index}. ${lp.startAge}岁 ${lp.ganZhi.gan}${lp.ganZhi.zhi} (${lp.startYear}年 - ${lp.endYear}年)`
        ).join('\n');
      }
      if (chart.daLiu && chart.daLiu.length > 0) {
        return chart.daLiu.map((yun, idx) => 
          `${idx+1}. ${yun.startAge}岁 ${yun.ganZhi} (${yun.element})`
        ).join('\n');
      }
      return "未计算大运";
    };

    // Helper to format Shen Sha
    const shenShaInfo = chart.shenSha ? `
      吉神: ${chart.shenSha.auspicious?.join('、') || '无'}
      凶煞: ${chart.shenSha.inauspicious?.join('、') || '无'}
      贵人: ${chart.shenSha.noblemen?.join('、') || '无'}
    ` : '未计算神煞';

    // Helper to format Kong Wang
    const kongWangInfo = chart.kongWang ? 
      `空亡地支: ${chart.kongWang.join('、')}` : '未计算空亡';

    // Helper to format Shi Shen (Ten Gods)
    const formatShiShen = () => {
      if (chart.shiShenRelations) {
        const relations = chart.shiShenRelations;
        return `
        年柱: ${relations.year.gan}${relations.year.zhi}
        月柱: ${relations.month.gan}${relations.month.zhi}
        日柱: ${relations.day.gan}${relations.day.zhi}
        时柱: ${relations.hour.gan}${relations.hour.zhi}
        `;
      }
      // Fallback to pillars data
      return `
      年柱: ${chart.pillars.year.ganZhi.shiShenGan || '-'} / ${chart.pillars.year.ganZhi.hiddenStems[0]?.shiShen || '-'}
      月柱: ${chart.pillars.month.ganZhi.shiShenGan || '-'} / ${chart.pillars.month.ganZhi.hiddenStems[0]?.shiShen || '-'}
      日柱: 日主 / ${chart.pillars.day.ganZhi.hiddenStems[0]?.shiShen || '-'}
      时柱: ${chart.pillars.hour.ganZhi.shiShenGan || '-'} / ${chart.pillars.hour.ganZhi.hiddenStems[0]?.shiShen || '-'}
      `;
    };

    // Helper for Na Yin
    const naYinInfo = chart.naYinElements ? 
      `年柱纳音: ${chart.naYinElements.year}
      月柱纳音: ${chart.naYinElements.month}
      日柱纳音: ${chart.naYinElements.day}
      时柱纳音: ${chart.naYinElements.hour}` 
      : `年柱纳音: ${chart.pillars.year.ganZhi.naYin}
      月柱纳音: ${chart.pillars.month.ganZhi.naYin}
      日柱纳音: ${chart.pillars.day.ganZhi.naYin}
      时柱纳音: ${chart.pillars.hour.ganZhi.naYin}`;

    // Helper for Tai Yuan / Ming Gong
    const taiYuanMingGong = chart.taiYuanMingGong ? `
      胎元: ${chart.taiYuanMingGong.taiYuan}
      命宫: ${chart.taiYuanMingGong.mingGong}
      身宫: ${chart.taiYuanMingGong.shenGong || '未计算'}
    ` : '未计算胎元命宫';

    // Helper for Tiao Hou
    const tiaoHouShen = chart.balance.tiaoHouYongShen ? 
      `调候用神: ${chart.balance.tiaoHouYongShen.join('、')}` : '';

    // Construct the full chart description for the prompt
    const chartDescription = `
## 📜 命主基本信息
- **性别**: ${chart.gender === 'male' ? '男命' : '女命'}
- **出生时间**: ${chart.birthTime?.year || ''}年 ${chart.birthTime?.month || ''}月 ${chart.birthTime?.day || ''}日 ${chart.birthTime?.hour || ''}时
- **八字四柱**: 
  - 年柱: ${chart.pillars.year.ganZhi.gan}${chart.pillars.year.ganZhi.zhi} (${chart.pillars.year.ganZhi.ganElement}${chart.pillars.year.ganZhi.zhiElement})
  - 月柱: ${chart.pillars.month.ganZhi.gan}${chart.pillars.month.ganZhi.zhi} (${chart.pillars.month.ganZhi.ganElement}${chart.pillars.month.ganZhi.zhiElement})
  - 日柱: ${chart.pillars.day.ganZhi.gan}${chart.pillars.day.ganZhi.zhi} (${chart.pillars.day.ganZhi.ganElement}${chart.pillars.day.ganZhi.zhiElement})
  - 时柱: ${chart.pillars.hour.ganZhi.gan}${chart.pillars.hour.ganZhi.zhi} (${chart.pillars.hour.ganZhi.ganElement}${chart.pillars.hour.ganZhi.zhiElement})

## 🌟 核心命局分析
- **日主**: ${chart.dayMaster} (${chart.dayMasterElement})
- **身强弱**: ${chart.balance.dayMasterStrength.level} (${chart.balance.dayMasterStrength.score})
- **命局格局**: ${chart.pattern.name} - ${chart.pattern.level} - ${chart.pattern.isEstablished ? '✅ 成格' : '❌ 破格'}
  ${chart.pattern.description ? `  ${chart.pattern.description}` : ''}

## ⚖️ 五行平衡
- **五行分布**: 金${chart.wuxingCounts['金']} 木${chart.wuxingCounts['木']} 水${chart.wuxingCounts['水']} 火${chart.wuxingCounts['火']} 土${chart.wuxingCounts['土']}
- **喜用神**: ${chart.balance.yongShen.join('、')}
- **忌神**: ${chart.balance.jiShen?.join('、') || '待分析'}
  ${tiaoHouShen}

## 🔮 十神格局
${formatShiShen()}

## 🏮 神煞纳音
${shenShaInfo}
${kongWangInfo}

## 🌌 纳音五行
${naYinInfo}

## 🏛️ 胎元命宫
${taiYuanMingGong}

## 📅 大运流年
### 起运时间: ${chart.startLuckText || chart.startYunAge + '岁'}
### 大运走势:
${formatDaLiu()}

## 💫 特殊格局与特征
${chart.specialPatterns ? chart.specialPatterns.map(p => `- ${p.name}: ${p.description}`).join('\n') : '待分析'}

## 🔥 当前关注
- **当前大运**: ${chart.currentDaYun || '见大运列表'}
- **近年关键流年**: ${chart.keyYears ? chart.keyYears.join('、') : '待分析'}
`;

    // System Prompt Definition
    const systemPrompt = `你是一位精通《三命通会》、《渊海子平》、《滴天髓》、《子平真诠》等经典的资深八字命理大师，兼具现代心理学和社会学视角。

## 🌿 你的分析风格
1. **专业精准**: 基于八字原理，准确分析格局、用神
2. **古雅深邃**: 引用经典，使用典雅的古文词汇
3. **积极引导**: 避免宿命论，强调人的主观能动性
4. **结构清晰**: 按模块分析，逻辑层次分明
5. **实用建议**: 提供可操作的生活指导

## 📋 分析框架要求
请严格按照以下结构组织分析报告，使用markdown格式：

### 📜 一、命局总纲
1. 格局层次评定（富贵贫贱层次）
2. 命局气象特点（清浊、寒暖、燥湿）
3. 人生大运走势总评

### 🌟 二、十神精微分析
1. **官杀**: 事业成就、社会地位
2. **财星**: 财富格局、理财能力  
3. **印星**: 学业智慧、贵人助力
4. **食伤**: 才华技艺、表达能力
5. **比劫**: 人际关系、合作竞争

### 🧠 三、性格心性解析
1. 命主心性特点
2. 潜在优势与短板
3. 情绪模式与改进建议

### 💼 四、事业财运深度
1. 适合行业方向（结合用神喜忌）
2. 事业发展节奏（关键年龄段）
3. 财富格局与积累方式
4. 合作合伙宜忌

### ❤️ 五、婚姻情感分析  
1. 配偶特征与缘分
2. 感情相处模式
3. 婚姻稳定度与注意事项
4. 子女缘分分析

### 🏥 六、健康养生提示
1. 需注意的身体系统（五行角度）
2. 养生调养建议
3. 情绪健康维护

### 📈 七、大运流年精解
1. **当前大运分析**
2. **未来三年流年运势**（给出具体建议）
3. **人生关键节点**（结合大运转折点）

### 🌈 八、开运指导
1. **方位吉凶**: 有利发展的方位
2. **颜色配饰**: 增强运势的颜色与材质
3. **行业选择**: 最适配的领域
4. **人际建议**: 适合交往的生肖或日主
5. **修行方向**: 心性修炼的重点

### 💫 九、经典引证
引用1-2句贴合命局的《三命通会》或《滴天髓》原句，并做白话解释。

## ✨ 特别提醒
1. 如命盘中有特殊格局（如从格、化格、专旺等），需重点分析
2. 注意调候用神与扶抑用神的区别使用
3. 结合神煞进行辅助判断，但不唯神煞论
4. 男女命在分析时注意阴阳差别`;

    // Construct User Prompt
    const userPrompt = question 
      ? `## 用户具体问题
"${question}"

## 命盘详情
${chartDescription}

请针对以上问题，结合命盘进行深入解答，给出专业建议。`
      : `## 请求事项
请为以下命盘进行全面、深度的八字命理分析：

${chartDescription}

请按照分析框架要求，生成完整的命理分析报告。`;

    // Call Gemini API
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userPrompt,
        config: {
            systemInstruction: systemPrompt,
            temperature: 1.0, // Creativity enabled
        }
    });

    let content = response.text || "AI 暂时无法生成解读，请稍后再试。";
    
    // Post-processing to ensure Markdown header
    if (!content.includes('# 八字命理分析报告')) {
      content = `# 八字命理分析报告\n\n${content}`;
    }
    
    return content;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return `## ❌ 解读服务出错\n\n错误信息: ${error instanceof Error ? error.message : '未知错误'}\n\n请检查网络连接或稍后再试。`;
  }
};