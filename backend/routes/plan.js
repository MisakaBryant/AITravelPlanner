// 行程规划核心接口
const express = require('express');
const router = express.Router();

// POST /api/plan
// body: { destination, days, budget, preferences, people }
router.post('/plan', async (req, res) => {
  const { destination, days, budget, preferences, people } = req.body;
  // TODO: 调用大语言模型API生成行程（此处先返回mock数据）
  const mockPlan = {
    destination,
    days,
    budget,
    preferences,
    people,
    itinerary: [
      { day: 1, activities: ['抵达', '入住酒店', '本地美食'] },
      { day: 2, activities: ['景点A', '景点B', '特色餐厅'] },
      // ...
    ]
  };
  res.json({ code: 0, data: mockPlan });
});

module.exports = router;
