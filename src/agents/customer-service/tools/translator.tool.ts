import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../../infrastructure/llm/llm.service';
import { ITool, ToolDefinition } from '../../../common/interfaces';

@Injectable()
export class TranslatorTool implements ITool {
  private readonly logger = new Logger(TranslatorTool.name);

  readonly definition: ToolDefinition = {
    name: 'translate',
    description: '将文本翻译到目标语言，支持多语种',
    parameters: [
      { name: 'text', type: 'string', description: '待翻译文本', required: true },
      { name: 'targetLocale', type: 'string', description: '目标语言代码，如 en, es, fr, de, ja, ko', required: true },
    ],
  };

  constructor(private readonly llm: LlmService) {}

  async execute(params: Record<string, unknown>): Promise<unknown> {
    return this.translate(params.text as string, params.targetLocale as string);
  }

  async translate(text: string, targetLocale: string): Promise<string> {
    if (targetLocale === 'zh-CN') return text;
    const localeNames: Record<string, string> = { en: '英语', es: '西班牙语', fr: '法语', de: '德语', ja: '日语', ko: '韩语' };
    const response = await this.llm.complete([
      { role: 'system', content: `你是一个专业的${localeNames[targetLocale] ?? targetLocale}翻译。请准确翻译，保持语气自然。` },
      { role: 'user', content: `翻译为${targetLocale}: ${text}` },
    ], { temperature: 0.3, maxTokens: 500 });
    this.logger.log(`翻译完成: ${text.slice(0, 20)}... → ${targetLocale}`);
    return response;
  }
}
