# 多智能体跨境电商系统 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建事件驱动的多 AI Agent 跨境电商协作系统，含选品分析、订单处理、客服三个 Agent 及 Web 交互界面。

**Architecture:** 事件驱动 Agent 总线，NestJS 模块化设计，Orchestrator 负责任务编排，Agent 通过 EventBus 松耦合通信，pgvector 支持语义检索。

**Tech Stack:** NestJS + TypeScript + PostgreSQL (pgvector) + Redis + React

---

## 文件结构总览

```
src/
├── main.ts
├── app.module.ts
├── common/interfaces/
│   ├── agent.interface.ts
│   ├── task.interface.ts
│   ├── event.interface.ts
│   └── index.ts
├── core/
│   ├── core.module.ts
│   ├── agent-base/
│   │   ├── agent-base.module.ts
│   │   └── base-agent.ts
│   ├── event-bus/
│   │   ├── event-bus.module.ts
│   │   ├── event-bus.service.ts
│   │   └── event-bus.service.spec.ts
│   └── orchestrator/
│       ├── orchestrator.module.ts
│       ├── orchestrator.service.ts
│       ├── orchestrator.service.spec.ts
│       └── orchestrator.integration.spec.ts
├── agents/
│   ├── product-research/
│   │   ├── product-research.module.ts
│   │   ├── product-research.agent.ts
│   │   ├── product-research.agent.spec.ts
│   │   └── tools/
│   │       ├── trend-query.tool.ts
│   │       ├── competitor-analysis.tool.ts
│   │       ├── scoring.tool.ts
│   │       └── report-generator.tool.ts
│   ├── order-management/
│   │   ├── order-management.module.ts
│   │   ├── order-management.agent.ts
│   │   ├── order-management.agent.spec.ts
│   │   └── tools/
│   │       ├── product-crud.tool.ts
│   │       ├── order-workflow.tool.ts
│   │       ├── inventory-alert.tool.ts
│   │       └── anomaly-detection.tool.ts
│   └── customer-service/
│       ├── customer-service.module.ts
│       ├── customer-service.agent.ts
│       ├── customer-service.agent.spec.ts
│       └── tools/
│           ├── translator.tool.ts
│           ├── faq-retrieval.tool.ts
│           ├── sentiment-analysis.tool.ts
│           └── template-manager.tool.ts
├── infrastructure/
│   ├── infrastructure.module.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── entities/
│   │   │   ├── index.ts
│   │   │   ├── product.entity.ts
│   │   │   ├── order.entity.ts
│   │   │   ├── customer.entity.ts
│   │   │   ├── agent-task.entity.ts
│   │   │   ├── conversation.entity.ts
│   │   │   └── agent-memory.entity.ts
│   │   └── vector-entities/
│   │       ├── product-embedding.entity.ts
│   │       ├── faq-embedding.entity.ts
│   │       └── market-embedding.entity.ts
│   ├── cache/
│   │   ├── cache.module.ts
│   │   └── cache.service.ts
│   ├── llm/
│   │   ├── llm.module.ts
│   │   └── llm.service.ts
│   ├── embedding/
│   │   ├── embedding.module.ts
│   │   └── embedding.service.ts
│   └── external-apis/
│       ├── external-apis.module.ts
│       ├── platform-adapter.interface.ts
│       └── mock-adapter.ts
├── api/
│   ├── api.module.ts
│   ├── rest/
│   │   ├── rest.module.ts
│   │   ├── dashboard.controller.ts
│   │   ├── agent.controller.ts
│   │   └── dto/
│   │       └── create-task.dto.ts
│   └── websocket/
│       ├── websocket.module.ts
│       └── agent.gateway.ts
└── chat/
    ├── chat.module.ts
    ├── intent-parser/
    │   ├── intent-parser.module.ts
    │   └── intent-parser.service.ts
    └── conversation/
        ├── conversation.module.ts
        └── conversation.service.ts

frontend/
├── package.json
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── components/
    │   ├── Dashboard.tsx
    │   ├── ChatPanel.tsx
    │   └── AgentStatus.tsx
    ├── hooks/
    │   └── useWebSocket.ts
    └── services/
        └── api.ts
```

---

## Phase 1: 项目脚手架 + 核心框架

### Task 1: 初始化 NestJS 项目

**Files:**
- Create: NestJS 项目脚手架
- Create: `.env`

- [ ] **Step 1: 使用 NestJS CLI 创建项目**

