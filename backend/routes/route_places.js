// 地点序列解析与保存接口
const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { callLLM } = require('../utils/aiClient');

// POST /api/route_places/parse
// body: { itinerary }
router.post('/parse', async (req, res) => {
  const { itinerary } = req.body;
  if (!Array.isArray(itinerary)) return res.json({ code: 1, msg: '参数错误' });
  const prompt = `请根据以下行程安排，提取游览顺序地点数组，字段为 name, desc, day，JSON数组返回，其中 name 应该包含城市名防止重名地点。行程安排：${JSON.stringify(itinerary)}`;
  try {
    const result = await callLLM(prompt);
    if (Array.isArray(result)) {
      res.json({ code: 0, data: result });
    } else {
      res.json({ code: 2, msg: '解析失败' });
    }
  } catch (e) {
    res.json({ code: 3, msg: '大模型调用失败' });
  }
});

// POST /api/route_places/save
// body: { planId, route_places }
router.post('/save', async (req, res) => {
  const { planId, route_places } = req.body;
  if (!planId || !Array.isArray(route_places)) return res.json({ code: 1, msg: '参数错误' });
  const { error } = await supabase
    .from('plans')
    .update({ route_places })
    .eq('id', planId);
  if (error) return res.json({ code: 2, msg: '保存失败' });
  res.json({ code: 0, msg: '保存成功' });
});

module.exports = router;
