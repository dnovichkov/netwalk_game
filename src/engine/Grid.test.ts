import { describe, it, expect } from 'vitest';
import { Grid } from './Grid';
import { Cell } from './Cell';
import { CellType, Direction } from './types';

describe('Grid', () => {
  describe('constructor', () => {
    it('should create empty grid with specified dimensions', () => {
      const grid = new Grid(5, 5);
      expect(grid.width).toBe(5);
      expect(grid.height).toBe(5);
    });

    it('should initialize all cells as EMPTY', () => {
      const grid = new Grid(3, 3);
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const cell = grid.getCell(x, y);
          expect(cell).toBeDefined();
          expect(cell?.type).toBe(CellType.EMPTY);
        }
      }
    });

    it('should accept initial cells', () => {
      const cells: Cell[][] = [
        [
          new Cell({ x: 0, y: 0, type: CellType.SERVER }),
          new Cell({ x: 1, y: 0, type: CellType.STRAIGHT }),
        ],
        [
          new Cell({ x: 0, y: 1, type: CellType.CORNER }),
          new Cell({ x: 1, y: 1, type: CellType.COMPUTER }),
        ],
      ];
      const grid = new Grid(2, 2, cells);

      expect(grid.getCell(0, 0)?.type).toBe(CellType.SERVER);
      expect(grid.getCell(1, 0)?.type).toBe(CellType.STRAIGHT);
      expect(grid.getCell(0, 1)?.type).toBe(CellType.CORNER);
      expect(grid.getCell(1, 1)?.type).toBe(CellType.COMPUTER);
    });
  });

  describe('isInBounds', () => {
    it('should return true for valid positions', () => {
      const grid = new Grid(5, 5);
      expect(grid.isInBounds(0, 0)).toBe(true);
      expect(grid.isInBounds(4, 4)).toBe(true);
      expect(grid.isInBounds(2, 2)).toBe(true);
    });

    it('should return false for out of bounds positions', () => {
      const grid = new Grid(5, 5);
      expect(grid.isInBounds(-1, 0)).toBe(false);
      expect(grid.isInBounds(0, -1)).toBe(false);
      expect(grid.isInBounds(5, 0)).toBe(false);
      expect(grid.isInBounds(0, 5)).toBe(false);
    });
  });

  describe('getCell', () => {
    it('should return cell at valid position', () => {
      const grid = new Grid(3, 3);
      const cell = grid.getCell(1, 1);
      expect(cell).toBeDefined();
      expect(cell?.x).toBe(1);
      expect(cell?.y).toBe(1);
    });

    it('should return undefined for out of bounds', () => {
      const grid = new Grid(3, 3);
      expect(grid.getCell(-1, 0)).toBeUndefined();
      expect(grid.getCell(3, 0)).toBeUndefined();
    });
  });

  describe('getCellSafe', () => {
    it('should return cell at valid position', () => {
      const grid = new Grid(3, 3);
      const cell = grid.getCellSafe(1, 1);
      expect(cell.x).toBe(1);
      expect(cell.y).toBe(1);
    });

    it('should throw error for out of bounds', () => {
      const grid = new Grid(3, 3);
      expect(() => grid.getCellSafe(-1, 0)).toThrow();
      expect(() => grid.getCellSafe(3, 0)).toThrow();
    });
  });

  describe('setCell', () => {
    it('should set cell at valid position', () => {
      const grid = new Grid(3, 3);
      const newCell = new Cell({ x: 1, y: 1, type: CellType.SERVER });
      grid.setCell(1, 1, newCell);

      expect(grid.getCell(1, 1)?.type).toBe(CellType.SERVER);
    });

    it('should throw error for out of bounds', () => {
      const grid = new Grid(3, 3);
      const cell = new Cell({ x: 3, y: 0, type: CellType.EMPTY });
      expect(() => grid.setCell(3, 0, cell)).toThrow();
    });
  });

  describe('getNeighbor', () => {
    it('should return correct neighbor in each direction', () => {
      const grid = new Grid(3, 3);

      // Set up some identifiable cells
      grid.setCell(1, 0, new Cell({ x: 1, y: 0, type: CellType.CORNER }));
      grid.setCell(2, 1, new Cell({ x: 2, y: 1, type: CellType.STRAIGHT }));
      grid.setCell(1, 2, new Cell({ x: 1, y: 2, type: CellType.T_JUNCTION }));
      grid.setCell(0, 1, new Cell({ x: 0, y: 1, type: CellType.CROSS }));

      // Check neighbors of center cell (1, 1)
      expect(grid.getNeighbor(1, 1, Direction.NORTH)?.type).toBe(CellType.CORNER);
      expect(grid.getNeighbor(1, 1, Direction.EAST)?.type).toBe(CellType.STRAIGHT);
      expect(grid.getNeighbor(1, 1, Direction.SOUTH)?.type).toBe(CellType.T_JUNCTION);
      expect(grid.getNeighbor(1, 1, Direction.WEST)?.type).toBe(CellType.CROSS);
    });

    it('should return undefined for neighbors out of bounds', () => {
      const grid = new Grid(3, 3);
      expect(grid.getNeighbor(0, 0, Direction.NORTH)).toBeUndefined();
      expect(grid.getNeighbor(0, 0, Direction.WEST)).toBeUndefined();
      expect(grid.getNeighbor(2, 2, Direction.EAST)).toBeUndefined();
      expect(grid.getNeighbor(2, 2, Direction.SOUTH)).toBeUndefined();
    });
  });

  describe('getNeighbors', () => {
    it('should return all 4 neighbors for center cell', () => {
      const grid = new Grid(3, 3);
      const neighbors = grid.getNeighbors(1, 1);
      expect(neighbors).toHaveLength(4);
    });

    it('should return 2 neighbors for corner cell', () => {
      const grid = new Grid(3, 3);
      const neighbors = grid.getNeighbors(0, 0);
      expect(neighbors).toHaveLength(2);
      expect(neighbors.map((n) => n.direction)).toContain(Direction.EAST);
      expect(neighbors.map((n) => n.direction)).toContain(Direction.SOUTH);
    });

    it('should return 3 neighbors for edge cell', () => {
      const grid = new Grid(3, 3);
      const neighbors = grid.getNeighbors(1, 0);
      expect(neighbors).toHaveLength(3);
    });
  });

  describe('areCellsConnected', () => {
    it('should return true when both cells have matching connections', () => {
      const grid = new Grid(3, 1);

      // Set up: STRAIGHT at (0,0) connecting E-W and STRAIGHT at (1,0) connecting E-W
      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.STRAIGHT, rotation: 1 }));
      grid.setCell(1, 0, new Cell({ x: 1, y: 0, type: CellType.STRAIGHT, rotation: 1 }));

      expect(grid.areCellsConnected(0, 0, 1, 0)).toBe(true);
    });

    it('should return false when cells dont have matching connections', () => {
      const grid = new Grid(3, 1);

      // STRAIGHT N-S and STRAIGHT N-S (not connecting E-W)
      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.STRAIGHT, rotation: 0 }));
      grid.setCell(1, 0, new Cell({ x: 1, y: 0, type: CellType.STRAIGHT, rotation: 0 }));

      expect(grid.areCellsConnected(0, 0, 1, 0)).toBe(false);
    });

    it('should return false for non-adjacent cells', () => {
      const grid = new Grid(3, 3);
      expect(grid.areCellsConnected(0, 0, 2, 0)).toBe(false);
    });

    it('should return false for out of bounds', () => {
      const grid = new Grid(3, 3);
      expect(grid.areCellsConnected(0, 0, -1, 0)).toBe(false);
    });
  });

  describe('findServer', () => {
    it('should find server when present', () => {
      const grid = new Grid(3, 3);
      grid.setCell(1, 1, new Cell({ x: 1, y: 1, type: CellType.SERVER }));

      const server = grid.findServer();
      expect(server).toBeDefined();
      expect(server?.x).toBe(1);
      expect(server?.y).toBe(1);
    });

    it('should return undefined when no server', () => {
      const grid = new Grid(3, 3);
      expect(grid.findServer()).toBeUndefined();
    });
  });

  describe('findComputers', () => {
    it('should find all computers', () => {
      const grid = new Grid(3, 3);
      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.COMPUTER }));
      grid.setCell(2, 2, new Cell({ x: 2, y: 2, type: CellType.COMPUTER }));

      const computers = grid.findComputers();
      expect(computers).toHaveLength(2);
    });

    it('should return empty array when no computers', () => {
      const grid = new Grid(3, 3);
      expect(grid.findComputers()).toHaveLength(0);
    });
  });

  describe('forEachCell', () => {
    it('should iterate over all cells', () => {
      const grid = new Grid(3, 3);
      let count = 0;
      grid.forEachCell(() => {
        count++;
      });
      expect(count).toBe(9);
    });
  });

  describe('mapCells', () => {
    it('should map over all cells', () => {
      const grid = new Grid(2, 2);
      const positions = grid.mapCells((cell) => `${cell.x},${cell.y}`);
      expect(positions).toEqual(['0,0', '1,0', '0,1', '1,1']);
    });
  });

  describe('resetConnections', () => {
    it('should reset all connection flags', () => {
      const grid = new Grid(2, 2);

      // Set some cells as connected
      grid.forEachCell((cell) => {
        cell.isConnected = true;
      });

      grid.resetConnections();

      grid.forEachCell((cell) => {
        expect(cell.isConnected).toBe(false);
      });
    });
  });

  describe('clone', () => {
    it('should create independent copy', () => {
      const grid = new Grid(2, 2);
      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.SERVER }));

      const clone = grid.clone();

      expect(clone.getCell(0, 0)?.type).toBe(CellType.SERVER);

      // Modify original
      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.COMPUTER }));

      // Clone should be unchanged
      expect(clone.getCell(0, 0)?.type).toBe(CellType.SERVER);
    });
  });

  describe('toData and fromData', () => {
    it('should serialize and deserialize correctly', () => {
      const grid = new Grid(2, 2);
      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.SERVER }));
      grid.setCell(1, 0, new Cell({ x: 1, y: 0, type: CellType.STRAIGHT, rotation: 1 }));
      grid.setCell(0, 1, new Cell({ x: 0, y: 1, type: CellType.CORNER, rotation: 2 }));
      grid.setCell(1, 1, new Cell({ x: 1, y: 1, type: CellType.COMPUTER, rotation: 3 }));

      const data = grid.toData();
      const restored = Grid.fromData(data);

      expect(restored.width).toBe(grid.width);
      expect(restored.height).toBe(grid.height);
      expect(restored.getCell(0, 0)?.type).toBe(CellType.SERVER);
      expect(restored.getCell(1, 0)?.type).toBe(CellType.STRAIGHT);
      expect(restored.getCell(1, 0)?.rotation).toBe(1);
      expect(restored.getCell(0, 1)?.type).toBe(CellType.CORNER);
      expect(restored.getCell(0, 1)?.rotation).toBe(2);
      expect(restored.getCell(1, 1)?.type).toBe(CellType.COMPUTER);
      expect(restored.getCell(1, 1)?.rotation).toBe(3);
    });
  });

  describe('findCellsByType', () => {
    it('should find all cells of specified type', () => {
      const grid = new Grid(3, 3);
      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.CORNER }));
      grid.setCell(2, 2, new Cell({ x: 2, y: 2, type: CellType.CORNER }));

      const positions = grid.findCellsByType(CellType.CORNER);
      expect(positions).toHaveLength(2);
      expect(positions).toContainEqual({ x: 0, y: 0 });
      expect(positions).toContainEqual({ x: 2, y: 2 });
    });
  });

  describe('findHangingEnds', () => {
    it('should find connections pointing to grid edge', () => {
      const grid = new Grid(3, 3);
      // Place STRAIGHT at edge pointing outside
      grid.setCell(0, 1, new Cell({ x: 0, y: 1, type: CellType.STRAIGHT, rotation: 1 })); // E-W

      const hangingEnds = grid.findHangingEnds();

      // Should have hanging end pointing WEST (outside grid)
      const westHanging = hangingEnds.find(
        (h) => h.position.x === 0 && h.position.y === 1 && h.direction === Direction.WEST
      );
      expect(westHanging).toBeDefined();
    });

    it('should find unmatched connections between cells', () => {
      const grid = new Grid(3, 1);
      // STRAIGHT N-S at (0,0) and STRAIGHT N-S at (1,0) - not connecting
      grid.setCell(0, 0, new Cell({ x: 0, y: 0, type: CellType.STRAIGHT, rotation: 0 }));
      grid.setCell(1, 0, new Cell({ x: 1, y: 0, type: CellType.STRAIGHT, rotation: 0 }));

      const hangingEnds = grid.findHangingEnds();

      // Both cells should have hanging ends pointing to grid edge (N and S)
      expect(hangingEnds.length).toBeGreaterThan(0);
    });
  });
});
