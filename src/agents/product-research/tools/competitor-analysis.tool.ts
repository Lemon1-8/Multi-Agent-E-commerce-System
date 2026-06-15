import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from '../../../infrastructure/embedding/embedding.service';

@Injectable()
export class CompetitorAnalysisTool {
  private readonly logger = new Logger(CompetitorAnalysisTool.name);

  constructor(private readonly embedding: EmbeddingService) {}

  async analyze(category: string, keywords: string[]): Promise<string> {
    this.logger.log(`竞品分析: category=${category}, keywords=${keywords.join(',')}`);
    const query = `${category} ${keywords.join(' ')} 竞品对比 价格 评分`;
    const results = await this.embedding.search({
      query, collection: 'products', topK: 10, threshold: 0.4,
    });
    if (results.length === 0) {
      return `未找到 ${category} 相关竞品数据。`;
    }
    return `## ${category} 竞品分析\n\n找到 ${results.length} 个相关竞品:\n\n${results.map((r, i) => `${i + 1}. ${r.content} (相似度: ${(r.score * 100).toFixed(1)}%)`).join('\n')}`;
  }
}
