import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../../infrastructure/database/entities/order.entity';
import { ITool, ToolDefinition } from '../../../common/interfaces';

@Injectable()
export class OrderWorkflowTool implements ITool {
  private readonly logger = new Logger(OrderWorkflowTool.name);

  readonly definition: ToolDefinition = {
    name: 'order_workflow',
    description: '订单工作流管理，支持创建订单、状态流转和按状态查询',
    parameters: [
      { name: 'action', type: 'string', description: '操作类型: create|transition|listByStatus', required: true },
      { name: 'productId', type: 'string', description: '商品 ID (create 时使用)', required: false },
      { name: 'totalAmount', type: 'number', description: '订单总金额 (create 时使用)', required: false },
      { name: 'customerId', type: 'string', description: '客户 ID (create 时使用)', required: false },
      { name: 'orderId', type: 'string', description: '订单 ID (transition 时使用)', required: false },
      { name: 'newStatus', type: 'string', description: '目标订单状态 (transition 时使用)', required: false },
      { name: 'status', type: 'string', description: '订单状态 (listByStatus 时使用)', required: false },
    ],
  };

  constructor(@InjectRepository(Order) private readonly orderRepo: Repository<Order>) {}

  async execute(params: Record<string, unknown>): Promise<unknown> {
    const action = params.action as string;
    switch (action) {
      case 'create':
        return this.create(params.productId as string, params.totalAmount as number, params.customerId as string);
      case 'transition':
        return this.transition(params.orderId as string, params.newStatus as OrderStatus);
      case 'listByStatus':
        return this.listByStatus(params.status as OrderStatus);
      default:
        throw new Error(`未知 action: ${action}`);
    }
  }

  async create(productId: string, totalAmount: number, customerId?: string): Promise<Order> {
    const order = this.orderRepo.create({ product_id: productId, customer_id: customerId, totalAmount, status: OrderStatus.PENDING });
    const saved = await this.orderRepo.save(order);
    this.logger.log(`订单已创建: ${saved.id}`);
    return saved;
  }

  async transition(orderId: string, newStatus: OrderStatus): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new Error(`订单 ${orderId} 未找到`);

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.RETURNED]: [],
    };

    const allowed = validTransitions[order.status];
    if (!allowed.includes(newStatus)) {
      throw new Error(`订单状态不可从 ${order.status} 变更为 ${newStatus}`);
    }

    order.status = newStatus;
    const updated = await this.orderRepo.save(order);
    this.logger.log(`订单 ${orderId}: → ${newStatus}`);
    return updated;
  }

  async listByStatus(status: OrderStatus): Promise<Order[]> {
    return this.orderRepo.find({ where: { status }, relations: { product: true } });
  }
}
