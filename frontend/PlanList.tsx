import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Typography, Tag } from 'antd';
import { EyeOutlined, CalendarOutlined, DollarOutlined, TeamOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const PlanList: React.FC<{ userId: number }> = ({ userId }) => {
  const normalizePreferences = (pref: any): string[] => {
    if (Array.isArray(pref)) return pref.map(String);
    if (typeof pref === 'string') {
      try {
        const parsed = JSON.parse(pref);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {}
      return pref.split(/[，,、\s]+/).filter(Boolean).map(String);
    }
    return [];
  };
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
          <Row gutter={[16, 16]}>
            {plans.map((plan) => (
              <Col xs={24} sm={12} md={8} key={plan.id}>
                <Card
                  hoverable
                  title={<Text strong style={{ fontSize: 16 }}>{plan.destination}</Text>}
                  extra={<Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/plan/${plan.id}`)}>查看</Button>}
                  style={{ height: '100%' }}
                >
                    {plan.origin && (
                      <div style={{ marginBottom: 8 }}>
                        <EnvironmentOutlined style={{ marginRight: 6, color: '#722ed1' }} />
                        从 {plan.origin}
                      </div>
                    )}
                  <div style={{ marginBottom: 8 }}>
                    <CalendarOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                    {plan.days} 天
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <DollarOutlined style={{ marginRight: 6, color: '#52c41a' }} />
                    预算 {plan.budget} 元
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <TeamOutlined style={{ marginRight: 6, color: '#faad14' }} />
                    {plan.people} 人
                  </div>
                  <div style={{ marginTop: 12 }}>
                    {normalizePreferences(plan.preferences).map((p: string, i: number) => (
                      <Tag key={i} color="blue" style={{ marginBottom: 4 }}>{p}</Tag>
                    ))}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )
      )}
    </div>
  );
};

export default PlanList;
