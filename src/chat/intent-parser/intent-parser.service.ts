import { Injectable, Logger } from '@nestjs/common';
import { TaskType } from '../../common/interfaces';

@Injectable()
export class IntentParserService {
  private readonly logger = new Logger(IntentParserService.name);

  parse(text: string): { taskType: TaskType; extractedInput: Record<string, unknown> } {
    const quickMatch = this.quickMatch(text);
    if (quickMatch) return quickMatch;

    return { taskType: TaskType.CUSTOMER_SERVICE, extractedInput: { action: 'handle_query', text } };
  }

  private quickMatch(text: string): { taskType: TaskType; extractedInput: Record<string, unknown> } | null {
    const patterns: Array<{ keywords: string[]; type: TaskType; action: string }> = [
      { keywords: ['选品', '市场', '趋势', '竞品', '分析报告', '什么产品好卖'], type: TaskType.PRODUCT_RESEARCH, action: 'analyze' },
      { keywords: ['订单', '商品', '上架', '库存', '发货', '物流'], type: TaskType.ORDER_MANAGEMENT, action: 'create_product' },
      { keywords: ['客户', '投诉', 'FAQ', '翻译', '回复', '售后', '退货'], type: TaskType.CUSTOMER_SERVICE, action: 'handle_query' },
    ];
    for (const { keywords, type, action } of patterns) {
      if (keywords.some((k) => text.includes(k))) {
        return { taskType: type, extractedInput: { action, query: text } };
      }
    }
    return null;
  }
}
