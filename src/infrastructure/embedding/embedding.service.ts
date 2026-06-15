import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEmbedding } from '../database/vector-entities/product-embedding.entity';
import { FaqEmbedding } from '../database/vector-entities/faq-embedding.entity';
import { MarketEmbedding } from '../database/vector-entities/market-embedding.entity';

export interface VectorSearchParams {
  query: string;
  collection: 'products' | 'faq' | 'market';
  topK: number;
  filter?: Record<string, unknown>;
  threshold?: number;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(ProductEmbedding)
    private readonly productEmbeddingRepo: Repository<ProductEmbedding>,
    @InjectRepository(FaqEmbedding)
    private readonly faqEmbeddingRepo: Repository<FaqEmbedding>,
    @InjectRepository(MarketEmbedding)
    private readonly marketEmbeddingRepo: Repository<MarketEmbedding>,
  ) {}

  async embed(text: string): Promise<number[]> {
    const apiKey = this.config.get('LLM_API_KEY');
    const model = this.config.get('EMBEDDING_MODEL', 'text-embedding-3-small');

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, input: text }),
      });

      if (!response.ok) {
        throw new Error(`Embedding API 错误: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      this.logger.warn(`Embedding API 调用失败，使用零向量占位: ${(error as Error).message}`);
      return new Array(1536).fill(0);
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await this.embed(text));
    }
    return results;
  }

  async search(params: VectorSearchParams): Promise<VectorSearchResult[]> {
    const queryVector = await this.embed(params.query);

    let repo: Repository<ProductEmbedding | FaqEmbedding | MarketEmbedding>;
    switch (params.collection) {
      case 'products': repo = this.productEmbeddingRepo; break;
      case 'faq': repo = this.faqEmbeddingRepo; break;
      case 'market': repo = this.marketEmbeddingRepo; break;
    }

    const results = await repo
      .createQueryBuilder('e')
      .select(['e.id', 'e.content'])
      .addSelect(`1 - (e.embedding <=> :queryVector)`, 'score')
      .where(params.filter ?? {})
      .setParameter('queryVector', JSON.stringify(queryVector))
      .orderBy('score', 'DESC')
      .limit(params.topK)
      .getRawMany();

    return results
      .filter((r: any) => !params.threshold || r.score >= params.threshold)
      .map((r: any) => ({ id: r.e_id, content: r.e_content, score: r.score }));
  }
}
