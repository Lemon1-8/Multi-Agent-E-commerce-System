import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ChatPanel } from './components/ChatPanel';
import { useWebSocket } from './hooks/useWebSocket';

export default function App() {
  const { events, sendMessage, connected, lastResponse } = useWebSocket();
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/dashboard/agents')
      .then((r) => r.json())
      .then(setAgents)
      .catch(console.error);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', margin: 0 }}>
      <div style={{ flex: 1, padding: 24, overflow: 'auto', background: '#f5f5f5' }}>
        <h1 style={{ margin: '0 0 16px 0', fontSize: 22 }}>Multi-Agent 跨境电商系统</h1>
        <div style={{ marginBottom: 12, color: connected ? '#22c55e' : '#ef4444', fontSize: 13 }}>
          {connected ? '已连接' : '未连接'}
        </div>
        <Dashboard agents={agents} events={events} />
      </div>
      <div style={{ width: 420, borderLeft: '1px solid #e0e0e0', background: '#fff' }}>
        <ChatPanel onSend={sendMessage} lastResponse={lastResponse} />
      </div>
    </div>
  );
}
