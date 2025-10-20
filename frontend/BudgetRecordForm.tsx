import React, { useState } from 'react';
import { Input, Button, DatePicker, Form, Typography, message } from 'antd';
import dayjs from 'dayjs';

const defaultForm = {
  item: '',
  amount: '',
  date: ''
};


const BudgetRecordForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (changed: Partial<typeof defaultForm>) => {
    setForm(prev => ({ ...prev, ...changed }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/budget/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
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
      style={{ maxWidth: 400, margin: '0 auto', marginTop: 24, background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2' }}
      onFinish={handleSubmit}
    >
      <Typography.Title level={4}>开销记录</Typography.Title>
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
          value={form.date ? dayjs(form.date) : undefined}
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
