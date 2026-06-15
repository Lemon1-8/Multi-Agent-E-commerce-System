import React from 'react';

interface Props {
  agents: any[];
  events: any[];
}

export function Dashboard({ agents, events }: Props) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {agents.map((agent) => (
          <div key={agent.id} style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>{agent.name}</h3>
              <span style={{
                padding: '2px 8px', borderRadius: 12, fontSize: 11,
                background: agent.status === 'idle' ? '#dcfce7' : agent.status === 'busy' ? '#fef9c3' : '#fee2e2',
                color: agent.status === 'idle' ? '#166534' : agent.status === 'busy' ? '#854d0e' : '#991b1b',
              }}>
                {agent.status}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>{agent.description}</p>
            <div style={{ marginTop: 8, fontSize: 11, color: '#999' }}>
              {agent.tools?.length ?? 0} 个工具
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 16, marginBottom: 8 }}>实时事件流</h2>
      <div style={{ background: '#fff', borderRadius: 8, padding: 12, maxHeight: 300, overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {events.length === 0 && <p style={{ color: '#999', fontSize: 13 }}>暂无事件</p>}
        {events.map((evt, i) => (
          <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>
            <span style={{ color: '#2563eb', fontWeight: 500 }}>{evt.type ?? evt.eventType}</span>
            <span style={{ color: '#999', marginLeft: 8 }}>{new Date(evt.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