```bash
cd "D:/codes/trae_data/Multi-Agent E-commerce System"
npx @nestjs/cli new . --package-manager npm --skip-git
```

- [ ] **Step 2: 安装核心依赖**

```bash
npm install @nestjs/event-emitter @nestjs/typeorm typeorm pg redis ioredis @nestjs/config class-validator class-transformer @nestjs/websockets socket.io
npm install -D @types/node
```

- [ ] **Step 3: 创建 .env 文件**

```bash
# .env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=multi_agent_ecommerce
REDIS_HOST=localhost
REDIS_PORT=6379
LLM_API_KEY=sk-placeholder
LLM_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
PORT=3000
NODE_ENV=development
```

- [ ] **Step 4: 验证项目可启动**

```bash
npm run start:dev
```
预期: 应用无报错启动，然后 Ctrl+C 停止

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: scaffold NestJS project with core dependencies"
```

---

### Task 2: 定义核心接口和类型

**Files:**
- Create: `src/common/interfaces/agent.interface.ts`
- Create: `src/common/interfaces/task.interface.ts`
- Create: `src/common/interfaces/event.interface.ts`
- Create: `src/common/interfaces/index.ts`

- [ ] **Step 1: 编写 agent.interface.ts**

```typescript
export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  OFFLINE = 'offline',
}

export interface IAgent {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  handleTask(task: AgentTask): Promise<AgentResult>;
  handleEvent(event: AgentEvent): Promise<void>;
  getStatus(): AgentStatus;
  getTools(): ToolDefinition[];
}
```

- [ ] **Step 2: 编写 task.interface.ts**

```typescript
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum TaskType {
  PRODUCT_RESEARCH = 'product_research',
  ORDER_MANAGEMENT = 'order_management',
  CUSTOMER_SERVICE = 'customer_service',
}

export interface AgentTask {
  id: string;
  type: TaskType;
  input: Record<string, unknown>;
  targetAgentId?: string;
  correlationId?: string;
  createdAt: Date;
}

export interface AgentResult {
  taskId: string;
  agentId: string;
  status: TaskStatus;
  output: Record<string, unknown>;
  steps: TaskStep[];
  completedAt: Date;
}

export interface TaskStep {
  name: string;
  status: TaskStatus;
  detail: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
}
```

- [ ] **Step 3: 编写 event.interface.ts**

```typescript
export enum AgentEventType {
  REPORT_GENERATED = 'report.generated',
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  ORDER_STATUS_CHANGED = 'order.status_changed',
  REPLY_GENERATED = 'reply.generated',
  ESCALATION_TRIGGERED = 'escalation.triggered',
  TASK_ASSIGNED = 'task.assigned',
  TASK_COMPLETED = 'task.completed',
  TASK_FAILED = 'task.failed',
  AGENT_STATUS_CHANGED = 'agent.status_changed',
}

export interface AgentEvent {
  id: string;
  type: AgentEventType;
  source: string;
  timestamp: Date;
  payload: unknown;
  correlationId?: string;
}
```

- [ ] **Step 4: 编写 barrel export**

```typescript
export * from './agent.interface';
export * from './task.interface';
export * from './event.interface';
```

- [ ] **Step 5: 验证编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: define core interfaces (IAgent, AgentTask, AgentEvent)"
```

---

### Task 3: 实现 Agent 基类

**Files:**
- Create: `src/core/agent-base/base-agent.ts`
- Create: `src/core/agent-base/agent-base.module.ts`
- Create: `src/core/core.module.ts`

- [ ] **Step 1: 编写 BaseAgent 抽象类**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import {
  IAgent, AgentStatus, AgentTask, AgentResult, AgentEvent,
  AgentEventType, TaskStatus, TaskStep, ToolDefinition,
} from '../../common/interfaces';

@Injectable()
export abstract class BaseAgent implements IAgent {
  protected readonly logger = new Logger(this.constructor.name);
  protected status: AgentStatus = AgentStatus.IDLE;
  private taskSteps: Map<string, TaskStep[]> = new Map();

  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;

  abstract getTools(): ToolDefinition[];
  abstract executeTask(task: AgentTask): Promise<Record<string, unknown>>;
  abstract handleEvent(event: AgentEvent): Promise<void>;

