import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from '../../../infrastructure/embedding/embedding.service';
import { ITool, ToolDefinition } from '../../../common/interfaces';

@Injectable()
export class FaqRetrievalTool implements ITool {
  private readonly logger = new Logger(FaqRetrievalTool.name);

  readonly definition: ToolDefinition = {
    name: 'faq_search',
    description: '在FAQ知识库中检索与用户问题最匹配的答案',
    parameters: [
      { name: 'question', type: 'string', description: '用户问题', required: true },
      { name: 'locale', type: 'string', description: '语言代码，默认 zh-CN', required: false },
    ],
  };

  constructor(private readonly embedding: EmbeddingService) {}

  async execute(params: Record<string, unknown>): Promise<unknown> {
    return this.search(params.question as string, (params.locale as string) ?? 'zh-CN');
  }

  async search(question: string, locale = 'zh-CN'): Promise<string> {
    const results = await this.embedding.search({
      query: question, collection: 'faq', topK: 3, threshold: 0.5,
    });
    if (results.length === 0) return '未找到相关FAQ条目，建议转人工客服处理。';
    this.logger.log(`FAQ匹配: ${question.slice(0, 30)}... → ${results.length} 条结果`);
    return results.map((r, i) => `${i + 1}. ${r.content}`).join('\n\n');
  }
}
