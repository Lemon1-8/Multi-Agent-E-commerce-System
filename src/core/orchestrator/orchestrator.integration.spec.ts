import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrchestratorService } from './orchestrator.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { BaseAgent } from '../agent-base/base-agent';
import {
  AgentEvent, AgentResult, AgentStatus, AgentTask,
  TaskStatus, TaskType, AgentEventType, ToolDefinition,
} from '../../common/interfaces';

class TestResearchAgent extends BaseAgent {
  id = 'research-1';
  name = '选品Agent';
  description = '负责选品分析';

  getTools(): ToolDefinition[] { return []; }
  async executeTask(task: AgentTask): Promise<Record<string, unknown>> {
    return { report: `分析完成: ${task.input.query}` };
  }
  async handleEvent(_event: AgentEvent): Promise<void> {}
}

class TestOrderAgent extends BaseAgent {
  id = 'order-1';
  name = '订单Agent';
  description = '负责订单处理';

  getTools(): ToolDefinition[] { return []; }
  async executeTask(task: AgentTask): Promise<Record<string, unknown>> {
    return { order: `订单已处理: ${JSON.stringify(task.input)}` };
  }
  async handleEvent(event: AgentEvent): Promise<void> {
    this.logger.log(`收到事件: ${event.type}`);
  }
}

describe('Framework Integration', () => {
  let orchestrator: OrchestratorService;
  let eventBus: EventBusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [OrchestratorService, EventBusService],
    }).compile();

    orchestrator = module.get<OrchestratorService>(OrchestratorService);
    eventBus = module.get<EventBusService>(EventBusService);
  });

  it('完整的 Agent 注册 → 任务路由 → 结果返回流程', async () => {
    const researchAgent = new TestResearchAgent();
    orchestrator.registerAgent(researchAgent, TaskType.PRODUCT_RESEARCH);

    const task: AgentTask = {
      id: 'task-int-1',
      type: TaskType.PRODUCT_RESEARCH,
      input: { query: '蓝牙耳机市场趋势' },
      createdAt: new Date(),
    };

    const result = await orchestrator.routeTask(task);
    expect(result.status).toBe(TaskStatus.COMPLETED);
    expect(result.output).toHaveProperty('report');
  });

  it('事件广播通知所有 Agent', async () => {
    const orderAgent = new TestOrderAgent();
    orchestrator.registerAgent(orderAgent);

    const handleEventSpy = jest.spyOn(orderAgent, 'handleEvent');

    await orchestrator.broadcastEvent(AgentEventType.REPORT_GENERATED, { reportId: 'r-1' });

    expect(handleEventSpy).toHaveBeenCalled();
    expect(handleEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AgentEventType.REPORT_GENERATED })
    );
  });
});
