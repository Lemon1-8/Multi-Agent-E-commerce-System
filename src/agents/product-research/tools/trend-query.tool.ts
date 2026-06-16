import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from '../../../infrastructure/embedding/embedding.service';
import { ITool, ToolDefinition } from '../../../common/interfaces';

@Injectable()
export class TrendQueryTool implements ITool {
  private readonly logger = new Logger(TrendQueryTool.name);

  readonly definition: ToolDefinition = {
    name: 'trend_query',
    description: '查询品类市场趋势数据，了解搜索量变化和热度趋势',
    parameters: [
      { name: 'category', type: 'string', description: '品类名称', required: true },
      { name: 'period', type: 'string', description: '时间范围，如 last_30_days', required: false },
    ],
  };

  constructor(private readonly embedding: EmbeddingService) {}

  async execute(params: Record<string, unknown>): Promise<string> {
    return this.query(params.category as string, (params.period as string) ?? 'last_30_days');
  }

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
