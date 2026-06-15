import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { OrchestratorService } from '../../core/orchestrator/orchestrator.service';
import { AgentTask, TaskType } from '../../common/interfaces';
import { CreateTaskDto } from './dto/create-task.dto';

@Controller('api/agents')
export class AgentController {
  constructor(private readonly orchestrator: OrchestratorService) {}

  @Post('task')
  async createTask(@Body() dto: CreateTaskDto) {
    const task: AgentTask = {
      id: crypto.randomUUID(),
      type: dto.type as TaskType,
      input: dto.input,
      targetAgentId: dto.targetAgentId,
      createdAt: new Date(),
    };
    const result = await this.orchestrator.routeTask(task);
    return result;
  }

  @Get(':id')
  getAgent(@Param('id') id: string) {
    const agent = this.orchestrator.getAgent(id);
    if (!agent) return { error: 'Agent not found' };
    return {
      id: agent.id,
      name: agent.name,
      status: agent.getStatus(),
      tools: agent.getTools(),
    };
  }
}
