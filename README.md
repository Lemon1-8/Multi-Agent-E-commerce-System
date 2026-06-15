# Multi-Agent E-commerce System

多 AI Agent 协作的跨境电商系统，面向中国出海电商场景。

## 技术栈

- **后端**: NestJS + TypeScript
- **数据库**: PostgreSQL (pgvector)
- **缓存**: Redis
- **前端**: React

## 快速开始

```bash
cp .env.example .env
# 编辑 .env 填入实际配置
npm install
npm run start:dev
```

## 架构

事件驱动 Agent 总线架构，含选品分析、订单处理、客服三个 Agent。
