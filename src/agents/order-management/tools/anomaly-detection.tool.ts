import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AnomalyDetectionTool {
  private readonly logger = new Logger(AnomalyDetectionTool.name);

  detect(orderDescription: string): { anomaly: boolean; reason: string } {
    const anomalyKeywords = ['退货', '退款', '投诉', '破损', '延迟', '丢失'];
    const matched = anomalyKeywords.filter((k) => orderDescription.includes(k));
    if (matched.length > 0) {
      this.logger.warn(`检测到异常: ${orderDescription}`);
    }
    return { anomaly: matched.length > 0, reason: matched.length > 0 ? `订单包含异常关键词: ${matched.join(', ')}` : '正常' };
  }
}
