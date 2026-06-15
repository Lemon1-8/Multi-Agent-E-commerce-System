import { Module } from '@nestjs/common';
import { CustomerServiceAgent } from './customer-service.agent';
import { TranslatorTool } from './tools/translator.tool';
import { FaqRetrievalTool } from './tools/faq-retrieval.tool';
import { SentimentAnalysisTool } from './tools/sentiment-analysis.tool';
import { TemplateManagerTool } from './tools/template-manager.tool';
import { EmbeddingModule } from '../../infrastructure/embedding/embedding.module';

@Module({
  imports: [EmbeddingModule],
  providers: [CustomerServiceAgent, TranslatorTool, FaqRetrievalTool, SentimentAnalysisTool, TemplateManagerTool],
  exports: [CustomerServiceAgent],
})
export class CustomerServiceModule {}
