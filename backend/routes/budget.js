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
// body: { text }
// 返回: { code:0, data: { total:number, breakdown:[{type,amount}], note?:string } }
router.post('/budget/estimate', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.json({ code: 1, msg: '缺少参数' });

  // 业务层构造系统提示词（System Prompt）
  const prompt = `请阅读以下旅行预算需求的自然语言描述，根据你的常识与合理估算，给出一个简要预算（人民币）。\n要求：\n1) 返回 JSON，不要额外文字。\n2) 字段包括：total（总预算，数字），breakdown（数组，每项含 type 和 amount 两个字段），note（可选，简短说明）。\n3) 估算尽量简洁合理，可按交通/住宿/餐饮/娱乐/购物等类型拆分。\n用户描述：${text}`;

  try {
    const { callLLM } = require('../utils/aiClient');
    const result = await callLLM(prompt);
    const data = {
      total: Number(result.total) || 0,
      breakdown: Array.isArray(result.breakdown)
        ? result.breakdown.map((it) => ({
            type: String(it.type || '其他'),
            amount: Number(it.amount) || 0,
          }))
        : [],
      note: result.note ? String(result.note) : undefined,
    };
    return res.json({ code: 0, data });
  } catch (e) {
    return res.json({ code: 2, msg: '预算估算失败' });
  }
});

// POST /api/budget/record
// body: { userId, item, amount, date, planId }
router.post('/budget/record/save', async (req, res) => {
  const { userId, item, amount, date, planId } = req.body;
  
  // 验证必填字段
  if (!planId) {
    return res.json({ code: 1, msg: '必须关联到行程' });
  }
  
  const { error } = await supabase
    .from('records')
    .insert([{ user_id: userId, item, amount, date, plan_id: planId }]);
  if (error) {
    console.error('记录失败', error);
    return res.json({ code: 2, msg: '记录失败' });
  }
  res.json({ code: 0, msg: '记录成功' });
});

// POST /api/budget/record/update
// body: { id, item, amount, date }
router.post('/budget/record/update', async (req, res) => {
  const { id, item, amount, date } = req.body || {};
  if (!id) return res.json({ code: 1, msg: '缺少记录ID' });
  try {
    const { error } = await supabase
      .from('records')
      .update({
        item: String(item || ''),
        amount: Number(amount || 0),
        date: String(date || ''),
      })
      .eq('id', id)
      .eq('user_id', req.userId);
    if (error) return res.json({ code: 2, msg: '更新失败' });
    return res.json({ code: 0, msg: '更新成功' });
  } catch (e) {
    return res.json({ code: 2, msg: '更新失败' });
  }
});

// POST /api/budget/record/delete
// body: { id }
router.post('/budget/record/delete', async (req, res) => {
  const { id } = req.body || {};
  if (!id) return res.json({ code: 1, msg: '缺少记录ID' });
  try {
    const { error } = await supabase
      .from('records')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);
    if (error) return res.json({ code: 2, msg: '删除失败' });
    return res.json({ code: 0, msg: '删除成功' });
  } catch (e) {
    return res.json({ code: 2, msg: '删除失败' });
  }
});

module.exports = router;
