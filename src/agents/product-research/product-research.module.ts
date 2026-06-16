import { Module } from '@nestjs/common';
import { ProductResearchAgent } from './product-research.agent';
import { TrendQueryTool } from './tools/trend-query.tool';
import { CompetitorAnalysisTool } from './tools/competitor-analysis.tool';
import { ScoringTool } from './tools/scoring.tool';
import { ReportGeneratorTool } from './tools/report-generator.tool';
import { EmbeddingModule } from '../../infrastructure/embedding/embedding.module';
import { ReActLoopService } from '../../core/agent-base/react-loop.service';

@Module({
  imports: [EmbeddingModule],
  providers: [ProductResearchAgent, TrendQueryTool, CompetitorAnalysisTool, ScoringTool, ReportGeneratorTool, ReActLoopService],
  exports: [ProductResearchAgent],
})
export class ProductResearchModule {}
