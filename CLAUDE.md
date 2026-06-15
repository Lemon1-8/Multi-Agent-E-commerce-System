# Multi-Agent E-commerce System

## Superpowers

本项目使用 Superpowers 技能系统进行开发。所有开发工作流（头脑风暴、计划、TDD、调试、代码审查）都通过 Superpowers skills 来执行。

### 核心规则

在任何开发任务开始前，必须先调用 `using-superpowers` skill 来确认工作流。如果你认为某个 skill 可能适用（即使只有 1% 的可能性），你必须调用它。

### 可用 Skills

本项目的 skills 位于 `.claude/skills/` 目录下：

| Skill | 用途 |
|---|---|
| `using-superpowers` | 技能系统引导，每次会话必须首先调用 |
| `brainstorming` | 功能设计前进行头脑风暴和方案设计 |
| `writing-plans` | 将设计方案分解为可执行的实施计划 |
| `executing-plans` | 按批次执行实施计划 |
| `test-driven-development` | Red-Green-Refactor TDD 开发 |
| `systematic-debugging` | 4 步根因分析调试 |
| `requesting-code-review` | 5 代理并行代码审查 |
| `receiving-code-review` | 处理代码审查反馈 |
| `subagent-driven-development` | 子代理驱动开发 |
| `dispatching-parallel-agents` | 并行代理调度 |
| `verification-before-completion` | 完成前验证检查 |
| `finishing-a-development-branch` | 完成开发分支 |
| `using-git-worktrees` | 隔离并行开发 |
| `writing-skills` | 编写自定义 skills |

### 技术栈

- **后端**: NestJS (Node.js)
- **语言**: TypeScript
- **数据库**: PostgreSQL
- **架构**: Multi-Agent 系统
