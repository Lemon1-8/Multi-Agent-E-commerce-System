import { Injectable, Logger } from '@nestjs/common';

export interface ReplyTemplate {
  id: string;
  scenario: string;
  template: string;
  locale: string;
  variables: string[];
}

@Injectable()
export class TemplateManagerTool {
  private readonly logger = new Logger(TemplateManagerTool.name);
  private templates: ReplyTemplate[] = [
    { id: 'greeting', scenario: '问候', template: '您好！感谢您联系客服团队，我是您的专属客服助手。请问有什么可以帮助您的？', locale: 'zh-CN', variables: [] },
    { id: 'order_status', scenario: '订单查询', template: '您的订单 #{order_id} 当前状态为: {order_status}。预计{delivery_date}送达。', locale: 'zh-CN', variables: ['order_id', 'order_status', 'delivery_date'] },
    { id: 'return_policy', scenario: '退换货', template: '我们支持30天无理由退换货。请确保商品完好，申请后3个工作日内处理。', locale: 'zh-CN', variables: [] },
    { id: 'escalation', scenario: '升级工单', template: '您的问题已转接至高级客服专员，将在24小时内通过邮件与您联系。', locale: 'zh-CN', variables: [] },
  ];

  findTemplate(scenario: string, locale = 'zh-CN'): ReplyTemplate | undefined {
    return this.templates.find((t) => t.scenario === scenario && t.locale === locale);
  }

  fillTemplate(template: ReplyTemplate, variables: Record<string, string>): string {
    let result = template.template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(`{${key}}`, value);
    }
    return result;
  }

  addTemplate(template: ReplyTemplate): void {
    this.templates.push(template);
    this.logger.log(`新话术模板已添加: ${template.scenario}`);
  }
}
