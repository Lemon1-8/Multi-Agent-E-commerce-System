import React, { useState, useRef, useEffect } from 'react';

interface Props {
  onSend: (text: string) => void;
  events: any[];
}

export function ChatPanel({ onSend, events }: Props) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string; ts: string }>>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: input, ts: new Date().toISOString() }]);
    onSend(input);
    setInput('');
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'assistant', content: '正在处理您的请求...', ts: new Date().toISOString() }]);
    }, 500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', fontWeight: 600, fontSize: 14 }}>
        💬 与 Agent 团队对话
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            marginBottom: 8, padding: 8, borderRadius: 8, maxWidth: '85%',
            background: msg.role === 'user' ? '#eff6ff' : '#f3f4f6',
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            fontSize: 13, lineHeight: 1.5,
          }}>
            <div style={{ fontWeight: 600, fontSize: 10, color: '#666', marginBottom: 2 }}>
              {msg.role === 'user' ? '你' : 'Agent'}
            </div>
            {msg.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: 12, borderTop: '1px solid #e0e0e0', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          placeholder="输入任务，如：分析蓝牙耳机市场趋势..."
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #d0d0d0', borderRadius: 6, fontSize: 13, outline: 'none' }}
        />
        <button onClick={handleSend}
          style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
          发送
        </button>
      </div>
    </div>
  );
}
