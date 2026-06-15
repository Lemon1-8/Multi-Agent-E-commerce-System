import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationService } from './conversation.service';
import { Conversation } from '../../infrastructure/database/entities/conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation])],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
