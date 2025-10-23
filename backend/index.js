// 后端入口文件

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: './.env' });

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

const auth = require('./middleware/auth');
const userRouter = require('./routes/user');
const planRouter = require('./routes/plan');
const budgetRouter = require('./routes/budget');
const parseRouter = require('./routes/parse');

// 统一鉴权
app.use('/api', auth, userRouter);
app.use('/api', auth, planRouter);
app.use('/api', auth, budgetRouter);
app.use('/api/ai', auth, parseRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
