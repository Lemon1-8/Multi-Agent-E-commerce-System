import { Module } from '@nestjs/common';
import { AgentBaseModule } from './agent-base/agent-base.module';

@Module({
  imports: [AgentBaseModule],
  exports: [AgentBaseModule],
})
export class CoreModule {}
