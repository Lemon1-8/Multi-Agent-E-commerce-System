const BASE = '/api';

export async function fetchAgents() {
  const res = await fetch(`${BASE}/dashboard/agents`);
  return res.json();
}

export async function fetchStatus() {
  const res = await fetch(`${BASE}/dashboard/status`);
  return res.json();
}

export async function createTask(type: string, input: Record<string, unknown>, targetAgentId?: string) {
  const res = await fetch(`${BASE}/agents/task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, input, targetAgentId }),
  });
  return res.json();
}
