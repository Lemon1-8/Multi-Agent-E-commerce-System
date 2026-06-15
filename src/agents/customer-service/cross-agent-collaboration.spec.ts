import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrchestratorService } from '../../core/orchestrator/orchestrator.service';
import { EventBusService } from '../../core/event-bus/event-bus.service';
import { BaseAgent } from '../../core/agent-base/base-agent';
import { AgentTask, AgentEvent, TaskStatus, TaskType, AgentEventType, ToolDefinition } from '../../common/interfaces';

class TestResearchAgent extends BaseAgent {
  id = 'research-1'; name = '选品Agent'; description = '选品';
  getTools(): ToolDefinition[] { return []; }
  async executeTask(task: AgentTask): Promise<Record<string, unknown>> {
    return { report: '分析结果' };
  }
  async handleEvent(_event: AgentEvent): Promise<void> {}
}

class TestOrderAgent extends BaseAgent {
  id = 'order-1'; name = '订单Agent'; description = '订单';
  receivedEvents: AgentEvent[] = [];
  getTools(): ToolDefinition[] { return []; }
  async executeTask(task: AgentTask): Promise<Record<string, unknown>> {
    if (task.input.action === 'create_product') {
      this.receivedEvents.push({ id: 'ev-1', type: AgentEventType.REPORT_GENERATED, source: 'research-1', timestamp: new Date(), payload: {} });
    }
    return { product: { id: 'prod-1' } };
  }
  async handleEvent(event: AgentEvent): Promise<void> {
    this.receivedEvents.push(event);
  }
}

class TestServiceAgent extends BaseAgent {
  id = 'service-1'; name = '客服Agent'; description = '客服';
  receivedEvents: AgentEvent[] = [];
  getTools(): ToolDefinition[] { return []; }
  async executeTask(): Promise<Record<string, unknown>> {
    return { reply: '感谢您的咨询' };
  }
  async handleEvent(event: AgentEvent): Promise<void> {
    this.receivedEvents.push(event);
  }
}

describe('Cross-Agent Collaboration', () => {
  let orchestrator: OrchestratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [OrchestratorService, EventBusService],
    }).compile();
    orchestrator = module.get<OrchestratorService>(OrchestratorService);
  });

  it('选品→订单→客服 事件联动流程', async () => {
    const researchAgent = new TestResearchAgent();
    const orderAgent = new TestOrderAgent();
    const serviceAgent = new TestServiceAgent();

    orchestrator.registerAgent(researchAgent, TaskType.PRODUCT_RESEARCH);
    orchestrator.registerAgent(orderAgent, TaskType.ORDER_MANAGEMENT);
    orchestrator.registerAgent(serviceAgent, TaskType.CUSTOMER_SERVICE);

    // 1. 选品生成报告
    const reportResult = await orchestrator.routeTask({
      id: 'collab-1', type: TaskType.PRODUCT_RESEARCH, input: { query: '蓝牙耳机' }, createdAt: new Date(),
    });
    expect(reportResult.status).toBe(TaskStatus.COMPLETED);

    // 2. 订单Agent创建商品
    const orderResult = await orchestrator.routeTask({
      id: 'collab-2', type: TaskType.ORDER_MANAGEMENT, input: { action: 'create_product', sku: 'BT-001', title: '蓝牙耳机', price: 99, category: '电子' }, createdAt: new Date(),
    });
    expect(orderResult.status).toBe(TaskStatus.COMPLETED);

    // 3. 客服Agent响应
    const serviceResult = await orchestrator.routeTask({
      id: 'collab-3', type: TaskType.CUSTOMER_SERVICE, input: { action: 'handle_query', text: '你好' }, createdAt: new Date(),
    });
    expect(serviceResult.status).toBe(TaskStatus.COMPLETED);
  });
});
