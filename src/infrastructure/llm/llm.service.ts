import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly cache: CacheService,
  ) {}

  async complete(messages: LlmMessage[], options: LlmCompletionOptions = {}): Promise<string> {
    const { temperature = 0.7, maxTokens = 2000, jsonMode = false } = options;
    const apiKey = this.config.get('LLM_API_KEY');
    const model = this.config.get('LLM_MODEL', 'gpt-4o-mini');

    const cacheKey = `llm:${model}:${JSON.stringify(messages)}:${temperature}`;
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens,
          response_format: jsonMode ? { type: 'json_object' } : undefined }),
      });

      if (!response.ok) {
        throw new Error(`LLM API 错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      await this.cache.set(cacheKey, content, 300);
      return content;
    } catch (error) {
      this.logger.error(`LLM 调用失败: ${(error as Error).message}`);
      throw error;
    }
  }
}
