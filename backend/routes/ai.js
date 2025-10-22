const express = require('express');
const router = express.Router();

const OpenAI = require('openai');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
const OPENAI_MODEL = process.env.OPENAI_MODEL;


const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
  baseURL: OPENAI_BASE_URL,
});

async function callLLM(prompt) {
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    enable_enhancement: true,
  });
  // 解析大模型返回内容
  const content = completion.choices[0].message.content;
  console.log('LLM Response:', content);
  // 期望返回为JSON结构
  try {
    return JSON.parse(content);
  } catch {
    // 若解析失败，返回空结构
    return {};
  }
}

router.post('/parse-speech', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.json({ code: 1, msg: '缺少参数' });

  // 构造大模型 prompt
  const prompt = `请从下述用户旅行需求语音中，智能提取以下字段：\n目的地（destination）、天数（days）、预算（budget，单位元）、人数（people，单位人）、偏好（preferences，多个用顿号分隔）。\n原始内容：${text}\n请以JSON格式返回，字段名用英文，不确定的字段可以不返回。`;

  try {
    const result = await callLLM(prompt);
    // 字段校验与类型转换
    const data = {
      destination: result.destination || '',
      days: Number(result.days) || 1,
      budget: Number(result.budget) || 0,
      people: Number(result.people) || 1,
      preferences: result.preferences || ''
    };
    res.json({ code: 0, data });
  } catch (e) {
    res.json({ code: 2, msg: '大模型解析失败' });
  }
});

// POST /api/ai/budget-estimate
// body: { text }
// 返回: { code:0, data: { total:number, breakdown:[{type,amount}], note?:string } }
router.post('/budget-estimate', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.json({ code: 1, msg: '缺少参数' });

  const prompt = `请阅读以下旅行预算需求的自然语言描述，根据你的常识与合理估算，给出一个简要预算（人民币）。
要求：
1) 返回 JSON，不要额外文字。
2) 字段包括：total（总预算，数字），breakdown（数组，每项含 type 和 amount 两个字段），note（可选，简短说明）。
3) 估算尽量简洁合理，可按交通/住宿/餐饮/娱乐/购物等类型拆分。
用户描述：${text}`;

  try {
    const result = await callLLM(prompt);
    const data = {
      total: Number(result.total) || 0,
      breakdown: Array.isArray(result.breakdown) ? result.breakdown.map(it => ({
        type: String(it.type || '其他'),
        amount: Number(it.amount) || 0,
      })) : [],
      note: result.note ? String(result.note) : undefined,
    };
    return res.json({ code: 0, data });
  } catch (e) {
    return res.json({ code: 2, msg: '预算估算失败' });
  }
});
// 让其他模块可以复用 callLLM，同时保持默认导出为路由
router.callLLM = callLLM;
module.exports = router;
