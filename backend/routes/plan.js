// 行程规划核心接口
const express = require('express');
const router = express.Router();

// 使用通用 AI 客户端
const { callLLM } = require('../utils/aiClient');

// POST /api/plan
// body: { origin, destination, days, budget, preferences, people }
router.post('/plan', async (req, res) => {
  const { origin, destination, days, budget, preferences, people } = req.body;
  // 构造大模型 prompt，仅生成 itinerary
  const prompt = `请根据以下用户需求，生成详细的个性化旅行行程规划，包含每日活动安排（itinerary），每项活动用数组表示。\n需求：出发地：${origin}，目的地：${destination}，天数：${days}，预算：${budget}元，人数：${people}，偏好：${preferences}。\n请以JSON格式返回，字段包括 origin, destination, days, budget, people, preferences, itinerary（数组，元素为{day, activities}）。不要添加多余说明。`;
  try {
    const result = await callLLM(prompt);
    // 字段校验与类型转换
    const data = {
      origin: result.origin || origin,
      destination: result.destination || destination,
      days: Number(result.days) || days,
      budget: Number(result.budget) || budget,
      people: Number(result.people) || people,
      preferences: result.preferences || preferences,
      itinerary: Array.isArray(result.itinerary) ? result.itinerary : []
    };
    res.json({ code: 0, data });
  } catch (e) {
    console.error(e);
    res.json({ code: 2, msg: '大模型生成失败' });
  }
});

module.exports = router;
