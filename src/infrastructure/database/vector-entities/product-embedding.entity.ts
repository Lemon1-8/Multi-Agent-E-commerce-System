import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('product_embeddings')
export class ProductEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  // pgvector column type - recognized at runtime with pgvector package
  @Column({ type: 'vector', length: 1536 } as any)
  @Index({ spatial: true } as any)
  embedding: number[];

  @Column('text')
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
