import { Injectable, Logger } from '@nestjs/common';
import { IPlatformAdapter, PlatformProduct, PlatformOrder } from './platform-adapter.interface';

@Injectable()
export class MockPlatformAdapter implements IPlatformAdapter {
  readonly platformName = 'MockPlatform';
  private readonly logger = new Logger(MockPlatformAdapter.name);

  private products: PlatformProduct[] = [
    {
      platformId: 'mock-prod-001',
      sku: 'BT-EAR-001',
      title: '无线蓝牙耳机 Pro',
      description: '主动降噪蓝牙耳机，续航 40 小时',
      price: 29.99,
      currency: 'USD',
      category: '电子产品/音频',
      status: 'active',
    },
    {
      platformId: 'mock-prod-002',
      sku: 'BT-EAR-002',
      title: '迷你蓝牙耳机 Lite',
      description: '轻量级蓝牙耳机，IPX5 防水',
      price: 19.99,
      currency: 'USD',
      category: '电子产品/音频',
      status: 'active',
    },
  ];

  private orders: PlatformOrder[] = [
    {
      platformId: 'mock-order-001',
      productSku: 'BT-EAR-001',
      customerEmail: 'customer1@example.com',
      status: 'pending',
      totalAmount: 29.99,
      currency: 'USD',
    },
  ];

  async fetchProducts(): Promise<PlatformProduct[]> {
    this.logger.log('Mock: 获取商品列表');
    return this.products;
  }

  async fetchOrders(): Promise<PlatformOrder[]> {
    this.logger.log('Mock: 获取订单列表');
    return this.orders;
  }

  async createProduct(data: Partial<PlatformProduct>): Promise<PlatformProduct> {
    const product: PlatformProduct = {
      platformId: `mock-prod-${Date.now()}`,
      sku: data.sku ?? `SKU-${Date.now()}`,
      title: data.title ?? 'New Product',
      description: data.description ?? '',
      price: data.price ?? 0,
      currency: data.currency ?? 'USD',
      category: data.category ?? 'Uncategorized',
      status: 'draft',
    };
    this.products.push(product);
    this.logger.log(`Mock: 创建商品 ${product.title}`);
    return product;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    const order = this.orders.find((o) => o.platformId === orderId);
    if (order) {
      order.status = status;
      this.logger.log(`Mock: 更新订单 ${orderId} 状态为 ${status}`);
    }
  }
}
