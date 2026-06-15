import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CustomerServiceAgent } from './customer-service.agent';
import { TranslatorTool } from './tools/translator.tool';
import { FaqRetrievalTool } from './tools/faq-retrieval.tool';
import { SentimentAnalysisTool } from './tools/sentiment-analysis.tool';
import { TemplateManagerTool } from './tools/template-manager.tool';
import { EventBusService } from '../../core/event-bus/event-bus.service';

describe('CustomerServiceAgent', () => {
  let agent: CustomerServiceAgent;

  const mockLlm = { complete: jest.fn().mockResolvedValue('{"sentiment":"neutral","score":0.5,"keywords":[]}') };
  const mockEmbedding = { search: jest.fn().mockResolvedValue([]), embed: jest.fn(), embedBatch: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        CustomerServiceAgent, EventBusService,
        { provide: TemplateManagerTool, useClass: TemplateManagerTool },
        { provide: TranslatorTool, useFactory: (llm: any) => new TranslatorTool(llm), inject: [{ token: 'LlmService', optional: true }] },
        { provide: FaqRetrievalTool, useFactory: (emb: any) => new FaqRetrievalTool(emb), inject: [{ token: 'EmbeddingService', optional: true }] },
        { provide: SentimentAnalysisTool, useFactory: (llm: any) => new SentimentAnalysisTool(llm), inject: [{ token: 'LlmService', optional: true }] },
      ],
    })
    .overrideProvider(TranslatorTool).useValue({ translate: jest.fn().mockResolvedValue('translated text') })
    .overrideProvider(FaqRetrievalTool).useValue({ search: jest.fn().mockResolvedValue('FAQ: 如何退货？') })
    .overrideProvider(SentimentAnalysisTool).useValue({ analyze: jest.fn().mockResolvedValue({ sentiment: 'neutral', score: 0.5, keywords: [] }) })
    .compile();

    agent = module.get<CustomerServiceAgent>(CustomerServiceAgent);
  });

  it('应该定义基础属性', () => {
    expect(agent.id).toBe('customer-service');
    expect(agent.name).toBe('客服Agent');
  });

  it('应该处理客服查询', async () => {
    const task = { id: 't1', type: 'customer_service' as any, input: { action: 'handle_query', text: '如何退货？', locale: 'zh-CN' }, createdAt: new Date() };
    const result = await agent.handleTask(task);
    expect(result.status).toBe('completed');
    expect(result.output).toHaveProperty('reply');
  });
});
