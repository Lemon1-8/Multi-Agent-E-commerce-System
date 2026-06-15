import { Injectable } from '@nestjs/common';
import { BaseAgent } from '../../core/agent-base/base-agent';
import { EventBusService } from '../../core/event-bus/event-bus.service';
import { AgentTask, AgentEvent, TaskStatus, AgentEventType, ToolDefinition } from '../../common/interfaces';
import { ProductCrudTool } from './tools/product-crud.tool';
import { OrderWorkflowTool } from './tools/order-workflow.tool';
import { InventoryAlertTool } from './tools/inventory-alert.tool';
import { AnomalyDetectionTool } from './tools/anomaly-detection.tool';

@Injectable()
export class OrderManagementAgent extends BaseAgent {
  readonly id = 'order-management';
  readonly name = '订单处理Agent';
  readonly description = '负责商品管理、订单生命周期、库存预警和异常检测';

  constructor(
    private readonly eventBus: EventBusService,
    private readonly productCrud: ProductCrudTool,
    private readonly orderWorkflow: OrderWorkflowTool,
    private readonly inventoryAlert: InventoryAlertTool,
    private readonly anomalyDetection: AnomalyDetectionTool,
  ) { super(); }

  getTools(): ToolDefinition[] {
    return [
      { name: 'create_product', description: '创建商品', parameters: [
        { name: 'sku', type: 'string', description: 'SKU', required: true },
        { name: 'title', type: 'string', description: '商品标题', required: true },
        { name: 'price', type: 'number', description: '价格', required: true },
        { name: 'category', type: 'string', description: '类目', required: true },
      ]},
      { name: 'list_products', description: '查询商品列表', parameters: [
        { name: 'category', type: 'string', description: '类目', required: false },
      ]},
      { name: 'create_order', description: '创建订单', parameters: [
        { name: 'productId', type: 'string', description: '商品ID', required: true },
        { name: 'totalAmount', type: 'number', description: '金额', required: true },
      ]},
      { name: 'update_order_status', description: '更新订单状态', parameters: [
        { name: 'orderId', type: 'string', description: '订单ID', required: true },
        { name: 'status', type: 'string', description: '新状态', required: true },
      ]},
      { name: 'check_inventory', description: '检查库存预警', parameters: [
        { name: 'productName', type: 'string', description: '商品名', required: true },
        { name: 'currentStock', type: 'number', description: '当前库存', required: true },
        { name: 'threshold', type: 'number', description: '安全线', required: true },
      ]},
    ];
  }

  async executeTask(task: AgentTask): Promise<Record<string, unknown>> {
    const { action, ...data } = task.input as Record<string, unknown>;

    switch (action) {
      case 'create_product': {
        const product = await this.productCrud.create(data as any);
        this.eventBus.emit(AgentEventType.PRODUCT_CREATED, product, task.correlationId, this.id);
        return { product };
      }
      case 'list_products': {
        const products = await this.productCrud.listByCategory(data.category as string);
        return { products, count: products.length };
      }
      case 'create_order': {
        const order = await this.orderWorkflow.create(data.productId as string, data.totalAmount as number, data.customerId as string);
        return { order };
      }
      case 'update_order_status': {
        const order = await this.orderWorkflow.transition(data.orderId as string, data.status as any);
        this.eventBus.emit(AgentEventType.ORDER_STATUS_CHANGED, { orderId: data.orderId, newStatus: data.status }, task.correlationId, this.id);
        return { order };
      }
      case 'check_inventory': {
        return this.inventoryAlert.check(data.productName as string, data.currentStock as number, data.threshold as number);
      }
      default:
        return { message: `未知操作: ${action}` };
    }
  }

  async handleEvent(event: AgentEvent): Promise<void> {
    if (event.type === AgentEventType.REPORT_GENERATED) {
      this.logger.log(`收到选品报告，可据此创建商品草稿`);
    }
  }
}
