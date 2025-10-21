import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Form, Input, InputNumber, message, Space, Descriptions, List } from 'antd';
import { EditOutlined, SaveOutlined, RollbackOutlined, EnvironmentOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import MapView from './MapView';

const { Title } = Typography;

interface Plan {
  id: number;
  destination: string;
  days: number;
  budget: number;
  people: number;
  preferences: string | string[];
  itinerary: Array<{ day: number; activities: string[] }>;
}

const PlanDetailPage: React.FC<{ userId: number }> = ({ userId }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  // 加载行程详情
  useEffect(() => {
    if (!id || !userId) return;
    setLoading(true);
    fetch(`/api/plan/list?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.code === 0) {
          // 这里简化处理：从列表中找到对应的计划（实际应该有专门的详情接口）
          const found = data.data.find((p: any) => p.id === Number(id));
          if (found) {
            setPlan(found);
            form.setFieldsValue({
              destination: found.destination,
              days: found.days,
              budget: found.budget,
              people: found.people,
              preferences: Array.isArray(found.preferences) ? found.preferences.join('、') : found.preferences,
              itinerary: found.itinerary?.map((item: any) => ({
                day: item.day,
                activities: Array.isArray(item.activities) ? item.activities.join('、') : item.activities
              })) || []
            });
          } else {
            message.error('未找到该行程');
          }
        }
      })
      .finally(() => setLoading(false));
  }, [id, userId, form]);

  // 保存编辑
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      // 这里应该调用更新接口，目前简化为本地更新
      const updated = {
        ...plan!,
        ...values,
        preferences: values.preferences.split(/[，,、\s]+/).filter(Boolean),
        itinerary: values.itinerary // 使用编辑后的行程
      };
      setPlan(updated);
      setEditing(false);
      message.success('行程已更新（注：需要后端接口支持持久化）');
    } catch (err) {
      message.error('请检查表单输入');
    }
  };

  // 导航到目的地（打开高德地图导航）
  const handleNavigate = () => {
    if (!plan) return;
    const keyword = plan.destination;
    // 打开高德地图Web端导航（或调用APP端URL Scheme）
    window.open(`https://uri.amap.com/navigation?to=${encodeURIComponent(keyword)},全国`, '_blank');
  };

  if (loading) return <Card loading />;
  if (!plan) return <Card>行程不存在</Card>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
      <Button icon={<RollbackOutlined />} onClick={() => navigate('/home')} style={{ marginBottom: 16 }}>
        返回首页
      </Button>
      <Card
        title={<Title level={3}>{plan.destination} 行程详情</Title>}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<EnvironmentOutlined />}
              onClick={handleNavigate}
            >
              导航
            </Button>
            {!editing ? (
              <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>
                编辑
              </Button>
            ) : (
              <>
                <Button icon={<SaveOutlined />} type="primary" onClick={handleSave}>
                  保存
                </Button>
                <Button onClick={() => { setEditing(false); form.resetFields(); }}>
                  取消
                </Button>
              </>
            )}
          </Space>
        }
      >
        {!editing ? (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="目的地">{plan.destination}</Descriptions.Item>
              <Descriptions.Item label="天数">{plan.days} 天</Descriptions.Item>
              <Descriptions.Item label="预算">{plan.budget} 元</Descriptions.Item>
              <Descriptions.Item label="人数">{plan.people} 人</Descriptions.Item>
              <Descriptions.Item label="偏好" span={2}>
                {Array.isArray(plan.preferences) ? plan.preferences.join('、') : plan.preferences}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 24 }}>
              <Title level={4}>地图位置</Title>
              <MapView destination={plan.destination} itinerary={plan.itinerary} />
            </div>
            <div style={{ marginTop: 24 }}>
              <Title level={4}>详细行程</Title>
              <ol style={{ lineHeight: 2 }}>
                {plan.itinerary?.map((d: any) => (
                  <li key={d.day}>
                    <strong>第{d.day}天：</strong>{d.activities.join('，')}
                  </li>
                ))}
              </ol>
            </div>
          </>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item label="目的地" name="destination" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="天数" name="days" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="预算（元）" name="budget" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="人数" name="people" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="偏好" name="preferences">
              <Input.TextArea placeholder="用顿号、逗号或空格分隔" />
            </Form.Item>
            <Form.Item label="详细行程" name="itinerary">
              <Form.List name="itinerary">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card
                        key={key}
                        size="small"
                        title={`第 ${name + 1} 天`}
                        extra={
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                          >
                            删除
                          </Button>
                        }
                        style={{ marginBottom: 12 }}
                      >
                        <Form.Item
                          {...restField}
                          name={[name, 'day']}
                          initialValue={name + 1}
                          hidden
                        >
                          <InputNumber />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'activities']}
                          label="活动安排"
                          rules={[{ required: true, message: '请输入活动' }]}
                        >
                          <Input.TextArea
                            placeholder="多个活动用逗号、顿号或换行分隔"
                            autoSize={{ minRows: 2, maxRows: 6 }}
                            onChange={(e) => {
                              // 自动分割活动并保存为数组
                              const activities = e.target.value.split(/[，,、\n]+/).filter(Boolean);
                              const currentValues = form.getFieldValue('itinerary');
                              currentValues[name].activities = activities;
                              form.setFieldValue('itinerary', currentValues);
                            }}
                          />
                        </Form.Item>
                      </Card>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add({ day: fields.length + 1, activities: [] })}
                      block
                      icon={<PlusOutlined />}
                    >
                      添加一天行程
                    </Button>
                  </>
                )}
              </Form.List>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default PlanDetailPage;
