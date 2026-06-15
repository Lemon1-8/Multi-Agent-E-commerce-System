export enum AgentEventType {
  REPORT_GENERATED = 'report.generated',
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  ORDER_STATUS_CHANGED = 'order.status_changed',
  REPLY_GENERATED = 'reply.generated',
  ESCALATION_TRIGGERED = 'escalation.triggered',
  TASK_ASSIGNED = 'task.assigned',
  TASK_COMPLETED = 'task.completed',
  TASK_FAILED = 'task.failed',
  AGENT_STATUS_CHANGED = 'agent.status_changed',
}

export interface AgentEvent {
  id: string;
  type: AgentEventType;
  source: string;
  timestamp: Date;
  payload: unknown;
  correlationId?: string;
}
