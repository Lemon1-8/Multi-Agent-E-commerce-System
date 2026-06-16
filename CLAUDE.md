# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 开发命令

```bash
# 基础设施
docker compose up -d                                              # 启动 PostgreSQL (pgvector) + Redis
docker start embedding_rerank_models-tei-embedding-1              # 启动本地 BGE-M3 Embedding 服务 (端口 8888)

# 后端 (NestJS)
npm run start:dev                                                 # 开发模式 (watch 热重载)
npm run build                                                     # 编译
npm run start:prod                                                # 生产模式
npm run lint                                                      # ESLint

# 测试
npm test                                                          # 全部测试
npx jest <path-to-file>                                           # 单个测试文件
npx jest --testPathPattern=<name>                                 # 按名称过滤测试

# 前端
cd frontend && npm run dev                                        # Vite 开发服务器 (端口 5173)
cd frontend && npm run build                                      # 生产构建
```

## 技术栈

- **后端**: NestJS 11 + TypeScript 5
- **数据库**: PostgreSQL 16 + pgvector (向量检索)
- **缓存/队列**: Redis 7
- **AI**: DeepSeek v4 Flash (LLM) + 本地 BGE-M3 via TEI (Embedding, 1024维)
- **前端**: React + Vite + socket.io-client
- **包管理**: npm

## 架构总览

```
用户交互层:  React 前端 (Web 管理面板 + 对话聊天)
                │ REST / WebSocket
API 网关层:  DashboardController  AgentController  AgentGateway(WS)
                │
Agent 核心层:  Orchestrator (任务编排)  ←→  EventBus (事件总线)
                ├── ProductResearchAgent (选品分析)
                ├── OrderManagementAgent (订单处理)
                └── CustomerServiceAgent (客服)
                │
基础设施层:  PostgreSQL+pgvector  Redis  LlmService  EmbeddingService
```

### 核心概念

- **Agent**: 继承 `BaseAgent` 抽象类，实现 `executeTask()`、`handleEvent()`、`getTools()`
- **Tool**: 每个 Agent 的独立工具类，封装具体能力（如 `TrendQueryTool`、`TranslatorTool`）
- **Orchestrator**: 管理 Agent 注册与任务路由（按 `TaskType` 或显式指定目标 Agent）
- **EventBus**: 基于 `@nestjs/event-emitter`，Agent 间松耦合通信（`TASK_ASSIGNED`、`REPORT_GENERATED`、`PRODUCT_CREATED` 等事件）
- **EmbeddingService**: 优先使用本地 TEI 端点 (`EMBEDDING_API_URL`)，否则回退 OpenAI API；支持 `embed()`、`embedBatch()`、`search()`（pgvector 余弦相似度）

### 目录结构要点

```
src/
├── common/interfaces/     # IAgent, AgentTask, AgentEvent, TaskType 等核心类型
├── core/
│   ├── agent-base/        # BaseAgent 抽象类 (所有 Agent 的基类)
│   ├── event-bus/         # EventBusService + EventBusModule (@Global)
│   └── orchestrator/      # OrchestratorService (@Global) — Agent 注册 + 任务路由
├── agents/
│   ├── product-research/  # 选品 Agent (趋势查询/竞品分析/评分/报告生成)
│   ├── order-management/  # 订单 Agent (商品CRUD/订单状态机/库存预警)
│   └── customer-service/  # 客服 Agent (翻译/FAQ检索/情感分析/话术模板)
├── infrastructure/
│   ├── database/          # TypeORM 实体 + pgvector 向量实体
│   ├── embedding/         # EmbeddingService (TEI/OpenAI)
│   ├── llm/               # LlmService (DeepSeek/OpenAI, 支持缓存)
│   ├── cache/             # CacheService (Redis)
│   └── external-apis/     # 平台适配器接口 + Mock 实现
├── api/
│   ├── rest/              # DashboardController, AgentController
│   └── websocket/         # AgentGateway (实时 Agent 事件推送)
└── chat/
    ├── intent-parser/     # 关键词匹配 → TaskType 识别
    └── conversation/      # 对话历史 CRUD
```

### 如何新增一个 Agent

1. 在 `src/agents/<name>/tools/` 下创建工具类（独立注入式 Service）
2. 创建 `<name>.agent.ts` 继承 `BaseAgent`，实现 `executeTask()` 和 `getTools()`
3. 创建 `<name>.module.ts`，导入 `EventBusModule` 和所需基础设施模块
4. 在 `AppModule` 中导入新模块
5. 在 `main.ts` 中注入并注册 Agent: `orchestrator.registerAgent(agent, TaskType.XXX)`

### APP Controller / Service

`app.controller.ts` 和 `app.service.ts` 是 NestJS 脚手架残留文件，未被任何业务模块使用，可安全删除。

## Superpowers 技能系统

本项目使用 Superpowers 技能系统进行开发。在任何开发任务开始前，必须先调用 `using-superpowers` skill。如果认为某个 skill 可能适用（即使只有 1% 的可能性），必须调用它。

Skills 位于 `.claude/skills/` 目录，包含：`brainstorming`、`writing-plans`、`executing-plans`、`subagent-driven-development`、`test-driven-development`、`systematic-debugging`、`requesting-code-review`、`receiving-code-review`、`verification-before-completion`、`finishing-a-development-branch`、`using-git-worktrees`。

## 环境配置

配置通过 `.env` 文件管理（由 `.env.example` 模板创建）：

| 变量 | 用途 |
|------|------|
| `DB_HOST/PORT/USER/PASSWORD/NAME` | PostgreSQL 连接 |
| `REDIS_HOST/PORT` | Redis 连接 |
| `LLM_API_KEY/MODEL` | LLM 配置 (DeepSeek API) |
| `EMBEDDING_API_URL` | 设为 `http://localhost:8888` 使用本地 BGE-M3；留空则用 OpenAI |
| `EMBEDDING_MODEL` | `bge-m3` (本地) 或 `text-embedding-3-small` (OpenAI) |
| `EMBEDDING_DIMENSION` | 1024 (BGE-M3) 或 1536 (OpenAI) |
