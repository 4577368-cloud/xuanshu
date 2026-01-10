import { BaziChart } from "../types";

// 新增：报告结构类型
export interface BaziReport {
  title: string;
  copyText: string; // 纯文本，用于一键复制
  sections: {
    id: string;
    title: string;
    content: string | Array<{ label: string; value: string }> | Array<Record<string, string>>;
    type: 'text' | 'list' | 'table';
  }[];
  meta: {
    generatedAt: string;
    platform: string;
    year: number;
  };
}

const identifyPlatform = (apiKey: string): { platform: 'deepseek' | 'dashscope' | 'unknown', baseURL: string, model: string } => {
  const trimmedKey = apiKey.trim();
  if (trimmedKey.length > 30 && trimmedKey.startsWith('sk-')) {
    if (trimmedKey.includes('ali') || trimmedKey.length > 45) {
      return {
        platform: 'dashscope',
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        model: 'qwen-plus'
      };
    }
    return {
      platform: 'deepseek',
      baseURL: 'https://api.deepseek.com/v1/chat/completions',
      model: 'deepseek-chat'
    };
  }
  return { platform: 'unknown', baseURL: '', model: '' };
};

/**
 * 生成结构化八字+投资分析报告
 */
export const analyzeBaziStructured = async (
  chart: BaziChart,
  apiKey: string,
  question?: string
): Promise<BaziReport> => {
  const config = identifyPlatform(apiKey);
  if (config.platform === 'unknown') {
    return {
      title: "❌ 无效的 API KEY",
      copyText: "请填写以 sk- 开头的有效密钥，支持 DeepSeek 或 阿里云百炼。",
      sections: [{ id: 'error', title: '错误', content: '请填写以 sk- 开头的有效密钥，支持 DeepSeek 或 阿里云百炼。', type: 'text' }],
      meta: { generatedAt: new Date().toISOString(), platform: 'unknown', year: new Date().getFullYear() }
    };
  }

  const analysisYear = new Date().getFullYear();

  try {
    const formatDaLiuForPrompt = () => {
      let output = "";
      if (chart.xiaoYun?.length) {
        output += "童限（小运）:\n" + chart.xiaoYun.map(xy => `${xy.age}岁: ${xy.ganZhi.gan}${xy.ganZhi.zhi} (${xy.year}年)`).join("; ") + "\n\n";
      }
      output += "大运走势:\n" + (chart.luckPillars?.length
        ? chart.luckPillars.map(lp => `${lp.startAge}-${lp.startAge + 9}岁: ${lp.ganZhi.gan}${lp.ganZhi.zhi} (${lp.startYear}-${lp.endYear}年)`).join("; ")
        : "未提供大运");
      return output;
    };

    const chartDescription = `
命主: ${chart.profileId} (${chart.gender === 'male' ? '男' : '女'})
八字: ${chart.pillars.year.ganZhi.gan}${chart.pillars.year.ganZhi.zhi} ${chart.pillars.month.ganZhi.gan}${chart.pillars.month.ganZhi.zhi} ${chart.pillars.day.ganZhi.gan}${chart.pillars.day.ganZhi.zhi} ${chart.pillars.hour.ganZhi.gan}${chart.pillars.hour.ganZhi.zhi}
日主: ${chart.dayMaster} (${chart.dayMasterElement}), 身强弱: ${chart.balance.dayMasterStrength.level}
格局: ${chart.pattern.name} (${chart.pattern.level})
五行: 金${chart.wuxingCounts['金']} 木${chart.wuxingCounts['木']} 水${chart.wuxingCounts['水']} 火${chart.wuxingCounts['火']} 土${chart.wuxingCounts['土']}
喜用神: ${chart.balance.yongShen.join('、') || '需结合大运判断'}
${formatDaLiuForPrompt()}
`;

    const systemPrompt = `你是一位融合传统命理与现代投资的顾问。请严格按以下JSON格式输出，不要任何额外内容。

{
  "sections": [
     {
      "id": "overview",
      "title": "命局总纲",
      "content": "格局成败、日主强弱、五行流通、寒暖调候等核心判断（100字内）",
      "type": "text"
    },
    {
      "id": "shishen",
      "title": "十神精微",
      "content": "重点分析月令藏干、天干透出、十神组合（如财生官、食神制杀等），指出命局亮点与隐患",
      "type": "text"
    },
    {
      "id": "personality",
      "title": "性格特质",
      "content": [
        { "label": "优势", "value": "- 条目1\\n- 条目2" },
        { "label": "挑战", "value": "- 条目1\\n- 条目2" }
      ],
      "type": "list"
    },
    {
      "id": "career_wealth",
      "title": "事业与财富",
      "content": "适合行业（结合五行）、财富层次、贵人方向，并融入现代投资建议：如适合的资产类别（股票/房产/基金）、风险偏好、财富积累节奏等",
      "type": "text"
    },
    {
      "id": "marriage",
      "title": "婚姻情感",
      "content": "配偶特征（外貌/性格/职业倾向）、婚恋有利年份、注意事项（如忌神年份）",
      "type": "text"
    },
    {
      "id": "health",
      "title": "健康提示",
      "content": [
        { "label": "薄弱脏腑", "value": "根据五行过旺/过弱推断" },
        { "label": "养生建议", "value": "- 调理方向\\n- 季节注意事项" }
      ],
      "type": "list"
    },
    {
      "id": "luck_timeline",
      "title": "大运与流年走势",
      "content": "结合当前大运，简析未来3-5年（${analysisYear}–${analysisYear + 4}）的关键节点：事业突破、财运高峰、感情机会、健康风险等",
      "type": "text"
    },
    {
      "id": "fengshui_tips",
      "title": "开运锦囊",
      "content": [
        { "label": "吉利方位", "value": "如西南、正西" },
        { "label": "幸运颜色", "value": "如白色、金色（喜金者）" },
        { "label": "助运数字", "value": "如4、9（属金）" },
        { "label": "日常习惯", "value": "- 佩戴金属饰品\\n- 晨起面朝西" }
      ],
      "type": "list"
    },
    {
      "id": "investment_style",
      "title": "财富与投资策略",
      "content": [
        { "label": "适合的投资类型", "value": "- 类型1（依据）\\n- 类型2（依据）" },
        { "label": "应规避的投资类型", "value": "- 类型1（依据）\\n- 类型2（依据）" }
      ],
      "type": "list"
    },
    {
      "id": "market_industry",
      "title": "行业与市场适配度",
      "content": [
        { "市场": "A股", "推荐行业": "半导体、电力设备", "五行属性": "金、火" },
        { "市场": "港股", "推荐行业": "金融、数据中心", "五行属性": "土、金" },
        { "市场": "美股", "推荐行业": "云计算、高端制造", "五行属性": "金、水" }
      ],
      "type": "table"
    },
    {
      "id": "stock_picks",
      "title": "个股/ETF精选（总计≤10只）",
      "content": "- A股: 512480 半导体ETF — 金旺助身\\n- 港股: 02800.HK 盈富基金 — 土金相生\\n- 美股: QQQ 纳斯达克100 — 激发食神创造力",
      "type": "text"
    },
    {
      "id": "timing",
      "title": "${analysisYear}年精准择时",
      "content": "针对核心标的，给出买入/卖出窗口建议（如Q2低吸、节气减仓等）",
      "type": "text"
    },
    {
      "id": "monthly_plan",
      "title": "${analysisYear}年流月投资详表",
      "content": [
        { "月份": "6月", "重点关注": "芒种后金气渐旺", "操作建议": "逢低布局金属类ETF" },
        { "月份": "7月", "重点关注": "未月土旺", "操作建议": "增持银行、基建板块" }
      ],
      "type": "table"
    }
  ]
}

要求：
- 内容专业、实用，结合命主喜用神
- 表格字段必须一致
- 不要包含任何格式化标签
- 不要Markdown，不要解释，只输出合法JSON
- 若用户有提问，优先回应`;

    const userPrompt = question
      ? `用户问题: "${question}"\n\n命盘:\n${chartDescription}`
      : `请为以下命盘生成结构化投资命理报告:\n${chartDescription}`;

    const response = await fetch(config.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.55,
        max_tokens: 2800
      })
    });

    if (!response.ok) {
      throw new Error(`API 请求失败 (${response.status})`);
    }

    const data = await response.json();
    let rawJson = data.choices?.[0]?.message?.content?.trim() || '';

    // 清理可能的 Markdown 包裹（如 ```json ... ```）
    rawJson = rawJson.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();

    let parsed: { sections: any[] } = { sections: [] };
    try {
      parsed = JSON.parse(rawJson);
    } catch (e) {
      console.error("AI 返回非 JSON 内容:", rawJson);
      throw new Error("AI 未返回有效结构化数据，请重试");
    }

    // 构造可复制的纯文本
    const copyLines: string[] = [];
    copyLines.push(`# 八字命理与财富投资分析报告`);
    copyLines.push(`命主：${chart.profileId} | 性别：${chart.gender === 'male' ? '男' : '女'}`);
    copyLines.push(`生成时间：${new Date().toLocaleDateString('zh-CN')} | 平台：${config.platform === 'deepseek' ? 'DeepSeek' : '阿里云百炼'}`);
    copyLines.push('');

    for (const sec of parsed.sections) {
      copyLines.push(`## ${sec.title}`);
      if (sec.type === 'text') {
        copyLines.push(sec.content);
      } else if (sec.type === 'list') {
        for (const item of sec.content) {
          copyLines.push(`${item.label}：`);
          copyLines.push(item.value.split('\n').map(l => `  ${l}`).join('\n'));
        }
      } else if (sec.type === 'table') {
        if (sec.content.length > 0) {
          const keys = Object.keys(sec.content[0]);
          copyLines.push(keys.join('\t'));
          for (const row of sec.content) {
            copyLines.push(keys.map(k => row[k] || '').join('\t'));
          }
        }
      }
      copyLines.push('');
    }

    return {
      title: "八字命理与财富投资分析报告",
      copyText: copyLines.join('\n'),
      sections: parsed.sections,
      meta: {
        generatedAt: new Date().toISOString(),
        platform: config.platform === 'deepseek' ? 'DeepSeek' : '阿里云百炼',
        year: analysisYear
      }
    };

  } catch (error) {
    console.error("结构化分析失败:", error);
    return {
      title: "❌ 分析服务异常",
      copyText: `分析失败：${error instanceof Error ? error.message : '未知错误'}`,
      sections: [{ id: 'error', title: '错误', content: `分析失败：${error instanceof Error ? error.message : '未知错误'}`, type: 'text' }],
      meta: { generatedAt: new Date().toISOString(), platform: 'error', year: analysisYear }
    };
  }
};