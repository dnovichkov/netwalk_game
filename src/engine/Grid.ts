import { Cell } from './Cell';
import {
  CellType,
  Direction,
  Position,
  CellData,
  getDirectionDelta,
  getOppositeDirection,
} from './types';

/**
 * Grid class representing the game board.
 * Contains cells and provides methods for accessing and manipulating them.
 */
export class Grid {
  public readonly width: number;
  public readonly height: number;
  private cells: Cell[][];

  constructor(width: number, height: number, initialCells?: Cell[][]) {
    this.width = width;
    this.height = height;

    if (initialCells) {
      this.cells = initialCells;
    } else {
      // Initialize with empty cells
      this.cells = [];
      for (let y = 0; y < height; y++) {
        const row: Cell[] = [];
        for (let x = 0; x < width; x++) {
          row.push(new Cell({ x, y, type: CellType.EMPTY }));
        }
        this.cells.push(row);
      }
    }
  }

  /**
   * Check if a position is within the grid bounds
   */
  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Get the cell at the given position
   * Returns undefined if out of bounds
   */
  getCell(x: number, y: number): Cell | undefined {
    if (!this.isInBounds(x, y)) {
      return undefined;
    }
    return this.cells[y]?.[x];
  }

  /**
   * Get the cell at the given position
   * Throws an error if out of bounds
   */
  getCellSafe(x: number, y: number): Cell {
    const cell = this.getCell(x, y);
    if (!cell) {
      throw new Error(`Cell at (${x}, ${y}) is out of bounds`);
    }
    return cell;
  }

  /**
   * Set the cell at the given position
   */
  setCell(x: number, y: number, cell: Cell): void {
    if (!this.isInBounds(x, y)) {
      throw new Error(`Position (${x}, ${y}) is out of bounds`);
    }
    const row = this.cells[y];
    if (row) {
      row[x] = cell;
    }
  }

  /**
   * Get the neighbor cell in the given direction
   */
  getNeighbor(x: number, y: number, direction: Direction): Cell | undefined {
    const delta = getDirectionDelta(direction);
    return this.getCell(x + delta.x, y + delta.y);
  }

  /**
   * Get all neighbors of a cell with their directions
   */
  getNeighbors(x: number, y: number): Array<{ cell: Cell; direction: Direction }> {
    const neighbors: Array<{ cell: Cell; direction: Direction }> = [];

    for (let dir = 0; dir < 4; dir++) {
      const neighbor = this.getNeighbor(x, y, dir as Direction);
      if (neighbor) {
        neighbors.push({ cell: neighbor, direction: dir as Direction });
      }
    }

    return neighbors;
  }

  /**
   * Check if two adjacent cells are connected
   * (both have matching openings facing each other)
   */
  areCellsConnected(x1: number, y1: number, x2: number, y2: number): boolean {
    const cell1 = this.getCell(x1, y1);
    const cell2 = this.getCell(x2, y2);

    if (!cell1 || !cell2) {
      return false;
    }

    // Determine the direction from cell1 to cell2
    const dx = x2 - x1;
    const dy = y2 - y1;

    // Cells must be adjacent
    if (Math.abs(dx) + Math.abs(dy) !== 1) {
      return false;
    }

    let direction: Direction;
    if (dx === 1) direction = Direction.EAST;
    else if (dx === -1) direction = Direction.WEST;
    else if (dy === 1) direction = Direction.SOUTH;
    else direction = Direction.NORTH;

    const oppositeDirection = getOppositeDirection(direction);

    // Both cells must have connections facing each other
    return cell1.hasConnection(direction) && cell2.hasConnection(oppositeDirection);
  }

  /**
   * Find the server cell in the grid
   */
  findServer(): Cell | undefined {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.getCell(x, y);
        if (cell?.isServer()) {
          return cell;
        }
      }
    }
    return undefined;
  }

  /**
   * Find all computer cells in the grid
   */
  findComputers(): Cell[] {
    const computers: Cell[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.getCell(x, y);
        if (cell?.isComputer()) {
          computers.push(cell);
        }
      }
    }
    return computers;
  }

  /**
   * Iterate over all cells in the grid
   */
  forEachCell(callback: (cell: Cell, x: number, y: number) => void): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.getCell(x, y);
        if (cell) {
          callback(cell, x, y);
        }
      }
    }
  }

  /**
   * Map over all cells and return an array of results
   */
  mapCells<T>(callback: (cell: Cell, x: number, y: number) => T): T[] {
    const results: T[] = [];
    this.forEachCell((cell, x, y) => {
      results.push(callback(cell, x, y));
    });
    return results;
  }

  /**
   * Reset all cells' connection status to false
   */
  resetConnections(): void {
    this.forEachCell((cell) => {
      cell.isConnected = false;
    });
  }

  /**
   * Clone the grid to create an independent copy
   */
  clone(): Grid {
    const clonedCells: Cell[][] = [];
    for (let y = 0; y < this.height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < this.width; x++) {
        const cell = this.getCell(x, y);
        if (cell) {
          row.push(cell.clone());
        }
      }
      clonedCells.push(row);
    }
    return new Grid(this.width, this.height, clonedCells);
  }

  /**
   * Convert to a 2D array of cell data for serialization
   */
  toData(): CellData[][] {
    return this.cells.map((row) => row.map((cell) => cell.toData()));
  }

  /**
   * Create a Grid from serialized data
   */
  static fromData(data: CellData[][]): Grid {
    if (data.length === 0 || data[0]?.length === 0) {
      return new Grid(0, 0);
    }

    const height = data.length;
    const width = data[0]?.length ?? 0;

    const cells: Cell[][] = data.map((row) =>
      row.map((cellData) => Cell.fromData(cellData))
    );

    return new Grid(width, height, cells);
  }

  /**
   * Get all positions that have a specific cell type
   */
  findCellsByType(type: CellType): Position[] {
    const positions: Position[] = [];
    this.forEachCell((cell, x, y) => {
      if (cell.type === type) {
        positions.push({ x, y });
      }
    });
    return positions;
  }

  /**
   * Get cells that have hanging ends (connections pointing to nowhere or unmatched)
   */
  findHangingEnds(): Array<{ position: Position; direction: Direction }> {
    const hangingEnds: Array<{ position: Position; direction: Direction }> = [];

    this.forEachCell((cell, x, y) => {
      if (cell.isEmpty()) return;

      const openDirs = cell.getOpenDirections();
      for (const dir of openDirs) {
        const neighbor = this.getNeighbor(x, y, dir);

        // No neighbor (edge of grid)
        if (!neighbor) {
          hangingEnds.push({ position: { x, y }, direction: dir });
          continue;
        }

        // Neighbor doesn't have matching connection
        const oppositeDir = getOppositeDirection(dir);
        if (!neighbor.hasConnection(oppositeDir)) {
          hangingEnds.push({ position: { x, y }, direction: dir });
        }
      }
    });

    return hangingEnds;
  }
}
