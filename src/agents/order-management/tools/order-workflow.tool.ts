import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../../infrastructure/database/entities/order.entity';

@Injectable()
export class OrderWorkflowTool {
  private readonly logger = new Logger(OrderWorkflowTool.name);

  constructor(@InjectRepository(Order) private readonly orderRepo: Repository<Order>) {}

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
