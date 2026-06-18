import { Module } from '@nestjs/common';
import { AgentGateway } from './agent.gateway';
import { IntentParserModule } from '../../chat/intent-parser/intent-parser.module';

@Module({
  imports: [IntentParserModule],
  providers: [AgentGateway],
  exports: [AgentGateway],
})
export class WebsocketModule {}
