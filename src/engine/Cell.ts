import {
  CellType,
  Direction,
  CellData,
  getOpenDirections,
  positionKey,
} from './types';

/**
 * Cell class representing a single cell in the game grid.
 * Handles rotation logic and connection state.
 */
export class Cell {
  public type: CellType;
  public rotation: number;
  public readonly x: number;
  public readonly y: number;
  public isConnected: boolean;
  public isLocked: boolean;

  constructor(data: Partial<CellData> & Pick<CellData, 'x' | 'y'>) {
    this.type = data.type ?? CellType.EMPTY;
    this.rotation = data.rotation ?? 0;
    this.x = data.x;
    this.y = data.y;
    this.isConnected = data.isConnected ?? false;
    this.isLocked = data.isLocked ?? false;
  }

  /**
   * Get the open directions for this cell based on type and current rotation
   */
  getOpenDirections(): Direction[] {
    return getOpenDirections(this.type, this.rotation);
  }

  /**
   * Check if this cell has a connection in the given direction
   */
  hasConnection(direction: Direction): boolean {
    return this.getOpenDirections().includes(direction);
  }

  /**
   * Rotate the cell by 90 degrees
   * @param clockwise - If true, rotate clockwise; if false, counter-clockwise
   */
  rotate(clockwise: boolean = true): void {
    if (this.isLocked) {
      return;
    }

    if (clockwise) {
      this.rotation = (this.rotation + 1) % 4;
    } else {
      this.rotation = (this.rotation + 3) % 4; // +3 is same as -1 mod 4
    }
  }

  /**
   * Set a specific rotation value (0-3)
   */
  setRotation(rotation: number): void {
    if (this.isLocked) {
      return;
    }
    this.rotation = ((rotation % 4) + 4) % 4; // Normalize to 0-3
  }

  /**
   * Check if this cell can be rotated (not locked and not a fixed type)
   */
  canRotate(): boolean {
    if (this.isLocked) {
      return false;
    }

    // Server is always fixed
    if (this.type === CellType.SERVER) {
      return false;
    }

    // Cross looks the same in all rotations, so effectively can't rotate
    if (this.type === CellType.CROSS) {
      return false;
    }

    // Empty cells have no visual change, but we still allow rotation
    return this.type !== CellType.EMPTY;
  }

  /**
   * Check if this cell is a source (server)
   */
  isServer(): boolean {
    return this.type === CellType.SERVER;
  }

  /**
   * Check if this cell is a computer (end node)
   */
  isComputer(): boolean {
    return this.type === CellType.COMPUTER;
  }

  /**
   * Check if this cell is empty
   */
  isEmpty(): boolean {
    return this.type === CellType.EMPTY;
  }

  /**
   * Get a unique key for this cell's position
   */
  getKey(): string {
    return positionKey({ x: this.x, y: this.y });
  }

  /**
   * Get the number of connections this cell type has
   */
  getConnectionCount(): number {
    return getOpenDirections(this.type, 0).length;
  }

  /**
   * Clone this cell to create a copy
   */
  clone(): Cell {
    return new Cell({
      type: this.type,
      rotation: this.rotation,
      x: this.x,
      y: this.y,
      isConnected: this.isConnected,
      isLocked: this.isLocked,
    });
  }

  /**
   * Convert to plain data object for serialization
   */
  toData(): CellData {
    return {
      type: this.type,
      rotation: this.rotation,
      x: this.x,
      y: this.y,
      isConnected: this.isConnected,
      isLocked: this.isLocked,
    };
  }

  /**
   * Create a Cell from plain data
   */
  static fromData(data: CellData): Cell {
    return new Cell(data);
  }
}

/**
 * Determine the cell type based on the number of connections
 */
export function determineCellType(connectionCount: number): CellType {
  switch (connectionCount) {
    case 0:
      return CellType.EMPTY;
    case 1:
      return CellType.COMPUTER;
    case 2:
      // This will be refined later to STRAIGHT or CORNER
      // based on the actual directions
      return CellType.STRAIGHT;
    case 3:
      return CellType.T_JUNCTION;
    case 4:
      return CellType.CROSS;
    default:
      return CellType.EMPTY;
  }
}

/**
 * Determine if two directions are opposite (for STRAIGHT cable)
 */
export function areDirectionsOpposite(d1: Direction, d2: Direction): boolean {
  return Math.abs(d1 - d2) === 2;
}

/**
 * Determine if two directions are adjacent (for CORNER cable)
 */
export function areDirectionsAdjacent(d1: Direction, d2: Direction): boolean {
  const diff = Math.abs(d1 - d2);
  return diff === 1 || diff === 3;
}

/**
 * Calculate the rotation needed to align base directions with target directions
 */
export function calculateRotation(
  type: CellType,
  targetDirections: Direction[]
): number {
  if (targetDirections.length === 0) {
    return 0;
  }

  // Try each rotation and find one that matches
  for (let rotation = 0; rotation < 4; rotation++) {
    const rotatedDirs = getOpenDirections(type, rotation);
    if (
      rotatedDirs.length === targetDirections.length &&
      targetDirections.every((d) => rotatedDirs.includes(d))
    ) {
      return rotation;
    }
  }

  return 0; // Default if no match found
}
