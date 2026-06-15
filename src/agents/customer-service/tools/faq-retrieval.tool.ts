import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from '../../../infrastructure/embedding/embedding.service';

@Injectable()
export class FaqRetrievalTool {
  private readonly logger = new Logger(FaqRetrievalTool.name);

  constructor(private readonly embedding: EmbeddingService) {}

  async search(question: string, locale = 'zh-CN'): Promise<string> {
    const results = await this.embedding.search({
      query: question, collection: 'faq', topK: 3, threshold: 0.5,
    });
    if (results.length === 0) return '未找到相关FAQ条目，建议转人工客服处理。';
    this.logger.log(`FAQ匹配: ${question.slice(0, 30)}... → ${results.length} 条结果`);
    return results.map((r, i) => `${i + 1}. ${r.content}`).join('\n\n');
  }
}
