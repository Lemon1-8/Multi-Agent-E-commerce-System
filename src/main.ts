import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { OrchestratorService } from './core/orchestrator/orchestrator.service';
import { ProductResearchAgent } from './agents/product-research/product-research.agent';
import { OrderManagementAgent } from './agents/order-management/order-management.agent';
import { CustomerServiceAgent } from './agents/customer-service/customer-service.agent';
import { TaskType } from './common/interfaces';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // 自动注册所有 Agent
  const orchestrator = app.get(OrchestratorService);
  const productResearchAgent = app.get(ProductResearchAgent);
  const orderManagementAgent = app.get(OrderManagementAgent);
  const customerServiceAgent = app.get(CustomerServiceAgent);

  orchestrator.registerAgent(productResearchAgent, TaskType.PRODUCT_RESEARCH);
  orchestrator.registerAgent(orderManagementAgent, TaskType.ORDER_MANAGEMENT);
  orchestrator.registerAgent(customerServiceAgent, TaskType.CUSTOMER_SERVICE);

  console.log('已注册 Agents:', orchestrator.getRegisteredAgents().map(a => a.name).join(', '));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Multi-Agent E-commerce System 运行在 http://localhost:${port}`);
}
bootstrap();
