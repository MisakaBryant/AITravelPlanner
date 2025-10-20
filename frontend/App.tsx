import React, { useState } from 'react';
import PlanForm from './PlanForm';
import BudgetEstimateForm from './BudgetEstimateForm';
import BudgetRecordForm from './BudgetRecordForm';

const App: React.FC = () => {
  const [plan, setPlan] = useState<any>(null);
  const [budget, setBudget] = useState<any>(null);
  const [recordMsg, setRecordMsg] = useState('');

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>AITravelPlanner 智能旅行规划</h1>
      <PlanForm onResult={setPlan} />
      {plan && (
        <div style={{ marginTop: 32 }}>
          <h2>行程结果</h2>
          <div>目的地：{plan.destination}</div>
          <div>天数：{plan.days}</div>
          <div>预算：{plan.budget} 元</div>
          <div>人数：{plan.people}</div>
          <div>偏好：{Array.isArray(plan.preferences) ? plan.preferences.join('、') : plan.preferences}</div>
          <h3>详细行程：</h3>
          <ol>
            {plan.itinerary?.map((d: any) => (
              <li key={d.day}>
                第{d.day}天：{d.activities.join('，')}
              </li>
            ))}
          </ol>
        </div>
      )}

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
    </div>
  );
};

export default App;
