import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../infrastructure/database/entities/conversation.entity';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
  ) {}

  async create(): Promise<Conversation> {
    const conversation = this.conversationRepo.create({ messages: [] });
    return this.conversationRepo.save(conversation);
  }

  async addMessage(conversationId: string, role: 'user' | 'assistant', content: string): Promise<void> {
    const conversation = await this.conversationRepo.findOne({ where: { id: conversationId } });
    if (!conversation) throw new Error('对话不存在');
    conversation.messages = [...conversation.messages, { role, content, timestamp: new Date().toISOString() }];
    await this.conversationRepo.save(conversation);
  }

  async getHistory(conversationId: string): Promise<Conversation | null> {
    return this.conversationRepo.findOne({ where: { id: conversationId } });
  }
}
