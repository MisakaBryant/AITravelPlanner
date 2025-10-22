import React, { useState } from 'react';
import { Form, Input, Button, Alert, Divider } from 'antd';
import SpeechInput from './SpeechInput';

const BudgetEstimateForm: React.FC<{ onResult: (result: any) => void }> = ({ onResult }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleSpeech = async (spoken: string) => {
    setText(prev => (prev ? `${prev} ${spoken}` : spoken));
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('请先用自然语言描述你的行程与计划');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/budget-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.code === 0) {
        setResult(data.data);
        onResult(data.data);
      } else {
        setError(data.msg || '预算估算失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form layout="vertical" style={{ background: '#fff' }} onFinish={handleSubmit}>
      <SpeechInput onResult={handleSpeech} />
      <Form.Item label="用自然语言描述预算需求" required>
        <Input.TextArea
          placeholder="例如：从上海出发，五一期间去日本东京玩5天，主要逛动漫、购物和吃美食，预算大概多少？"
          value={text}
          onChange={e => setText(e.target.value)}
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={loading} block>
        估算预算
      </Button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 12 }}>
          <Divider style={{ margin: '12px 0' }} />
          {typeof result.total !== 'undefined' && (
            <Alert type="success" message={`预估总预算：¥${Number(result.total).toFixed(0)}`} showIcon />
          )}
          {Array.isArray(result.breakdown) && result.breakdown.length > 0 && (
            <ul style={{ marginTop: 8, paddingLeft: 18 }}>
              {result.breakdown.map((b: any, idx: number) => (
                <li key={idx}>{b.type}：¥{Number(b.amount).toFixed(0)}</li>
              ))}
            </ul>
          )}
          {result.note && <div style={{ color: '#666', marginTop: 6 }}>{result.note}</div>}
        </div>
      )}
    </Form>
  );
};

export default BudgetEstimateForm;
