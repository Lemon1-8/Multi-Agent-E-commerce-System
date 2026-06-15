export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum TaskType {
  PRODUCT_RESEARCH = 'product_research',
  ORDER_MANAGEMENT = 'order_management',
  CUSTOMER_SERVICE = 'customer_service',
}

export interface AgentTask {
  id: string;
  type: TaskType;
  input: Record<string, unknown>;
  targetAgentId?: string;
  correlationId?: string;
  createdAt: Date;
}

export interface AgentResult {
  taskId: string;
  agentId: string;
  status: TaskStatus;
  output: Record<string, unknown>;
  steps: TaskStep[];
  completedAt: Date;
}

export interface TaskStep {
  name: string;
  status: TaskStatus;
  detail: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
}
