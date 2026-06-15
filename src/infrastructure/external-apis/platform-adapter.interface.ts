export interface PlatformProduct {
  platformId: string;
  sku: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  status: string;
}

export interface PlatformOrder {
  platformId: string;
  productSku: string;
  customerEmail: string;
  status: string;
  totalAmount: number;
  currency: string;
}

export interface IPlatformAdapter {
  readonly platformName: string;
  fetchProducts(): Promise<PlatformProduct[]>;
  fetchOrders(): Promise<PlatformOrder[]>;
  createProduct(data: Partial<PlatformProduct>): Promise<PlatformProduct>;
  updateOrderStatus(orderId: string, status: string): Promise<void>;
}
