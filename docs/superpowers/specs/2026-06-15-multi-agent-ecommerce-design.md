# 多智能体跨境电商系统 — 设计方案

> 日期: 2026-06-15  
> 状态: 已确认  
> 技术栈: NestJS + TypeScript + PostgreSQL (pgvector) + Redis

---

## 1. 项目概述

构建一个多 AI Agent 协作的跨境电商系统，面向中国出海电商场景。首期实现 3 个 Agent（选品分析、订单处理、客服），以事件驱动 Agent 总线的方式协作。先以 Mock 数据跑通框架，后续对接真实平台。

## 2. 系统架构

采用**事件驱动 Agent 总线**架构，分为四层：

| 层 | 职责 | 关键组件 |
|------|------|----------|
| 用户交互层 | 管理面板 + 对话式聊天 | React 前端 |
| API 网关层 | 鉴权、路由、WebSocket 推送 | NestJS Gateway |
| Agent 核心层 | 协调器、3 个 Agent、事件总线 | NestJS Modules |
| 基础设施层 | 存储、缓存、AI 能力 | PostgreSQL+pgvector, Redis, LLM |

### 架构图

```
用户交互层:  Web 管理面板  +  对话式聊天界面
                │ (REST)    │ (WebSocket)
API 网关层:     └──────┬────┘
                      │
Agent 核心层:  ┌──────┴──────┐
              │ Orchestrator │  (任务分解·路由·结果聚合·状态管理)
              └──┬──────┬───┘
                 │      │
       ┌─────────┼──────┼─────────┐
       ▼         ▼      ▼         ▼
  ┌─────────────────────────────────┐
  │         Agent 事件总线           │
  │  任务队列(1:1) + 事件广播(1:N)   │
  └──┬──────────┬──────────┬───────┘
     ▼          ▼          ▼
  选品Agent   订单Agent   客服Agent

基础设施层:  PostgreSQL+pgvector  Redis  LLM服务  Mock外部API
```

## 3. Agent 设计

### 3.1 Agent 通用接口

```typescript
interface IAgent {
  id: string;
  name: string;
  handleTask(task: AgentTask): Promise<AgentResult>;
  handleEvent(event: AgentEvent): Promise<void>;
  getStatus(): AgentStatus;
}
```

### 3.2 选品分析 Agent

- **职责**: 接收选品需求 → 查询市场数据 → LLM 分析 → 生成报告
- **工具集**: 趋势数据查询、类目对比分析、竞品情报搜集、选品评分计算、报告生成
- **记忆**: 市场快照、历史选品记录、用户偏好
- **发布事件**: `ReportGenerated`
- **向量检索**: 相似商品搜索、竞品语义对比、趋势聚类分析

### 3.3 订单处理 Agent

- **职责**: 管理商品和订单生命周期
- **工具集**: 商品 CRUD、订单状态流转、库存预警、物流追踪、异常检测
- **记忆**: 商品库、订单列表、异常记录
- **监听事件**: `ReportGenerated`
- **发布事件**: `ProductCreated`, `ProductUpdated`, `OrderStatusChanged`
- **向量检索**: 异常订单聚类、地址标准化

### 3.4 客服 Agent

- **职责**: 处理客户咨询，自动生成多语言客服话术
- **工具集**: 多语言翻译、FAQ 检索生成、情感分析、话术模板管理、升级标记
- **记忆**: 客户画像、历史对话、FAQ 库
- **监听事件**: `ProductCreated`, `OrderStatusChanged`
- **发布事件**: `ReplyGenerated`, `EscalationTriggered`
- **向量检索**: FAQ 语义匹配、历史对话检索、情感语义分析

## 4. 事件总线与通信

### 4.1 通信模式

| 模式 | 方向 | 场景 | 实现 |
|------|------|------|------|
| 任务派发 | 协调器 → Agent | 用户请求需要某 Agent 执行 | EventEmitter (point-to-point) |
| 事件广播 | Agent → 所有监听者 | 选品完成、订单状态变更 | EventEmitter (broadcast) |
| 状态上报 | Agent → 协调器 | Agent 进度实时推送 | WebSocket |
| Agent 互询 | Agent ↔ Agent | 跨 Agent 信息查询 | 通过协调器中转 |

### 4.2 核心事件

```typescript
enum AgentEventType {
  REPORT_GENERATED = 'report.generated',
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  ORDER_STATUS_CHANGED = 'order.status_changed',
  REPLY_GENERATED = 'reply.generated',
  ESCALATION_TRIGGERED = 'escalation.triggered',
  TASK_ASSIGNED = 'task.assigned',
  TASK_COMPLETED = 'task.completed',
  TASK_FAILED = 'task.failed',
}
```

### 4.3 典型协作流程

