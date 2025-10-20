import React, { useState } from 'react';
import { Form, Input, InputNumber, Button, Typography } from 'antd';

const defaultForm = {
  days: 1,
  people: 1,
  destination: '',
  preferences: ''
};

const BudgetEstimateForm: React.FC<{ onResult: (result: any) => void }> = ({ onResult }) => {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (changed: Partial<typeof defaultForm>) => {
    setForm(prev => ({ ...prev, ...changed }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/budget/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          days: Number(form.days),
          people: Number(form.people),
          preferences: form.preferences.split(/[，,、\s]+/).filter(Boolean)
        })
      });
      const data = await res.json();
      if (data.code === 0) {
        onResult(data.data);
      } else {
        setError('预算估算失败');
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
      style={{ maxWidth: 400, margin: '0 auto', background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2' }}
      onFinish={handleSubmit}
    >
      <Typography.Title level={4}>预算估算</Typography.Title>
      <Form.Item label="目的地" required>
        <Input
          placeholder="目的地"
          value={form.destination}
          onChange={e => handleChange({ destination: e.target.value })}
        />
      </Form.Item>
      <Form.Item label="天数" required>
        <InputNumber
          min={1}
          value={form.days}
          onChange={v => handleChange({ days: Number(v) })}
          style={{ width: '100%' }}
        />
      </Form.Item>
      <Form.Item label="人数" required>
        <InputNumber
          min={1}
          value={form.people}
          onChange={v => handleChange({ people: Number(v) })}
          style={{ width: '100%' }}
        />
      </Form.Item>
      <Form.Item label="偏好（如美食、亲子）">
        <Input.TextArea
          placeholder="偏好"
          value={form.preferences}
          onChange={e => handleChange({ preferences: e.target.value })}
        />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={loading} block>
        估算预算
      </Button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </Form>
  );
};

export default BudgetEstimateForm;
