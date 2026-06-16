# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 开发命令

```bash
# 基础设施
docker compose up -d && docker start embedding_rerank_models-tei-embedding-1  # 启动全部服务

# 后端
npm run start:dev                                                 # NestJS 开发模式 (watch)
npm run start:prod                                                # 生产模式
npm run lint                                                      # ESLint

# 测试
npm test                                                          # 全部测试
npx jest <path-to-file>                                           # 单个文件
npx jest --testPathPattern=<name>                                 # 按名称过滤

# 前端 (另开终端)
cd frontend && npm run dev                                        # Vite (5173)

# 数据播种
npm run seed                                                      # 灌入 540+ 行种子数据 (需先启动 Docker)
```

## 技术栈

NestJS 11 + TypeScript 5 · PostgreSQL 16 + pgvector (向量检索) · Redis 7 · DeepSeek v4 Flash (LLM) · 本地 BGE-M3 via TEI (Embedding, 1024维) · React + Vite + socket.io-client · npm

## 核心架构

```
用户输入 (聊天 / REST) → IntentParser → Orchestrator → Agent.handleTask()
                                                           │
                                          BaseAgent (模板方法: 状态机 + 错误兜底)
                                              │
                                          ReActLoopService.run()
                                              │
                                          LLM (completeWithTools) 选工具
                                              │
                                          工具执行 → 观察结果 → 再推理 → 输出
```

### 关键类与职责

| 类 | 文件 | 职责 |
|-----|------|------|
| `BaseAgent` | `core/agent-base/base-agent.ts` | 模板方法：状态机 + `executeTask()` 调用 ReAct 循环。子类只需声明 `systemPrompt` + `tools[]` |
| `ReActLoopService` | `core/agent-base/react-loop.service.ts` | LLM 推理循环：发消息 → LLM 选工具 → 执行 → 观察结果 → 循环直到输出最终答案（最大10轮） |
| `Orchestrator` | `core/orchestrator/orchestrator.service.ts` | Agent 注册 + 任务路由（按 `TaskType` 或显式指定目标 Agent） |
| `EventBusService` | `core/event-bus/event-bus.service.ts` | Agent 间松耦合事件通信 (@Global)，`emit()` / `on()` / `broadcast()` |
| `LlmService` | `infrastructure/llm/llm.service.ts` | `complete()` (纯文本) + `completeWithTools()` (function calling)，通过 `LLM_API_URL` 配置端点 |
| `EmbeddingService` | `infrastructure/embedding/embedding.service.ts` | `embed()`(→1024维向量) + `search()`(pgvector 余弦相似度) |
| `ITool` | `common/interfaces/tool.interface.ts` | `{ definition: ToolDefinition; execute(params): Promise<unknown> }` — 所有工具的标准化接口 |

### Agent 模式

三个 Agent 不再包含硬编码业务逻辑，只声明身份和工具清单，由 LLM 自主决定工具调用顺序：

```
ProductResearchAgent: systemPrompt + [trendQuery, competitorAnalysis, scoring, reportGenerator]
OrderManagementAgent: systemPrompt + [productCrud, orderWorkflow, inventoryAlert, anomalyDetection]
CustomerServiceAgent: systemPrompt + [translator, faqSearch, sentimentAnalysis, templateManager]
```

### 如何新增 Agent

1. 在 `src/agents/<name>/tools/` 下创建工具类，实现 `ITool` 接口（含 `definition` + `execute()`）
2. 创建 `<name>.agent.ts` 继承 `BaseAgent`，声明 `systemPrompt` + 构造注入工具并赋给 `this.tools`
3. 创建 `<name>.module.ts`，providers 包含 `ReActLoopService` 和所有工具
4. 在 `AppModule` 中导入新模块
5. 在 `main.ts` 中注册：`orchestrator.registerAgent(agent, TaskType.XXX)`

## 环境配置

| 变量 | 用途 |
|------|------|
| `DB_HOST/PORT/USER/PASSWORD/NAME` | PostgreSQL 连接 |
| `REDIS_HOST/PORT` | Redis 连接 |
| `LLM_API_KEY` | API Key |
| `LLM_API_URL` | API 端点 (如 `https://api.deepseek.com`) |
| `LLM_MODEL` | 模型名 (如 `deepseek-v4-flash`) |
| `EMBEDDING_API_URL` | TEI 端点 (`http://localhost:8888`)，留空则用 OpenAI |
| `EMBEDDING_MODEL` | `bge-m3` (1024维) 或 `text-embedding-3-small` (1536维) |
| `EMBEDDING_DIMENSION` | 向量维度 (1024 或 1536) |
