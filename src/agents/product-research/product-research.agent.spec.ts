import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ProductResearchAgent } from './product-research.agent';
import { TrendQueryTool } from './tools/trend-query.tool';
import { CompetitorAnalysisTool } from './tools/competitor-analysis.tool';
import { ScoringTool } from './tools/scoring.tool';
import { ReportGeneratorTool } from './tools/report-generator.tool';
import { EventBusService } from '../../core/event-bus/event-bus.service';

describe('ProductResearchAgent', () => {
  let agent: ProductResearchAgent;
  let eventBus: EventBusService;

  const mockEmbedding = { search: jest.fn().mockResolvedValue([]), embed: jest.fn(), embedBatch: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        ProductResearchAgent, EventBusService,
        { provide: TrendQueryTool, useValue: new TrendQueryTool(mockEmbedding as any) },
        { provide: CompetitorAnalysisTool, useValue: new CompetitorAnalysisTool(mockEmbedding as any) },
        { provide: ScoringTool, useClass: ScoringTool },
        { provide: ReportGeneratorTool, useClass: ReportGeneratorTool },
      ],
    }).compile();

    agent = module.get<ProductResearchAgent>(ProductResearchAgent);
    eventBus = module.get<EventBusService>(EventBusService);
  });

  it('应该定义基础属性', () => {
    expect(agent.id).toBe('product-research');
    expect(agent.name).toBe('选品分析Agent');
    expect(agent.getStatus()).toBe('idle');
  });

  it('应该注册工具集', () => {
    const tools = agent.getTools();
    expect(tools.length).toBeGreaterThanOrEqual(2);
    expect(tools.map((t) => t.name)).toContain('trend_query');
  });

  it('应该处理选品分析任务', async () => {
    const task = {
      id: 'task-pr-1',
      type: 'product_research' as any,
      input: { query: '蓝牙耳机市场分析', category: '电子产品' },
      createdAt: new Date(),
    };
    const result = await agent.handleTask(task);
    expect(result.status).toBe('completed');
    expect(result.output).toHaveProperty('report');
  });
});
