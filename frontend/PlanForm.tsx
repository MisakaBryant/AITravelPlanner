import React, { useState } from 'react';
import SpeechInput from './SpeechInput';

const defaultForm = {
  destination: '',
  days: 1,
  budget: '',
  preferences: '',
  people: 1
};

const PlanForm: React.FC<{ onResult: (result: any) => void }> = ({ onResult }) => {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 语音输入结果自动填充到偏好或目的地
  const handleSpeech = (text: string) => {
    // 简单判断是否为地名或偏好
    if (text.match(/(天|天数|天的)/)) {
      const days = parseInt(text.replace(/\D/g, ''));
      if (days) setForm(f => ({ ...f, days }));
    } else if (text.match(/(预算|元|块)/)) {
      const budget = parseInt(text.replace(/\D/g, ''));
      if (budget) setForm(f => ({ ...f, budget: String(budget) }));
    } else if (text.match(/(人|人数)/)) {
      const people = parseInt(text.replace(/\D/g, ''));
      if (people) setForm(f => ({ ...f, people }));
    } else if (text.match(/(美食|动漫|亲子|购物|自然|历史|文化)/)) {
      setForm(f => ({ ...f, preferences: f.preferences ? f.preferences + '、' + text : text }));
    } else {
      setForm(f => ({ ...f, destination: text }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>行程规划</h2>
      <SpeechInput onResult={handleSpeech} />
      <input name="destination" placeholder="目的地" value={form.destination} onChange={handleChange} required style={{ width: '100%', marginBottom: 8 }} />
      <input name="days" type="number" min={1} placeholder="天数" value={form.days} onChange={handleChange} required style={{ width: '100%', marginBottom: 8 }} />
      <input name="budget" type="number" min={0} placeholder="预算（元）" value={form.budget} onChange={handleChange} required style={{ width: '100%', marginBottom: 8 }} />
      <input name="people" type="number" min={1} placeholder="人数" value={form.people} onChange={handleChange} required style={{ width: '100%', marginBottom: 8 }} />
      <textarea name="preferences" placeholder="偏好（如美食、动漫、亲子）" value={form.preferences} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} />
      <button type="submit" disabled={loading} style={{ width: '100%' }}>
        {loading ? '生成中...' : '生成行程'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </form>
  );
};

export default PlanForm;
