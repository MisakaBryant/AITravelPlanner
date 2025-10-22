// 费用预算与管理 API
const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');

// GET /api/budget/records?userId=xx&planId=xx
router.get('/budget/records', async (req, res) => {
  const { userId, planId } = req.query;
  let query = supabase.from('records').select('*');
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  if (planId) {
    query = query.eq('plan_id', planId);
  }
  
  const { data, error } = await query.order('date', { ascending: false });
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
// body: { userId, item, amount, date, planId }
router.post('/budget/record', async (req, res) => {
  const { userId, item, amount, date, planId } = req.body;
  
  // 验证必填字段
  if (!planId) {
    return res.json({ code: 1, msg: '必须关联到行程' });
  }
  
  const { error } = await supabase
    .from('records')
    .insert([{ user_id: userId, item, amount, date, plan_id: planId }]);
  if (error) return res.json({ code: 2, msg: '记录失败' });
  res.json({ code: 0, msg: '记录成功' });
});

module.exports = router;
