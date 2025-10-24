import React, { useState, useEffect } from 'react';
import { Input, Button, DatePicker, Form, Select } from 'antd';
import dayjs from 'dayjs';

const defaultForm = {
  item: '',
  amount: '',
  date: '',
  planId: undefined as number | undefined
};


const BudgetRecordForm: React.FC<{ userId: number; onSuccess: () => void }> = ({ userId, onSuccess }) => {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState<any[]>([]);

  // 加载用户的行程列表
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/plan/list?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.code === 0) setPlans(data.data || []);
      });
  }, [userId]);

  const handleChange = (changed: Partial<typeof defaultForm>) => {
    setForm(prev => ({ ...prev, ...changed }));
  };

  const handleSubmit = async () => {
    if (!form.planId) {
      setError('请选择关联行程');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/budget/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          userId,
          amount: Number(form.amount)
        })
      });
      const data = await res.json();
      if (data.code === 0) {
        onSuccess();
        setForm(defaultForm);
      } else {
        setError('记录失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      layout="vertical"
      style={{ background: '#fff' }}
      onFinish={handleSubmit}
    >
      <Form.Item label="关联行程" required>
        <Select
          placeholder="请选择行程"
          value={form.planId}
          onChange={(value) => handleChange({ planId: value })}
        >
          {plans.map(p => (
            <Select.Option key={p.id} value={p.id}>
              {p.destination} - {p.days}天
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item label="项目" required>
        <Input
          name="item"
          placeholder="如午餐、门票"
          value={form.item}
          onChange={e => handleChange({ item: e.target.value })}
        />
      </Form.Item>
      <Form.Item label="金额 (元)" required>
        <Input
          name="amount"
          type="number"
          min={0}
          placeholder="金额"
          value={form.amount}
          onChange={e => handleChange({ amount: e.target.value })}
        />
      </Form.Item>
      <Form.Item label="日期" required>
        <DatePicker
          style={{ width: '100%' }}
          value={form.date ? dayjs(form.date) : dayjs(Date.now())}
          onChange={d => handleChange({ date: d ? d.format('YYYY-MM-DD') : '' })}
        />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={loading} block>
        记录开销
      </Button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </Form>
  );
};

export default BudgetRecordForm;
