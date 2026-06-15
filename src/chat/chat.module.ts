import { Module } from '@nestjs/common';
import { IntentParserModule } from './intent-parser/intent-parser.module';
import { ConversationModule } from './conversation/conversation.module';

@Module({
  imports: [IntentParserModule, ConversationModule],
  exports: [IntentParserModule, ConversationModule],
})
export class ChatModule {}
