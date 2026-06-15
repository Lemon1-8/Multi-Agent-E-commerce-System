import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class AgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AgentGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`客户端已连接: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`客户端已断开: ${client.id}`);
  }

  @SubscribeMessage('chat:message')
  handleChatMessage(_client: Socket, payload: { text: string }): void {
    this.logger.log(`收到聊天消息: ${payload.text.slice(0, 50)}...`);
    this.server.emit('chat:response', {
      type: 'acknowledged',
      text: payload.text,
      timestamp: new Date().toISOString(),
    });
  }

  emitAgentProgress(taskId: string, step: string, detail: string): void {
    this.server.emit('agent:progress', { taskId, step, detail, timestamp: new Date().toISOString() });
  }
}
