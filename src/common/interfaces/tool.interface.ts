import { ToolDefinition } from './task.interface';

export interface ITool {
  readonly definition: ToolDefinition;
  execute(params: Record<string, unknown>): Promise<unknown>;
}
