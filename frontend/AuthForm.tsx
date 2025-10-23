import React, { useState } from 'react';
import { Form, Input, Button, Typography } from 'antd';

const AuthForm: React.FC<{ onLogin: (user: any) => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (changed: Partial<typeof form>) => {
    setForm(prev => ({ ...prev, ...changed }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/auth/${isLogin ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include' // 关键：允许携带/接收 cookie
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
    <Form
      layout="vertical"
      style={{ maxWidth: 320, margin: '0 auto', marginTop: 32, background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2' }}
      onFinish={handleSubmit}
    >
      <Typography.Title level={4}>{isLogin ? '登录' : '注册'}</Typography.Title>
      <Form.Item label="用户名" required>
        <Input
          placeholder="用户名"
          value={form.username}
          onChange={e => handleChange({ username: e.target.value })}
        />
      </Form.Item>
      <Form.Item label="密码" required>
        <Input.Password
          placeholder="密码"
          value={form.password}
          onChange={e => handleChange({ password: e.target.value })}
        />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={loading} block>
        {isLogin ? '登录' : '注册'}
      </Button>
      <div style={{ marginTop: 8 }}>
        <a href="#" onClick={e => { e.preventDefault(); setIsLogin(!isLogin); setError(''); }}>{isLogin ? '没有账号？注册' : '已有账号？登录'}</a>
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </Form>
  );
};

export default AuthForm;

// 检查登录状态
export async function checkAuth() {
  try {
    const res = await fetch('/api/auth/check', { credentials: 'include' });
    const data = await res.json();
    if (data.code === 0) return data.data;
    return null;
  } catch {
    return null;
  }
}

// 登出
export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}
