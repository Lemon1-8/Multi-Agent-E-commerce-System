import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventBusService } from './event-bus.service';
import { AgentEventType } from '../../common/interfaces';

describe('EventBusService', () => {
  let service: EventBusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [EventBusService],
    }).compile();
    service = module.get<EventBusService>(EventBusService);
  });

  it('发布事件后订阅者能收到', (done) => {
    service.on(AgentEventType.TASK_ASSIGNED, (event) => {
      expect(event.payload).toEqual({ data: 'hello' });
      done();
    });
    service.emit(AgentEventType.TASK_ASSIGNED, { data: 'hello' }, 'corr-1');
  });

  it('支持多个订阅者', (done) => {
    let count = 0;
    const handler = () => { count++; if (count >= 2) done(); };
    service.on(AgentEventType.PRODUCT_CREATED, handler);
    service.on(AgentEventType.PRODUCT_CREATED, handler);
    service.emit(AgentEventType.PRODUCT_CREATED, {});
  });
});
