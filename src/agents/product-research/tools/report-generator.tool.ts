import { Injectable, Logger } from '@nestjs/common';

export interface ReportSection {
  title: string;
  content: string;
}

@Injectable()
export class ReportGeneratorTool {
  private readonly logger = new Logger(ReportGeneratorTool.name);

  generate(title: string, sections: ReportSection[]): string {
    this.logger.log(`生成报告: ${title}`);
    const header = `# 📊 选品分析报告: ${title}\n\n> 生成时间: ${new Date().toISOString()}\n\n---\n\n`;
    const body = sections.map((s) => `## ${s.title}\n\n${s.content}\n\n`).join('');
    const footer = `---\n\n*本报告由选品分析 Agent 自动生成*`;
    return header + body + footer;
  }
}
