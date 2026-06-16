import { Injectable, Logger } from '@nestjs/common';
import { ITool, ToolDefinition } from '../../../common/interfaces';

export interface ReportSection {
  title: string;
  content: string;
}

@Injectable()
export class ReportGeneratorTool implements ITool {
  private readonly logger = new Logger(ReportGeneratorTool.name);

  readonly definition: ToolDefinition = {
    name: 'generate_report',
    description: '生成格式化的选品分析报告',
    parameters: [
      { name: 'title', type: 'string', description: '报告标题', required: true },
      { name: 'sections', type: 'array', description: '报告章节列表，每项包含 title 和 content', required: true },
    ],
  };

  async execute(params: Record<string, unknown>): Promise<unknown> {
    return this.generate(params.title as string, params.sections as ReportSection[]);
  }

  generate(title: string, sections: ReportSection[]): string {
    this.logger.log(`生成报告: ${title}`);
    const header = `# 📊 选品分析报告: ${title}\n\n> 生成时间: ${new Date().toISOString()}\n\n---\n\n`;
    const body = sections.map((s) => `## ${s.title}\n\n${s.content}\n\n`).join('');
    const footer = `---\n\n*本报告由选品分析 Agent 自动生成*`;
    return header + body + footer;
  }
}
