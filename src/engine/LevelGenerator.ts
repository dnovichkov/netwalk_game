import { Grid } from './Grid';
import { Cell, areDirectionsOpposite, calculateRotation } from './Cell';
import { ConnectionValidator } from './ConnectionValidator';
import {
  CellType,
  Direction,
  Difficulty,
  Position,
  DIFFICULTY_CONFIG,
  GameState,
  getOppositeDirection,
  getDirectionDelta,
} from './types';

/**
 * LevelGenerator creates solvable NetWalk puzzles.
 *
 * Algorithm:
 * 1. Create empty grid and place server
 * 2. Build spanning tree using randomized DFS from server
 * 3. Add extra edges based on difficulty
 * 4. Convert cells with 1 connection to computers
 * 5. Determine cell types based on connections
 * 6. Scramble rotations (ensuring puzzle is not already solved)
 */
export class LevelGenerator {
  private validator: ConnectionValidator;

  constructor() {
    this.validator = new ConnectionValidator();
  }

  /**
   * Generate a new level for the given difficulty
   */
  generate(difficulty: Difficulty): GameState {
    const config = DIFFICULTY_CONFIG[difficulty];
    const { width, height } = config;

    // Track connections for each cell
    const connections: Map<string, Set<Direction>> = new Map();

    // Initialize connection sets for all cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        connections.set(`${x},${y}`, new Set());
      }
    }

    // 1. Place server at center
    const serverPos: Position = {
      x: Math.floor(width / 2),
      y: Math.floor(height / 2),
    };

    // 2. Build spanning tree using DFS
    this.buildSpanningTree(width, height, serverPos, connections);

    // 3. Add extra edges based on difficulty (creates cycles/more complexity)
    this.addExtraEdges(width, height, connections, config.extraEdgeProbability);

    // 4. Find all leaf positions (cells with exactly 1 connection, excluding server)
    const leaves = this.findLeaves(width, height, connections, serverPos);

    // Ensure we have enough leaves - if not, we may need to prune some branches
    let computerPositions: Position[];
    if (leaves.length >= config.minComputers) {
      // Select random subset for computers
      const computerCount = this.randomRange(
        config.minComputers,
        Math.min(config.maxComputers, leaves.length)
      );
      computerPositions = this.shuffle([...leaves]).slice(0, computerCount);
    } else {
      // Use all leaves as computers
      computerPositions = [...leaves];
    }

    // 5. Create grid with proper cell types
    const grid = this.createGrid(
      width,
      height,
      connections,
      serverPos,
      computerPositions
    );

    // Store correct rotations for solvability verification
    const correctRotations: Map<string, number> = new Map();
    grid.forEachCell((cell) => {
      correctRotations.set(cell.getKey(), cell.rotation);
    });

    // 6. Scramble rotations
    this.scramble(grid, serverPos);

    // 7. Ensure not solved initially
    let attempts = 0;
    while (this.validator.isSolved(grid) && attempts < 100) {
      this.scramble(grid, serverPos);
      attempts++;
    }

    return {
      grid: grid.toData(),
      width,
      height,
      difficulty,
      moves: 0,
      startTime: Date.now(),
      elapsedTime: 0,
      isCompleted: false,
      isPaused: false,
      serverPosition: serverPos,
      computerPositions,
    };
  }

  /**
   * Build a spanning tree from the server position using randomized DFS.
   * This ensures all cells are reachable from the server.
   */
  private buildSpanningTree(
    width: number,
    height: number,
    start: Position,
    connections: Map<string, Set<Direction>>
  ): void {
    const visited = new Set<string>();
    const stack: Position[] = [start];
    visited.add(`${start.x},${start.y}`);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      if (!current) break;

      const neighbors = this.getUnvisitedNeighbors(
        current,
        width,
        height,
        visited
      );

      if (neighbors.length === 0) {
        stack.pop();
        continue;
      }

      // Pick random unvisited neighbor
      const { neighbor, direction } = this.shuffle(neighbors)[0]!;

      // Add bidirectional connection
      const currentKey = `${current.x},${current.y}`;
      const neighborKey = `${neighbor.x},${neighbor.y}`;

      connections.get(currentKey)?.add(direction);
      connections.get(neighborKey)?.add(getOppositeDirection(direction));

      visited.add(neighborKey);
      stack.push(neighbor);
    }
  }

  /**
   * Get unvisited neighbors of a position
   */
  private getUnvisitedNeighbors(
    pos: Position,
    width: number,
    height: number,
    visited: Set<string>
  ): Array<{ neighbor: Position; direction: Direction }> {
    const neighbors: Array<{ neighbor: Position; direction: Direction }> = [];

    const directions = [
      Direction.NORTH,
      Direction.EAST,
      Direction.SOUTH,
      Direction.WEST,
    ];

    for (const dir of directions) {
      const delta = getDirectionDelta(dir);
      const nx = pos.x + delta.x;
      const ny = pos.y + delta.y;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const key = `${nx},${ny}`;
        if (!visited.has(key)) {
          neighbors.push({ neighbor: { x: nx, y: ny }, direction: dir });
        }
      }
    }

    return neighbors;
  }

  /**
   * Add extra edges to create cycles (makes puzzle more interesting for higher difficulties)
   */
  private addExtraEdges(
    width: number,
    height: number,
    connections: Map<string, Set<Direction>>,
    probability: number
  ): void {
    if (probability === 0) return;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Only check right and down to avoid duplicates
        const directions = [Direction.EAST, Direction.SOUTH];

        for (const dir of directions) {
          const delta = getDirectionDelta(dir);
          const nx = x + delta.x;
          const ny = y + delta.y;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const currentKey = `${x},${y}`;
            const neighborKey = `${nx},${ny}`;
            const currentConns = connections.get(currentKey);
            const neighborConns = connections.get(neighborKey);

            // Skip if connection already exists
            if (currentConns?.has(dir)) continue;

            // Add edge with given probability
            if (Math.random() < probability) {
              currentConns?.add(dir);
              neighborConns?.add(getOppositeDirection(dir));
            }
          }
        }
      }
    }
  }

  /**
   * Find leaf nodes (cells with only 1 connection, excluding server)
   */
  private findLeaves(
    width: number,
    height: number,
    connections: Map<string, Set<Direction>>,
    serverPos: Position
  ): Position[] {
    const leaves: Position[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Skip server
        if (x === serverPos.x && y === serverPos.y) continue;

        const key = `${x},${y}`;
        const conns = connections.get(key);

        if (conns && conns.size === 1) {
          leaves.push({ x, y });
        }
      }
    }

    return leaves;
  }

  /**
   * Create the grid with proper cell types based on connections
   */
  private createGrid(
    width: number,
    height: number,
    connections: Map<string, Set<Direction>>,
    serverPos: Position,
    computerPositions: Position[]
  ): Grid {
    const grid = new Grid(width, height);
    const computerSet = new Set(computerPositions.map((p) => `${p.x},${p.y}`));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = `${x},${y}`;
        const conns = connections.get(key);
        const connArray = conns ? Array.from(conns) : [];

        let type: CellType;
        let rotation = 0;

        // Determine cell type
        if (x === serverPos.x && y === serverPos.y) {
          type = CellType.SERVER;
          // Server doesn't need specific rotation - it connects all directions
        } else if (computerSet.has(key)) {
          type = CellType.COMPUTER;
          rotation = calculateRotation(CellType.COMPUTER, connArray);
        } else if (connArray.length === 0) {
          type = CellType.EMPTY;
        } else {
          type = this.determineCellType(connArray);
          rotation = calculateRotation(type, connArray);
        }

        const cell = new Cell({
          x,
          y,
          type,
          rotation,
          isConnected: false,
          isLocked: type === CellType.SERVER,
        });

        grid.setCell(x, y, cell);
      }
    }

    return grid;
  }

  /**
   * Determine cell type based on number and arrangement of connections
   */
  private determineCellType(directions: Direction[]): CellType {
    const count = directions.length;

    switch (count) {
      case 0:
        return CellType.EMPTY;
      case 1:
        return CellType.COMPUTER;
      case 2: {
        // Check if opposite (STRAIGHT) or adjacent (CORNER)
        const [d1, d2] = directions;
        if (d1 !== undefined && d2 !== undefined && areDirectionsOpposite(d1, d2)) {
          return CellType.STRAIGHT;
        }
        return CellType.CORNER;
      }
      case 3:
        return CellType.T_JUNCTION;
      case 4:
        return CellType.CROSS;
      default:
        return CellType.EMPTY;
    }
  }

  /**
   * Scramble all cell rotations (except server and locked cells)
   */
  private scramble(grid: Grid, _serverPos: Position): void {
    grid.forEachCell((cell) => {
      // Don't rotate server, empty, or cross cells
      if (
        cell.isServer() ||
        cell.isEmpty() ||
        cell.type === CellType.CROSS ||
        cell.isLocked
      ) {
        return;
      }

      // Random rotation 1-3 times (never 0 to ensure change)
      const rotations = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < rotations; i++) {
        cell.rotate(true);
      }
    });
  }

  /**
   * Shuffle array and return new shuffled array
   */
  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = result[i];
      const other = result[j];
      if (temp !== undefined && other !== undefined) {
        result[i] = other;
        result[j] = temp;
      }
    }
    return result;
  }

  /**
   * Generate random integer in range [min, max] inclusive
   */
  private randomRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

// Export a singleton for convenience
export const levelGenerator = new LevelGenerator();