  async handleTask(task: AgentTask): Promise<AgentResult> {
    this.status = AgentStatus.BUSY;
    const steps: TaskStep[] = [];

    try {
      this.addStep(task.id, 'start', TaskStatus.COMPLETED, `Agent ${this.name} 开始处理`);
      const output = await this.executeTask(task);
      this.addStep(task.id, 'done', TaskStatus.COMPLETED, '任务执行完成');
      this.status = AgentStatus.IDLE;

      return {
        taskId: task.id, agentId: this.id, status: TaskStatus.COMPLETED,
        output, steps: this.taskSteps.get(task.id) ?? [], completedAt: new Date(),
      };
    } catch (error) {
      this.status = AgentStatus.ERROR;
      this.addStep(task.id, 'error', TaskStatus.FAILED, (error as Error).message);
      return {
        taskId: task.id, agentId: this.id, status: TaskStatus.FAILED,
        output: { error: (error as Error).message },
        steps: this.taskSteps.get(task.id) ?? [], completedAt: new Date(),
      };
    } finally {
      this.taskSteps.delete(task.id);
    }
  }

  getStatus(): AgentStatus { return this.status; }

  protected addStep(taskId: string, name: string, status: TaskStatus, detail: string): void {
    const steps = this.taskSteps.get(taskId) ?? [];
    steps.push({ name, status, detail, startedAt: new Date(),
      completedAt: status === TaskStatus.COMPLETED ? new Date() : undefined });
    this.taskSteps.set(taskId, steps);
  }

  protected emitEvent(
    eventBus: { emit: (event: AgentEvent) => void },
    type: AgentEventType, payload: unknown, correlationId?: string,
  ): void {
    eventBus.emit({
      id: crypto.randomUUID(), type, source: this.id,
      timestamp: new Date(), payload, correlationId,
    });
  }
}
```

- [ ] **Step 2: 编写模块文件**

```typescript
// src/core/agent-base/agent-base.module.ts
import { Module } from '@nestjs/common';
@Module({})
export class AgentBaseModule {}
```

```typescript
// src/core/core.module.ts
import { Module } from '@nestjs/common';
import { AgentBaseModule } from './agent-base/agent-base.module';

@Module({
  imports: [AgentBaseModule],
  exports: [AgentBaseModule],
})
export class CoreModule {}
```

- [ ] **Step 3: 验证编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: implement BaseAgent abstract class"
```

---

### Task 4: 实现事件总线

**Files:**
- Create: `src/core/event-bus/event-bus.service.ts`
- Create: `src/core/event-bus/event-bus.module.ts`
- Create: `src/core/event-bus/event-bus.service.spec.ts`

- [ ] **Step 1: 编写测试**

```typescript
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
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx jest src/core/event-bus/event-bus.service.spec.ts
```

- [ ] **Step 3: 实现事件总线服务**

```typescript
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
      id: crypto.randomUUID(), type, source, timestamp: new Date(), payload, correlationId,
    };
    this.eventEmitter.emit(type, event);
  }

  on(type: AgentEventType, handler: EventHandler): void {
    this.eventEmitter.on(type, (event: AgentEvent) => handler(event));
  }

  broadcast(type: AgentEventType, payload: unknown, handlers: EventHandler[], source = 'system'): void {
    const event: AgentEvent = {
      id: crypto.randomUUID(), type, source, timestamp: new Date(), payload,
    };
    for (const handler of handlers) {
      try { handler(event); } catch (error) {
        this.logger.error(`事件处理器失败: ${(error as Error).message}`);
      }
    }
    this.eventEmitter.emit(type, event);
  }
}
```

- [ ] **Step 4: 编写模块**

```typescript
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
```

- [ ] **Step 5: 运行测试确认通过**

