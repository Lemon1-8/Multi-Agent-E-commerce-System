import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { AgentController } from './agent.controller';

@Module({
  controllers: [DashboardController, AgentController],
})
export class RestModule {}
