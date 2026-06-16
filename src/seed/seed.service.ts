import { Injectable, Logger } from '@nestjs/common';
import { ProductGenerator } from './generators/product.generator';
import { MarketGenerator } from './generators/market.generator';
import { FaqGenerator } from './generators/faq.generator';
import { CustomerGenerator } from './generators/customer.generator';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly products: ProductGenerator,
    private readonly market: MarketGenerator,
    private readonly faq: FaqGenerator,
    private readonly customers: CustomerGenerator,
  ) {}

  async seed(): Promise<void> {
    const start = Date.now();

    const productCount = await this.products.generate();
    const marketCount = await this.market.generate();
    const faqCount = await this.faq.generate();
    const customerCount = await this.customers.generate();

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const total = productCount + marketCount + faqCount + customerCount;

    console.log('\n========================================');
    console.log(`  播种完成 (${elapsed}s)`);
    console.log('========================================');
    console.log(`  商品 + 向量    : ${productCount}`);
    console.log(`  市场情报 + 向量: ${marketCount}`);
    console.log(`  FAQ + 向量     : ${faqCount}`);
    console.log(`  客户           : ${customerCount}`);
    console.log('  -------------------------------------');
    console.log(`  总计           : ${total}`);
    console.log('========================================');
  }
}