```bash
npx jest src/core/event-bus/event-bus.service.spec.ts
```

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: implement EventBus service with tests"
```

---

### Task 5: 实现协调器 (Orchestrator)

**Files:**
- Create: `src/core/orchestrator/orchestrator.service.ts`
- Create: `src/core/orchestrator/orchestrator.module.ts`
- Create: `src/core/orchestrator/orchestrator.service.spec.ts`
- Create: `src/core/orchestrator/orchestrator.integration.spec.ts`

- [ ] **Step 1: 编写测试**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrchestratorService } from './orchestrator.service';
import { EventBusService } from '../event-bus/event-bus.service';
import {
  AgentTask, TaskType, TaskStatus, AgentResult, AgentStatus, AgentEvent, IAgent, ToolDefinition,
} from '../../common/interfaces';

class MockAgent implements IAgent {
  id: string; name: string; description = 'Mock';
  constructor(id: string, name: string) { this.id = id; this.name = name; }
  async handleTask(task: AgentTask): Promise<AgentResult> {
    return { taskId: task.id, agentId: this.id, status: TaskStatus.COMPLETED,
      output: { result: 'ok' }, steps: [], completedAt: new Date() };
  }
  async handleEvent(_event: AgentEvent): Promise<void> {}
  getStatus(): AgentStatus { return AgentStatus.IDLE; }
  getTools(): ToolDefinition[] { return []; }
}

describe('OrchestratorService', () => {
  let orchestrator: OrchestratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [OrchestratorService, EventBusService],
    }).compile();
    orchestrator = module.get<OrchestratorService>(OrchestratorService);
  });

  it('注册 Agent', () => {
    orchestrator.registerAgent(new MockAgent('a1', '选品Agent'));
    expect(orchestrator.getRegisteredAgents()).toHaveLength(1);
  });

  it('任务路由到指定 Agent', async () => {
    orchestrator.registerAgent(new MockAgent('a1', '选品Agent'));
    const task: AgentTask = {
      id: 't1', type: TaskType.PRODUCT_RESEARCH,
      input: { query: '分析' }, targetAgentId: 'a1', createdAt: new Date(),
    };
    const result = await orchestrator.routeTask(task);
    expect(result.status).toBe(TaskStatus.COMPLETED);
  });

  it('未找到 Agent 时抛出错误', async () => {
    const task: AgentTask = {
      id: 't2', type: TaskType.PRODUCT_RESEARCH,
      input: {}, targetAgentId: 'nonexistent', createdAt: new Date(),
    };
    await expect(orchestrator.routeTask(task)).rejects.toThrow();
  });

  it('根据 TaskType 自动路由', async () => {
    orchestrator.registerAgent(new MockAgent('r1', '选品Agent'), TaskType.PRODUCT_RESEARCH);
    const task: AgentTask = {
      id: 't3', type: TaskType.PRODUCT_RESEARCH, input: {}, createdAt: new Date(),
    };
    const result = await orchestrator.routeTask(task);
    expect(result.agentId).toBe('r1');
  });
});
```

- [ ] **Step 2: 实现协调器**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../event-bus/event-bus.service';
import {
  IAgent, AgentTask, AgentResult, AgentEventType, TaskType, TaskStatus,
} from '../../common/interfaces';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private readonly agents: Map<string, IAgent> = new Map();
  private readonly taskTypeRouting: Map<TaskType, string> = new Map();

  constructor(private readonly eventBus: EventBusService) {}

  registerAgent(agent: IAgent, defaultTaskType?: TaskType): void {
    this.agents.set(agent.id, agent);
    if (defaultTaskType) this.taskTypeRouting.set(defaultTaskType, agent.id);
    this.logger.log(`Agent 已注册: ${agent.name} (${agent.id})`);
  }

  getRegisteredAgents(): IAgent[] { return Array.from(this.agents.values()); }
  getAgent(id: string): IAgent | undefined { return this.agents.get(id); }

  async routeTask(task: AgentTask): Promise<AgentResult> {
    const targetAgentId = task.targetAgentId ?? this.taskTypeRouting.get(task.type);
    if (!targetAgentId) throw new Error(`无法路由任务: TaskType ${task.type} 未注册路由`);
    const agent = this.agents.get(targetAgentId);
    if (!agent) throw new Error(`Agent ${targetAgentId} 未注册`);

    this.logger.log(`路由任务 ${task.id} → ${agent.name}`);
    this.eventBus.emit(AgentEventType.TASK_ASSIGNED, { taskId: task.id, agentId: agent.id }, task.correlationId);
    const result = await agent.handleTask(task);

    const eventType = result.status === TaskStatus.COMPLETED
      ? AgentEventType.TASK_COMPLETED : AgentEventType.TASK_FAILED;
    this.eventBus.emit(eventType, result, task.correlationId, agent.id);
    return result;
  }
}
```

- [ ] **Step 3: 编写模块**

```typescript
import { Module, Global } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';

