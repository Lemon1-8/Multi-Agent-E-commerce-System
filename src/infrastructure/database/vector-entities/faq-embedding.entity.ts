import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('faq_embeddings')
export class FaqEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  question: string;

  @Column('text')
  answer: string;

  // pgvector column type - recognized at runtime with pgvector package
  @Column({ type: 'vector', length: 1536 } as any)
  @Index({ spatial: true } as any)
  embedding: number[];

  @Column({ default: 'en' })
  locale: string;

  @Column('text', { array: true, nullable: true })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;
}
