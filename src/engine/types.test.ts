import { describe, it, expect } from 'vitest';
import {
  Direction,
  CellType,
  getOppositeDirection,
  getDirectionDelta,
  rotateDirection,
  getOpenDirections,
  positionKey,
  parsePositionKey,
  DIFFICULTY_CONFIG,
  Difficulty,
} from './types';

describe('Direction utilities', () => {
  describe('getOppositeDirection', () => {
    it('should return SOUTH for NORTH', () => {
      expect(getOppositeDirection(Direction.NORTH)).toBe(Direction.SOUTH);
    });

    it('should return NORTH for SOUTH', () => {
      expect(getOppositeDirection(Direction.SOUTH)).toBe(Direction.NORTH);
    });

    it('should return WEST for EAST', () => {
      expect(getOppositeDirection(Direction.EAST)).toBe(Direction.WEST);
    });

    it('should return EAST for WEST', () => {
      expect(getOppositeDirection(Direction.WEST)).toBe(Direction.EAST);
    });
  });

  describe('getDirectionDelta', () => {
    it('should return correct delta for NORTH', () => {
      expect(getDirectionDelta(Direction.NORTH)).toEqual({ x: 0, y: -1 });
    });

    it('should return correct delta for EAST', () => {
      expect(getDirectionDelta(Direction.EAST)).toEqual({ x: 1, y: 0 });
    });

    it('should return correct delta for SOUTH', () => {
      expect(getDirectionDelta(Direction.SOUTH)).toEqual({ x: 0, y: 1 });
    });

    it('should return correct delta for WEST', () => {
      expect(getDirectionDelta(Direction.WEST)).toEqual({ x: -1, y: 0 });
    });
  });

  describe('rotateDirection', () => {
    it('should not change direction with rotation 0', () => {
      expect(rotateDirection(Direction.NORTH, 0)).toBe(Direction.NORTH);
    });

    it('should rotate NORTH to EAST with rotation 1', () => {
      expect(rotateDirection(Direction.NORTH, 1)).toBe(Direction.EAST);
    });

    it('should rotate NORTH to SOUTH with rotation 2', () => {
      expect(rotateDirection(Direction.NORTH, 2)).toBe(Direction.SOUTH);
    });

    it('should rotate NORTH to WEST with rotation 3', () => {
      expect(rotateDirection(Direction.NORTH, 3)).toBe(Direction.WEST);
    });

    it('should wrap around correctly', () => {
      expect(rotateDirection(Direction.WEST, 1)).toBe(Direction.NORTH);
      expect(rotateDirection(Direction.WEST, 2)).toBe(Direction.EAST);
    });
  });
});

describe('getOpenDirections', () => {
  describe('EMPTY cell', () => {
    it('should have no open directions', () => {
      expect(getOpenDirections(CellType.EMPTY, 0)).toEqual([]);
      expect(getOpenDirections(CellType.EMPTY, 2)).toEqual([]);
    });
  });

  describe('STRAIGHT cell', () => {
    it('should connect NORTH-SOUTH at rotation 0', () => {
      const dirs = getOpenDirections(CellType.STRAIGHT, 0);
      expect(dirs).toContain(Direction.NORTH);
      expect(dirs).toContain(Direction.SOUTH);
      expect(dirs).toHaveLength(2);
    });

    it('should connect EAST-WEST at rotation 1', () => {
      const dirs = getOpenDirections(CellType.STRAIGHT, 1);
      expect(dirs).toContain(Direction.EAST);
      expect(dirs).toContain(Direction.WEST);
      expect(dirs).toHaveLength(2);
    });
  });

  describe('CORNER cell', () => {
    it('should connect NORTH-EAST at rotation 0', () => {
      const dirs = getOpenDirections(CellType.CORNER, 0);
      expect(dirs).toContain(Direction.NORTH);
      expect(dirs).toContain(Direction.EAST);
      expect(dirs).toHaveLength(2);
    });

    it('should connect EAST-SOUTH at rotation 1', () => {
      const dirs = getOpenDirections(CellType.CORNER, 1);
      expect(dirs).toContain(Direction.EAST);
      expect(dirs).toContain(Direction.SOUTH);
      expect(dirs).toHaveLength(2);
    });

    it('should connect SOUTH-WEST at rotation 2', () => {
      const dirs = getOpenDirections(CellType.CORNER, 2);
      expect(dirs).toContain(Direction.SOUTH);
      expect(dirs).toContain(Direction.WEST);
      expect(dirs).toHaveLength(2);
    });

    it('should connect WEST-NORTH at rotation 3', () => {
      const dirs = getOpenDirections(CellType.CORNER, 3);
      expect(dirs).toContain(Direction.WEST);
      expect(dirs).toContain(Direction.NORTH);
      expect(dirs).toHaveLength(2);
    });
  });

  describe('T_JUNCTION cell', () => {
    it('should connect NORTH-EAST-WEST at rotation 0', () => {
      const dirs = getOpenDirections(CellType.T_JUNCTION, 0);
      expect(dirs).toContain(Direction.NORTH);
      expect(dirs).toContain(Direction.EAST);
      expect(dirs).toContain(Direction.WEST);
      expect(dirs).toHaveLength(3);
    });

    it('should connect EAST-SOUTH-NORTH at rotation 1', () => {
      const dirs = getOpenDirections(CellType.T_JUNCTION, 1);
      expect(dirs).toContain(Direction.EAST);
      expect(dirs).toContain(Direction.SOUTH);
      expect(dirs).toContain(Direction.NORTH);
      expect(dirs).toHaveLength(3);
    });
  });

  describe('CROSS cell', () => {
    it('should connect all directions at any rotation', () => {
      for (let rotation = 0; rotation < 4; rotation++) {
        const dirs = getOpenDirections(CellType.CROSS, rotation);
        expect(dirs).toContain(Direction.NORTH);
        expect(dirs).toContain(Direction.EAST);
        expect(dirs).toContain(Direction.SOUTH);
        expect(dirs).toContain(Direction.WEST);
        expect(dirs).toHaveLength(4);
      }
    });
  });

  describe('COMPUTER cell', () => {
    it('should have only one connection at rotation 0', () => {
      const dirs = getOpenDirections(CellType.COMPUTER, 0);
      expect(dirs).toContain(Direction.NORTH);
      expect(dirs).toHaveLength(1);
    });

    it('should rotate its connection', () => {
      expect(getOpenDirections(CellType.COMPUTER, 1)).toContain(Direction.EAST);
      expect(getOpenDirections(CellType.COMPUTER, 2)).toContain(Direction.SOUTH);
      expect(getOpenDirections(CellType.COMPUTER, 3)).toContain(Direction.WEST);
    });
  });

  describe('SERVER cell', () => {
    it('should connect all directions at any rotation', () => {
      for (let rotation = 0; rotation < 4; rotation++) {
        const dirs = getOpenDirections(CellType.SERVER, rotation);
        expect(dirs).toHaveLength(4);
      }
    });
  });
});

