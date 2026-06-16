import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderManagementAgent } from './order-management.agent';
import { ProductCrudTool } from './tools/product-crud.tool';
import { OrderWorkflowTool } from './tools/order-workflow.tool';
import { InventoryAlertTool } from './tools/inventory-alert.tool';
import { AnomalyDetectionTool } from './tools/anomaly-detection.tool';
import { Product } from '../../infrastructure/database/entities/product.entity';
import { Order } from '../../infrastructure/database/entities/order.entity';
import { Customer } from '../../infrastructure/database/entities/customer.entity';
import { ReActLoopService } from '../../core/agent-base/react-loop.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Order, Customer])],
  providers: [OrderManagementAgent, ProductCrudTool, OrderWorkflowTool, InventoryAlertTool, AnomalyDetectionTool, ReActLoopService],
  exports: [OrderManagementAgent],
})
export class OrderManagementModule {}
