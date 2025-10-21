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
// 让其他模块可以复用 callLLM，同时保持默认导出为路由
router.callLLM = callLLM;
module.exports = router;
