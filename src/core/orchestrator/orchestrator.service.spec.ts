import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrchestratorService } from './orchestrator.service';
import { EventBusService } from '../event-bus/event-bus.service';
import {
  AgentTask, TaskType, TaskStatus, AgentResult, AgentStatus, AgentEvent, IAgent, ToolDefinition,
} from '../../common/interfaces';

class MockAgent implements IAgent {
  id: string; name: string; description = 'Mock';
  constructor(id: string, name: string) { this.id = id; this.name = name; }
  async handleTask(task: AgentTask): Promise<AgentResult> {
    return {
      taskId: task.id, agentId: this.id, status: TaskStatus.COMPLETED,
      output: { result: 'ok' }, steps: [], completedAt: new Date(),
    };
  }
  async handleEvent(_event: AgentEvent): Promise<void> {}
  getStatus(): AgentStatus { return AgentStatus.IDLE; }
  getTools(): ToolDefinition[] { return []; }
}

describe('OrchestratorService', () => {
  let orchestrator: OrchestratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [OrchestratorService, EventBusService],
    }).compile();
    orchestrator = module.get<OrchestratorService>(OrchestratorService);
  });

  it('注册 Agent', () => {
    orchestrator.registerAgent(new MockAgent('a1', '选品Agent'));
    expect(orchestrator.getRegisteredAgents()).toHaveLength(1);
  });

  it('任务路由到指定 Agent', async () => {
    orchestrator.registerAgent(new MockAgent('a1', '选品Agent'));
    const task: AgentTask = {
      id: 't1', type: TaskType.PRODUCT_RESEARCH,
      input: { query: '分析' }, targetAgentId: 'a1', createdAt: new Date(),
    };
    const result = await orchestrator.routeTask(task);
    expect(result.status).toBe(TaskStatus.COMPLETED);
  });

  it('未找到 Agent 时抛出错误', async () => {
    const task: AgentTask = {
      id: 't2', type: TaskType.PRODUCT_RESEARCH,
      input: {}, targetAgentId: 'nonexistent', createdAt: new Date(),
    };
    await expect(orchestrator.routeTask(task)).rejects.toThrow();
  });

  it('根据 TaskType 自动路由', async () => {
    orchestrator.registerAgent(new MockAgent('r1', '选品Agent'), TaskType.PRODUCT_RESEARCH);
    const task: AgentTask = {
      id: 't3', type: TaskType.PRODUCT_RESEARCH, input: {}, createdAt: new Date(),
    };
    const result = await orchestrator.routeTask(task);
    expect(result.agentId).toBe('r1');
  });
});
