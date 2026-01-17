import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreCalculator } from './ScoreCalculator';
import { Difficulty, DIFFICULTY_CONFIG } from './types';

describe('ScoreCalculator', () => {
  let calculator: ScoreCalculator;

  beforeEach(() => {
    calculator = new ScoreCalculator();
  });

  describe('calculate', () => {
    it('should calculate base score correctly', () => {
      const config = DIFFICULTY_CONFIG[Difficulty.EASY];
      const result = calculator.calculate(Difficulty.EASY, config.idealTime, config.idealMoves);

      // Base score = 5 * 5 * 100 = 2500
      expect(result.baseScore).toBe(2500);
    });

    it('should give 2x time multiplier for very fast completion', () => {
      const config = DIFFICULTY_CONFIG[Difficulty.EASY];
      // Complete faster than ideal time
      const result = calculator.calculate(Difficulty.EASY, config.idealTime - 10, config.idealMoves);

      expect(result.timeMultiplier).toBe(2.0);
    });

    it('should give 1.5x time multiplier for fast completion', () => {
      const config = DIFFICULTY_CONFIG[Difficulty.EASY];
      // Complete between ideal and 2x ideal
      const result = calculator.calculate(
        Difficulty.EASY,
        config.idealTime + 30, // Between 60 and 120 seconds
        config.idealMoves
      );

      expect(result.timeMultiplier).toBe(1.5);
    });

    it('should give 1.0x time multiplier for moderate completion', () => {
      const config = DIFFICULTY_CONFIG[Difficulty.EASY];
      // Complete between 2x and 3x ideal
      const result = calculator.calculate(
        Difficulty.EASY,
        config.idealTime * 2 + 30, // Between 120 and 180 seconds
        config.idealMoves
      );

      expect(result.timeMultiplier).toBe(1.0);
    });

    it('should give 0.5x time multiplier for slow completion', () => {
      const config = DIFFICULTY_CONFIG[Difficulty.EASY];
      // Complete slower than 3x ideal
      const result = calculator.calculate(
        Difficulty.EASY,
        config.idealTime * 3 + 10,
        config.idealMoves
      );

      expect(result.timeMultiplier).toBe(0.5);
    });

    it('should give 2x moves multiplier for very few moves', () => {
      const config = DIFFICULTY_CONFIG[Difficulty.EASY];
      const result = calculator.calculate(Difficulty.EASY, config.idealTime, config.idealMoves - 5);

      expect(result.movesMultiplier).toBe(2.0);
    });

    it('should give 1.5x moves multiplier for few moves', () => {
      const config = DIFFICULTY_CONFIG[Difficulty.EASY];
      // Between ideal and 1.5x ideal (25-37 moves)
      const result = calculator.calculate(
        Difficulty.EASY,
        config.idealTime,
        Math.floor(config.idealMoves * 1.25)
      );

      expect(result.movesMultiplier).toBe(1.5);
    });

    it('should give 1.0x moves multiplier for moderate moves', () => {
      const config = DIFFICULTY_CONFIG[Difficulty.EASY];
      // Between 1.5x and 2x ideal (38-49 moves)
      const result = calculator.calculate(
        Difficulty.EASY,
        config.idealTime,
        Math.floor(config.idealMoves * 1.75)
      );

      expect(result.movesMultiplier).toBe(1.0);
    });

    it('should give 0.5x moves multiplier for many moves', () => {
      const config = DIFFICULTY_CONFIG[Difficulty.EASY];
      // More than 2x ideal (50+ moves)
      const result = calculator.calculate(
        Difficulty.EASY,
        config.idealTime,
        config.idealMoves * 2 + 10
      );

      expect(result.movesMultiplier).toBe(0.5);
    });

    it('should calculate final score with all multipliers', () => {
      const config = DIFFICULTY_CONFIG[Difficulty.EASY];
      // Perfect performance
      const result = calculator.calculate(
        Difficulty.EASY,
        config.idealTime - 10, // 2x time
        config.idealMoves - 5 // 2x moves
      );

      // Base 2500 * 2 * 2 = 10000
      expect(result.score).toBe(10000);
    });

    it('should calculate minimum score', () => {
      const config = DIFFICULTY_CONFIG[Difficulty.EASY];
      // Poor performance
      const result = calculator.calculate(
        Difficulty.EASY,
        config.idealTime * 4, // 0.5x time
        config.idealMoves * 3 // 0.5x moves
      );

      // Base 2500 * 0.5 * 0.5 = 625
      expect(result.score).toBe(625);
    });

    it('should detect new record', () => {
      const result = calculator.calculate(Difficulty.EASY, 30, 20, 5000);

      expect(result.isNewRecord).toBe(true);
    });

    it('should not detect new record when score is lower', () => {
      const config = DIFFICULTY_CONFIG[Difficulty.EASY];
      const result = calculator.calculate(
        Difficulty.EASY,
        config.idealTime * 4,
        config.idealMoves * 3,
        10000
      );

      expect(result.isNewRecord).toBe(false);
    });

    it('should handle no previous high score', () => {
      const result = calculator.calculate(Difficulty.EASY, 30, 20);

      expect(result.isNewRecord).toBe(false);
    });
  });

  describe('getMaxScore', () => {
    it('should return maximum possible score for EASY', () => {
      const maxScore = calculator.getMaxScore(Difficulty.EASY);
      // 5 * 5 * 100 * 2 * 2 = 10000
      expect(maxScore).toBe(10000);
    });

    it('should return maximum possible score for MEDIUM', () => {
      const maxScore = calculator.getMaxScore(Difficulty.MEDIUM);
      // 7 * 7 * 100 * 2 * 2 = 19600
      expect(maxScore).toBe(19600);
    });

    it('should return maximum possible score for HARD', () => {
      const maxScore = calculator.getMaxScore(Difficulty.HARD);
      // 9 * 9 * 100 * 2 * 2 = 32400
      expect(maxScore).toBe(32400);
    });
  });

  describe('getRating', () => {
    it('should return 3 stars for perfect performance', () => {
      expect(calculator.getRating(2.0, 2.0)).toBe(3);
    });

    it('should return 2 stars for good performance', () => {
      expect(calculator.getRating(1.5, 1.5)).toBe(2);
      expect(calculator.getRating(2.0, 1.5)).toBe(2);
    });

    it('should return 1 star for moderate performance', () => {
      expect(calculator.getRating(1.0, 1.0)).toBe(1);
      expect(calculator.getRating(1.5, 1.0)).toBe(1);
    });

    it('should return 0 stars for poor performance', () => {
      expect(calculator.getRating(0.5, 0.5)).toBe(0);
      expect(calculator.getRating(1.0, 0.5)).toBe(0);
    });
  });

  describe('formatTime', () => {
    it('should format seconds correctly', () => {
      expect(calculator.formatTime(65)).toBe('01:05');
      expect(calculator.formatTime(0)).toBe('00:00');
      expect(calculator.formatTime(3661)).toBe('61:01');
    });

    it('should pad minutes and seconds', () => {
      expect(calculator.formatTime(5)).toBe('00:05');
      expect(calculator.formatTime(65)).toBe('01:05');
    });
  });

  describe('formatScore', () => {
    it('should format scores with thousands separator', () => {
      expect(calculator.formatScore(1000)).toMatch(/1[,\s]000/);
      expect(calculator.formatScore(10000)).toMatch(/10[,\s]000/);
    });

    it('should handle small numbers', () => {
      expect(calculator.formatScore(100)).toBe('100');
    });
  });

  describe('difficulty scaling', () => {
    it('should have higher base scores for harder difficulties', () => {
      const easyResult = calculator.calculate(Difficulty.EASY, 60, 25);
      const mediumResult = calculator.calculate(Difficulty.MEDIUM, 60, 25);
      const hardResult = calculator.calculate(Difficulty.HARD, 60, 25);

      expect(easyResult.baseScore).toBeLessThan(mediumResult.baseScore);
      expect(mediumResult.baseScore).toBeLessThan(hardResult.baseScore);
    });
  });
});
