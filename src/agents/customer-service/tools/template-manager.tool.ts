import { Injectable, Logger } from '@nestjs/common';
import { ITool, ToolDefinition } from '../../../common/interfaces';

export interface ReplyTemplate {
  id: string;
  scenario: string;
  template: string;
  locale: string;
  variables: string[];
}

@Injectable()
export class TemplateManagerTool implements ITool {
  private readonly logger = new Logger(TemplateManagerTool.name);

  readonly definition: ToolDefinition = {
    name: 'manage_template',
    description: '管理客服回复话术模板，支持查找、填充变量和新增模板',
    parameters: [
      { name: 'action', type: 'string', description: '操作类型: find|fill|add', required: true },
      { name: 'scenario', type: 'string', description: '场景名称 (find 时使用)', required: false },
      { name: 'locale', type: 'string', description: '语言代码 (find 时使用)', required: false },
      { name: 'templateId', type: 'string', description: '模板 ID (fill 时使用，与 scenario 二选一)', required: false },
      { name: 'variables', type: 'object', description: '模板变量键值对 (fill 时使用)', required: false },
      { name: 'template', type: 'object', description: '新模板对象，需包含 id, scenario, template, locale, variables 字段 (add 时使用)', required: false },
    ],
  };

  async execute(params: Record<string, unknown>): Promise<unknown> {
    const action = params.action as string;
    switch (action) {
      case 'find': {
        const tmpl = this.findTemplate(params.scenario as string, (params.locale as string) ?? 'zh-CN');
        return tmpl ?? null;
      }
      case 'fill': {
        const tmpl = this.findTemplate(params.scenario as string, (params.locale as string) ?? 'zh-CN');
        if (!tmpl) throw new Error('模板未找到');
        return this.fillTemplate(tmpl, (params.variables as Record<string, string>) ?? {});
      }
      case 'add':
        this.addTemplate(params.template as unknown as ReplyTemplate);
        return { success: true };
      default:
        throw new Error(`未知 action: ${action}`);
    }
  }
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
