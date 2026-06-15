import { Injectable } from '@nestjs/common';
import { BaseAgent } from '../../core/agent-base/base-agent';
import { EventBusService } from '../../core/event-bus/event-bus.service';
import { AgentTask, AgentEvent, TaskStatus, AgentEventType, ToolDefinition } from '../../common/interfaces';
import { TranslatorTool } from './tools/translator.tool';
import { FaqRetrievalTool } from './tools/faq-retrieval.tool';
import { SentimentAnalysisTool } from './tools/sentiment-analysis.tool';
import { TemplateManagerTool } from './tools/template-manager.tool';

@Injectable()
export class CustomerServiceAgent extends BaseAgent {
  readonly id = 'customer-service';
  readonly name = '客服Agent';
  readonly description = '多语言客服，FAQ 检索，情感分析，话术生成，异常升级';

  constructor(
    private readonly eventBus: EventBusService,
    private readonly translator: TranslatorTool,
    private readonly faq: FaqRetrievalTool,
    private readonly sentiment: SentimentAnalysisTool,
    private readonly templates: TemplateManagerTool,
  ) { super(); }

  getTools(): ToolDefinition[] {
    return [
      { name: 'translate', description: '多语言翻译', parameters: [
        { name: 'text', type: 'string', description: '原文', required: true },
        { name: 'locale', type: 'string', description: '目标语言', required: true },
      ]},
      { name: 'faq_search', description: 'FAQ 检索', parameters: [
        { name: 'question', type: 'string', description: '问题', required: true },
      ]},
      { name: 'sentiment', description: '情感分析', parameters: [
        { name: 'text', type: 'string', description: '待分析文本', required: true },
      ]},
      { name: 'reply', description: '生成客服回复', parameters: [
        { name: 'scenario', type: 'string', description: '场景', required: true },
      ]},
    ];
  }

  async executeTask(task: AgentTask): Promise<Record<string, unknown>> {
    const { action, ...data } = task.input as Record<string, unknown>;

    if (action === 'handle_query') {
      const text = data.text as string;
      const locale = (data.locale as string) ?? 'zh-CN';

      const sentimentResult = await this.sentiment.analyze(text);
      const faqResult = await this.faq.search(text, locale);

      const scenario = this.detectScenario(text);
      const template = this.templates.findTemplate(scenario, locale);
      const reply = template ? this.templates.fillTemplate(template, data.variables as Record<string, string> ?? {}) : faqResult;

      const finalReply = locale === 'zh-CN' ? reply : await this.translator.translate(reply, locale);

      if (sentimentResult.sentiment === 'negative' && sentimentResult.score > 0.8) {
        this.eventBus.emit(AgentEventType.ESCALATION_TRIGGERED, { text, sentiment: sentimentResult }, task.correlationId, this.id);
      }

      this.eventBus.emit(AgentEventType.REPLY_GENERATED, { reply: finalReply }, task.correlationId, this.id);
      return { reply: finalReply, sentiment: sentimentResult, faqMatch: faqResult !== '未找到相关FAQ条目' };
    }

    return { reply: '请描述您的问题，我将为您提供帮助。' };
  }

  async handleEvent(event: AgentEvent): Promise<void> {
    if (event.type === AgentEventType.PRODUCT_CREATED) {
      this.logger.log(`新商品已创建，可准备客服话术模板`);
    } else if (event.type === AgentEventType.ORDER_STATUS_CHANGED) {
      this.logger.log(`订单状态变更，可主动通知客户`);
    }
  }

  private detectScenario(text: string): string {
    const mapping: Array<{ keywords: string[]; scenario: string }> = [
      { keywords: ['你好', 'hi', 'hello', '在吗'], scenario: 'greeting' },
      { keywords: ['订单', 'order', '快递', '物流', '发货', '配送'], scenario: 'order_status' },
      { keywords: ['退货', '退款', '换货', 'return', 'refund'], scenario: 'return_policy' },
      { keywords: ['投诉', '问题', '不满意', 'complaint'], scenario: 'escalation' },
    ];
    for (const { keywords, scenario } of mapping) {
      if (keywords.some((k) => text.toLowerCase().includes(k))) return scenario;
    }
    return 'greeting';
  }
}
