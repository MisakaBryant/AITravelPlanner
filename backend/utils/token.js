const crypto = require('crypto');

const SECRET = process.env.COOKIE_SECRET || 'aitp_secret';
const EXPIRE_MS = 7 * 24 * 60 * 60 * 1000; // 7天

// 生成加密token
function generateToken(userId, username) {
  const ts = Date.now();
  const raw = `${userId}:${username}:${ts}`;
  const sig = crypto.createHmac('sha256', SECRET).update(raw).digest('hex');
  return Buffer.from(`${userId}:${username}:${ts}:${sig}`).toString('base64');
}

// 校验token，返回{userId, username, ts}或null
function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [userId, username, ts, sig] = decoded.split(':');
    if (!userId || !username || !ts || !sig) return null;
    const raw = `${userId}:${username}:${ts}`;
    const expectedSig = crypto.createHmac('sha256', SECRET).update(raw).digest('hex');
    if (sig !== expectedSig) return null;
    if (Date.now() - Number(ts) > EXPIRE_MS) return null;
    return { userId, username, ts };
  } catch {
    return null;
  }
}

module.exports = { generateToken, verifyToken, EXPIRE_MS };
