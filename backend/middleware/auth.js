// 简单的 cookie 鉴权中间件

const { verifyToken } = require('../utils/token');
const supabase = require('../utils/supabase');

// token 结构：userId:username
module.exports = async function (req, res, next) {
  // 直接放行 /auth/ 路径
  if (req.path.startsWith('/auth/')) return next();
  const token = req.cookies && req.cookies.token;
  const info = token && verifyToken(token);
  if (!info) {
    return res.status(401).json({ code: 401, msg: '未登录或登录已过期' });
  }
  // 校验用户是否存在
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username')
    .eq('id', info.userId)
    .eq('username', info.username)
    .single();
  if (!user) {
    return res.status(401).json({ code: 401, msg: '用户不存在或token无效' });
  }
  req.userId = info.userId;
  req.username = info.username;
  next();
};
