import { Test, TestingModule } from '@nestjs/testing';
import { OrderManagementAgent } from './order-management.agent';
import { ReActLoopService } from '../../core/agent-base/react-loop.service';
import { EventBusService } from '../../core/event-bus/event-bus.service';
import { ProductCrudTool } from './tools/product-crud.tool';
import { OrderWorkflowTool } from './tools/order-workflow.tool';
import { InventoryAlertTool } from './tools/inventory-alert.tool';
import { AnomalyDetectionTool } from './tools/anomaly-detection.tool';

describe('OrderManagementAgent', () => {
  let agent: OrderManagementAgent;

  const mockReActLoop = { run: jest.fn().mockResolvedValue({ result: 'test output' }) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderManagementAgent,
        { provide: ReActLoopService, useValue: mockReActLoop },
        { provide: EventBusService, useValue: { emit: jest.fn() } },
        { provide: ProductCrudTool, useValue: { definition: { name: 'product_crud' }, execute: jest.fn() } },
        { provide: OrderWorkflowTool, useValue: { definition: { name: 'order_workflow' }, execute: jest.fn() } },
        { provide: InventoryAlertTool, useValue: { definition: { name: 'check_inventory' }, execute: jest.fn() } },
        { provide: AnomalyDetectionTool, useValue: { definition: { name: 'detect_anomalies' }, execute: jest.fn() } },
      ],
    }).compile();

    agent = module.get<OrderManagementAgent>(OrderManagementAgent);
  });

  it('应该定义基础属性和系统提示词', () => {
    expect(agent.id).toBe('order-management');
    expect(agent.name).toBe('订单处理Agent');
    expect(agent.systemPrompt).toBeTruthy();
  });

  it('应该注册所有工具', () => {
    expect(agent.getTools().length).toBe(4);
  });

  it('应该通过ReAct循环处理任务', async () => {
    const task = { id: 't1', type: 'order_management' as any, input: { action: 'check_inventory', productName: '蓝牙耳机', currentStock: 20, threshold: 100 }, createdAt: new Date() };
    const result = await agent.handleTask(task);
    expect(result.status).toBe('completed');
    expect(mockReActLoop.run).toHaveBeenCalled();
  });
});
