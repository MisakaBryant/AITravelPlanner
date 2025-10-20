import React, { useState } from 'react';

const defaultForm = {
  item: '',
  amount: '',
  date: ''
};

const BudgetRecordForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto', marginTop: 24 }}>
      <h2>开销记录</h2>
      <input name="item" placeholder="项目（如午餐、门票）" value={form.item} onChange={handleChange} required style={{ width: '100%', marginBottom: 8 }} />
      <input name="amount" type="number" min={0} placeholder="金额（元）" value={form.amount} onChange={handleChange} required style={{ width: '100%', marginBottom: 8 }} />
      <input name="date" type="date" value={form.date} onChange={handleChange} required style={{ width: '100%', marginBottom: 8 }} />
      <button type="submit" disabled={loading} style={{ width: '100%' }}>
        {loading ? '记录中...' : '记录开销'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </form>
  );
};

export default BudgetRecordForm;
