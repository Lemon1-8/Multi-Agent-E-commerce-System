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
    const apiUrl = this.config.get('EMBEDDING_API_URL', '');
    const model = this.config.get('EMBEDDING_MODEL', 'bge-m3');
    const dimension = this.config.get<number>('EMBEDDING_DIMENSION', 1024);
    const apiKey = this.config.get('LLM_API_KEY', '');

    // 优先使用本地 TEI 服务，否则用 OpenAI
    const baseUrl = apiUrl || 'https://api.openai.com';
    const isOpenAI = !apiUrl;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (isOpenAI) headers['Authorization'] = `Bearer ${apiKey}`;

      const response = await fetch(`${baseUrl}/v1/embeddings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, input: text }),
      });

      if (!response.ok) {
        throw new Error(`Embedding API 错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      this.logger.warn(`Embedding API 调用失败，使用零向量占位: ${(error as Error).message}`);
      return new Array(dimension).fill(0);
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
