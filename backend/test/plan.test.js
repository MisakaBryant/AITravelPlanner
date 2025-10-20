const request = require('supertest');
const express = require('express');
const planRouter = require('../routes/plan');

describe('POST /api/plan', () => {
  const app = express();
  app.use(express.json());
  app.use('/api', planRouter);

  it('should return a mock plan', async () => {
    const res = await request(app)
      .post('/api/plan')
      .send({
        destination: '日本',
        days: 5,
        budget: 10000,
        preferences: ['美食', '动漫'],
        people: 3
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.destination).toBe('日本');
    expect(res.body.data.days).toBe(5);
    expect(res.body.data.itinerary.length).toBeGreaterThan(0);
  });
});
