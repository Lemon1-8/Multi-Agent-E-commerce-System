import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentEvent, AgentEventType } from '../../common/interfaces';

export type EventHandler = (event: AgentEvent) => void | Promise<void>;

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit(type: AgentEventType, payload: unknown, correlationId?: string, source = 'system'): void {
    const event: AgentEvent = {
      id: crypto.randomUUID(),
      type,
      source,
      timestamp: new Date(),
      payload,
      correlationId,
    };
    this.eventEmitter.emit(type, event);
  }

  on(type: AgentEventType, handler: EventHandler): void {
    this.eventEmitter.on(type, (event: AgentEvent) => handler(event));
  }

  async broadcast(
    type: AgentEventType,
    payload: unknown,
    handlers: EventHandler[],
    source = 'system',
    correlationId?: string,
  ): Promise<void> {
    const event: AgentEvent = {
      id: crypto.randomUUID(),
      type,
      source,
      timestamp: new Date(),
      payload,
      correlationId,
    };
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error(`事件处理器失败: ${(error as Error).message}`, (error as Error).stack);
      }
    }
  }
}
