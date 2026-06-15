import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  customerId: string;

  @Column({ nullable: true })
  @Index()
  agentId: string;

  @Column({ type: 'jsonb' })
  messages: Array<{ role: string; content: string; timestamp: string }>;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
