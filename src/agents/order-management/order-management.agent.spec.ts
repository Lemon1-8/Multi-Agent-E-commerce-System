import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrderManagementAgent } from './order-management.agent';
import { ProductCrudTool } from './tools/product-crud.tool';
import { OrderWorkflowTool } from './tools/order-workflow.tool';
import { InventoryAlertTool } from './tools/inventory-alert.tool';
import { AnomalyDetectionTool } from './tools/anomaly-detection.tool';
import { EventBusService } from '../../core/event-bus/event-bus.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../../infrastructure/database/entities/product.entity';
import { Order } from '../../infrastructure/database/entities/order.entity';

describe('OrderManagementAgent', () => {
  let agent: OrderManagementAgent;

  const mockRepo = { find: jest.fn().mockResolvedValue([]), findOne: jest.fn().mockResolvedValue(null), create: jest.fn(), save: jest.fn(), update: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        OrderManagementAgent, EventBusService,
        InventoryAlertTool, AnomalyDetectionTool,
        { provide: getRepositoryToken(Product), useValue: mockRepo },
        { provide: getRepositoryToken(Order), useValue: mockRepo },
        { provide: ProductCrudTool, useFactory: (repo: any) => new ProductCrudTool(repo), inject: [getRepositoryToken(Product)] },
        { provide: OrderWorkflowTool, useFactory: (repo: any) => new OrderWorkflowTool(repo), inject: [getRepositoryToken(Order)] },
      ],
    }).compile();

    agent = module.get<OrderManagementAgent>(OrderManagementAgent);
  });

  it('应该定义基础属性', () => {
    expect(agent.id).toBe('order-management');
    expect(agent.name).toBe('订单处理Agent');
  });

  it('应该注册工具集', () => {
    expect(agent.getTools().length).toBeGreaterThanOrEqual(3);
  });

  it('应该处理库存预警任务', async () => {
    const task = {
      id: 't1', type: 'order_management' as any,
      input: { action: 'check_inventory', productName: '蓝牙耳机', currentStock: 20, threshold: 100 },
      createdAt: new Date(),
    };
    const result = await agent.handleTask(task);
    expect(result.status).toBe('completed');
    expect(result.output).toHaveProperty('alert');
  });
});
