// 用户管理与数据存储 API（mock，后续可接入 Supabase）
const express = require('express');
const router = express.Router();

// mock 用户数据
const users = [{ id: 1, username: 'test', password: '123456' }];
const plans = {};

// POST /api/auth/register
router.post('/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.json({ code: 1, msg: '用户名已存在' });
  }
  const user = { id: users.length + 1, username, password };
  users.push(user);
  res.json({ code: 0, data: { id: user.id, username: user.username } });
});

// POST /api/auth/login
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.json({ code: 1, msg: '用户名或密码错误' });
  res.json({ code: 0, data: { id: user.id, username: user.username } });
});

// POST /api/plan/save
router.post('/plan/save', (req, res) => {
  const { userId, plan } = req.body;
  if (!plans[userId]) plans[userId] = [];
  plans[userId].push(plan);
  res.json({ code: 0, msg: '保存成功' });
});

// GET /api/plan/list?userId=1
router.get('/plan/list', (req, res) => {
  const { userId } = req.query;
  res.json({ code: 0, data: plans[userId] || [] });
});

module.exports = router;
