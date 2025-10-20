const request = require('supertest');
const express = require('express');
const userRouter = require('../routes/user');

describe('用户注册与登录', () => {
  const app = express();
  app.use(express.json());
  app.use('/api', userRouter);

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'user1', password: 'pass1' });
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.username).toBe('user1');
  });

  it('should not register duplicate user', async () => {
    await request(app).post('/api/auth/register').send({ username: 'user2', password: 'pass2' });
    const res = await request(app).post('/api/auth/register').send({ username: 'user2', password: 'pass2' });
    expect(res.body.code).toBe(1);
  });

  it('should login with correct credentials', async () => {
    await request(app).post('/api/auth/register').send({ username: 'user3', password: 'pass3' });
    const res = await request(app).post('/api/auth/login').send({ username: 'user3', password: 'pass3' });
    expect(res.body.code).toBe(0);
    expect(res.body.data.username).toBe('user3');
  });

  it('should not login with wrong password', async () => {
    await request(app).post('/api/auth/register').send({ username: 'user4', password: 'pass4' });
    const res = await request(app).post('/api/auth/login').send({ username: 'user4', password: 'wrong' });
    expect(res.body.code).toBe(1);
  });
});

describe('行程保存与查询', () => {
  const app = express();
  app.use(express.json());
  app.use('/api', userRouter);

  it('should save and list plans', async () => {
    await request(app).post('/api/auth/register').send({ username: 'user5', password: 'pass5' });
    const loginRes = await request(app).post('/api/auth/login').send({ username: 'user5', password: 'pass5' });
    const userId = loginRes.body.data.id;
    await request(app).post('/api/plan/save').send({ userId, plan: { destination: '日本' } });
    const listRes = await request(app).get('/api/plan/list').query({ userId });
    expect(listRes.body.code).toBe(0);
    expect(listRes.body.data.length).toBeGreaterThan(0);
    expect(listRes.body.data[0].destination).toBe('日本');
  });
});
