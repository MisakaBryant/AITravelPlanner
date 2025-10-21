// 费用预算与管理 API
const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');

// GET /api/budget/records?userId=xx
router.get('/budget/records', async (req, res) => {
  const { userId } = req.query;
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('user_id', userId);
  if (error) return res.json({ code: 2, msg: '查询失败' });
  res.json({ code: 0, data: data || [] });
});

// POST /api/budget/estimate
// body: { days, people, destination, preferences }
router.post('/budget/estimate', async (req, res) => {
  const { days, people, destination, preferences } = req.body;
  // TODO: 调用大模型API进行预算估算（此处先返回mock数据）
  const mockBudget = {
    total: 8000 + days * 500 * people,
    breakdown: [
      { type: '交通', amount: 2000 },
      { type: '住宿', amount: 3000 },
      { type: '餐饮', amount: 2000 },
      { type: '门票/娱乐', amount: 1000 + days * 100 }
    ]
  };
  res.json({ code: 0, data: mockBudget });
});

// POST /api/budget/record
// body: { userId, item, amount, date }
router.post('/budget/record', async (req, res) => {
  const { userId, item, amount, date } = req.body;
  const { error } = await supabase
    .from('records')
    .insert([{ user_id: userId, item, amount, date }]);
  if (error) return res.json({ code: 2, msg: '记录失败' });
  res.json({ code: 0, msg: '记录成功' });
});

module.exports = router;
