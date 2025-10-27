import { Layout, Card, Button, Typography, message, Row, Col, Tag } from 'antd';
import 'antd/dist/reset.css';
import React, { useEffect, useState } from 'react';
import PlanForm from './PlanForm';
import BudgetEstimateForm from './BudgetEstimateForm';
import BudgetRecordForm from './BudgetRecordForm';
import AuthForm, { checkAuth, logout as apiLogout } from './AuthForm';
import PlanList from './PlanList';
import PlanDetailPage from './PlanDetailPage';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CompassOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  // 规范化偏好为字符串数组
  const normalizePreferences = (pref: any): string[] => {
    if (Array.isArray(pref)) return pref.map(String);
    if (typeof pref === 'string') {
      try {
        const parsed = JSON.parse(pref);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {}
      // 兜底按照常见分隔符拆分
      return pref.split(/[，,、\s]+/).filter(Boolean).map(String);
    }
    return [];
  };
  const [plan, setPlan] = useState<any>(null);
  const [budget, setBudget] = useState<any>(null);
  const [recordMsg, setRecordMsg] = useState('');
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [planListRefreshKey, setPlanListRefreshKey] = useState(0);

  // 初始化：检测后端登录态
  useEffect(() => {
    checkAuth().then(u => {
      setUser(u);
      setAuthChecked(true);
    });
  }, []);

  // 登录后刷新用户信息
  const handleLoggedIn = (u: any) => {
    setUser(u);
  };

  // 退出登录：请求后端并清空状态
  const handleLogout = async () => {
    await apiLogout();
    setUser(null);
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
    setPlanListRefreshKey(k => k + 1); // 强制刷新 PlanList
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      <Header
        style={{
          background: 'linear-gradient(90deg, #165DFF 0%, #4096ff 50%, #2f54eb 100%)',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 8px 24px rgba(22,119,255,0.25)'
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 64
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 16px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(2px)'
            }}
          >
            <CompassOutlined style={{ color: '#fff', fontSize: 22 }} />
            <Title
              level={3}
              style={{
                color: '#fff',
                margin: 0,
                textAlign: 'center',
                letterSpacing: 0.5,
                textShadow: '0 1px 1px rgba(0,0,0,0.25)'
              }}
            >
              AITravelPlanner 智能旅行规划
            </Title>
          </div>
        </div>
      </Header>
      <Content style={{ maxWidth: 1400, margin: '32px auto', width: '100%', padding: '0 16px' }}>
        {!authChecked ? (
          <div style={{ textAlign: 'center', marginTop: 100 }}>正在检测登录状态...</div>
        ) : (
          <Routes>
            <Route
              path="/login"
              element={
                <Card style={{ maxWidth: 500, margin: '0 auto', boxShadow: '0 2px 8px #f0f1f2' }}>
                  {user ? <Navigate to="/home" replace /> : <AuthForm onLogin={handleLoggedIn} />}
                </Card>
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
                    <Row gutter={24}>
                      {/* 左侧：行程规划主区域 */}
                      <Col xs={24} lg={16}>
                        <Card title={<Title level={4} style={{ margin: 0 }}>智能行程规划</Title>} style={{ marginBottom: 24 }}>
                          <PlanForm onResult={(p) => { setPlan(p); message.success('行程生成成功！'); }} />
                        </Card>
                        {plan && (
                          <Card title={<Title level={4} style={{ margin: 0 }}>行程</Title>} style={{ marginBottom: 24 }}>
                              {plan.origin && <p><strong>出发地：</strong>{plan.origin}</p>}
                            <p><strong>目的地：</strong>{plan.destination}</p>
                            <p><strong>天数：</strong>{plan.days} 天 <strong>人数：</strong>{plan.people} 人 <strong>预算：</strong>{plan.budget} 元</p>
                            <div>
                              <strong>偏好：</strong>
                              {normalizePreferences(plan.preferences).length === 0 ? (
                                <span>无</span>
                              ) : (
                                normalizePreferences(plan.preferences).map((p: string, i: number) => (
                                  <Tag key={i} color="blue" style={{ marginBottom: 4 }}>{p}</Tag>
                                ))
                              )}
                            </div>
                            <div style={{ marginTop: 16 }}>
                              <strong>详细行程：</strong>
                              {plan.itinerary && plan.itinerary.map((item: any, idx: number) => (
                                <div key={idx} style={{ marginTop: 12, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                                  <div><strong>Day {item.day}</strong></div>
                                  <div>{Array.isArray(item.activities) ? item.activities.join(' → ') : item.activities}</div>
                                </div>
                              ))}
                            </div>
                            {user && (
                              <Button type="primary" style={{ marginTop: 16 }} onClick={handleSavePlan}>
                                保存到我的账号
                              </Button>
                            )}
                          </Card>
                        )}
                        <PlanList userId={user.id} key={planListRefreshKey} />
                      </Col>
                      {/* 右侧：预算与开销管理 */}
                      <Col xs={24} lg={8}>
                        <Card title={<Title level={4} style={{ margin: 0 }}>预算估算</Title>} style={{ marginBottom: 24 }}>
                          <BudgetEstimateForm onResult={setBudget} />
                        </Card>
                        <Card title={<Title level={4} style={{ margin: 0 }}>开销记录</Title>}>
                          <BudgetRecordForm userId={user.id} onSuccess={() => message.success('开销记录成功！')} />
                        </Card>
                      </Col>
                    </Row>
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
        )}
      </Content>
      <Footer style={{ textAlign: 'center', color: '#888' }}>
        AITravelPlanner ©2025 Created by GitHub Copilot
      </Footer>
    </Layout>
  );
};

export default App;