@Global()
@Module({
  providers: [OrchestratorService],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx jest src/core/orchestrator/orchestrator.service.spec.ts
```

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: implement Orchestrator with agent registration and task routing"
```

---

### Task 6: 组装 AppModule 并验证框架

**Files:**
- Modify: `src/app.module.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: 更新 AppModule**

```typescript
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
```

- [ ] **Step 2: 更新 main.ts**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Multi-Agent E-commerce System 运行在 http://localhost:${port}`);
}
bootstrap();
```

- [ ] **Step 3: 编写集成验证测试 (orchestrator.integration.spec.ts)**

创建两个测试 Agent (TestResearchAgent, TestOrderAgent 继承 BaseAgent)，验证完整注册→路由→事件广播流程。

- [ ] **Step 4: 运行集成测试**

```bash
npx jest src/core/orchestrator/orchestrator.integration.spec.ts
```

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: wire up AppModule with framework integration tests"
```

---

## Phase 2: 基础设施层

### Task 7: 数据库实体定义

**Files:**
- Create: `src/infrastructure/database/database.module.ts`
- Create: `src/infrastructure/infrastructure.module.ts`
- Create: 6 个 TypeORM 实体文件
- Create: 3 个 pgvector 向量实体文件

- [ ] **Step 1: 编写 DatabaseModule**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'multi_agent_ecommerce'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
  ],
})
export class DatabaseModule {}
```

- [ ] **Step 2: 编写 6 个业务实体**

- `product.entity.ts`: Product (id, sku, title, description, price, category, currency, platform, status, createdAt, updatedAt)
- `order.entity.ts`: Order (id, product_id, customer_id, status OrderStatus枚举, totalAmount, currency, platform, metadata JSONB, createdAt, updatedAt)
- `customer.entity.ts`: Customer (id, name, email, locale, preferences JSONB, createdAt, updatedAt)
- `agent-task.entity.ts`: AgentTaskEntity (id, agentId, type, status, input JSONB, output JSONB, correlationId, createdAt)
- `conversation.entity.ts`: Conversation (id, customerId, agentId, messages JSONB, summary, createdAt, updatedAt)
- `agent-memory.entity.ts`: AgentMemory (id, agentId, key, value JSONB, createdAt, updatedAt) @Unique(['agentId', 'key'])

- [ ] **Step 3: 编写 3 个向量实体**

- `product-embedding.entity.ts`: ProductEmbedding (id, productId, embedding vector(1536), content text, metadata JSONB, createdAt)
- `faq-embedding.entity.ts`: FaqEmbedding (id, question text, answer text, embedding vector(1536), locale, tags text[], createdAt)
- `market-embedding.entity.ts`: MarketEmbedding (id, source, content text, embedding vector(1536), category, collectedAt date, createdAt)

每个向量表添加 HNSW 索引: `@Index({ spatial: true })`

- [ ] **Step 4: 安装 pgvector 依赖**

```bash
npm install pgvector
```

- [ ] **Step 5: 验证编译并提交**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat: define TypeORM entities and pgvector entities"
```

---

### Task 8: Embedding 服务 + Cache 服务 + LLM 服务

**Files:**
- Create: `src/infrastructure/embedding/embedding.service.ts` + `.module.ts`
- Create: `src/infrastructure/cache/cache.service.ts` + `.module.ts`
- Create: `src/infrastructure/llm/llm.service.ts` + `.module.ts`
- Modify: `src/infrastructure/infrastructure.module.ts`

- [ ] **Step 1: 实现 Cache 服务**

```typescript
// cache.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis({
      host: this.config.get('REDIS_HOST', 'localhost'),
      port: this.config.get('REDIS_PORT', 6379),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try { const v = await this.redis.get(key); return v ? JSON.parse(v) : null; }
    catch { return null; }
  }

  async set(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
    try { await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds); } catch {}
  }

  async del(key: string): Promise<void> {
    try { await this.redis.del(key); } catch {}
  }

  async onModuleDestroy(): Promise<void> { await this.redis.quit(); }
}
```

- [ ] **Step 2: 实现 LLM 服务**

LLM 服务封装 OpenAI chat completions API，支持缓存（key=`llm:${model}:${hash}`），json mode 输出，错误处理和日志记录。

- [ ] **Step 3: 实现 Embedding 服务**

Embedding 服务封装 OpenAI embeddings API，支持:
- `embed(text)`: 单文本向量化 (1536维)，失败时返回零向量占位
- `embedBatch(texts)`: 批量向量化
- `search(params)`: 基于 pgvector 余弦相似度 (`<=>` 操作符) 的语义搜索，支持按 collection (products/faq/market) 选择向量表，支持 threshold 和 topK

- [ ] **Step 4: 更新 InfrastructureModule 导出所有服务**

