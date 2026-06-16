import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('faq_embeddings')
export class FaqEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  question: string;

  @Column('text')
  answer: string;

  @Column({ type: 'vector', length: 1024 } as any)
  embedding: number[];

  @Column({ default: 'en' })
  locale: string;

  @Column('text', { array: true, nullable: true })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;
}
