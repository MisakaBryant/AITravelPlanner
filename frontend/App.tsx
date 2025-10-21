import { Layout, Card, Button, Typography, message } from 'antd';
import 'antd/dist/reset.css';
import MapView from './MapView';
import React, { useEffect, useState } from 'react';
import PlanForm from './PlanForm';
import BudgetEstimateForm from './BudgetEstimateForm';
import BudgetRecordForm from './BudgetRecordForm';
import AuthForm from './AuthForm';
import PlanList from './PlanList';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const [plan, setPlan] = useState<any>(null);
  const [budget, setBudget] = useState<any>(null);
  const [recordMsg, setRecordMsg] = useState('');
  const [user, setUser] = useState<any>(null);

  // 初始化：从本地存储恢复登录态
  useEffect(() => {
    try {
      const raw = localStorage.getItem('aitp_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id) setUser(parsed);
      }
    } catch {}
  }, []);

  // 登录后写入本地存储
  const handleLoggedIn = (u: any) => {
    setUser(u);
    try { localStorage.setItem('aitp_user', JSON.stringify(u)); } catch {}
  };

  // 退出登录：清空本地存储并清空计划/预算等状态
  const handleLogout = () => {
    setUser(null);
    setPlan(null);
    setBudget(null);
    try { localStorage.removeItem('aitp_user'); } catch {}
  };

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
    <Layout style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      <Header style={{ background: '#1677ff', padding: '0 32px' }}>
        <Title level={2} style={{ color: '#fff', margin: 0, textAlign: 'center' }}>AITravelPlanner 智能旅行规划</Title>
      </Header>
      <Content style={{ maxWidth: 700, margin: '32px auto', width: '100%' }}>
        <Card style={{ boxShadow: '0 2px 8px #f0f1f2' }}>
          <Routes>
            <Route
              path="/login"
              element={
                user ? <Navigate to="/home" replace /> : <AuthForm onLogin={handleLoggedIn} />
              }
            />
            <Route
              path="/home"
              element={
                !user ? (
                  <Navigate to="/login" replace />
                ) : (
                  <>
                    <div style={{ textAlign: 'right', marginBottom: 16 }}>
                      你好，{user.username} <Button type="link" onClick={handleLogout}>退出</Button>
                    </div>
                    <PlanForm onResult={setPlan} />
                    {plan && (
                      <div style={{ marginTop: 32 }}>
                        <Title level={4}>行程结果</Title>
                        <div>目的地：{plan.destination}</div>
                        <div>天数：{plan.days}</div>
                        <div>预算：{plan.budget} 元</div>
                        <div>人数：{plan.people}</div>
                        <div>偏好：{Array.isArray(plan.preferences) ? plan.preferences.join('、') : plan.preferences}</div>
                        <MapView destination={plan.destination} />
                        <Title level={5} style={{ marginTop: 16 }}>详细行程：</Title>
                        <ol>
                          {plan.itinerary?.map((d: any) => (
                            <li key={d.day}>
                              第{d.day}天：{d.activities.join('，')}
                            </li>
                          ))}
                        </ol>
                        <Button type="primary" onClick={handleSavePlan} style={{ marginTop: 12 }}>保存到我的账号</Button>
                      </div>
                    )}
                    <PlanList userId={user.id} />
                    <hr style={{ margin: '40px 0' }} />
                    <BudgetEstimateForm onResult={setBudget} />
                    <BudgetRecordForm userId={user.id} onSuccess={() => message.success('开销记录成功！')} />
                  </>
                )
              }
            />
            <Route path="*" element={<Navigate to={user ? '/home' : '/login'} replace />} />
          </Routes>
        </Card>
      </Content>
      <Footer style={{ textAlign: 'center', color: '#888' }}>
        AITravelPlanner ©2025 Created by GitHub Copilot
      </Footer>
    </Layout>
  );
};

export default App;
