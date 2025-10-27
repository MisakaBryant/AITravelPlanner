
import React, { useRef, useState } from 'react';
import { Button, Tooltip, message } from 'antd';

const SpeechInput: React.FC<{ onResult: (text: string) => void }> = ({ onResult }) => {
  const recognitionRef = useRef<any>(null);
  const [recording, setRecording] = useState(false);

  const startRecognition = () => {
    if (!('webkitSpeechRecognition' in window)) {
      message.warning('当前浏览器不支持语音识别');
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
      message.error('语音识别失败');
    };
    recognition.onend = () => {
      setRecording(false);
    };
    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  };

  const stopRecognition = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  // 兼容移动端和PC端
  const handlePress = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!recording) startRecognition();
  };
  const handleRelease = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (recording) stopRecognition();
  };

  return (
    <div style={{ margin: '16px 0', textAlign: 'center' }}>
      <Tooltip title={recording ? '松开停止识别' : '按住说话'}>
        <Button
          type={recording ? 'primary' : 'default'}
          shape="circle"
          size="large"
          icon={<span role="img" aria-label="mic">🎤</span>}
          style={{ background: recording ? '#ff7875' : undefined, color: recording ? '#fff' : undefined, border: recording ? 'none' : undefined }}
          onMouseDown={handlePress}
          onMouseUp={handleRelease}
          onMouseLeave={handleRelease}
          onTouchStart={handlePress}
          onTouchEnd={handleRelease}
        />
      </Tooltip>
      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{recording ? '正在聆听，请说话...' : '按住麦克风说话'}</div>
    </div>
  );
};

export default SpeechInput;
