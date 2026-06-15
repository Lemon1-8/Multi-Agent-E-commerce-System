import { Injectable, Logger } from '@nestjs/common';
import {
  IAgent, AgentStatus, AgentTask, AgentResult, AgentEvent,
  AgentEventType, TaskStatus, TaskStep, ToolDefinition,
} from '../../common/interfaces';

@Injectable()
export abstract class BaseAgent implements IAgent {
  protected readonly logger = new Logger(this.constructor.name);
  protected status: AgentStatus = AgentStatus.IDLE;
  private taskSteps: Map<string, TaskStep[]> = new Map();

  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;

  abstract getTools(): ToolDefinition[];
  abstract executeTask(task: AgentTask): Promise<Record<string, unknown>>;
  abstract handleEvent(event: AgentEvent): Promise<void>;

  async handleTask(task: AgentTask): Promise<AgentResult> {
    this.status = AgentStatus.BUSY;

    try {
      this.addStep(task.id, 'start', TaskStatus.COMPLETED, `Agent ${this.name} 开始处理`);
      const output = await this.executeTask(task);
      this.addStep(task.id, 'done', TaskStatus.COMPLETED, '任务执行完成');
      this.status = AgentStatus.IDLE;

      return {
        taskId: task.id, agentId: this.id, status: TaskStatus.COMPLETED,
        output, steps: this.taskSteps.get(task.id) ?? [], completedAt: new Date(),
      };
    } catch (error) {
      this.status = AgentStatus.ERROR;
      this.addStep(task.id, 'error', TaskStatus.FAILED, (error as Error).message);
      return {
        taskId: task.id, agentId: this.id, status: TaskStatus.FAILED,
        output: { error: (error as Error).message },
        steps: this.taskSteps.get(task.id) ?? [], completedAt: new Date(),
      };
    } finally {
      this.taskSteps.delete(task.id);
    }
  }

  getStatus(): AgentStatus { return this.status; }

  protected addStep(taskId: string, name: string, status: TaskStatus, detail: string): void {
    const steps = this.taskSteps.get(taskId) ?? [];
    steps.push({ name, status, detail, startedAt: new Date(),
      completedAt: status === TaskStatus.COMPLETED ? new Date() : undefined });
    this.taskSteps.set(taskId, steps);
  }

  protected emitEvent(
    eventBus: { emit: (event: AgentEvent) => void },
    type: AgentEventType, payload: unknown, correlationId?: string,
  ): void {
    eventBus.emit({
      id: crypto.randomUUID(), type, source: this.id,
      timestamp: new Date(), payload, correlationId,
    });
  }
}