```
用户: "分析这个品类的退货率高的原因"
  → 协调器 → 订单Agent (查询退货数据)
  → 协调器 → 选品Agent (分析原因 + 生成报告)
  → 客服Agent 自动监听 (生成客户沟通建议)
```

## 5. 数据与知识层

### 5.1 数据库选型

| 组件 | 用途 |
|------|------|
| PostgreSQL | 主数据库：业务数据、任务记录、对话历史 |
| pgvector (扩展) | 向量存储：Embedding、语义索引 |
| Redis | 缓存/队列：会话状态、Agent 工作队列、LLM 响应缓存 |

### 5.2 核心业务表

- **products**: 商品信息 (sku, title, description, price, category, platform, status)
- **orders**: 订单 (product_id, customer_id, status, total_amount, currency)
- **customers**: 客户 (name, email, locale, preferences)
- **agent_tasks**: Agent 任务记录 (agent_id, type, status, input, output, correlation_id)
- **conversations**: 对话历史 (customer_id, agent_id, messages, summary)
- **agent_memory**: Agent 记忆 (agent_id, key, value JSONB)

### 5.3 向量表

- **product_embeddings**: 商品语义向量 (1536维, HNSW 索引)
- **faq_embeddings**: FAQ 语义向量 (多语言, HNSW 索引)
- **market_embeddings**: 市场数据向量 (HNSW 索引)

### 5.4 Embedding 服务

```typescript
interface IEmbeddingService {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  search(params: VectorSearchParams): Promise<VectorSearchResult[]>;
}
```

统一向量化服务，所有 Agent 共用。支持 OpenAI text-embedding-3-small (1536维) 或其他模型。

## 6. 用户交互层

### 6.1 Web 管理面板

- **仪表盘**: Agent 状态总览、关键指标卡片
- **选品中心**: 选品报告列表、详情查看、手动触发
- **订单管理**: 商品列表、订单追踪、异常标记
- **客服中心**: 对话监控、待处理队列、满意度统计
- **Agent 配置**: 参数调优、工具开关

### 6.2 对话式聊天界面

- 用户自然语言输入，实时展示 Agent 执行步进
- 支持 Agent 思考过程透明化（查询了什么、做了什么决策）
- 交互式操作按钮（采纳建议、深入分析、忽略）
- 前端技术: React，REST API + WebSocket

## 7. 项目模块结构

```
src/
├── main.ts
├── app.module.ts
├── common/                  # 公共模块
│   ├── interfaces/          # IAgent, AgentTask, AgentEvent 等
│   ├── decorators/          # 自定义装饰器
│   └── utils/               # 工具函数
├── core/                    # 核心框架
│   ├── orchestrator/        # 任务编排与协调
│   ├── event-bus/           # Agent 事件总线
│   └── agent-base/          # Agent 基类
├── agents/                  # Agent 实现
│   ├── product-research/    # 选品分析 Agent
│   ├── order-management/    # 订单处理 Agent
│   └── customer-service/    # 客服 Agent
├── infrastructure/          # 基础设施
│   ├── database/            # PostgreSQL + pgvector
│   ├── cache/               # Redis
│   ├── llm/                 # LLM 服务封装
│   ├── embedding/           # 向量化服务
│   └── external-apis/       # 外部平台 API (Mock)
├── api/                     # API 层
│   ├── rest/                # REST 控制器
│   └── websocket/           # WebSocket 网关
└── chat/                    # 对话管理
    ├── intent-parser/       # 意图识别
    └── conversation/        # 对话管理
```

## 8. 测试策略

- **单元测试**: 每个 Agent 的独立逻辑、工具函数
- **集成测试**: Agent 与事件总线的协作、数据库操作
- **Agent 协作测试**: 端到端场景（选品→订单→客服联动）
- **Mock**: 外部平台 API、LLM 调用（测试阶段全 Mock）

## 9. 实施阶段

| 阶段 | 内容 | 产出 |
|------|------|------|
| Phase 1 | 项目脚手架 + 核心框架 | NestJS 项目、Orchestrator、EventBus、Agent 基类 |
| Phase 2 | 基础设施层 | DB 模型 + pgvector + Redis + LLM 服务 + Embedding |
| Phase 3 | 选品 Agent | 选品 Agent 完整实现 + 测试 |
| Phase 4 | 订单 Agent | 订单 Agent 完整实现 + 测试 |
| Phase 5 | 客服 Agent | 客服 Agent 完整实现 + Agent 间协作测试 |
| Phase 6 | 用户交互层 | REST API + WebSocket + 前端基础页面 |

## 10. 不做的（当前版本）

- 真实平台 API 对接（Amazon/Shopify 等）
- 生产级多语言（先用中英双语）
- 支付集成
- 用户权限系统（单用户）
- 向量模型微调（用通用 Embedding 模型）
- 前端完整 UI（MVP 阶段用基础管理界面）
