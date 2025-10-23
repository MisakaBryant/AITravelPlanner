// 用户管理与数据存储 API（mock，后续可接入 Supabase）
const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { generateToken, verifyToken, EXPIRE_MS } = require('../utils/token');

// POST /api/auth/register
router.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  // 检查用户名是否存在
  const { data: exist, error: existErr } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single();
  if (exist) return res.json({ code: 1, msg: '用户名已存在' });
  // 插入新用户
  const { data, error } = await supabase
    .from('users')
    .insert([{ username, password }])
    .select('id, username')
    .single();
  console.log(data, error);
  if (error) return res.json({ code: 2, msg: '注册失败' });
  res.json({ code: 0, data });
});

// POST /api/auth/login

// 登录成功后设置 httpOnly cookie，内容为加密token
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username')
    .eq('username', username)
    .eq('password', password)
    .single();
  if (!user) return res.json({ code: 1, msg: '用户名或密码错误' });
  // 生成加密token
  const token = generateToken(user.id, user.username);
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: EXPIRE_MS
  });
  res.json({ code: 0, data: user });
});

// POST /api/auth/logout
router.post('/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ code: 0, msg: '已登出' });
});

// POST /api/plan/save
router.post('/plan/save', async (req, res) => {
  const { userId, plan } = req.body;
  const { error } = await supabase
    .from('plans')
    .insert([{ user_id: userId, ...plan }]);
  if (error) return res.json({ code: 2, msg: '保存失败' });
  res.json({ code: 0, msg: '保存成功' });
});

// GET /api/plan/list?userId=1
router.get('/plan/list', async (req, res) => {
  const { userId } = req.query;
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', userId);
  if (error) return res.json({ code: 2, msg: '查询失败' });
  res.json({ code: 0, data: data || [] });
});

// GET /api/auth/check
router.get('/auth/check', (req, res) => {
  const token = req.cookies && req.cookies.token;
  const info = token && verifyToken(token);
  if (!info) return res.json({ code: 401, msg: '未登录' });
  res.json({ code: 0, data: { id: info.userId, username: info.username } });
});

module.exports = router;