```typescript
@Module({
  imports: [DatabaseModule, CacheModule, LlmModule, EmbeddingModule],
  exports: [DatabaseModule, CacheModule, LlmModule, EmbeddingModule],
})
export class InfrastructureModule {}
```

- [ ] **Step 5: 验证编译并提交**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat: add Embedding, Cache, and LLM infrastructure services"
```

---

### Task 9: 外部 API Mock 适配器

**Files:**
- Create: `src/infrastructure/external-apis/platform-adapter.interface.ts`
- Create: `src/infrastructure/external-apis/mock-adapter.ts`
- Create: `src/infrastructure/external-apis/external-apis.module.ts`

- [ ] **Step 1: 编写 IPlatformAdapter 接口**

定义 `PlatformProduct`, `PlatformOrder` 接口和 `IPlatformAdapter` 接口，包含 `fetchProducts()`, `fetchOrders()`, `createProduct()`, `updateOrderStatus()` 方法。

- [ ] **Step 2: 编写 MockPlatformAdapter**

实现 Mock 适配器，内存中维护预设的 2 个 Mock 商品和 1 个 Mock 订单，所有操作返回 Mock 数据。

- [ ] **Step 3: 编写模块 (使用 provide: 'IPlatformAdapter', useClass: MockPlatformAdapter)**

```typescript
@Module({
  providers: [{ provide: 'IPlatformAdapter', useClass: MockPlatformAdapter }],
  exports: ['IPlatformAdapter'],
})
export class ExternalApisModule {}
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: add platform adapter interface and Mock implementation"
```

---

## Phase 3: 选品分析 Agent

### Task 10: 选品 Agent 工具集 + Agent 核心

**Files:**
- Create: `src/agents/product-research/tools/` 下 4 个工具文件
- Create: `src/agents/product-research/product-research.agent.ts`
- Create: `src/agents/product-research/product-research.module.ts`
- Create: `src/agents/product-research/product-research.agent.spec.ts`

- [ ] **Step 1: 编写趋势查询工具 (trend-query.tool.ts)**

依赖 EmbeddingService，`query(category, period)` 方法：对 market 向量表做语义搜索，返回趋势摘要。

- [ ] **Step 2: 编写竞品分析工具 (competitor-analysis.tool.ts)**

依赖 EmbeddingService，`analyze(category, keywords)` 方法：对 products 向量表做语义搜索，返回竞品列表。

- [ ] **Step 3: 编写选品评分工具 (scoring.tool.ts)**

`calculate(input: ScoringInput)` 方法：根据搜索量(25%)、竞争度(25%)、均价(20%)、利润率(20%)、增长率(10%) 计算加权评分，返回 0-100 分和 A/B/C/D 等级。

- [ ] **Step 4: 编写报告生成工具 (report-generator.tool.ts)**

`generate(title, sections)` 方法：拼接 Markdown 格式报告，含标题、时间戳、章节和页脚。

- [ ] **Step 5: 实现 ProductResearchAgent (继承 BaseAgent)**

```typescript
id = 'product-research'; name = '选品分析Agent';

executeTask(task): // 1.趋势查询 2.竞品分析 3.选品评分 4.生成报告 5.发布 REPORT_GENERATED 事件
handleEvent(event): // 记录日志

getTools(): // 注册 trend_query, competitor_analysis, scoring, generate_report
```

- [ ] **Step 6: 编写模块 (导入 EmbeddingModule)**

```typescript
@Module({
  imports: [EmbeddingModule],
  providers: [ProductResearchAgent, TrendQueryTool, CompetitorAnalysisTool, ScoringTool, ReportGeneratorTool],
  exports: [ProductResearchAgent],
})
export class ProductResearchModule {}
```

- [ ] **Step 7: 编写测试并验证**

测试覆盖: Agent 基础属性、工具注册、任务处理(含事件发布验证)。

```bash
npx jest src/agents/product-research/
git add -A
git commit -m "feat: implement ProductResearchAgent with full tool chain and tests"
```

---

## Phase 4: 订单处理 Agent

### Task 11: 订单 Agent 工具集 + Agent 核心

**Files:**
- Create: `src/agents/order-management/tools/` 下 4 个工具文件
- Create: `src/agents/order-management/order-management.agent.ts` + `.module.ts` + `.spec.ts`

- [ ] **Step 1: 编写商品 CRUD 工具 (product-crud.tool.ts)**

依赖 `@InjectRepository(Product)`，实现 `create()`, `findBySku()`, `listByCategory()`, `updateStatus()`。

- [ ] **Step 2: 编写订单工作流工具 (order-workflow.tool.ts)**

依赖 `@InjectRepository(Order)`，实现 `create()`, `transition()` (含状态机验证: PENDING→CONFIRMED→PROCESSING→SHIPPED→DELIVERED，CANCELLED/RETURNED 为终态), `listByStatus()`。

- [ ] **Step 3: 编写库存预警工具 (inventory-alert.tool.ts)**

`check(name, stock, threshold)` 方法：根据库存比率返回分级预警 (售罄/严重不足/偏低/接近安全线/充足)。

- [ ] **Step 4: 编写异常检测工具 (anomaly-detection.tool.ts)**

依赖 EmbeddingService，`detect(description)` 方法：关键词匹配检测异常 (退货/退款/投诉/破损/延迟/丢失)。

- [ ] **Step 5: 实现 OrderManagementAgent**

```typescript
id = 'order-management'; name = '订单处理Agent';

