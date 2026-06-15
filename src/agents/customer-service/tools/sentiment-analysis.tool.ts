import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../../infrastructure/llm/llm.service';

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  keywords: string[];
}

@Injectable()
export class SentimentAnalysisTool {
  private readonly logger = new Logger(SentimentAnalysisTool.name);

  constructor(private readonly llm: LlmService) {}

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
