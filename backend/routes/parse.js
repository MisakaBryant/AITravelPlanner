const express = require('express');
const router = express.Router();
// 使用抽离后的通用 AI 客户端
const { callLLM } = require('../utils/aiClient');

router.post('/parse-speech', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.json({ code: 1, msg: '缺少参数' });

  // 构造大模型 prompt
    const prompt = `请从下述用户旅行需求语音中，智能提取以下字段：\n出发地（origin）、目的地（destination）、天数（days）、预算（budget，单位元）、人数（people，单位人）、偏好（preferences，多个用顿号分隔）。\n原始内容：${text}\n请以JSON格式返回，字段名用英文，不确定的字段可以不返回。`;

  try {
    const result = await callLLM(prompt);
    // 字段校验与类型转换
    const data = {
        origin: result.origin || '',
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

module.exports = router;
