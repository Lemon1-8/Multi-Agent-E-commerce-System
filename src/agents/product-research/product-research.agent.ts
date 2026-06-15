import { Injectable } from '@nestjs/common';
import { BaseAgent } from '../../core/agent-base/base-agent';
import { EventBusService } from '../../core/event-bus/event-bus.service';
import { AgentTask, AgentEvent, TaskStatus, AgentEventType, ToolDefinition } from '../../common/interfaces';
import { TrendQueryTool } from './tools/trend-query.tool';
import { CompetitorAnalysisTool } from './tools/competitor-analysis.tool';
import { ScoringTool } from './tools/scoring.tool';
import { ReportGeneratorTool } from './tools/report-generator.tool';

@Injectable()
export class ProductResearchAgent extends BaseAgent {
  readonly id = 'product-research';
  readonly name = '选品分析Agent';
  readonly description = '负责跨境电商选品分析：趋势洞察、竞品对比、选品评分和报告生成';

  constructor(
    private readonly eventBus: EventBusService,
    private readonly trendQuery: TrendQueryTool,
    private readonly competitorAnalysis: CompetitorAnalysisTool,
    private readonly scoring: ScoringTool,
    private readonly reportGenerator: ReportGeneratorTool,
  ) { super(); }

  getTools(): ToolDefinition[] {
    return [
      { name: 'trend_query', description: '查询品类市场趋势', parameters: [
        { name: 'category', type: 'string', description: '品类名称', required: true },
        { name: 'period', type: 'string', description: '时间范围', required: false },
      ]},
      { name: 'competitor_analysis', description: '竞品对比分析', parameters: [
        { name: 'category', type: 'string', description: '品类', required: true },
      ]},
      { name: 'scoring', description: '选品评分', parameters: [
        { name: 'searchVolume', type: 'number', description: '搜索量', required: true },
        { name: 'competition', type: 'number', description: '竞争度 0-100', required: true },
        { name: 'avgPrice', type: 'number', description: '均价', required: true },
        { name: 'margin', type: 'number', description: '利润率 %', required: true },
        { name: 'growthRate', type: 'number', description: '增长率 %', required: true },
      ]},
      { name: 'generate_report', description: '生成选品报告', parameters: [] },
    ];
  }

  async executeTask(task: AgentTask): Promise<Record<string, unknown>> {
    const { query, category = '通用' } = task.input as { query: string; category?: string };

    const trendData = await this.trendQuery.query(category, 'last_30_days');
    this.addStep(task.id, 'trend_query', TaskStatus.COMPLETED, '趋势查询完成');

    const competitorData = await this.competitorAnalysis.analyze(category, query.split(' '));
    this.addStep(task.id, 'competitor_analysis', TaskStatus.COMPLETED, '竞品分析完成');

    const score = this.scoring.calculate({ searchVolume: 5000, competition: 45, avgPrice: 29.99, margin: 35, growthRate: 23 });
    this.addStep(task.id, 'scoring', TaskStatus.COMPLETED, `评分: ${score.score} → ${score.grade}`);

    const report = this.reportGenerator.generate(`${category} - 选品分析`, [
      { title: '趋势分析', content: trendData },
      { title: '竞品对比', content: competitorData },
      { title: '选品评分', content: `综合评分: ${score.score}/100 (${score.grade})` },
    ]);
    this.addStep(task.id, 'report_generated', TaskStatus.COMPLETED, '报告生成完成');

    this.eventBus.emit(AgentEventType.REPORT_GENERATED, { category, score: score.score, reportId: task.id }, task.correlationId, this.id);

    return { report, score: score.score, grade: score.grade, category };
  }

  async handleEvent(event: AgentEvent): Promise<void> {
    this.logger.log(`收到事件: ${event.type} from ${event.source}`);
  }
}