executeTask(task): // 根据 action 分发: create_product → 创建+发布 PRODUCT_CREATED
                   // create_order / update_order_status → 状态流转+发布 ORDER_STATUS_CHANGED
handleEvent(event): // 监听 REPORT_GENERATED → 可据此创建商品草稿
```

- [ ] **Step 6: 编写模块 (导入 TypeOrmModule.forFeature([Product, Order]), EmbeddingModule)**

- [ ] **Step 7: 测试并提交**

```bash
npx jest src/agents/order-management/
git add -A
git commit -m "feat: implement OrderManagementAgent with CRUD, workflow, and anomaly detection"
```

---

## Phase 5: 客服 Agent

### Task 12: 客服 Agent 工具集 + Agent 核心 + 协作测试

**Files:**
- Create: `src/agents/customer-service/tools/` 下 4 个工具文件
- Create: `src/agents/customer-service/customer-service.agent.ts` + `.module.ts` + `.spec.ts`
- Create: `src/agents/customer-service/cross-agent-collaboration.spec.ts`

- [ ] **Step 1: 编写翻译工具 (translator.tool.ts)**

依赖 LlmService，`translate(text, targetLocale)` 方法：调用 LLM 翻译，支持多语言 (en/es/fr/de/ja/ko)。

- [ ] **Step 2: 编写 FAQ 检索工具 (faq-retrieval.tool.ts)**

依赖 EmbeddingService，`search(question, locale)` 方法：对 faq 向量表做语义搜索，按语言过滤。

- [ ] **Step 3: 编写情感分析工具 (sentiment-analysis.tool.ts)**

依赖 LlmService (jsonMode)，返回 `{ sentiment: 'positive'|'neutral'|'negative', score: 0-1, keywords: [] }`。

- [ ] **Step 4: 编写话术模板工具 (template-manager.tool.ts)**

内存维护 4 个预设模板 (greeting/order_status/return_policy/escalation)，支持 `findTemplate()` 和 `fillTemplate()` 变量替换。

- [ ] **Step 5: 实现 CustomerServiceAgent**

```typescript
id = 'customer-service'; name = '客服Agent';

executeTask(task): // action='handle_query' → 1.情感分析 2.FAQ检索 3.生成回复 4.翻译 5.负面情感+升级
                   // 发布 REPLY_GENERATED / ESCALATION_TRIGGERED 事件
handleEvent(event): // 监听 PRODUCT_CREATED, ORDER_STATUS_CHANGED
```

场景检测逻辑: 关键词映射 (你好/hi→greeting, 订单/快递→order_status, 退货/退款→return_policy, 投诉→escalation)

- [ ] **Step 6: 编写跨 Agent 协作测试**

测试流程: 选品Agent生成报告 → 订单Agent收到事件 → 创建商品 → 客服Agent收到事件 → 准备话术模板。

- [ ] **Step 7: 测试并提交**

```bash
npx jest src/agents/customer-service/
git add -A
git commit -m "feat: implement CustomerServiceAgent with translation, FAQ, sentiment, and cross-agent tests"
```

---

## Phase 6: 用户交互层

### Task 13: REST API

**Files:**
- Create: `src/api/api.module.ts`
- Create: `src/api/rest/rest.module.ts`, `dashboard.controller.ts`, `agent.controller.ts`
- Create: `src/api/rest/dto/create-task.dto.ts`

- [ ] **Step 1: 编写 CreateTaskDto**

```typescript
import { IsString, IsObject, IsOptional } from 'class-validator';
export class CreateTaskDto {
  @IsString() type: string;
  @IsObject() input: Record<string, unknown>;
  @IsString() @IsOptional() targetAgentId?: string;
}
```

- [ ] **Step 2: 编写 DashboardController**

`GET /api/dashboard/agents` — 返回所有已注册 Agent 的 id/name/description/status/tools
`GET /api/dashboard/status` — 返回 totalAgents/onlineAgents/timestamp

- [ ] **Step 3: 编写 AgentController**

`POST /api/agents/task` — 创建任务，自动路由到对应 Agent，返回 AgentResult
`GET /api/agents/:id` — 返回单个 Agent 信息

- [ ] **Step 4: 编译验证并提交**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat: implement REST API controllers for dashboard and agent tasks"
```

