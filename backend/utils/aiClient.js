// 通用的大模型客户端（仅封装客户端与基本调用，不包含业务提示词）
const OpenAI = require('openai');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
const OPENAI_MODEL = process.env.OPENAI_MODEL;
const NODE_ENV = process.env.NODE_ENV;

const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
  baseURL: OPENAI_BASE_URL,
});

// 基础调用：给定 prompt，期望模型直接返回 JSON 文本
async function callLLM(prompt) {
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'user', content: prompt },
    ],
    enable_enhancement: true,
  });
  const content = completion?.choices?.[0]?.message?.content || '';
  if (NODE_ENV !== 'production') {
    // 开发环境输出方便调试，生产环境不打印
    console.debug('[LLM] Response:', content);
  }
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
}

module.exports = {
  callLLM,
};
