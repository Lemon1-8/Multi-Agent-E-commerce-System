import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from '../../../infrastructure/embedding/embedding.service';

@Injectable()
export class TrendQueryTool {
  private readonly logger = new Logger(TrendQueryTool.name);

  constructor(private readonly embedding: EmbeddingService) {}

  async query(category: string, period: string): Promise<string> {
    this.logger.log(`查询趋势: category=${category}, period=${period}`);
    const results = await this.embedding.search({
      query: `${category} 市场趋势 ${period}`,
      collection: 'market',
      topK: 5,
      threshold: 0.5,
    });
    if (results.length === 0) {
      return `未找到 ${category} 在 ${period} 的趋势数据。建议扩大搜索范围。`;
    }
    const summary = results.map((r) => r.content).join('\n');
    return `## ${category} 趋势分析 (${period})\n\n${summary}`;
  }
}
