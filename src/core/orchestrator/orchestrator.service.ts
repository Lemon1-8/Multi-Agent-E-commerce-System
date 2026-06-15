import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../event-bus/event-bus.service';
import {
  IAgent, AgentTask, AgentResult, AgentEventType, TaskType, TaskStatus,
} from '../../common/interfaces';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private readonly agents: Map<string, IAgent> = new Map();
  private readonly taskTypeRouting: Map<TaskType, string> = new Map();

  constructor(private readonly eventBus: EventBusService) {}

  registerAgent(agent: IAgent, defaultTaskType?: TaskType): void {
    this.agents.set(agent.id, agent);
    if (defaultTaskType) this.taskTypeRouting.set(defaultTaskType, agent.id);
    this.logger.log(`Agent 已注册: ${agent.name} (${agent.id})`);
  }

  getRegisteredAgents(): IAgent[] { return Array.from(this.agents.values()); }
  getAgent(id: string): IAgent | undefined { return this.agents.get(id); }

  async routeTask(task: AgentTask): Promise<AgentResult> {
    const targetAgentId = task.targetAgentId ?? this.taskTypeRouting.get(task.type);
    if (!targetAgentId) throw new Error(`无法路由任务: TaskType ${task.type} 未注册路由`);
    const agent = this.agents.get(targetAgentId);
    if (!agent) throw new Error(`Agent ${targetAgentId} 未注册`);

    this.logger.log(`路由任务 ${task.id} → ${agent.name}`);
    this.eventBus.emit(AgentEventType.TASK_ASSIGNED, { taskId: task.id, agentId: agent.id }, task.correlationId);
    const result = await agent.handleTask(task);

    const eventType = result.status === TaskStatus.COMPLETED
      ? AgentEventType.TASK_COMPLETED : AgentEventType.TASK_FAILED;
    this.eventBus.emit(eventType, result, task.correlationId, agent.id);
    return result;
  }

  async broadcastEvent(eventType: AgentEventType, payload: unknown, correlationId?: string): Promise<void> {
    const agents = Array.from(this.agents.values());
    await Promise.allSettled(
      agents.map((agent) =>
        agent.handleEvent({
          id: crypto.randomUUID(), type: eventType, source: 'orchestrator',
          timestamp: new Date(), payload, correlationId,
        })
      )
    );
  }
}
