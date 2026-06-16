import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../../infrastructure/llm/llm.service';
import { ITool, ToolDefinition } from '../../../common/interfaces';

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  keywords: string[];
}

@Injectable()
export class SentimentAnalysisTool implements ITool {
  private readonly logger = new Logger(SentimentAnalysisTool.name);

  readonly definition: ToolDefinition = {
    name: 'sentiment_analysis',
    description: '分析用户文本的情感倾向，返回正/中/负及置信度',
    parameters: [
      { name: 'text', type: 'string', description: '待分析的用户文本', required: true },
    ],
  };

  constructor(private readonly llm: LlmService) {}

  async execute(params: Record<string, unknown>): Promise<unknown> {
    return this.analyze(params.text as string);
  }

  async analyze(text: string): Promise<SentimentResult> {
    const response = await this.llm.complete([
      { role: 'system', content: '分析以下文本的情感，返回 JSON: { "sentiment": "positive|neutral|negative", "score": 0-1, "keywords": [] }' },
      { role: 'user', content: text },
    ], { temperature: 0, maxTokens: 200, jsonMode: true });
    try {
      const result = JSON.parse(response);
      this.logger.log(`情感分析: ${result.sentiment} (${result.score})`);
      return result;
    } catch {
      return { sentiment: 'neutral', score: 0.5, keywords: [] };
    }
  }
}
