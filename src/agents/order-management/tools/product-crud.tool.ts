import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../../infrastructure/database/entities/product.entity';
import { ITool, ToolDefinition } from '../../../common/interfaces';

@Injectable()
export class ProductCrudTool implements ITool {
  private readonly logger = new Logger(ProductCrudTool.name);

  readonly definition: ToolDefinition = {
    name: 'product_crud',
    description: '商品增删改查，支持创建、查询、更新状态等操作',
    parameters: [
      { name: 'action', type: 'string', description: '操作类型: create|listByCategory|findBySku|updateStatus', required: true },
      { name: 'sku', type: 'string', description: '商品 SKU (create/findBySku 时使用)', required: false },
      { name: 'title', type: 'string', description: '商品标题 (create 时使用)', required: false },
      { name: 'price', type: 'number', description: '商品价格 (create 时使用)', required: false },
      { name: 'category', type: 'string', description: '品类名称 (create/listByCategory 时使用)', required: false },
      { name: 'description', type: 'string', description: '商品描述 (create 时使用)', required: false },
      { name: 'id', type: 'string', description: '商品 ID (updateStatus 时使用)', required: false },
      { name: 'status', type: 'string', description: '商品状态 (updateStatus 时使用)', required: false },
    ],
  };

  constructor(@InjectRepository(Product) private readonly productRepo: Repository<Product>) {}

  async execute(params: Record<string, unknown>): Promise<unknown> {
    const action = params.action as string;
    switch (action) {
      case 'create':
        return this.create({
          sku: params.sku as string,
          title: params.title as string,
          price: params.price as number,
          category: params.category as string,
          description: params.description as string,
        });
      case 'listByCategory':
        return this.listByCategory(params.category as string);
      case 'findBySku':
        return this.findBySku(params.sku as string);
      case 'updateStatus':
        await this.updateStatus(params.id as string, params.status as string);
        return { success: true };
      default:
        throw new Error(`未知 action: ${action}`);
    }
  }

  async create(data: { sku: string; title: string; price: number; category: string; description?: string }): Promise<Product> {
    const product = this.productRepo.create({ sku: data.sku, title: data.title, price: data.price, category: data.category, description: data.description ?? '' });
    const saved = await this.productRepo.save(product);
    this.logger.log(`商品已创建: ${saved.title} (${saved.sku})`);
    return saved;
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.productRepo.findOne({ where: { sku } });
  }

  async listByCategory(category: string): Promise<Product[]> {
    return this.productRepo.find({ where: { category } });
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.productRepo.update(id, { status });
    this.logger.log(`商品 ${id} 状态更新为 ${status}`);
  }
}
