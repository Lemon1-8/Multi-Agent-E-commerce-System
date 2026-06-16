import { Injectable, Logger } from '@nestjs/common';
import { LlmService, LlmMessage, ToolCall } from '../../infrastructure/llm/llm.service';
import { ITool } from '../../common/interfaces/tool.interface';
import { AgentTask, TaskStatus } from '../../common/interfaces';

export interface ReActLoopOptions {
  systemPrompt: string;
  task: AgentTask;
  tools: ITool[];
  onStep: (name: string, status: TaskStatus, detail: string) => void;
  maxIterations?: number;
}

@Injectable()
export class ReActLoopService {
  private readonly logger = new Logger(ReActLoopService.name);

  constructor(private readonly llm: LlmService) {}

  async run(options: ReActLoopOptions): Promise<Record<string, unknown>> {
    const { systemPrompt, task, tools, onStep, maxIterations = 10 } = options;

    const messages: LlmMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(task.input) },
    ];

    const toolDefs = tools.map((t) => t.definition);
    const toolMap = new Map<string, ITool>(tools.map((t) => [t.definition.name, t]));

    for (let i = 0; i < maxIterations; i++) {
      onStep(`reasoning_${i + 1}`, TaskStatus.IN_PROGRESS, `LLM 推理轮次 ${i + 1}/${maxIterations}`);

      const response = await this.llm.completeWithTools(messages, toolDefs);

      // LLM decided to produce final answer (no more tool calls)
      if (response.toolCalls.length === 0) {
        const text = response.content ?? '';
        onStep('final_answer', TaskStatus.COMPLETED, text.slice(0, 200));
        return this.parseFinalOutput(text);
      }

      // Process tool calls
      // First add assistant message with tool_calls
      const assistantMsg: LlmMessage = {
        role: 'assistant',
        content: response.content,
        tool_calls: response.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
        })),
      };
      messages.push(assistantMsg);

      for (const toolCall of response.toolCalls) {
        const tool = toolMap.get(toolCall.name);

        if (!tool) {
          const errMsg = `工具 "${toolCall.name}" 未找到`;
          onStep(toolCall.name, TaskStatus.FAILED, errMsg);
          messages.push({
            role: 'tool',
            content: `Error: ${errMsg}`,
            tool_call_id: toolCall.id,
          });
          continue;
        }

        try {
          onStep(
            toolCall.name,
            TaskStatus.IN_PROGRESS,
            `执行 ${toolCall.name}(${JSON.stringify(toolCall.arguments).slice(0, 100)})`,
          );
          const result = await tool.execute(toolCall.arguments);
          const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);
          onStep(toolCall.name, TaskStatus.COMPLETED, resultStr.slice(0, 200));

          messages.push({
            role: 'tool',
            content: resultStr,
            tool_call_id: toolCall.id,
          });
        } catch (error) {
          const errMsg = `工具 ${toolCall.name} 执行失败: ${(error as Error).message}`;
          onStep(toolCall.name, TaskStatus.FAILED, errMsg);
          messages.push({
            role: 'tool',
            content: `Error: ${errMsg}`,
            tool_call_id: toolCall.id,
          });
        }
      }
    }

    throw new Error(`ReAct 循环超出最大迭代次数 (${maxIterations})`);
  }

  private parseFinalOutput(text: string): Record<string, unknown> {
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { result: text };
    }
  }
}
