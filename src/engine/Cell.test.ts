import { describe, it, expect } from 'vitest';
import {
  Cell,
  determineCellType,
  areDirectionsOpposite,
  areDirectionsAdjacent,
  calculateRotation,
} from './Cell';
import { CellType, Direction } from './types';

describe('Cell', () => {
  describe('constructor', () => {
    it('should create a cell with default values', () => {
      const cell = new Cell({ x: 0, y: 0 });
      expect(cell.type).toBe(CellType.EMPTY);
      expect(cell.rotation).toBe(0);
      expect(cell.x).toBe(0);
      expect(cell.y).toBe(0);
      expect(cell.isConnected).toBe(false);
      expect(cell.isLocked).toBe(false);
    });

    it('should create a cell with specified values', () => {
      const cell = new Cell({
        x: 5,
        y: 3,
        type: CellType.CORNER,
        rotation: 2,
        isConnected: true,
        isLocked: true,
      });
      expect(cell.type).toBe(CellType.CORNER);
      expect(cell.rotation).toBe(2);
      expect(cell.x).toBe(5);
      expect(cell.y).toBe(3);
      expect(cell.isConnected).toBe(true);
      expect(cell.isLocked).toBe(true);
    });
  });

  describe('getOpenDirections', () => {
    it('should return correct directions for STRAIGHT at rotation 0', () => {
      const cell = new Cell({ x: 0, y: 0, type: CellType.STRAIGHT, rotation: 0 });
      const dirs = cell.getOpenDirections();
      expect(dirs).toContain(Direction.NORTH);
      expect(dirs).toContain(Direction.SOUTH);
      expect(dirs).toHaveLength(2);
    });

    it('should return correct directions for CORNER at rotation 1', () => {
      const cell = new Cell({ x: 0, y: 0, type: CellType.CORNER, rotation: 1 });
      const dirs = cell.getOpenDirections();
      expect(dirs).toContain(Direction.EAST);
      expect(dirs).toContain(Direction.SOUTH);
      expect(dirs).toHaveLength(2);
    });
  });

  describe('hasConnection', () => {
    it('should return true for connected directions', () => {
      const cell = new Cell({ x: 0, y: 0, type: CellType.STRAIGHT, rotation: 0 });
      expect(cell.hasConnection(Direction.NORTH)).toBe(true);
      expect(cell.hasConnection(Direction.SOUTH)).toBe(true);
    });

    it('should return false for non-connected directions', () => {
      const cell = new Cell({ x: 0, y: 0, type: CellType.STRAIGHT, rotation: 0 });
      expect(cell.hasConnection(Direction.EAST)).toBe(false);
      expect(cell.hasConnection(Direction.WEST)).toBe(false);
    });
  });

  describe('rotate', () => {
    it('should rotate clockwise by default', () => {
      const cell = new Cell({ x: 0, y: 0, type: CellType.CORNER, rotation: 0 });
      cell.rotate();
      expect(cell.rotation).toBe(1);
      cell.rotate();
      expect(cell.rotation).toBe(2);
    });

    it('should rotate counter-clockwise when specified', () => {
      const cell = new Cell({ x: 0, y: 0, type: CellType.CORNER, rotation: 2 });
      cell.rotate(false);
      expect(cell.rotation).toBe(1);
      cell.rotate(false);
      expect(cell.rotation).toBe(0);
    });

    it('should wrap around from 3 to 0', () => {
      const cell = new Cell({ x: 0, y: 0, type: CellType.CORNER, rotation: 3 });
      cell.rotate(true);
      expect(cell.rotation).toBe(0);
    });

    it('should wrap around from 0 to 3', () => {
      const cell = new Cell({ x: 0, y: 0, type: CellType.CORNER, rotation: 0 });
      cell.rotate(false);
      expect(cell.rotation).toBe(3);
    });

    it('should not rotate if cell is locked', () => {
      const cell = new Cell({
        x: 0,
        y: 0,
        type: CellType.CORNER,
        rotation: 0,
        isLocked: true,
      });
      cell.rotate();
      expect(cell.rotation).toBe(0);
    });
  });

  describe('setRotation', () => {
    it('should set rotation to specific value', () => {
      const cell = new Cell({ x: 0, y: 0, type: CellType.CORNER, rotation: 0 });
      cell.setRotation(3);
      expect(cell.rotation).toBe(3);
    });

    it('should normalize rotation values', () => {
      const cell = new Cell({ x: 0, y: 0, type: CellType.CORNER, rotation: 0 });
      cell.setRotation(5);
      expect(cell.rotation).toBe(1);
      cell.setRotation(-1);
      expect(cell.rotation).toBe(3);
    });

    it('should not set rotation if cell is locked', () => {
      const cell = new Cell({
        x: 0,
        y: 0,
        type: CellType.CORNER,
        rotation: 0,
        isLocked: true,
      });
      cell.setRotation(2);
      expect(cell.rotation).toBe(0);
    });
  });

  describe('canRotate', () => {
    it('should return true for rotatable types', () => {
      expect(new Cell({ x: 0, y: 0, type: CellType.STRAIGHT }).canRotate()).toBe(
        true
      );
      expect(new Cell({ x: 0, y: 0, type: CellType.CORNER }).canRotate()).toBe(
        true
      );
      expect(new Cell({ x: 0, y: 0, type: CellType.T_JUNCTION }).canRotate()).toBe(
        true
      );
      expect(new Cell({ x: 0, y: 0, type: CellType.COMPUTER }).canRotate()).toBe(
        true
      );
    });

    it('should return false for fixed types', () => {
      expect(new Cell({ x: 0, y: 0, type: CellType.SERVER }).canRotate()).toBe(
        false
      );
      expect(new Cell({ x: 0, y: 0, type: CellType.CROSS }).canRotate()).toBe(
        false
      );
      expect(new Cell({ x: 0, y: 0, type: CellType.EMPTY }).canRotate()).toBe(
        false
      );
    });

    it('should return false for locked cells', () => {
      expect(
        new Cell({ x: 0, y: 0, type: CellType.CORNER, isLocked: true }).canRotate()
      ).toBe(false);
    });
  });

  describe('type checks', () => {
    it('isServer should return true only for SERVER type', () => {
      expect(new Cell({ x: 0, y: 0, type: CellType.SERVER }).isServer()).toBe(
        true
      );
      expect(new Cell({ x: 0, y: 0, type: CellType.COMPUTER }).isServer()).toBe(
        false
      );
    });

    it('isComputer should return true only for COMPUTER type', () => {
      expect(new Cell({ x: 0, y: 0, type: CellType.COMPUTER }).isComputer()).toBe(
        true
      );
      expect(new Cell({ x: 0, y: 0, type: CellType.SERVER }).isComputer()).toBe(
        false
      );
    });

    it('isEmpty should return true only for EMPTY type', () => {
      expect(new Cell({ x: 0, y: 0, type: CellType.EMPTY }).isEmpty()).toBe(true);
      expect(new Cell({ x: 0, y: 0, type: CellType.CORNER }).isEmpty()).toBe(
        false
      );
    });
  });

  describe('getKey', () => {
    it('should return correct position key', () => {
      expect(new Cell({ x: 0, y: 0 }).getKey()).toBe('0,0');
      expect(new Cell({ x: 5, y: 3 }).getKey()).toBe('5,3');
    });
  });

  describe('getConnectionCount', () => {
    it('should return correct connection counts', () => {
      expect(new Cell({ x: 0, y: 0, type: CellType.EMPTY }).getConnectionCount()).toBe(0);
      expect(new Cell({ x: 0, y: 0, type: CellType.COMPUTER }).getConnectionCount()).toBe(1);
      expect(new Cell({ x: 0, y: 0, type: CellType.STRAIGHT }).getConnectionCount()).toBe(2);
      expect(new Cell({ x: 0, y: 0, type: CellType.CORNER }).getConnectionCount()).toBe(2);
      expect(new Cell({ x: 0, y: 0, type: CellType.T_JUNCTION }).getConnectionCount()).toBe(3);
      expect(new Cell({ x: 0, y: 0, type: CellType.CROSS }).getConnectionCount()).toBe(4);
      expect(new Cell({ x: 0, y: 0, type: CellType.SERVER }).getConnectionCount()).toBe(4);
    });
  });

  describe('clone', () => {
    it('should create an independent copy', () => {
      const original = new Cell({
        x: 1,
        y: 2,
        type: CellType.CORNER,
        rotation: 1,
        isConnected: true,
      });
      const clone = original.clone();

      expect(clone.x).toBe(original.x);
      expect(clone.y).toBe(original.y);
      expect(clone.type).toBe(original.type);
      expect(clone.rotation).toBe(original.rotation);
      expect(clone.isConnected).toBe(original.isConnected);

      // Verify independence
      clone.rotate();
      expect(clone.rotation).toBe(2);
      expect(original.rotation).toBe(1);
    });
  });

  describe('toData and fromData', () => {
    it('should serialize and deserialize correctly', () => {
      const original = new Cell({
        x: 3,
        y: 4,
        type: CellType.T_JUNCTION,
        rotation: 2,
        isConnected: true,
        isLocked: true,
      });

      const data = original.toData();
      const restored = Cell.fromData(data);

      expect(restored.x).toBe(original.x);
      expect(restored.y).toBe(original.y);
      expect(restored.type).toBe(original.type);
      expect(restored.rotation).toBe(original.rotation);
      expect(restored.isConnected).toBe(original.isConnected);
      expect(restored.isLocked).toBe(original.isLocked);
    });
  });
});

