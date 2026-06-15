import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderManagementAgent } from './order-management.agent';
import { ProductCrudTool } from './tools/product-crud.tool';
import { OrderWorkflowTool } from './tools/order-workflow.tool';
import { InventoryAlertTool } from './tools/inventory-alert.tool';
import { AnomalyDetectionTool } from './tools/anomaly-detection.tool';
import { Product } from '../../infrastructure/database/entities/product.entity';
import { Order } from '../../infrastructure/database/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Order])],
  providers: [OrderManagementAgent, ProductCrudTool, OrderWorkflowTool, InventoryAlertTool, AnomalyDetectionTool],
  exports: [OrderManagementAgent],
})
export class OrderManagementModule {}
