import { Injectable, Logger } from '@nestjs/common';
import { ITool, ToolDefinition } from '../../../common/interfaces';

export interface ScoringInput {
  searchVolume: number;
  competition: number;
  avgPrice: number;
  margin: number;
  growthRate: number;
}

@Injectable()
export class ScoringTool implements ITool {
  private readonly logger = new Logger(ScoringTool.name);

  readonly definition: ToolDefinition = {
    name: 'scoring',
    description: '对选品进行多维度评分，输出综合得分和等级',
    parameters: [
      { name: 'searchVolume', type: 'number', description: '搜索量', required: true },
      { name: 'competition', type: 'number', description: '竞争度 (0-100)', required: true },
      { name: 'avgPrice', type: 'number', description: '平均价格', required: true },
      { name: 'margin', type: 'number', description: '利润率 (0-100)', required: true },
      { name: 'growthRate', type: 'number', description: '市场增长率', required: true },
    ],
  };

  async execute(params: Record<string, unknown>): Promise<unknown> {
    const input: ScoringInput = {
      searchVolume: params.searchVolume as number,
      competition: params.competition as number,
      avgPrice: params.avgPrice as number,
      margin: params.margin as number,
      growthRate: params.growthRate as number,
    };
    return this.calculate(input);
  }

  calculate(input: ScoringInput): { score: number; grade: string; breakdown: Record<string, number> } {
    const searchScore = Math.min(input.searchVolume / 1000, 100) * 0.25;
    const competitionScore = (100 - input.competition) * 0.25;
    const priceScore = Math.min(input.avgPrice / 100, 100) * 0.20;
    const marginScore = input.margin * 0.20;
    const growthScore = Math.max(0, input.growthRate + 50) * 0.10;

    const score = searchScore + competitionScore + priceScore + marginScore + growthScore;
    const grade = score >= 80 ? 'A (强烈推荐)' : score >= 60 ? 'B (推荐)' : score >= 40 ? 'C (谨慎)' : 'D (不推荐)';
    this.logger.log(`选品评分: ${score.toFixed(1)} → ${grade}`);
    return { score: Math.round(score * 10) / 10, grade, breakdown: { searchScore, competitionScore, priceScore, marginScore, growthScore } };
  }
}