describe('determineCellType', () => {
  it('should return EMPTY for 0 connections', () => {
    expect(determineCellType(0)).toBe(CellType.EMPTY);
  });

  it('should return COMPUTER for 1 connection', () => {
    expect(determineCellType(1)).toBe(CellType.COMPUTER);
  });

  it('should return STRAIGHT for 2 connections', () => {
    expect(determineCellType(2)).toBe(CellType.STRAIGHT);
  });

  it('should return T_JUNCTION for 3 connections', () => {
    expect(determineCellType(3)).toBe(CellType.T_JUNCTION);
  });

  it('should return CROSS for 4 connections', () => {
    expect(determineCellType(4)).toBe(CellType.CROSS);
  });

  it('should return EMPTY for invalid counts', () => {
    expect(determineCellType(-1)).toBe(CellType.EMPTY);
    expect(determineCellType(5)).toBe(CellType.EMPTY);
  });
});

describe('areDirectionsOpposite', () => {
  it('should return true for opposite directions', () => {
    expect(areDirectionsOpposite(Direction.NORTH, Direction.SOUTH)).toBe(true);
    expect(areDirectionsOpposite(Direction.SOUTH, Direction.NORTH)).toBe(true);
    expect(areDirectionsOpposite(Direction.EAST, Direction.WEST)).toBe(true);
    expect(areDirectionsOpposite(Direction.WEST, Direction.EAST)).toBe(true);
  });

  it('should return false for non-opposite directions', () => {
    expect(areDirectionsOpposite(Direction.NORTH, Direction.EAST)).toBe(false);
    expect(areDirectionsOpposite(Direction.NORTH, Direction.WEST)).toBe(false);
    expect(areDirectionsOpposite(Direction.NORTH, Direction.NORTH)).toBe(false);
  });
});

