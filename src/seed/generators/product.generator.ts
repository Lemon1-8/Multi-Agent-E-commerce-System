import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmService } from '../../infrastructure/llm/llm.service';
import { EmbeddingService } from '../../infrastructure/embedding/embedding.service';
import { Product } from '../../infrastructure/database/entities/product.entity';
import { ProductEmbedding } from '../../infrastructure/database/vector-entities/product-embedding.entity';

const CATEGORIES = [
  { name: '消费电子', prefix: 'ELEC', count: 25 },
  { name: '服装配饰', prefix: 'CLTH', count: 25 },
  { name: '家居厨房', prefix: 'HOME', count: 20 },
  { name: '运动户外', prefix: 'SPRT', count: 20 },
  { name: '美妆个护', prefix: 'BEAU', count: 15 },
  { name: '图书媒体', prefix: 'BOOK', count: 15 },
  { name: '玩具游戏', prefix: 'TOYS', count: 15 },
  { name: '汽摩配件', prefix: 'AUTO', count: 15 },
];

@Injectable()
export class ProductGenerator {
  private readonly logger = new Logger(ProductGenerator.name);

  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductEmbedding) private readonly embRepo: Repository<ProductEmbedding>,
    private readonly llm: LlmService,
    private readonly embedding: EmbeddingService,
  ) {}

  async generate(): Promise<number> {
    let total = 0;

    for (const cat of CATEGORIES) {
      this.logger.log(`生成 ${cat.name} 商品 (${cat.count}个)...`);
      try {
        const response = await this.llm.complete([
          {
            role: 'system',
            content: `你是一个跨境电商商品数据生成器。生成逼真的商品数据，所有价格使用美元(USD)。`,
          },
          {
            role: 'user',
            content: `生成 ${cat.count} 个"${cat.name}"类目的商品JSON数组。每个商品严格包含以下字段:
- sku: "${cat.prefix}-" 前缀加3位数字 (如 "${cat.prefix}-001")
- title: 简短商品名 (英文, 最多80字符)
- description: 1-2句商品描述 (中文, 强调卖点和规格)
- price: 美元价格 (数字, 合理范围)
- category: "${cat.name}"
- currency: "USD"
- platform: 随机选择 "Amazon" / "eBay" / "Shopify"
- status: "active"

只返回有效的JSON数组，不要其他文字。`,
          },
        ], { temperature: 0.7, maxTokens: 4000, jsonMode: true });

        const products = JSON.parse(response);
        if (!Array.isArray(products)) continue;

        for (const item of products) {
          try {
            // Insert product
            const product = this.productRepo.create({
              sku: item.sku,
              title: item.title,
              description: item.description ?? '',
              price: item.price,
              category: item.category,
              currency: item.currency ?? 'USD',
              platform: item.platform ?? 'Amazon',
              status: item.status ?? 'active',
            });
            const saved = await this.productRepo.save(product);

            // Generate embedding
            const embedText = `${item.title} ${item.description ?? ''}`;
            const vector = await this.embedding.embed(embedText);

            // Insert embedding
            const emb = this.embRepo.create({
              productId: saved.id,
              embedding: vector,
              content: embedText,
              metadata: { price: item.price, category: item.category, platform: item.platform },
            });
            await this.embRepo.save(emb);
            total++;
          } catch (e) {
            this.logger.warn(`跳过商品 ${item.sku}: ${(e as Error).message}`);
          }
        }
      } catch (e) {
        this.logger.error(`${cat.name} 生成失败: ${(e as Error).message}`);
      }
    }

    return total;
  }
}
