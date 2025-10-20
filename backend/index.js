// 后端入口文件

const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: './.env' });

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});


// 行程规划API
app.use('/api', require('./routes/plan'));
// 费用预算API
app.use('/api', require('./routes/budget'));

// 用户管理与数据存储API
app.use('/api', require('./routes/user'));

// AI语音智能解析API
app.use('/api/ai', require('./routes/ai'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
