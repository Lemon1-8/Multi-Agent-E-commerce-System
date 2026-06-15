import { Injectable, Logger } from '@nestjs/common';

export interface ScoringInput {
  searchVolume: number;
  competition: number;
  avgPrice: number;
  margin: number;
  growthRate: number;
}

@Injectable()
export class ScoringTool {
  private readonly logger = new Logger(ScoringTool.name);

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
