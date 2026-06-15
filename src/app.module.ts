import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/core.module';
import { EventBusModule } from './core/event-bus/event-bus.module';
import { OrchestratorModule } from './core/orchestrator/orchestrator.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ProductResearchModule } from './agents/product-research/product-research.module';
import { OrderManagementModule } from './agents/order-management/order-management.module';
import { CustomerServiceModule } from './agents/customer-service/customer-service.module';
import { ApiModule } from './api/api.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventBusModule,
    OrchestratorModule,
    CoreModule,
    InfrastructureModule,
    ProductResearchModule,
    OrderManagementModule,
    CustomerServiceModule,
    ApiModule,
    ChatModule,
  ],
})
export class AppModule {}
