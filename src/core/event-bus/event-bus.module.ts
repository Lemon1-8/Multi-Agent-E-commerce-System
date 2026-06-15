import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventBusService } from './event-bus.service';

@Global()
@Module({
  imports: [EventEmitterModule.forRoot({ wildcard: false, delimiter: '.' })],
  providers: [EventBusService],
  exports: [EventBusService],
})
export class EventBusModule {}
