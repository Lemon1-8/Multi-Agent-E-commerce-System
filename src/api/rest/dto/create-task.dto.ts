import { IsString, IsObject, IsOptional } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  type: string;

  @IsObject()
  input: Record<string, unknown>;

  @IsString()
  @IsOptional()
  targetAgentId?: string;
}
