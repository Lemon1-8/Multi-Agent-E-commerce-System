import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('agent_memory')
@Unique(['agentId', 'key'])
export class AgentMemory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  agentId: string;

  @Column()
  key: string;

  @Column({ type: 'jsonb' })
  value: unknown;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
