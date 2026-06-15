import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class InventoryAlertTool {
  private readonly logger = new Logger(InventoryAlertTool.name);

  check(productName: string, currentStock: number, threshold: number): { alert: boolean; message: string } {
    const ratio = currentStock / threshold;
    const alert = ratio < 1;
    let message: string;
    if (ratio <= 0) message = `🔴 ${productName} 已售罄！请立即补货。`;
    else if (ratio < 0.3) message = `🟠 ${productName} 库存严重不足 (当前: ${currentStock}, 安全线: ${threshold})。建议3天内补货。`;
    else if (ratio < 0.6) message = `🟡 ${productName} 库存偏低 (当前: ${currentStock}, 安全线: ${threshold})。建议7天内补货。`;
    else if (ratio < 1) message = `🔵 ${productName} 库存接近安全线 (当前: ${currentStock})。关注销量趋势。`;
    else message = `✅ ${productName} 库存充足 (当前: ${currentStock})。`;
    this.logger.log(message);
    return { alert, message };
  }
}
