import { Module } from '@nestjs/common';
import { RestModule } from './rest/rest.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [RestModule, WebsocketModule],
})
export class ApiModule {}