describe('areDirectionsAdjacent', () => {
  it('should return true for adjacent directions', () => {
    expect(areDirectionsAdjacent(Direction.NORTH, Direction.EAST)).toBe(true);
    expect(areDirectionsAdjacent(Direction.EAST, Direction.SOUTH)).toBe(true);
    expect(areDirectionsAdjacent(Direction.SOUTH, Direction.WEST)).toBe(true);
    expect(areDirectionsAdjacent(Direction.WEST, Direction.NORTH)).toBe(true);
  });

  it('should return false for non-adjacent directions', () => {
    expect(areDirectionsAdjacent(Direction.NORTH, Direction.SOUTH)).toBe(false);
    expect(areDirectionsAdjacent(Direction.EAST, Direction.WEST)).toBe(false);
    expect(areDirectionsAdjacent(Direction.NORTH, Direction.NORTH)).toBe(false);
  });
});

describe('calculateRotation', () => {
  it('should return 0 for empty directions', () => {
    expect(calculateRotation(CellType.EMPTY, [])).toBe(0);
  });

  it('should find correct rotation for STRAIGHT', () => {
    // N-S is rotation 0
    expect(
      calculateRotation(CellType.STRAIGHT, [Direction.NORTH, Direction.SOUTH])
    ).toBe(0);
    // E-W is rotation 1
    expect(
      calculateRotation(CellType.STRAIGHT, [Direction.EAST, Direction.WEST])
    ).toBe(1);
  });

  it('should find correct rotation for CORNER', () => {
    // N-E is rotation 0
    expect(
      calculateRotation(CellType.CORNER, [Direction.NORTH, Direction.EAST])
    ).toBe(0);
    // E-S is rotation 1
    expect(
      calculateRotation(CellType.CORNER, [Direction.EAST, Direction.SOUTH])
    ).toBe(1);
    // S-W is rotation 2
    expect(
      calculateRotation(CellType.CORNER, [Direction.SOUTH, Direction.WEST])
    ).toBe(2);
    // W-N is rotation 3
    expect(
      calculateRotation(CellType.CORNER, [Direction.WEST, Direction.NORTH])
    ).toBe(3);
  });

  it('should find correct rotation for COMPUTER', () => {
    expect(calculateRotation(CellType.COMPUTER, [Direction.NORTH])).toBe(0);
    expect(calculateRotation(CellType.COMPUTER, [Direction.EAST])).toBe(1);
    expect(calculateRotation(CellType.COMPUTER, [Direction.SOUTH])).toBe(2);
    expect(calculateRotation(CellType.COMPUTER, [Direction.WEST])).toBe(3);
  });
});
