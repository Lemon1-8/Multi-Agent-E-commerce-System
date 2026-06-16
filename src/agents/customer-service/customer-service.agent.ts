import { Injectable } from '@nestjs/common';
import { BaseAgent } from '../../core/agent-base/base-agent';
import { ReActLoopService } from '../../core/agent-base/react-loop.service';
import { EventBusService } from '../../core/event-bus/event-bus.service';
import { AgentEvent, AgentEventType, ToolDefinition, ITool } from '../../common/interfaces';
import { TranslatorTool } from './tools/translator.tool';
import { FaqRetrievalTool } from './tools/faq-retrieval.tool';
import { SentimentAnalysisTool } from './tools/sentiment-analysis.tool';
import { TemplateManagerTool } from './tools/template-manager.tool';

@Injectable()
export class CustomerServiceAgent extends BaseAgent {
  readonly id = 'customer-service';
  readonly name = '客服Agent';
  readonly description = '多语言客服，FAQ 检索，情感分析，话术生成，异常升级';

  readonly systemPrompt = `你是跨境电商智能客服。为客户提供多语言支持、FAQ检索和情感分析。

## 可用工具
- translate: 多语言翻译，参数 text(原文), targetLocale(目标语言如en/es/fr/de/ja/ko)
- faq_search: FAQ检索，参数 question(问题文本), locale(语言，默认zh-CN)
- sentiment_analysis: 情感分析，参数 text(待分析文本)，返回 sentiment(positive/neutral/negative)和score(0-1)
- manage_template: 话术模板管理，参数 action(find/fill/add) + 对应字段

## 工作流程
1. 首先理解客户的问题
2. 调用 sentiment_analysis 分析客户情绪
3. 调用 faq_search 查找相关答案
4. 如果找到FAQ就用 manage_template 生成回复
5. 如果需要翻译就调用 translate
6. 如果客户情绪非常负面(sentiment=negative且score>0.8)，明确告知需要升级

## 规则
- 始终以友好、专业的态度回复
- 优先使用FAQ已有答案，不要编造信息
- 翻译时保持原文语气
- 遇到无法解决的问题，建议升级到人工客服`;

  constructor(
    reactLoop: ReActLoopService,
    private readonly eventBus: EventBusService,
    translator: TranslatorTool,
    faq: FaqRetrievalTool,
    sentiment: SentimentAnalysisTool,
    templates: TemplateManagerTool,
  ) {
    super(reactLoop);
    this.tools = [translator, faq, sentiment, templates];
  }

  getTools(): ToolDefinition[] {
    return this.tools.map((t: ITool) => t.definition);
  }

  async handleEvent(event: AgentEvent): Promise<void> {
    if (event.type === AgentEventType.PRODUCT_CREATED) {
      this.logger.log(`新商品已创建，可准备客服话术模板`);
    } else if (event.type === AgentEventType.ORDER_STATUS_CHANGED) {
      this.logger.log(`订单状态变更，可主动通知客户`);
    }
  }
}
