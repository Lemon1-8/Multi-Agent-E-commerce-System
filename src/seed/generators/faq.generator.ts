import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmService } from '../../infrastructure/llm/llm.service';
import { EmbeddingService } from '../../infrastructure/embedding/embedding.service';
import { FaqEmbedding } from '../../infrastructure/database/vector-entities/faq-embedding.entity';

const FAQ_TOPICS = [
  { topic: '物流与配送', count: 20, tags: ['shipping', 'delivery', 'logistics'] },
  { topic: '退货与退款', count: 15, tags: ['returns', 'refunds', 'after-sales'] },
  { topic: '支付方式', count: 15, tags: ['payment', 'currency', 'billing'] },
  { topic: '关税与清关', count: 15, tags: ['customs', 'duties', 'tax'] },
  { topic: '产品质量与真伪', count: 15, tags: ['quality', 'authenticity', 'warranty'] },
  { topic: '尺码与适配', count: 10, tags: ['sizing', 'fit', 'measurements'] },
  { topic: '售后保修', count: 10, tags: ['warranty', 'repairs', 'support'] },
];

@Injectable()
export class FaqGenerator {
  private readonly logger = new Logger(FaqGenerator.name);

  constructor(
    @InjectRepository(FaqEmbedding) private readonly repo: Repository<FaqEmbedding>,
    private readonly llm: LlmService,
    private readonly embedding: EmbeddingService,
  ) {}

  async generate(): Promise<number> {
    let total = 0;

    for (const topic of FAQ_TOPICS) {
      this.logger.log(`生成FAQ: ${topic.topic}...`);
      try {
        const response = await this.llm.complete([
          { role: 'system', content: '你是跨境电商客服专家。生成高质量的FAQ问答对。' },
          { role: 'user', content: `生成 ${topic.count} 对关于"${topic.topic}"的FAQ JSON数组。

每条严格包含:
- question: 客户常问问题 (中文或英文, 自然语言, 10-40字)
- answer: 客服标准回答 (中文, 50-150字, 专业友好)
- locale: "en" (英文问题) 或 "zh-CN" (中文问题)
- tags: ${JSON.stringify(topic.tags)}

混合中英文问题。只返回有效JSON数组。` },
        ], { temperature: 0.7, maxTokens: 4000, jsonMode: true });

        const items = JSON.parse(response);
        if (!Array.isArray(items)) continue;

        for (const item of items) {
          try {
            const embedText = `Q: ${item.question}\nA: ${item.answer}`;
            const vector = await this.embedding.embed(embedText);
            const emb = this.repo.create({
              question: item.question,
              answer: item.answer,
              embedding: vector,
              locale: item.locale ?? 'zh-CN',
              tags: item.tags ?? topic.tags,
            });
            await this.repo.save(emb);
            total++;
          } catch (e) {
            this.logger.warn(`跳过FAQ: ${(e as Error).message}`);
          }
        }
      } catch (e) {
        this.logger.error(`${topic.topic} 生成失败: ${(e as Error).message}`);
      }
    }

    return total;
  }
}
