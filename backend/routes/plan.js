// 行程规划核心接口
const express = require('express');
const router = express.Router();

// 使用通用 AI 客户端
const { callLLM } = require('../utils/aiClient');
const supabase = require('../utils/supabase');

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

// POST /api/plan/save
// body: { userId, plan }
// 说明：plan 需包含 route_places 字段（由前端主动解析并传入）
router.post('/plan/save', async (req, res) => {
  const { userId, plan } = req.body;
  try {
    const { error } = await supabase
      .from('plans')
      .insert([{ user_id: userId, ...plan }]);
    if (error) return res.json({ code: 2, msg: '保存失败' });
    res.json({ code: 0, msg: '保存成功' });
  } catch (e) {
    console.error(e);
    res.json({ code: 2, msg: '保存失败' });
  }
});

// POST /api/plan/update
// body: { planId, plan }
// 说明：编辑行程时，前端需主动解析 route_places 并传入
router.post('/plan/update', async (req, res) => {
  const { planId, plan } = req.body;
  try {
    const { error } = await supabase
      .from('plans')
      .update({ ...plan })
      .eq('id', planId);
    if (error) return res.json({ code: 2, msg: '更新失败' });
    res.json({ code: 0, msg: '更新成功' });
  } catch (e) {
    console.error(e);
    res.json({ code: 2, msg: '更新失败' });
  }
});

// GET /api/plan/list?userId=1
router.get('/plan/list', async (req, res) => {
  const { userId } = req.query;
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId);
    if (error) return res.json({ code: 2, msg: '查询失败' });
    res.json({ code: 0, data: data || [] });
  } catch (e) {
    console.error(e);
    res.json({ code: 2, msg: '查询失败' });
  }
});

module.exports = router;
