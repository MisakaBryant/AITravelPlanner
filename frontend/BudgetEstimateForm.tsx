import React, { useState } from 'react';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>预算估算</h2>
      <input name="destination" placeholder="目的地" value={form.destination} onChange={handleChange} required style={{ width: '100%', marginBottom: 8 }} />
      <input name="days" type="number" min={1} placeholder="天数" value={form.days} onChange={handleChange} required style={{ width: '100%', marginBottom: 8 }} />
      <input name="people" type="number" min={1} placeholder="人数" value={form.people} onChange={handleChange} required style={{ width: '100%', marginBottom: 8 }} />
      <textarea name="preferences" placeholder="偏好（如美食、亲子）" value={form.preferences} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} />
      <button type="submit" disabled={loading} style={{ width: '100%' }}>
        {loading ? '估算中...' : '估算预算'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </form>
  );
};

export default BudgetEstimateForm;
