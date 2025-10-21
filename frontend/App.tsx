import { Layout, Card, Button, Typography, message } from 'antd';
import 'antd/dist/reset.css';
import React, { useEffect, useState } from 'react';
import PlanForm from './PlanForm';
import BudgetEstimateForm from './BudgetEstimateForm';
import BudgetRecordForm from './BudgetRecordForm';
import AuthForm from './AuthForm';
import PlanList from './PlanList';
import PlanDetailPage from './PlanDetailPage';
import { Routes, Route, Navigate } from 'react-router-dom';

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
                    <PlanForm onResult={(p) => { setPlan(p); message.success('行程生成成功！'); }} />
                    <PlanList userId={user.id} />
                    <hr style={{ margin: '40px 0' }} />
                    <BudgetEstimateForm onResult={setBudget} />
                    <BudgetRecordForm userId={user.id} onSuccess={() => message.success('开销记录成功！')} />
                  </>
                )
              }
            />
            <Route
              path="/plan/:id"
              element={
                !user ? (
                  <Navigate to="/login" replace />
                ) : (
                  <PlanDetailPage userId={user.id} />
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