---

### Task 14: WebSocket 网关 + 对话管理

**Files:**
- Create: `src/api/websocket/websocket.module.ts`, `agent.gateway.ts`
- Create: `src/chat/chat.module.ts`
- Create: `src/chat/intent-parser/intent-parser.service.ts` + `.module.ts`
- Create: `src/chat/conversation/conversation.service.ts` + `.module.ts`

- [ ] **Step 1: 编写 AgentGateway (WebSocket)**

```typescript
@WebSocketGateway({ cors: { origin: '*' } })
export class AgentGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(private readonly eventBus: EventBusService) {
    // 转发所有 Agent 事件到 WebSocket 客户端
  }

  @SubscribeMessage('chat:message')
  handleChatMessage(client: Socket, payload: { text: string }): void { ... }

  emitAgentProgress(taskId: string, step: string, detail: string): void { ... }
}
```

- [ ] **Step 2: 编写 IntentParserService**

`parse(text)` 方法：先用关键词快速匹配 (含中文关键词: 选品/市场/趋势/订单/商品/客户/投诉等)，不再用 LLM 解析。返回 `{ taskType, extractedInput }`。代码参照设计文档第 6.2 节。

- [ ] **Step 3: 编写 ConversationService**

依赖 `@InjectRepository(Conversation)`，实现 `create()`, `addMessage()`, `getHistory()`。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: implement WebSocket gateway, intent parser, and conversation service"
```

---

### Task 15: React 前端基础页面

**Files:**
- Create: `frontend/` 下全部文件

- [ ] **Step 1: 初始化前端项目**

```bash
cd frontend
npm init -y
npm install react react-dom socket.io-client
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react
```

- [ ] **Step 2: 编写配置文件 (tsconfig.json, index.html, vite.config.ts)**

- [ ] **Step 3: 编写核心组件**

- `App.tsx`: 左右分栏布局，左栏 Dashboard + Agent 状态，右栏 ChatPanel
- `Dashboard.tsx`: Agent 状态卡片 (id/name/status)、实时事件流
- `ChatPanel.tsx`: 聊天消息列表 + 输入框 + 发送按钮
- `useWebSocket.ts`: socket.io-client 封装，connect/disconnect 事件，消息收发

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: add React frontend with Dashboard, ChatPanel, and WebSocket hook"
```

---

### Task 16: 端到端集成与最终验证

**Files:**
- Modify: `src/app.module.ts` (整合所有模块)

- [ ] **Step 1: 更新 AppModule 导入所有业务模块**

```typescript
imports: [
  ConfigModule.forRoot({ isGlobal: true }),
  EventBusModule, OrchestratorModule, CoreModule,
  InfrastructureModule,
  ProductResearchModule, OrderManagementModule, CustomerServiceModule,
  ApiModule, ChatModule,
]
```

- [ ] **Step 2: 更新 main.ts 添加 Agent 自动注册**

在 bootstrap 中获取 OrchestratorService，注册三个 Agent 并绑定默认 TaskType。

- [ ] **Step 3: 全量编译检查**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: 运行全部测试**

```bash
npx jest --passWithNoTests
```

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: final integration — all modules wired, all tests passing"
```

---

## 自审结果

1. **Spec 覆盖**: 设计文档 10 个章节逐一对照，每个需求均有对应 Task
2. **占位符检查**: 无 TBD/TODO，所有代码步骤均有具体实现描述
3. **类型一致性**: IAgent, AgentTask, AgentEvent 在 Task 2 定义，后续 Task 引用一致
4. **范围清晰**: "不做的" 清单中所有项目 (真实API对接/生产多语言/支付/权限/向量微调/完整UI) 均未纳入计划
