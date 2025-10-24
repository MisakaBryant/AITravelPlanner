import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Form, Input, InputNumber, message, Space, Descriptions, List, Table, Tag } from 'antd';
import { EditOutlined, SaveOutlined, RollbackOutlined, EnvironmentOutlined, PlusOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons';
import MapView from './MapView';
import { Image } from 'antd';

const { Title } = Typography;


interface Plan {
  id: number;
  origin?: string;
  destination: string;
  days: number;
  budget: number;
  people: number;
  preferences: string | string[];
  itinerary: Array<{ day: number; activities: string[] }>;
  route_places?: Array<{ name: string; desc?: string; day?: number }>;
}

const PlanDetailPage: React.FC<{ userId: number }> = ({ userId }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [form] = Form.useForm();

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
                origin: found.origin || '',
                destination: found.destination,
                days: found.days,
                budget: found.budget,
                people: found.people,
                preferences: normalizePreferences(found.preferences).join('、'),
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

  // 加载行程关联的开销记录
  useEffect(() => {
    if (!id) return;
    setRecordsLoading(true);
    fetch(`/api/budget/records?planId=${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.code === 0) {
          setRecords(data.data || []);
        }
      })
      .finally(() => setRecordsLoading(false));
  }, [id]);

  // 保存编辑
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const preferences = values.preferences.split(/[，,、\s]+/).filter(Boolean);
      const itinerary = values.itinerary;
      // 先解析 route_places
      let route_places = [];
      try {
        const parseRes = await fetch('/api/route_places/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itinerary })
        });
        const parseData = await parseRes.json();
        if (parseData.code === 0) route_places = parseData.data;
      } catch {}
      // 更新后端
      await fetch('/api/plan/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan!.id, plan: { ...plan!, ...values, preferences, itinerary, route_places } })
      });
      setPlan({ ...plan!, ...values, preferences, itinerary, route_places });
      setEditing(false);
      message.success('行程已更新');
    } catch (err) {
      message.error('请检查表单输入');
    }
  };

  // 导航到目的地（打开高德地图导航，起点为当前位置）
  const handleNavigate = () => {
    if (!plan) return;
    const keyword = plan.destination;
    if (!window.AMap) {
      window.open(`https://uri.amap.com/navigation?to=${encodeURIComponent(keyword)}`, '_blank');
      return;
    }
    // 获取当前位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const geocoder = new window.AMap.Geocoder({ city: '全国' });
          geocoder.getLocation(keyword, (status: string, result: any) => {
            if (status === 'complete' && result?.geocodes?.length) {
              const loc = result.geocodes[0].location;
              const url = `https://uri.amap.com/navigation?from=${longitude},${latitude},我的位置&to=${loc.lng},${loc.lat},${encodeURIComponent(keyword)}`;
              window.open(url, '_blank');
            } else {
              // 兜底：只用地名
              window.open(`https://uri.amap.com/navigation?to=${encodeURIComponent(keyword)}`, '_blank');
            }
          });
        },
        () => {
          // 获取定位失败，仍然只用地名
          window.open(`https://uri.amap.com/navigation?to=${encodeURIComponent(keyword)}`, '_blank');
        }
      );
    } else {
      // 不支持定位
      window.open(`https://uri.amap.com/navigation?to=${encodeURIComponent(keyword)}`, '_blank');
    }
  };

  // 计算总开销
  const totalExpense = records.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  // 开销记录表格列定义
  const recordColumns = [
    {
      title: '项目',
      dataIndex: 'item',
      key: 'item',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => <span style={{ color: '#f5222d', fontWeight: 'bold' }}>¥{amount}</span>
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
  ];

  // 地点图片缩略图组件
  function PlaceThumb(props: { name: string }) {
    const { name } = props;
    const [url, setUrl] = React.useState<string | null>(null);
    useEffect(() => {
      if (!window.AMap) return;
      window.AMap.plugin('AMap.PlaceSearch', function () {
        const placeSearch = new window.AMap.PlaceSearch({ pageSize: 1 });
        placeSearch.search(name, function(status: string, result: any) {
          if (status === 'complete' && result?.poiList?.pois?.length) {
            const poi = result.poiList.pois[0];
            if (poi.photos && poi.photos.length > 0) setUrl(poi.photos[0].url);
          }
        });
      });
    }, [name]);
    return url ? (
      <Image src={url} width={64} height={48} style={{ objectFit: 'cover', borderRadius: 4, boxShadow: '0 1px 4px #eee' }} alt={name} />
    ) : (
      <div style={{ width: 64, height: 48, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 12 }}>{name}</div>
    );
  }

  if (loading) return <Card loading />;
  if (!plan) return <Card>行程不存在</Card>;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
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
        <Form form={form} layout="vertical" component="div">
          {!editing ? (
            <>
              <Descriptions bordered column={2}>
                {plan.origin && <Descriptions.Item label="出发地">{plan.origin}</Descriptions.Item>}
                <Descriptions.Item label="目的地">{plan.destination}</Descriptions.Item>
                <Descriptions.Item label="天数">{plan.days} 天</Descriptions.Item>
                <Descriptions.Item label="预算">{plan.budget} 元</Descriptions.Item>
                <Descriptions.Item label="人数">{plan.people} 人</Descriptions.Item>
                <Descriptions.Item label="偏好" span={2}>
                  {normalizePreferences(plan.preferences).join('、')}
                </Descriptions.Item>
              </Descriptions>
              <div style={{ marginTop: 24 }}>
                <Title level={4}>游览路线地图</Title>
                <MapView destination={plan.destination} routePlaces={plan.route_places} />
                {/* 路线图片缩略图展示 */}
                {Array.isArray(plan.route_places) && plan.route_places.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <span style={{ color: '#888' }}>关键地点图片：</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                      {plan.route_places.slice(0, 6).map((p, idx) => (
                        <PlaceThumb key={idx} name={p.name} />
                      ))}
                    </div>
                  </div>
                )}
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
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Title level={4}>
                    <DollarOutlined style={{ marginRight: 8 }} />
                    行程开销
                  </Title>
                  {records.length > 0 && (
                    <Tag color="red" style={{ fontSize: 16, padding: '4px 12px' }}>
                      总计：¥{totalExpense.toFixed(2)}
                    </Tag>
                  )}
                </div>
                <Table
                  dataSource={records}
                  columns={recordColumns}
                  loading={recordsLoading}
                  rowKey="id"
                  pagination={false}
                  locale={{ emptyText: '暂无开销记录' }}
                  size="small"
                  summary={() => 
                    records.length > 0 ? (
                      <Table.Summary fixed>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0}>
                            <strong>合计</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1}>
                            <strong style={{ color: '#f5222d' }}>¥{totalExpense.toFixed(2)}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2} />
                        </Table.Summary.Row>
                      </Table.Summary>
                    ) : null
                  }
                />
              </div>
            </>
          ) : (
            <>
              <Form.Item label="出发地" name="origin">
                <Input />
              </Form.Item>
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
            </>
          )}
        </Form>
      </Card>
    </div>
  );
};

export default PlanDetailPage;
