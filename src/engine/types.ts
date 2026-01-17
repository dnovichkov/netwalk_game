/**
 * Game engine types for NetWalk
 */

/**
 * Cardinal directions for cell connections
 * Values are clockwise starting from North (0, 1, 2, 3)
 */
export enum Direction {
  NORTH = 0,
  EAST = 1,
  SOUTH = 2,
  WEST = 3,
}

/**
 * Types of cells in the game grid
 */
export enum CellType {
  EMPTY = 'empty',
  STRAIGHT = 'straight', // Connects 2 opposite sides (| or -)
  CORNER = 'corner', // Connects 2 adjacent sides (L-shape)
  T_JUNCTION = 't_junction', // Connects 3 sides (T-shape)
  CROSS = 'cross', // Connects all 4 sides (+)
  COMPUTER = 'computer', // End node with 1 connection
  SERVER = 'server', // Central node, source of network
}

/**
 * Game difficulty levels
 */
export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

/**
 * Difficulty configuration
 */
export interface DifficultyConfig {
  width: number;
  height: number;
  minComputers: number;
  maxComputers: number;
  extraEdgeProbability: number;
  idealTime: number; // seconds
  idealMoves: number;
}

/**
 * Difficulty settings mapped by difficulty level
 */
export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  [Difficulty.EASY]: {
    width: 5,
    height: 5,
    minComputers: 4,
    maxComputers: 6,
    extraEdgeProbability: 0,
    idealTime: 60,
    idealMoves: 25,
  },
  [Difficulty.MEDIUM]: {
    width: 7,
    height: 7,
    minComputers: 8,
    maxComputers: 12,
    extraEdgeProbability: 0.125, // 10-15%
    idealTime: 180,
    idealMoves: 60,
  },
  [Difficulty.HARD]: {
    width: 9,
    height: 9,
    minComputers: 12,
    maxComputers: 18,
    extraEdgeProbability: 0.25, // 20-30%
    idealTime: 360,
    idealMoves: 120,
  },
};

/**
 * Position on the grid
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Cell data structure
 */
export interface CellData {
  type: CellType;
  rotation: number; // 0-3 (0°, 90°, 180°, 270°)
  x: number;
  y: number;
  isConnected: boolean;
  isLocked: boolean;
}

/**
 * Base directions for each cell type (at rotation 0)
 * These are the directions that have connections
 */
export const BASE_DIRECTIONS: Record<CellType, Direction[]> = {
  [CellType.EMPTY]: [],
  [CellType.STRAIGHT]: [Direction.NORTH, Direction.SOUTH],
  [CellType.CORNER]: [Direction.NORTH, Direction.EAST],
  [CellType.T_JUNCTION]: [Direction.NORTH, Direction.EAST, Direction.WEST],
  [CellType.CROSS]: [
    Direction.NORTH,
    Direction.EAST,
    Direction.SOUTH,
    Direction.WEST,
  ],
  [CellType.COMPUTER]: [Direction.NORTH],
  [CellType.SERVER]: [
    Direction.NORTH,
    Direction.EAST,
    Direction.SOUTH,
    Direction.WEST,
  ],
};

/**
 * Game state
 */
export interface GameState {
  grid: CellData[][];
  width: number;
  height: number;
  difficulty: Difficulty;
  moves: number;
  startTime: number;
  elapsedTime: number;
  isCompleted: boolean;
  isPaused: boolean;
  serverPosition: Position;
  computerPositions: Position[];
}

/**
 * Saved game format
 */
export interface SavedGame {
  version: number;
  savedAt: string;
  gameState: GameState;
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  id: string;
  difficulty: Difficulty;
  score: number;
  moves: number;
  time: number;
  date: string;
}

/**
 * Leaderboard data structure
 */
export interface LeaderboardData {
  version: number;
  leaderboard: Record<Difficulty, LeaderboardEntry[]>;
  statistics: GameStatistics;
}

/**
 * Game statistics
 */
export interface GameStatistics {
  gamesPlayed: number;
  gamesWon: number;
  totalTime: number;
  totalMoves: number;
}

/**
 * Validation result from connection validator
 */
export interface ValidationResult {
  isValid: boolean;
  connectedCells: Set<string>; // Set of "x,y" strings for quick lookup
  disconnectedComputers: Position[];
  hangingEnds: HangingEnd[];
}

/**
 * A hanging end - a cell with an unconnected direction
 */
export interface HangingEnd {
  position: Position;
  direction: Direction;
}

/**
 * Get the opposite direction
 */
export function getOppositeDirection(dir: Direction): Direction {
  return ((dir + 2) % 4) as Direction;
}

/**
 * Get the direction delta (dx, dy) for moving in a direction
 */
export function getDirectionDelta(dir: Direction): Position {
  switch (dir) {
    case Direction.NORTH:
      return { x: 0, y: -1 };
    case Direction.EAST:
      return { x: 1, y: 0 };
    case Direction.SOUTH:
      return { x: 0, y: 1 };
    case Direction.WEST:
      return { x: -1, y: 0 };
  }
}

/**
 * Rotate a direction by a given rotation (0-3)
 */
export function rotateDirection(dir: Direction, rotation: number): Direction {
  return ((dir + rotation) % 4) as Direction;
}

/**
 * Get directions for a cell type with a given rotation
 */
export function getOpenDirections(type: CellType, rotation: number): Direction[] {
  const baseDirections = BASE_DIRECTIONS[type];
  return baseDirections.map((dir) => rotateDirection(dir, rotation));
}

/**
 * Create a position key string for use in Sets/Maps
 */
export function positionKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

/**
 * Parse a position key back to a Position object
 */
export function parsePositionKey(key: string): Position {
  const [x, y] = key.split(',').map(Number);
  return { x: x ?? 0, y: y ?? 0 };
}
