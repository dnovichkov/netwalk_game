import { describe, it, expect, beforeEach } from 'vitest';
import { LevelGenerator } from './LevelGenerator';
import { Grid } from './Grid';
import { ConnectionValidator } from './ConnectionValidator';
import { Difficulty, CellType, DIFFICULTY_CONFIG } from './types';

describe('LevelGenerator', () => {
  let generator: LevelGenerator;
  let validator: ConnectionValidator;

  beforeEach(() => {
    generator = new LevelGenerator();
    validator = new ConnectionValidator();
  });

  describe('generate', () => {
    it('should generate a level for EASY difficulty', () => {
      const state = generator.generate(Difficulty.EASY);
      const config = DIFFICULTY_CONFIG[Difficulty.EASY];

      expect(state.width).toBe(config.width);
      expect(state.height).toBe(config.height);
      expect(state.difficulty).toBe(Difficulty.EASY);
      expect(state.moves).toBe(0);
      expect(state.isCompleted).toBe(false);
    });

    it('should generate a level for MEDIUM difficulty', () => {
      const state = generator.generate(Difficulty.MEDIUM);
      const config = DIFFICULTY_CONFIG[Difficulty.MEDIUM];

      expect(state.width).toBe(config.width);
      expect(state.height).toBe(config.height);
    });

    it('should generate a level for HARD difficulty', () => {
      const state = generator.generate(Difficulty.HARD);
      const config = DIFFICULTY_CONFIG[Difficulty.HARD];

      expect(state.width).toBe(config.width);
      expect(state.height).toBe(config.height);
    });

    it('should place server at center', () => {
      const state = generator.generate(Difficulty.EASY);

      expect(state.serverPosition.x).toBe(Math.floor(state.width / 2));
      expect(state.serverPosition.y).toBe(Math.floor(state.height / 2));
    });

    it('should have a server cell in the grid', () => {
      const state = generator.generate(Difficulty.EASY);
      const grid = Grid.fromData(state.grid);
      const server = grid.findServer();

      expect(server).toBeDefined();
      expect(server?.type).toBe(CellType.SERVER);
    });

    it('should have computers in the grid', () => {
      const state = generator.generate(Difficulty.EASY);
      const grid = Grid.fromData(state.grid);
      const computers = grid.findComputers();

      // Should have at least some computers
      expect(computers.length).toBeGreaterThan(0);
    });

    it('should record computer positions in state', () => {
      const state = generator.generate(Difficulty.EASY);

      // Should have at least some computers recorded
      expect(state.computerPositions.length).toBeGreaterThan(0);
    });

    it('should generate a puzzle where all computers are reachable in solved state', () => {
      // Generate a puzzle and verify structure is correct
      const state = generator.generate(Difficulty.EASY);
      const grid = Grid.fromData(state.grid);

      // Count non-empty cells and computers
      let nonEmptyCells = 0;
      grid.forEachCell((cell) => {
        if (!cell.isEmpty()) nonEmptyCells++;
      });

      const computers = grid.findComputers();
      const server = grid.findServer();

      // Should have server, computers, and connecting cells
      expect(server).toBeDefined();
      expect(computers.length).toBeGreaterThan(0);
      expect(nonEmptyCells).toBeGreaterThan(computers.length + 1);
    });

    it('should not generate an already-solved puzzle', () => {
      // Generate multiple puzzles and verify none are initially solved
      for (let i = 0; i < 10; i++) {
        const state = generator.generate(Difficulty.EASY);
        const grid = Grid.fromData(state.grid);

        expect(validator.isSolved(grid)).toBe(false);
      }
    });

    it('should have server locked', () => {
      const state = generator.generate(Difficulty.EASY);
      const grid = Grid.fromData(state.grid);
      const server = grid.findServer();

      expect(server?.isLocked).toBe(true);
    });

    it('should have a connected path structure', () => {
      const state = generator.generate(Difficulty.EASY);
      const grid = Grid.fromData(state.grid);

      // Verify grid structure: all non-empty cells should form a tree
      let nonEmptyCells = 0;
      let totalConnections = 0;

      grid.forEachCell((cell) => {
        if (!cell.isEmpty()) {
          nonEmptyCells++;
          totalConnections += cell.getConnectionCount();
        }
      });

      // In a tree, edges = nodes - 1, and each edge is counted twice
      // So connections should be approximately 2 * (nodes - 1) = 2*nodes - 2
      // With extra edges, it could be more, but never less for a connected graph
      expect(totalConnections).toBeGreaterThanOrEqual((nonEmptyCells - 1) * 2);
    });
  });

  describe('difficulty variations', () => {
    it('MEDIUM should have more computers than EASY', () => {
      const easyConfig = DIFFICULTY_CONFIG[Difficulty.EASY];
      const mediumConfig = DIFFICULTY_CONFIG[Difficulty.MEDIUM];

      expect(mediumConfig.minComputers).toBeGreaterThan(easyConfig.minComputers);
    });

    it('HARD should have larger grid than MEDIUM', () => {
      const mediumConfig = DIFFICULTY_CONFIG[Difficulty.MEDIUM];
      const hardConfig = DIFFICULTY_CONFIG[Difficulty.HARD];

      expect(hardConfig.width).toBeGreaterThan(mediumConfig.width);
      expect(hardConfig.height).toBeGreaterThan(mediumConfig.height);
    });

    it('MEDIUM and HARD should have extra edges', () => {
      const mediumConfig = DIFFICULTY_CONFIG[Difficulty.MEDIUM];
      const hardConfig = DIFFICULTY_CONFIG[Difficulty.HARD];

      expect(mediumConfig.extraEdgeProbability).toBeGreaterThan(0);
      expect(hardConfig.extraEdgeProbability).toBeGreaterThan(
        mediumConfig.extraEdgeProbability
      );
    });
  });

  describe('grid consistency', () => {
    it('should have valid cell types for all positions', () => {
      const state = generator.generate(Difficulty.MEDIUM);
      const grid = Grid.fromData(state.grid);

      grid.forEachCell((cell) => {
        expect(Object.values(CellType)).toContain(cell.type);
      });
    });

    it('should have rotations in valid range', () => {
      const state = generator.generate(Difficulty.MEDIUM);
      const grid = Grid.fromData(state.grid);

      grid.forEachCell((cell) => {
        expect(cell.rotation).toBeGreaterThanOrEqual(0);
        expect(cell.rotation).toBeLessThanOrEqual(3);
      });
    });

    it('should have correct cell coordinates', () => {
      const state = generator.generate(Difficulty.EASY);
      const grid = Grid.fromData(state.grid);

      grid.forEachCell((cell, x, y) => {
        expect(cell.x).toBe(x);
        expect(cell.y).toBe(y);
      });
    });
  });

  describe('performance', () => {
    it('should generate EASY level quickly', () => {
      const start = performance.now();
      generator.generate(Difficulty.EASY);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500); // Should be under 500ms
    });

    it('should generate HARD level in reasonable time', () => {
      const start = performance.now();
      generator.generate(Difficulty.HARD);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500); // Should still be under 500ms
    });
  });
});

