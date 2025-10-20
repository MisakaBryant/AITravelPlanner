import React, { useEffect, useState } from 'react';

const PlanList: React.FC<{ userId: number }> = ({ userId }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/plan/list?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.code === 0) setPlans(data.data);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;
  return (
    <div style={{ marginTop: 32 }}>
      <h2>我的行程计划</h2>
      {loading ? <div>加载中...</div> : (
        plans.length === 0 ? <div>暂无行程</div> : (
          <ul>
            {plans.map((plan, i) => (
              <li key={i} style={{ marginBottom: 12 }}>
                <b>{plan.destination}</b>，{plan.days}天，预算{plan.budget}元
                <div>偏好：{Array.isArray(plan.preferences) ? plan.preferences.join('、') : plan.preferences}</div>
                <div>行程：{plan.itinerary?.map((d: any) => `第${d.day}天：${d.activities.join('，')}`).join(' | ')}</div>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
};

export default PlanList;
