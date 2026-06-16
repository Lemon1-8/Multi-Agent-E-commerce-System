import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmService } from '../../infrastructure/llm/llm.service';
import { EmbeddingService } from '../../infrastructure/embedding/embedding.service';
import { MarketEmbedding } from '../../infrastructure/database/vector-entities/market-embedding.entity';

const TOPICS = [
  { type: '趋势分析', categories: ['消费电子', '服装', '家居', '运动', '美妆'], count: 25 },
  { type: '竞品分析', categories: ['消费电子', '服装', '家居', '运动', '美妆'], count: 25 },
  { type: '季节性规律', categories: ['服装', '运动', '家居', '玩具', '美妆'], count: 25 },
  { type: '行业洞察', categories: ['跨境电商', '拉美市场', '东南亚', '欧洲', '北美'], count: 25 },
];

@Injectable()
export class MarketGenerator {
  private readonly logger = new Logger(MarketGenerator.name);

  constructor(
    @InjectRepository(MarketEmbedding) private readonly repo: Repository<MarketEmbedding>,
    private readonly llm: LlmService,
    private readonly embedding: EmbeddingService,
  ) {}

  async generate(): Promise<number> {
    let total = 0;

    for (const topic of TOPICS) {
      this.logger.log(`生成市场情报: ${topic.type}...`);
      try {
        const response = await this.llm.complete([
          { role: 'system', content: '你是跨境电商市场分析专家。生成简洁、数据驱动的市场情报条目。' },
          { role: 'user', content: `生成 ${topic.count} 条"${topic.type}"类市场情报JSON数组，覆盖类目: ${topic.categories.join(', ')}。

每条包含:
- content: 情报内容 (中文, 100-200字, 含具体数字和数据)
- category: 所属类目
- source: 数据来源 (如 "Google Trends" / "Jungle Scout" / "海关数据" / "行业报告")

只返回有效JSON数组。` },
        ], { temperature: 0.7, maxTokens: 4000, jsonMode: true });

        const items = JSON.parse(response);
        if (!Array.isArray(items)) continue;

        for (const item of items) {
          try {
            const vector = await this.embedding.embed(item.content);
            const emb = this.repo.create({
              source: item.source ?? '行业报告',
              content: item.content,
              embedding: vector,
              category: item.category ?? '综合',
              collectedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            });
            await this.repo.save(emb);
            total++;
          } catch (e) {
            this.logger.warn(`跳过市场条目: ${(e as Error).message}`);
          }
        }
      } catch (e) {
        this.logger.error(`${topic.type} 生成失败: ${(e as Error).message}`);
      }
    }

    return total;
  }
}
