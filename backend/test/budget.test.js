const request = require('supertest');
const express = require('express');
const budgetRouter = require('../routes/budget');

describe('POST /api/budget/estimate', () => {
  const app = express();
  app.use(express.json());
  app.use('/api', budgetRouter);

  it('should return a mock budget', async () => {
    const res = await request(app)
      .post('/api/budget/estimate')
      .send({ days: 5, people: 2, destination: '日本', preferences: ['美食'] });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.total).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.breakdown)).toBe(true);
  });
});

describe('POST /api/budget/record', () => {
  const app = express();
  app.use(express.json());
  app.use('/api', budgetRouter);

  it('should record a budget item', async () => {
    const res = await request(app)
      .post('/api/budget/record')
      .send({ item: '午餐', amount: 100, date: '2025-10-20' });
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(0);
  });
});
