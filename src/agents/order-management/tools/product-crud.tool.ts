import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../../infrastructure/database/entities/product.entity';

@Injectable()
export class ProductCrudTool {
  private readonly logger = new Logger(ProductCrudTool.name);

  constructor(@InjectRepository(Product) private readonly productRepo: Repository<Product>) {}

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
