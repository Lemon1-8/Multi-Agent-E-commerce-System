import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';
import { ToolDefinition } from '../../common/interfaces/task.interface';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: LlmToolCall[];
  tool_call_id?: string;
}

export interface LlmToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface LlmToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, { type: string; description?: string; enum?: string[] }>;
      required?: string[];
    };
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LlmResponse {
  content: string | null;
  toolCalls: ToolCall[];
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
    const apiUrl = this.config.get('LLM_API_URL', 'https://api.openai.com');

    const cacheKey = `llm:${model}:${JSON.stringify(messages)}:${temperature}`;
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${apiUrl}/v1/chat/completions`, {
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

  async completeWithTools(
    messages: LlmMessage[],
    tools: ToolDefinition[],
    options?: LlmCompletionOptions,
  ): Promise<LlmResponse> {
    const { temperature = 0.7, maxTokens = 2000 } = options ?? {};
    const apiKey = this.config.get('LLM_API_KEY');
    const model = this.config.get('LLM_MODEL', 'gpt-4o-mini');
    const apiUrl = this.config.get('LLM_API_URL', 'https://api.openai.com');

    const llmTools = tools.map((td) => this.toolDefToLlmTool(td));

    try {
      const response = await fetch(`${apiUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          tools: llmTools,
          tool_choice: 'auto',
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM API 错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const choice = data.choices[0];
      const message = choice.message;

      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCalls: ToolCall[] = message.tool_calls.map((tc: {
          id: string;
          function: { name: string; arguments: string };
        }) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        }));
        return { content: null, toolCalls };
      }

      return { content: message.content ?? null, toolCalls: [] };
    } catch (error) {
      this.logger.error(`LLM (tools) 调用失败: ${(error as Error).message}`);
      throw error;
    }
  }

  private toolDefToLlmTool(td: ToolDefinition): LlmToolDefinition {
    const properties: Record<string, { type: string; description?: string; enum?: string[] }> = {};
    const required: string[] = [];
    for (const p of td.parameters) {
      properties[p.name] = {
        type:
          p.type === 'object'
            ? 'object'
            : p.type === 'array'
              ? 'array'
              : p.type === 'number'
                ? 'number'
                : 'string',
        description: p.description,
      };
      if (p.required) required.push(p.name);
    }
    return {
      type: 'function',
      function: {
        name: td.name,
        description: td.description,
        parameters: {
          type: 'object',
          properties,
          ...(required.length > 0 ? { required } : {}),
        },
      },
    };
  }
}
