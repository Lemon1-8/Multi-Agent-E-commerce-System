import type { AgentTask, AgentResult, ToolDefinition } from './task.interface';
import type { AgentEvent } from './event.interface';

export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  OFFLINE = 'offline',
}

export interface IAgent {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  handleTask(task: AgentTask): Promise<AgentResult>;
  handleEvent(event: AgentEvent): Promise<void>;
  getStatus(): AgentStatus;
  getTools(): ToolDefinition[];
}
