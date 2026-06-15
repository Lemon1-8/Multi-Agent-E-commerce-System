import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';
import { LlmModule } from './llm/llm.module';
import { EmbeddingModule } from './embedding/embedding.module';

@Module({
  imports: [DatabaseModule, CacheModule, LlmModule, EmbeddingModule],
  exports: [DatabaseModule, CacheModule, LlmModule, EmbeddingModule],
})
export class InfrastructureModule {}
