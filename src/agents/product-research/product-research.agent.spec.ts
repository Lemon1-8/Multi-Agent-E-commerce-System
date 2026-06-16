import { Test, TestingModule } from '@nestjs/testing';
import { ProductResearchAgent } from './product-research.agent';
import { ReActLoopService } from '../../core/agent-base/react-loop.service';
import { EventBusService } from '../../core/event-bus/event-bus.service';
import { TrendQueryTool } from './tools/trend-query.tool';
import { CompetitorAnalysisTool } from './tools/competitor-analysis.tool';
import { ScoringTool } from './tools/scoring.tool';
import { ReportGeneratorTool } from './tools/report-generator.tool';

describe('ProductResearchAgent', () => {
  let agent: ProductResearchAgent;

  const mockReActLoop = { run: jest.fn().mockResolvedValue({ result: 'test output' }) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductResearchAgent,
        { provide: ReActLoopService, useValue: mockReActLoop },
        { provide: EventBusService, useValue: { emit: jest.fn() } },
        { provide: TrendQueryTool, useValue: { definition: { name: 'trend_query' }, execute: jest.fn() } },
        { provide: CompetitorAnalysisTool, useValue: { definition: { name: 'competitor_analysis' }, execute: jest.fn() } },
        { provide: ScoringTool, useValue: { definition: { name: 'scoring' }, execute: jest.fn() } },
        { provide: ReportGeneratorTool, useValue: { definition: { name: 'generate_report' }, execute: jest.fn() } },
      ],
    }).compile();

    agent = module.get<ProductResearchAgent>(ProductResearchAgent);
  });

  it('应该定义基础属性和系统提示词', () => {
    expect(agent.id).toBe('product-research');
    expect(agent.name).toBe('选品分析Agent');
    expect(agent.systemPrompt).toBeTruthy();
  });

  it('应该注册所有工具', () => {
    expect(agent.getTools().length).toBe(4);
  });

  it('应该通过ReAct循环处理任务', async () => {
    const task = { id: 't1', type: 'product_research' as any, input: { query: 'test' }, createdAt: new Date() };
    const result = await agent.handleTask(task);
    expect(result.status).toBe('completed');
    expect(mockReActLoop.run).toHaveBeenCalled();
  });
});
