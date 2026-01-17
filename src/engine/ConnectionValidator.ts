import { Grid } from './Grid';
import { Cell } from './Cell';
import {
  Position,
  ValidationResult,
  HangingEnd,
  getOppositeDirection,
  getDirectionDelta,
  positionKey,
} from './types';

/**
 * ConnectionValidator validates the network connections in the game grid.
 * Uses BFS to find all connected cells from the server and checks for:
 * - All computers reachable
 * - No hanging ends (unmatched connections)
 */
export class ConnectionValidator {
  /**
   * Validate the grid connections
   * @returns ValidationResult with all details about the current state
   */
  validate(grid: Grid): ValidationResult {
    const connectedCells = this.findConnectedCells(grid);
    const disconnectedComputers = this.findDisconnectedComputers(grid, connectedCells);
    const hangingEnds = this.findHangingEnds(grid, connectedCells);

    const isValid =
      disconnectedComputers.length === 0 &&
      hangingEnds.length === 0 &&
      connectedCells.size > 0;

    return {
      isValid,
      connectedCells,
      disconnectedComputers,
      hangingEnds,
    };
  }

  /**
   * Quick check if the puzzle is solved
   */
  isSolved(grid: Grid): boolean {
    return this.validate(grid).isValid;
  }

  /**
   * Find all cells connected to the server using BFS
   * Also updates the isConnected flag on cells
   */
  findConnectedCells(grid: Grid): Set<string> {
    const connected = new Set<string>();

    // Reset all connection flags
    grid.resetConnections();

    const server = grid.findServer();
    if (!server) {
      return connected;
    }

    // BFS from server
    const queue: Cell[] = [server];
    connected.add(server.getKey());
    server.isConnected = true;

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;

      const openDirs = current.getOpenDirections();

      for (const dir of openDirs) {
        const neighbor = grid.getNeighbor(current.x, current.y, dir);
        if (!neighbor) continue;

        // Check if neighbor has matching connection back
        const oppositeDir = getOppositeDirection(dir);
        if (!neighbor.hasConnection(oppositeDir)) continue;

        const neighborKey = neighbor.getKey();
        if (connected.has(neighborKey)) continue;

        connected.add(neighborKey);
        neighbor.isConnected = true;
        queue.push(neighbor);
      }
    }

    return connected;
  }

  /**
   * Find computers that are not connected to the server
   */
  findDisconnectedComputers(grid: Grid, connectedCells: Set<string>): Position[] {
    const disconnected: Position[] = [];

    grid.forEachCell((cell) => {
      if (cell.isComputer() && !connectedCells.has(cell.getKey())) {
        disconnected.push({ x: cell.x, y: cell.y });
      }
    });

    return disconnected;
  }

  /**
   * Find all hanging ends (connections that don't match)
   * Only considers cells that are part of the connected network
   */
  findHangingEnds(grid: Grid, connectedCells: Set<string>): HangingEnd[] {
    const hangingEnds: HangingEnd[] = [];

    grid.forEachCell((cell) => {
      // Only check connected cells (or server)
      if (!connectedCells.has(cell.getKey()) && !cell.isServer()) {
        return;
      }

      if (cell.isEmpty()) return;

      const openDirs = cell.getOpenDirections();

      for (const dir of openDirs) {
        const delta = getDirectionDelta(dir);
        const nx = cell.x + delta.x;
        const ny = cell.y + delta.y;

        const neighbor = grid.getCell(nx, ny);

        // Connection points outside grid
        if (!neighbor) {
          hangingEnds.push({
            position: { x: cell.x, y: cell.y },
            direction: dir,
          });
          continue;
        }

        // Neighbor doesn't have matching connection
        const oppositeDir = getOppositeDirection(dir);
        if (!neighbor.hasConnection(oppositeDir)) {
          hangingEnds.push({
            position: { x: cell.x, y: cell.y },
            direction: dir,
          });
        }
      }
    });

    return hangingEnds;
  }

  /**
   * Update the grid's connection state
   * Marks all cells that are connected to the server
   */
  updateConnectionState(grid: Grid): void {
    this.findConnectedCells(grid);
  }

  /**
   * Check if a specific cell is connected to the server
   */
  isCellConnected(grid: Grid, x: number, y: number): boolean {
    const connected = this.findConnectedCells(grid);
    return connected.has(positionKey({ x, y }));
  }

  /**
   * Count the number of connected cells
   */
  countConnectedCells(grid: Grid): number {
    return this.findConnectedCells(grid).size;
  }

  /**
   * Get statistics about the current grid state
   */
  getStats(grid: Grid): {
    totalCells: number;
    connectedCells: number;
    totalComputers: number;
    connectedComputers: number;
    hangingEndCount: number;
  } {
    const result = this.validate(grid);
    const computers = grid.findComputers();
    const connectedComputers = computers.filter((c) =>
      result.connectedCells.has(c.getKey())
    ).length;

    let totalCells = 0;
    grid.forEachCell((cell) => {
      if (!cell.isEmpty()) totalCells++;
    });

    return {
      totalCells,
      connectedCells: result.connectedCells.size,
      totalComputers: computers.length,
      connectedComputers,
      hangingEndCount: result.hangingEnds.length,
    };
  }
}

// Export a singleton instance for convenience
export const connectionValidator = new ConnectionValidator();
