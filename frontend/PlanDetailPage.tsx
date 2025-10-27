import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Form, Input, InputNumber, message, Space, Descriptions, List, Table, Tag, Spin } from 'antd';
import { EditOutlined, SaveOutlined, RollbackOutlined, EnvironmentOutlined, PlusOutlined, DeleteOutlined, DollarOutlined, MenuOutlined } from '@ant-design/icons';
import MapView from './MapView';
import isEqual from 'lodash.isequal';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { Title } = Typography;


interface Plan {
  id: number;
  origin: string;
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
  const [saving, setSaving] = useState(false);
  const [savingTip, setSavingTip] = useState<string>('');
  const [records, setRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [form] = Form.useForm();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

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
                activities: Array.isArray(item.activities) ? item.activities : (typeof item.activities === 'string' ? [item.activities] : [])
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
      setSaving(true);
      setSavingTip('正在保存...');
      const values = await form.validateFields();
      const preferences = values.preferences.split(/[，,、\s]+/).filter(Boolean);
      // 规范化天序号，防止拖拽后 day 字段未同步
      const itinerary = (values.itinerary || []).map((d: any, idx: number) => ({ ...d, day: idx + 1 }));
      let route_places = [];
      if (!isEqual(itinerary, plan?.itinerary)) {
        // 先解析 route_places
        try {
          setSavingTip('正在解析路线...');
          const parseRes = await fetch('/api/route_places/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itinerary })
          });
          const parseData = await parseRes.json();
          if (parseData.code === 0) route_places = parseData.data;
        } catch {}
      }
      setSavingTip('正在保存...');
      // 更新后端
      await fetch('/api/plan/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan!.id, plan: { ...plan!, ...values, preferences, itinerary, route_places } })
      }).then(res => {
        if (res.status !== 200) {
          throw new Error('保存失败');
        }
      });
      setPlan({ ...plan!, ...values, preferences, itinerary, route_places });
      setEditing(false);
      message.success('行程已更新');
    } catch (err) {
      message.error('更新失败');
    } finally {
      setSaving(false);
      setSavingTip('');
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

  // 可拖拽的活动行组件
  function ActivitySortableRow({ id, actField, actIdx, addAct, removeAct }: { id: any, actField: any, actIdx: number, addAct: (init?: any, index?: number) => void, removeAct: (index: number) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      display: 'flex',
      alignItems: 'center',
      marginBottom: 6,
      background: isDragging ? '#f0f5ff' : undefined,
      borderRadius: 4,
      padding: 4,
    };
    const { key: _omitKey, ...fieldProps } = actField || {};
    return (
      <div ref={setNodeRef} style={style}>
        <Button type="text" icon={<MenuOutlined />} {...attributes} {...listeners} style={{ cursor: 'grab', marginRight: 8 }} />
        <Form.Item {...fieldProps} name={actField.name} style={{ flex: 1, marginBottom: 0 }} rules={[{ required: true, message: '请输入活动' }]}> 
          <Input placeholder={`活动${actIdx + 1}`} />
        </Form.Item>
        <Button type="text" icon={<PlusOutlined />} onClick={() => addAct('', actIdx + 1)} />
        <Button type="text" icon={<DeleteOutlined />} danger onClick={() => removeAct(actField.name)} />
      </div>
    );
  }

  // 可拖拽的“天”卡片组件，内部包含活动编辑（含拖拽）
  function DaySortableCard({ id, dayIdx, name, restField, addDay, removeDay }: { id: any, dayIdx: number, name: number, restField: any, addDay: () => void, removeDay: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      marginBottom: 12,
      background: isDragging ? '#fafcff' : undefined,
      borderRadius: 6,
    };
    return (
      <div ref={setNodeRef} style={style}>
        <Card
          size="small"
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Button type="text" icon={<MenuOutlined />} {...attributes} {...listeners} style={{ cursor: 'grab' }} />第 {dayIdx + 1} 天</div>}
          extra={
            <>
              <Button type="text" icon={<PlusOutlined />} onClick={addDay}>插入一天</Button>
              <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={removeDay}>删除</Button>
            </>
          }
        >
          <Form.Item {...restField} name={[name, 'day']} initialValue={dayIdx + 1} hidden>
            <InputNumber />
          </Form.Item>
          <Form.List name={[name, 'activities']}>
            {(acts, { add: addAct, remove: removeAct, move: moveAct }) => {
              const ids = acts.map((f: any) => f.key);
              const onDragEnd = (event: any) => {
                const { active, over } = event || {};
                if (!active || !over || active.id === over.id) return;
                const oldIndex = ids.indexOf(active.id);
                const newIndex = ids.indexOf(over.id);
                if (oldIndex < 0 || newIndex < 0) return;
                moveAct(oldIndex, newIndex);
              };
              return (
                <>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                      {acts.map((actField: any, actIdx: number) => (
                        <ActivitySortableRow
                          key={actField.key}
                          id={actField.key}
                          actField={actField}
                          actIdx={actIdx}
                          addAct={addAct}
                          removeAct={removeAct}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                  <Button type="dashed" onClick={() => addAct('')} block icon={<PlusOutlined />}>新增活动</Button>
                </>
              );
            }}
          </Form.List>
        </Card>
      </div>
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
  <Spin spinning={saving} tip={savingTip}>
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
              </div>
              <div style={{ marginTop: 24 }}>
                <Title level={4}>详细行程</Title>
                <ol style={{ lineHeight: 2 }}>
                  {plan.itinerary?.map((d: any) => (
                    <li key={d.day} style={{ marginBottom: 8 }}>
                      <strong>第{d.day}天：</strong>
                      <ul style={{ margin: '4px 0 0 24px', padding: 0 }}>
                        {Array.isArray(d.activities) ? d.activities.map((act: string, idx: number) => (
                          <li key={idx} style={{ listStyle: 'disc', margin: 0 }}>{act}</li>
                        )) : null}
                      </ul>
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
              <Form.Item label="出发地" name="origin" rules={[{ required: true }]}>
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
                  {(fields, { add, remove, move }) => {
                    const dayIds = fields.map((f: any) => f.key);
                    const onDayDragEnd = (event: any) => {
                      const { active, over } = event || {};
                      if (!active || !over || active.id === over.id) return;
                      const oldIndex = dayIds.indexOf(active.id);
                      const newIndex = dayIds.indexOf(over.id);
                      if (oldIndex < 0 || newIndex < 0) return;
                      // 使用 antd 的 move 以避免回弹
                      move(oldIndex, newIndex);
                    };
                    return (
                      <>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDayDragEnd}>
                          <SortableContext items={dayIds} strategy={verticalListSortingStrategy}>
                            {fields.map(({ key, name, ...restField }, dayIdx) => (
                              <DaySortableCard
                                key={key}
                                id={key}
                                dayIdx={dayIdx}
                                name={name}
                                restField={restField}
                                addDay={() => add({ day: dayIdx + 2, activities: [] }, dayIdx + 1)}
                                removeDay={() => remove(name)}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                        <Button type="dashed" onClick={() => add({ day: fields.length + 1, activities: [] })} block icon={<PlusOutlined />}>添加一天行程</Button>
                      </>
                    );
                  }}
                </Form.List>
              </Form.Item>
            </>
          )}
        </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default PlanDetailPage;
