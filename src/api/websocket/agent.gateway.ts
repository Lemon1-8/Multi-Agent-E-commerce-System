import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OrchestratorService } from '../../core/orchestrator/orchestrator.service';
import { IntentParserService } from '../../chat/intent-parser/intent-parser.service';
import { AgentTask } from '../../common/interfaces';

@WebSocketGateway({ cors: { origin: '*' } })
export class AgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AgentGateway.name);

  constructor(
    private readonly orchestrator: OrchestratorService,
    private readonly intentParser: IntentParserService,
  ) {}

  handleConnection(client: Socket): void {
    this.logger.log(`客户端已连接: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`客户端已断开: ${client.id}`);
  }

  @SubscribeMessage('chat:message')
  async handleChatMessage(client: Socket, payload: { text: string }): Promise<void> {
    this.logger.log(`收到聊天消息: ${payload.text.slice(0, 50)}...`);

    const { taskType, extractedInput } = this.intentParser.parse(payload.text);

    const task: AgentTask = {
      id: crypto.randomUUID(),
      type: taskType,
      input: { ...extractedInput, originalText: payload.text },
      createdAt: new Date(),
    };

    client.emit('chat:response', {
      type: 'task_created',
      taskId: task.id,
      taskType,
      text: payload.text,
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await this.orchestrator.routeTask(task);
      client.emit('chat:response', {
        type: 'task_result',
        taskId: task.id,
        agentId: result.agentId,
        status: result.status,
        output: result.output,
        steps: result.steps,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      client.emit('chat:response', {
        type: 'task_error',
        taskId: task.id,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
