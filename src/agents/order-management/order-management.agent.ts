import { Injectable } from '@nestjs/common';
import { BaseAgent } from '../../core/agent-base/base-agent';
import { ReActLoopService } from '../../core/agent-base/react-loop.service';
import { EventBusService } from '../../core/event-bus/event-bus.service';
import { AgentEvent, AgentEventType, ToolDefinition, ITool } from '../../common/interfaces';
import { ProductCrudTool } from './tools/product-crud.tool';
import { OrderWorkflowTool } from './tools/order-workflow.tool';
import { InventoryAlertTool } from './tools/inventory-alert.tool';
import { AnomalyDetectionTool } from './tools/anomaly-detection.tool';

@Injectable()
export class OrderManagementAgent extends BaseAgent {
  readonly id = 'order-management';
  readonly name = '订单处理Agent';
  readonly description = '负责商品管理、订单生命周期、库存预警和异常检测';

  readonly systemPrompt = `你是跨境电商订单处理助手。根据用户需求执行商品管理、订单处理和库存检测。

## 可用工具
- product_crud: 商品管理，参数 action(create/listByCategory/findBySku/updateStatus) + 对应字段
- order_workflow: 订单管理，参数 action(create/transition/listByStatus) + 对应字段
- check_inventory: 库存预警检查，参数 productName(商品名), currentStock(当前库存), threshold(安全线)
- detect_anomalies: 异常订单检测，参数 orderDescription(订单描述文本)

## 规则
- 创建商品成功后告知用户商品ID和SKU
- 更新订单状态时务必验证状态转换是否合法
- 库存不足时给出明确的补货建议
- 检测到异常订单时说明异常原因`;

  constructor(
    reactLoop: ReActLoopService,
    private readonly eventBus: EventBusService,
    productCrud: ProductCrudTool,
    orderWorkflow: OrderWorkflowTool,
    inventoryAlert: InventoryAlertTool,
    anomalyDetection: AnomalyDetectionTool,
  ) {
    super(reactLoop);
    this.tools = [productCrud, orderWorkflow, inventoryAlert, anomalyDetection];
  }

  getTools(): ToolDefinition[] {
    return this.tools.map((t: ITool) => t.definition);
  }

  async handleEvent(event: AgentEvent): Promise<void> {
    if (event.type === AgentEventType.REPORT_GENERATED) {
      this.logger.log(`收到选品报告，可据此创建商品草稿`);
    }
  }
}
