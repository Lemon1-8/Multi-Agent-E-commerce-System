import { Injectable } from '@nestjs/common';
import { BaseAgent } from '../../core/agent-base/base-agent';
import { ReActLoopService } from '../../core/agent-base/react-loop.service';
import { EventBusService } from '../../core/event-bus/event-bus.service';
import { AgentEvent, AgentEventType, ToolDefinition, ITool } from '../../common/interfaces';
import { TrendQueryTool } from './tools/trend-query.tool';
import { CompetitorAnalysisTool } from './tools/competitor-analysis.tool';
import { ScoringTool } from './tools/scoring.tool';
import { ReportGeneratorTool } from './tools/report-generator.tool';

@Injectable()
export class ProductResearchAgent extends BaseAgent {
  readonly id = 'product-research';
  readonly name = '选品分析Agent';
  readonly description = '负责跨境电商选品分析：趋势洞察、竞品对比、选品评分和报告生成';

  readonly systemPrompt = `你是跨境电商选品分析专家。你的任务是根据用户需求进行选品分析。

## 可用工具
- trend_query: 查询品类市场趋势数据，参数 category(品类名称), period(时间范围，如 last_30_days)
- competitor_analysis: 竞品对比分析，参数 category(品类名称), keywords(关键词数组)
- scoring: 选品评分，参数 searchVolume(搜索量), competition(竞争度0-100), avgPrice(均价), margin(利润率%), growthRate(增长率%)
- generate_report: 生成最终的选品分析报告，参数 title(报告标题), sections(章节数组，每项含title和content)

## 工作流程
1. 先调用 trend_query 了解市场趋势
2. 再调用 competitor_analysis 分析竞品
3. 然后调用 scoring 进行选品评分
4. 最后调用 generate_report 生成完整报告

## 规则
- 如果某个工具返回"未找到数据"，继续执行后续步骤，不要中断
- 评分时如果用户没提供具体数字，使用合理的估算值
- 最终必须调用 generate_report 来生成报告
- 报告生成后，你的工作就完成了，不需要再做其他事情`;

  constructor(
    reactLoop: ReActLoopService,
    private readonly eventBus: EventBusService,
    trendQuery: TrendQueryTool,
    competitorAnalysis: CompetitorAnalysisTool,
    scoring: ScoringTool,
    reportGenerator: ReportGeneratorTool,
  ) {
    super(reactLoop);
    this.tools = [trendQuery, competitorAnalysis, scoring, reportGenerator];
  }

  getTools(): ToolDefinition[] {
    return this.tools.map((t: ITool) => t.definition);
  }

  async handleEvent(event: AgentEvent): Promise<void> {
    this.logger.log(`收到事件: ${event.type} from ${event.source}`);
  }
}
