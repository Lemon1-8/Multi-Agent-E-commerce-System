import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('market_embeddings')
export class MarketEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  source: string;

  @Column('text')
  content: string;

  // pgvector column type - recognized at runtime with pgvector package
  @Column({ type: 'vector', length: 1536 } as any)
  @Index({ spatial: true } as any)
  embedding: number[];

  @Column()
  category: string;

  @Column({ type: 'date', nullable: true })
  collectedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
