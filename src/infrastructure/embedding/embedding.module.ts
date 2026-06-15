import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmbeddingService } from './embedding.service';
import { ProductEmbedding } from '../database/vector-entities/product-embedding.entity';
import { FaqEmbedding } from '../database/vector-entities/faq-embedding.entity';
import { MarketEmbedding } from '../database/vector-entities/market-embedding.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEmbedding, FaqEmbedding, MarketEmbedding])],
  providers: [EmbeddingService],
  exports: [EmbeddingService],
})
export class EmbeddingModule {}
