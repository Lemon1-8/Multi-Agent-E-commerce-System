import { Test, TestingModule } from '@nestjs/testing';
import { CustomerServiceAgent } from './customer-service.agent';
import { ReActLoopService } from '../../core/agent-base/react-loop.service';
import { EventBusService } from '../../core/event-bus/event-bus.service';
import { TranslatorTool } from './tools/translator.tool';
import { FaqRetrievalTool } from './tools/faq-retrieval.tool';
import { SentimentAnalysisTool } from './tools/sentiment-analysis.tool';
import { TemplateManagerTool } from './tools/template-manager.tool';

describe('CustomerServiceAgent', () => {
  let agent: CustomerServiceAgent;

  const mockReActLoop = { run: jest.fn().mockResolvedValue({ result: 'test output' }) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerServiceAgent,
        { provide: ReActLoopService, useValue: mockReActLoop },
        { provide: EventBusService, useValue: { emit: jest.fn() } },
        { provide: TranslatorTool, useValue: { definition: { name: 'translate' }, execute: jest.fn() } },
        { provide: FaqRetrievalTool, useValue: { definition: { name: 'faq_search' }, execute: jest.fn() } },
        { provide: SentimentAnalysisTool, useValue: { definition: { name: 'sentiment_analysis' }, execute: jest.fn() } },
        { provide: TemplateManagerTool, useValue: { definition: { name: 'manage_template' }, execute: jest.fn() } },
      ],
    }).compile();

    agent = module.get<CustomerServiceAgent>(CustomerServiceAgent);
  });

  it('应该定义基础属性和系统提示词', () => {
    expect(agent.id).toBe('customer-service');
    expect(agent.name).toBe('客服Agent');
    expect(agent.systemPrompt).toBeTruthy();
  });

  it('应该注册所有工具', () => {
    expect(agent.getTools().length).toBe(4);
  });

  it('应该通过ReAct循环处理客服查询', async () => {
    const task = { id: 't1', type: 'customer_service' as any, input: { action: 'handle_query', text: '如何退货？', locale: 'zh-CN' }, createdAt: new Date() };
    const result = await agent.handleTask(task);
    expect(result.status).toBe('completed');
    expect(mockReActLoop.run).toHaveBeenCalled();
  });
});
