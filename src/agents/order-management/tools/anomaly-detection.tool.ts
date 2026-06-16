import { Injectable, Logger } from '@nestjs/common';
import { ITool, ToolDefinition } from '../../../common/interfaces';

@Injectable()
export class AnomalyDetectionTool implements ITool {
  private readonly logger = new Logger(AnomalyDetectionTool.name);

  readonly definition: ToolDefinition = {
    name: 'detect_anomalies',
    description: '检测订单异常，识别退货、退款、投诉等问题关键词',
    parameters: [
      { name: 'orderDescription', type: 'string', description: '订单描述文本', required: true },
    ],
  };

  async execute(params: Record<string, unknown>): Promise<unknown> {
    return this.detect(params.orderDescription as string);
  }

  detect(orderDescription: string): { anomaly: boolean; reason: string } {
    const anomalyKeywords = ['退货', '退款', '投诉', '破损', '延迟', '丢失'];
    const matched = anomalyKeywords.filter((k) => orderDescription.includes(k));
    if (matched.length > 0) {
      this.logger.warn(`检测到异常: ${orderDescription}`);
    }
    return { anomaly: matched.length > 0, reason: matched.length > 0 ? `订单包含异常关键词: ${matched.join(', ')}` : '正常' };
  }
}
