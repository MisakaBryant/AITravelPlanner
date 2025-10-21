require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const request = require('supertest');
const express = require('express');
const userRouter = require('../routes/user');
const budgetRouter = require('../routes/budget');

const app = express();
app.use(express.json());
app.use('/api', userRouter);
app.use('/api', budgetRouter);

describe('Supabase 数据库集成测试', () => {
  let userId;
  let planId;

  it('注册新用户', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'dbtestuser', password: 'test123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveProperty('id');
    userId = res.body.data.id;
  });

  it('用户登录', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'dbtestuser', password: 'test123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.username).toBe('dbtestuser');
  });

  it('保存行程', async () => {
    const plan = {
      destination: '日本',
      days: 5,
      budget: 10000,
      people: 2,
      preferences: '美食、动漫',
      itinerary: [{ day: 1, activities: ['抵达', '美食'] }]
    };
    const res = await request(app)
      .post('/api/plan/save')
      .send({ userId, plan });
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(0);
  });

  it('查询行程列表', async () => {
    const res = await request(app)
      .get('/api/plan/list')
      .query({ userId });
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(0);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toHaveProperty('destination');
  });

  it('记录预算开销', async () => {
    const res = await request(app)
      .post('/api/budget/record')
      .send({ userId, item: '午餐', amount: 120, date: '2025-10-20' });
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(0);
  });

  it('查询预算开销记录', async () => {
    const res = await request(app)
      .get('/api/budget/records')
      .query({ userId });
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(0);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toHaveProperty('item');
  });
});