describe('Position utilities', () => {
  describe('positionKey', () => {
    it('should create a string key from position', () => {
      expect(positionKey({ x: 0, y: 0 })).toBe('0,0');
      expect(positionKey({ x: 5, y: 3 })).toBe('5,3');
      expect(positionKey({ x: -1, y: 10 })).toBe('-1,10');
    });
  });

  describe('parsePositionKey', () => {
    it('should parse a string key back to position', () => {
      expect(parsePositionKey('0,0')).toEqual({ x: 0, y: 0 });
      expect(parsePositionKey('5,3')).toEqual({ x: 5, y: 3 });
      expect(parsePositionKey('-1,10')).toEqual({ x: -1, y: 10 });
    });
  });

  it('should round-trip correctly', () => {
    const pos = { x: 7, y: 12 };
    expect(parsePositionKey(positionKey(pos))).toEqual(pos);
  });
});

describe('DIFFICULTY_CONFIG', () => {
  it('should have config for all difficulty levels', () => {
    expect(DIFFICULTY_CONFIG[Difficulty.EASY]).toBeDefined();
    expect(DIFFICULTY_CONFIG[Difficulty.MEDIUM]).toBeDefined();
    expect(DIFFICULTY_CONFIG[Difficulty.HARD]).toBeDefined();
  });

  it('should have increasing grid sizes', () => {
    const easy = DIFFICULTY_CONFIG[Difficulty.EASY];
    const medium = DIFFICULTY_CONFIG[Difficulty.MEDIUM];
    const hard = DIFFICULTY_CONFIG[Difficulty.HARD];

    expect(easy.width).toBeLessThan(medium.width);
    expect(medium.width).toBeLessThan(hard.width);
    expect(easy.height).toBeLessThan(medium.height);
    expect(medium.height).toBeLessThan(hard.height);
  });

  it('should have correct EASY config', () => {
    const easy = DIFFICULTY_CONFIG[Difficulty.EASY];
    expect(easy.width).toBe(5);
    expect(easy.height).toBe(5);
    expect(easy.minComputers).toBe(4);
    expect(easy.maxComputers).toBe(6);
    expect(easy.extraEdgeProbability).toBe(0);
  });

  it('should have correct MEDIUM config', () => {
    const medium = DIFFICULTY_CONFIG[Difficulty.MEDIUM];
    expect(medium.width).toBe(7);
    expect(medium.height).toBe(7);
    expect(medium.minComputers).toBe(8);
    expect(medium.maxComputers).toBe(12);
    expect(medium.extraEdgeProbability).toBeGreaterThan(0);
  });

  it('should have correct HARD config', () => {
    const hard = DIFFICULTY_CONFIG[Difficulty.HARD];
    expect(hard.width).toBe(9);
    expect(hard.height).toBe(9);
    expect(hard.minComputers).toBe(12);
    expect(hard.maxComputers).toBe(18);
    expect(hard.extraEdgeProbability).toBeGreaterThan(0.1);
  });
});
