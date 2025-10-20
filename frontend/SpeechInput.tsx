import React, { useRef } from 'react';

// 这里只做浏览器原生Web Speech API演示，实际项目可替换为科大讯飞/阿里云API
const SpeechInput: React.FC<{ onResult: (text: string) => void }> = ({ onResult }) => {
  const recognitionRef = useRef<any>(null);

  const handleStart = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('当前浏览器不支持语音识别');
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };
    recognition.onerror = () => {
      alert('语音识别失败');
    };
    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleStop = () => {
    recognitionRef.current?.stop();
  };

  return (
    <div style={{ margin: '16px 0' }}>
      <button type="button" onClick={handleStart}>🎤 语音输入</button>
      <button type="button" onClick={handleStop} style={{ marginLeft: 8 }}>停止</button>
    </div>
  );
};

export default SpeechInput;
