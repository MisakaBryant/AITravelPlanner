import React, { useState } from 'react';

const AuthForm: React.FC<{ onLogin: (user: any) => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/auth/${isLogin ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.code === 0) {
        onLogin(data.data);
      } else {
        setError(data.msg || '操作失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 320, margin: '0 auto', marginTop: 32 }}>
      <h2>{isLogin ? '登录' : '注册'}</h2>
      <input name="username" placeholder="用户名" value={form.username} onChange={handleChange} required style={{ width: '100%', marginBottom: 8 }} />
      <input name="password" type="password" placeholder="密码" value={form.password} onChange={handleChange} required style={{ width: '100%', marginBottom: 8 }} />
      <button type="submit" disabled={loading} style={{ width: '100%' }}>
        {loading ? '处理中...' : isLogin ? '登录' : '注册'}
      </button>
      <div style={{ marginTop: 8 }}>
        <a href="#" onClick={e => { e.preventDefault(); setIsLogin(!isLogin); setError(''); }}>{isLogin ? '没有账号？注册' : '已有账号？登录'}</a>
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </form>
  );
};

export default AuthForm;
