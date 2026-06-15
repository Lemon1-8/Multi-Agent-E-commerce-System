import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AgentTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('agent_tasks')
export class AgentTaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  agentId: string;

  @Column()
  type: string;

  @Column({ type: 'enum', enum: AgentTaskStatus, default: AgentTaskStatus.PENDING })
  status: AgentTaskStatus;

  @Column({ type: 'jsonb', nullable: true })
  input: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  output: Record<string, unknown>;

  @Column({ nullable: true })
  @Index()
  correlationId: string;

  @CreateDateColumn()
  createdAt: Date;
}
