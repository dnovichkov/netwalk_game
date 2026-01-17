import { describe, it, expect, beforeEach } from 'vitest';
import { ConnectionValidator } from './ConnectionValidator';
import { Grid } from './Grid';
import { Cell } from './Cell';
import { CellType, Direction } from './types';

describe('ConnectionValidator', () => {
  let validator: ConnectionValidator;

  beforeEach(() => {
    validator = new ConnectionValidator();
  });

  describe('findConnectedCells', () => {
    it('should return empty set if no server', () => {
      const grid = new Grid(3, 3);
      const connected = validator.findConnectedCells(grid);
      expect(connected.size).toBe(0);
    });

    it('should include only the server if no connections', () => {
      const grid = new Grid(3, 3);
      grid.setCell(1, 1, new Cell({ x: 1, y: 1, type: CellType.SERVER }));

      const connected = validator.findConnectedCells(grid);
      expect(connected.size).toBe(1);
      expect(connected.has('1,1')).toBe(true);
    });

    it('should find connected cells in a simple line', () => {
      const grid = new Grid(3, 1);

      // SERVER - STRAIGHT - COMPUTER (all connected E-W)
      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.SERVER }));
      grid.setCell(1, 0, new Cell({ x: 1, y: 0, type: CellType.STRAIGHT, rotation: 1 })); // E-W
      grid.setCell(2, 0, new Cell({ x: 2, y: 0, type: CellType.COMPUTER, rotation: 3 })); // W

      const connected = validator.findConnectedCells(grid);
      expect(connected.size).toBe(3);
      expect(connected.has('0,0')).toBe(true);
      expect(connected.has('1,0')).toBe(true);
      expect(connected.has('2,0')).toBe(true);
    });

    it('should not include cells without matching connections', () => {
      const grid = new Grid(3, 1);

      // SERVER - STRAIGHT (N-S, not connecting) - COMPUTER
      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.SERVER }));
      grid.setCell(1, 0, new Cell({ x: 1, y: 0, type: CellType.STRAIGHT, rotation: 0 })); // N-S
      grid.setCell(2, 0, new Cell({ x: 2, y: 0, type: CellType.COMPUTER, rotation: 3 })); // W

      const connected = validator.findConnectedCells(grid);
      expect(connected.size).toBe(1); // Only server
      expect(connected.has('0,0')).toBe(true);
      expect(connected.has('1,0')).toBe(false);
    });

    it('should mark cells as connected', () => {
      const grid = new Grid(2, 1);

      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.SERVER }));
      grid.setCell(1, 0, new Cell({ x: 1, y: 0, type: CellType.COMPUTER, rotation: 3 })); // W

      validator.findConnectedCells(grid);

      expect(grid.getCell(0, 0)?.isConnected).toBe(true);
      expect(grid.getCell(1, 0)?.isConnected).toBe(true);
    });
  });

  describe('findDisconnectedComputers', () => {
    it('should return empty array when all computers connected', () => {
      const grid = new Grid(2, 1);

      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.SERVER }));
      grid.setCell(1, 0, new Cell({ x: 1, y: 0, type: CellType.COMPUTER, rotation: 3 })); // W

      const connected = validator.findConnectedCells(grid);
      const disconnected = validator.findDisconnectedComputers(grid, connected);

      expect(disconnected).toHaveLength(0);
    });

    it('should find disconnected computers', () => {
      const grid = new Grid(3, 1);

      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.SERVER }));
      // Gap in the middle
      grid.setCell(2, 0, new Cell({ x: 2, y: 0, type: CellType.COMPUTER, rotation: 3 }));

      const connected = validator.findConnectedCells(grid);
      const disconnected = validator.findDisconnectedComputers(grid, connected);

      expect(disconnected).toHaveLength(1);
      expect(disconnected[0]).toEqual({ x: 2, y: 0 });
    });
  });

  describe('findHangingEnds', () => {
    it('should not count server connections as hanging ends', () => {
      const grid = new Grid(1, 1);
      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.SERVER }));

      const connected = validator.findConnectedCells(grid);
      const hangingEnds = validator.findHangingEnds(grid, connected);

      // Server is excluded from hanging end checks
      expect(hangingEnds).toHaveLength(0);
    });

    it('should find unmatched connections between cells', () => {
      const grid = new Grid(3, 1);

      // SERVER - CROSS (connects all 4 dirs) - empty cell
      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.SERVER }));
      grid.setCell(1, 0, new Cell({ x: 1, y: 0, type: CellType.CROSS })); // connects all 4
      // Cell at (2,0) is empty

      const connected = validator.findConnectedCells(grid);
      const hangingEnds = validator.findHangingEnds(grid, connected);

      // CROSS has hanging end pointing EAST (empty neighbor)
      const eastHanging = hangingEnds.find(
        (h) => h.position.x === 1 && h.position.y === 0 && h.direction === Direction.EAST
      );
      expect(eastHanging).toBeDefined();
    });

    it('should return empty array when all connections match', () => {
      // Test with a simple server-computer pair
      // Server is excluded from hanging end checks
      const pairGrid = new Grid(2, 1);
      pairGrid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.SERVER }));
      pairGrid.setCell(1, 0, new Cell({ x: 1, y: 0, type: CellType.COMPUTER, rotation: 3 })); // W

      const pairConnected = validator.findConnectedCells(pairGrid);
      const pairHanging = validator.findHangingEnds(pairGrid, pairConnected);

      // Server is excluded from hanging end checks
      // Computer has no hanging ends (only W which connects to server)
      expect(pairHanging.length).toBe(0);
    });
  });

  describe('validate', () => {
    it('should return invalid result for empty grid', () => {
      const grid = new Grid(3, 3);
      const result = validator.validate(grid);

      expect(result.isValid).toBe(false);
      expect(result.connectedCells.size).toBe(0);
    });

    it('should return invalid if computers disconnected', () => {
      const grid = new Grid(3, 1);

      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.SERVER }));
      grid.setCell(2, 0, new Cell({ x: 2, y: 0, type: CellType.COMPUTER }));

      const result = validator.validate(grid);

      expect(result.isValid).toBe(false);
      expect(result.disconnectedComputers).toHaveLength(1);
    });

    it('should return valid when server-computer are properly connected', () => {
      const grid = new Grid(2, 1);

      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.SERVER }));
      grid.setCell(1, 0, new Cell({ x: 1, y: 0, type: CellType.COMPUTER, rotation: 3 }));

      const result = validator.validate(grid);

      // Server is excluded from hanging end checks
      // Computer is connected, no hanging ends from non-server cells
      expect(result.isValid).toBe(true);
      expect(result.hangingEnds.length).toBe(0);
    });

    it('should return invalid if non-server cells have hanging ends', () => {
      const grid = new Grid(3, 1);

      // SERVER - CROSS - empty (CROSS has hanging end to EAST)
      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.SERVER }));
      grid.setCell(1, 0, new Cell({ x: 1, y: 0, type: CellType.CROSS }));

      const result = validator.validate(grid);

      // CROSS has hanging ends (connects in all 4 dirs, only W matches server)
      expect(result.isValid).toBe(false);
      expect(result.hangingEnds.length).toBeGreaterThan(0);
    });

    it('should mark puzzle as solved when all computers connected', () => {
      // SERVER - STRAIGHT - COMPUTER in a line
      const grid = new Grid(3, 1);
      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.SERVER }));
      grid.setCell(1, 0, new Cell({ x: 1, y: 0, type: CellType.STRAIGHT, rotation: 1 })); // E-W
      grid.setCell(2, 0, new Cell({ x: 2, y: 0, type: CellType.COMPUTER, rotation: 3 })); // W

      const result = validator.validate(grid);

      expect(result.disconnectedComputers).toHaveLength(0);
      expect(result.hangingEnds).toHaveLength(0); // Server excluded
      expect(result.isValid).toBe(true);
    });
  });

  describe('isSolved', () => {
    it('should return false for unsolved puzzle with disconnected computer', () => {
      const grid = new Grid(3, 3);
      grid.setCell(1, 1, new Cell({ x: 1, y: 1, type: CellType.SERVER }));
      // Add disconnected computer
      grid.setCell(2, 2, new Cell({ x: 2, y: 2, type: CellType.COMPUTER }));

      expect(validator.isSolved(grid)).toBe(false);
    });

    it('should return true for properly solved puzzle', () => {
      // SERVER - STRAIGHT - COMPUTER (all properly connected)
      const grid = new Grid(3, 1);
      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.SERVER }));
      grid.setCell(1, 0, new Cell({ x: 1, y: 0, type: CellType.STRAIGHT, rotation: 1 })); // E-W
      grid.setCell(2, 0, new Cell({ x: 2, y: 0, type: CellType.COMPUTER, rotation: 3 })); // W

      expect(validator.isSolved(grid)).toBe(true);
    });
  });

  describe('isCellConnected', () => {
    it('should return true for connected cell', () => {
      const grid = new Grid(2, 1);

      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.SERVER }));
      grid.setCell(1, 0, new Cell({ x: 1, y: 0, type: CellType.COMPUTER, rotation: 3 }));

      expect(validator.isCellConnected(grid, 0, 0)).toBe(true);
      expect(validator.isCellConnected(grid, 1, 0)).toBe(true);
    });

    it('should return false for disconnected cell', () => {
      const grid = new Grid(3, 1);

      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.SERVER }));
      // Gap
      grid.setCell(2, 0, new Cell({ x: 2, y: 0, type: CellType.COMPUTER }));

      expect(validator.isCellConnected(grid, 0, 0)).toBe(true);
      expect(validator.isCellConnected(grid, 2, 0)).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const grid = new Grid(3, 1);

      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.SERVER }));
      grid.setCell(1, 0, new Cell({ x: 1, y: 0, type: CellType.STRAIGHT, rotation: 1 }));
      grid.setCell(2, 0, new Cell({ x: 2, y: 0, type: CellType.COMPUTER, rotation: 3 }));

      const stats = validator.getStats(grid);

      expect(stats.totalCells).toBe(3);
      expect(stats.connectedCells).toBe(3);
      expect(stats.totalComputers).toBe(1);
      expect(stats.connectedComputers).toBe(1);
      expect(stats.hangingEndCount).toBe(0); // All connections matched, server excluded
    });
  });

  describe('complex grid validation', () => {
    it('should correctly validate a cross-shaped network', () => {
      const grid = new Grid(3, 3);

      // Create a cross pattern with server in center
      grid.setCell(1, 1, new Cell({ x: 1, y: 1, type: CellType.SERVER }));

      // 4 computers at edges, pointing toward center
      grid.setCell(1, 0, new Cell({ x: 1, y: 0, type: CellType.COMPUTER, rotation: 2 })); // S
      grid.setCell(2, 1, new Cell({ x: 2, y: 1, type: CellType.COMPUTER, rotation: 3 })); // W
      grid.setCell(1, 2, new Cell({ x: 1, y: 2, type: CellType.COMPUTER, rotation: 0 })); // N
      grid.setCell(0, 1, new Cell({ x: 0, y: 1, type: CellType.COMPUTER, rotation: 1 })); // E

      const result = validator.validate(grid);

      // All computers should be connected
      expect(result.disconnectedComputers).toHaveLength(0);

      // All cells should be connected
      expect(result.connectedCells.size).toBe(5);

      // No hanging ends (all server connections matched by computers)
      expect(result.hangingEnds).toHaveLength(0);

      // Should be valid!
      expect(result.isValid).toBe(true);
    });
  });
});
