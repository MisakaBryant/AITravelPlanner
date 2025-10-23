import React, { useState } from 'react';
import { Form, Input, InputNumber, Button, Typography } from 'antd';
import SpeechInput from './SpeechInput';

const defaultForm = {
  origin: '',
  destination: '',
  days: 1,
  budget: 0,
  preferences: '',
  people: 1
};

const PlanForm: React.FC<{ onResult: (result: any) => void }> = ({ onResult }) => {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (changed: Partial<typeof defaultForm>) => {
    setForm(prev => ({ ...prev, ...changed }));
  };

  // 语音输入结果通过大模型后端接口智能解析
  const handleSpeech = async (text: string) => {
    try {
      const res = await fetch('/api/ai/parse-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data && data.code === 0 && data.data) {
        setForm(f => ({ ...f, ...data.data }));
      }
    } catch (e) {
      // 可选：提示用户大模型解析失败
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          days: Number(form.days),
          budget: Number(form.budget),
          people: Number(form.people),
          preferences: form.preferences.split(/[，,、\s]+/).filter(Boolean)
        })
      });
      const data = await res.json();
      if (data.code === 0) {
        onResult(data.data);
      } else {
        setError('生成行程失败');
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
      <Typography.Title level={4}>行程规划</Typography.Title>
      <SpeechInput onResult={handleSpeech} />
        <Form.Item label="出发地" required>
          <Input
            placeholder="出发地"
            value={form.origin}
            onChange={e => handleChange({ origin: e.target.value })}
          />
        </Form.Item>
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
      <Form.Item label="预算（元）" required>
        <InputNumber
          min={0}
          value={form.budget}
          onChange={v => handleChange({ budget: Number(v) })}
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
      <Form.Item label="偏好（如美食、动漫、亲子）">
        <Input.TextArea
          placeholder="偏好"
          value={form.preferences}
          onChange={e => handleChange({ preferences: e.target.value })}
        />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={loading} block>
        生成行程
      </Button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </Form>
  );
};

export default PlanForm;
