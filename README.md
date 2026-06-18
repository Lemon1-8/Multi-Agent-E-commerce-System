# Multi-Agent E-commerce System

多 AI Agent 协作的跨境电商系统，面向中国出海电商场景。采用 LLM 驱动的 ReAct 推理模式，三个 Agent 各自携带专用工具，由大模型自主决策工具调用顺序。

## 技术栈

NestJS 11 + TypeScript 5 · PostgreSQL 16 + pgvector (向量检索) · Redis 7 · DeepSeek v4 Flash (LLM) · 本地 BGE-M3 via TEI (Embedding, 1024 维) · React + Vite + socket.io-client

## 快速开始

```bash
cp .env.example .env                    # 编辑 .env 填入实际配置
docker compose up -d                    # 启动 PostgreSQL + Redis
docker start embedding_rerank_models-tei-embedding-1  # 启动 TEI 向量服务
npm install
npm run seed                            # 灌入 540+ 行种子数据
npm run start:dev                       # 启动后端 (NestJS watch 模式)

# 前端 (另开终端)
cd frontend && npm install && npm run dev  # Vite 开发服务器 (端口 5173)
```

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

### 关键组件

| 组件 | 职责 |
|------|------|
| `BaseAgent` | 模板方法：状态机 + `executeTask()` 调用 ReAct 循环。子类只需声明 `systemPrompt` + `tools[]` |
| `ReActLoopService` | LLM 推理循环：发消息 → LLM 选工具 → 执行 → 观察结果 → 循环直到输出最终答案（最大 10 轮） |
| `Orchestrator` | Agent 注册 + 任务路由（按 `TaskType` 或显式指定目标 Agent） |
| `EventBusService` | Agent 间松耦合事件通信，`emit()` / `on()` / `broadcast()` |
| `LlmService` | `complete()` (纯文本) + `completeWithTools()` (function calling) |
| `EmbeddingService` | `embed()` (→1024 维向量) + `search()` (pgvector 余弦相似度) |
| `ITool` | 所有工具的标准化接口：`{ definition; execute(params) }` |

### Agent 清单

三个 Agent 不写死业务逻辑，只声明身份和工具清单，由 LLM 自主决定工具调用顺序：

| Agent | 工具 |
|-------|------|
| **ProductResearchAgent** | `trendQuery`, `competitorAnalysis`, `scoring`, `reportGenerator` |
| **OrderManagementAgent** | `productCrud`, `orderWorkflow`, `inventoryAlert`, `anomalyDetection` |
| **CustomerServiceAgent** | `translator`, `faqSearch`, `sentimentAnalysis`, `templateManager` |

## 环境配置

| 变量 | 用途 |
|------|------|
| `DB_HOST/PORT/USER/PASSWORD/NAME` | PostgreSQL 连接 |
| `REDIS_HOST/PORT` | Redis 连接 |
| `LLM_API_KEY` | API Key |
| `LLM_API_URL` | API 端点 (如 `https://api.deepseek.com`) |
| `LLM_MODEL` | 模型名 (如 `deepseek-v4-flash`) |
| `EMBEDDING_API_URL` | TEI 端点 (`http://localhost:8888`)，留空则用 OpenAI |
| `EMBEDDING_MODEL` | `bge-m3` (1024 维) 或 `text-embedding-3-small` (1536 维) |
| `EMBEDDING_DIMENSION` | 向量维度 (1024 或 1536) |

## 开发命令

```bash
npm run start:dev                # NestJS 开发模式 (watch)
npm run start:prod               # 生产模式
npm run lint                     # ESLint

# 测试
npm test                         # 全部测试
npx jest <path-to-file>          # 单个文件
npx jest --testPathPattern=<name>  # 按名称过滤
```

## 新增 Agent

1. 在 `src/agents/<name>/tools/` 下创建工具类，实现 `ITool` 接口（含 `definition` + `execute()`）
2. 创建 `<name>.agent.ts` 继承 `BaseAgent`，声明 `systemPrompt` + 构造注入工具并赋给 `this.tools`
3. 创建 `<name>.module.ts`，providers 包含 `ReActLoopService` 和所有工具
4. 在 `AppModule` 中导入新模块
5. 在 `main.ts` 中注册：`orchestrator.registerAgent(agent, TaskType.XXX)`
