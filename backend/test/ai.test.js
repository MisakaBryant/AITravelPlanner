require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const request = require('supertest');
const express = require('express');
const aiRouter = require('../routes/parse');

const app = express();
app.use(express.json());
app.use('/api/ai', aiRouter);

describe('POST /api/ai/parse-speech', () => {
  it('should parse speech and return structured travel info', async () => {
    const speech = '我想去日本，5天，预算1万元，喜欢美食和动漫，带孩子';
    const res = await request(app)
      .post('/api/ai/parse-speech')
      .send({ text: speech });
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveProperty('destination');
    expect(res.body.data).toHaveProperty('days');
    expect(res.body.data).toHaveProperty('budget');
    expect(res.body.data).toHaveProperty('people');
    expect(res.body.data).toHaveProperty('preferences');
    // 可选：断言字段内容
    expect(res.body.data.destination).toMatch(/日本/);
    expect(res.body.data.days).toBeGreaterThanOrEqual(1);
    expect(res.body.data.budget).toBeGreaterThanOrEqual(0);
    expect(res.body.data.people).toBeGreaterThanOrEqual(1);
    expect(res.body.data.preferences).toMatch(/美食|动漫/);
  });

  it('should return error for missing text', async () => {
    const res = await request(app)
      .post('/api/ai/parse-speech')
      .send({});
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(1);
  });
});
