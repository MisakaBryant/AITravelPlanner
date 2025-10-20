// 行程规划核心接口
const express = require('express');
const router = express.Router();

// 复用 OpenAI client 和 callLLM
const { callLLM } = require('./ai');

// POST /api/plan
// body: { destination, days, budget, preferences, people }
router.post('/plan', async (req, res) => {
  const { destination, days, budget, preferences, people } = req.body;
  // 构造大模型 prompt
  const prompt = `请根据以下用户需求，生成详细的个性化旅行行程规划，包含每日活动安排（itinerary），每项活动用数组表示。\n需求：目的地：${destination}，天数：${days}，预算：${budget}元，人数：${people}，偏好：${preferences}。\n请以JSON格式返回，字段包括 destination, days, budget, people, preferences, itinerary（数组，元素为{day, activities}）。`;
  try {
    const result = await callLLM(prompt);
    // 字段校验与类型转换
    const data = {
      destination: result.destination || destination,
      days: Number(result.days) || days,
      budget: Number(result.budget) || budget,
      people: Number(result.people) || people,
      preferences: result.preferences || preferences,
      itinerary: Array.isArray(result.itinerary) ? result.itinerary : []
    };
    res.json({ code: 0, data });
  } catch (e) {
    res.json({ code: 2, msg: '大模型生成失败' });
  }
});

module.exports = router;
