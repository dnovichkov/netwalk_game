import { Difficulty, DIFFICULTY_CONFIG } from './types';

/**
 * Score result with breakdown
 */
export interface ScoreResult {
  score: number;
  baseScore: number;
  timeMultiplier: number;
  movesMultiplier: number;
  timeSeconds: number;
  moves: number;
  isNewRecord: boolean;
}

/**
 * ScoreCalculator computes the final score based on game performance.
 *
 * Formula from requirements:
 * score = base_score × time_multiplier × moves_multiplier
 *
 * base_score = grid_width × grid_height × 100
 *
 * time_multiplier:
 *   - < ideal_time: 2.0
 *   - < ideal_time × 2: 1.5
 *   - < ideal_time × 3: 1.0
 *   - otherwise: 0.5
 *
 * moves_multiplier:
 *   - < ideal_moves: 2.0
 *   - < ideal_moves × 1.5: 1.5
 *   - < ideal_moves × 2: 1.0
 *   - otherwise: 0.5
 */
export class ScoreCalculator {
  /**
   * Calculate the final score
   */
  calculate(
    difficulty: Difficulty,
    timeSeconds: number,
    moves: number,
    currentHighScore?: number
  ): ScoreResult {
    const config = DIFFICULTY_CONFIG[difficulty];
    const { width, height, idealTime, idealMoves } = config;

    const baseScore = width * height * 100;
    const timeMultiplier = this.getTimeMultiplier(timeSeconds, idealTime);
    const movesMultiplier = this.getMovesMultiplier(moves, idealMoves);

    const score = Math.round(baseScore * timeMultiplier * movesMultiplier);

    return {
      score,
      baseScore,
      timeMultiplier,
      movesMultiplier,
      timeSeconds,
      moves,
      isNewRecord: currentHighScore !== undefined && score > currentHighScore,
    };
  }

  /**
   * Get time multiplier based on how fast the puzzle was solved
   */
  private getTimeMultiplier(timeSeconds: number, idealTime: number): number {
    if (timeSeconds < idealTime) {
      return 2.0;
    } else if (timeSeconds < idealTime * 2) {
      return 1.5;
    } else if (timeSeconds < idealTime * 3) {
      return 1.0;
    } else {
      return 0.5;
    }
  }

  /**
   * Get moves multiplier based on how few moves were used
   */
  private getMovesMultiplier(moves: number, idealMoves: number): number {
    if (moves < idealMoves) {
      return 2.0;
    } else if (moves < idealMoves * 1.5) {
      return 1.5;
    } else if (moves < idealMoves * 2) {
      return 1.0;
    } else {
      return 0.5;
    }
  }

  /**
   * Get the maximum possible score for a difficulty
   */
  getMaxScore(difficulty: Difficulty): number {
    const config = DIFFICULTY_CONFIG[difficulty];
    const baseScore = config.width * config.height * 100;
    return baseScore * 2.0 * 2.0; // Perfect time and moves
  }

  /**
   * Get a performance rating (stars) based on multipliers
   */
  getRating(timeMultiplier: number, movesMultiplier: number): number {
    const avgMultiplier = (timeMultiplier + movesMultiplier) / 2;

    if (avgMultiplier >= 2.0) return 3; // Perfect - 3 stars
    if (avgMultiplier >= 1.5) return 2; // Good - 2 stars
    if (avgMultiplier >= 1.0) return 1; // OK - 1 star
    return 0; // Poor - no stars
  }

  /**
   * Format time in mm:ss format
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format score with thousands separator
   */
  formatScore(score: number): string {
    return score.toLocaleString();
  }
}

// Export singleton for convenience
export const scoreCalculator = new ScoreCalculator();
