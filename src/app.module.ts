import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/core.module';
import { EventBusModule } from './core/event-bus/event-bus.module';
import { OrchestratorModule } from './core/orchestrator/orchestrator.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventBusModule,
    OrchestratorModule,
    CoreModule,
  ],
})
export class AppModule {}
