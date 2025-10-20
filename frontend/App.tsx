import MapView from './MapView';
import React, { useState } from 'react';
import PlanForm from './PlanForm';
import BudgetEstimateForm from './BudgetEstimateForm';
import BudgetRecordForm from './BudgetRecordForm';
import AuthForm from './AuthForm';
import PlanList from './PlanList';

const App: React.FC = () => {
  const [plan, setPlan] = useState<any>(null);
  const [budget, setBudget] = useState<any>(null);
  const [recordMsg, setRecordMsg] = useState('');
  const [user, setUser] = useState<any>(null);

  // 保存行程到用户账号
  const handleSavePlan = async () => {
    if (!user || !plan) return;
    await fetch('/api/plan/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, plan })
    });
    alert('行程已保存到账号！');
  };

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>AITravelPlanner 智能旅行规划</h1>
      {!user ? (
        <AuthForm onLogin={setUser} />
      ) : (
        <>
          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            你好，{user.username} <button onClick={() => setUser(null)}>退出</button>
          </div>
          <PlanForm onResult={setPlan} />
          {plan && (
            <div style={{ marginTop: 32 }}>
              <h2>行程结果</h2>
              <div>目的地：{plan.destination}</div>
              <div>天数：{plan.days}</div>
              <div>预算：{plan.budget} 元</div>
              <div>人数：{plan.people}</div>
              <div>偏好：{Array.isArray(plan.preferences) ? plan.preferences.join('、') : plan.preferences}</div>
              <MapView destination={plan.destination} />
              <h3>详细行程：</h3>
              <ol>
                {plan.itinerary?.map((d: any) => (
                  <li key={d.day}>
                    第{d.day}天：{d.activities.join('，')}
                  </li>
                ))}
              </ol>
              <button onClick={handleSavePlan} style={{ marginTop: 12 }}>保存到我的账号</button>
            </div>
          )}
          <PlanList userId={user.id} />

          <hr style={{ margin: '40px 0' }} />
          <BudgetEstimateForm onResult={setBudget} />
          {budget && (
            <div style={{ marginTop: 24 }}>
              <h2>预算估算结果</h2>
              <div>总预算：{budget.total} 元</div>
              <ul>
                {budget.breakdown?.map((b: any, i: number) => (
                  <li key={i}>{b.type}：{b.amount} 元</li>
                ))}
              </ul>
            </div>
          )}

          <BudgetRecordForm onSuccess={() => setRecordMsg('记录成功！')} />
          {recordMsg && <div style={{ color: 'green', textAlign: 'center', marginTop: 8 }}>{recordMsg}</div>}
        </>
      )}
    </div>
  );
};

export default App;
