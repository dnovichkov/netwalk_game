import { create } from 'zustand';
import {
  GameState,
  Difficulty,
  CellData,
} from '../engine/types';
import { Grid } from '../engine/Grid';
import { LevelGenerator } from '../engine/LevelGenerator';
import { ConnectionValidator } from '../engine/ConnectionValidator';
import { ScoreCalculator, ScoreResult } from '../engine/ScoreCalculator';

interface HistoryEntry {
  x: number;
  y: number;
  previousRotation: number;
}

interface GameStore {
  // State
  gameState: GameState | null;
  isPlaying: boolean;
  history: HistoryEntry[];
  lastScore: ScoreResult | null;

  // Actions
  newGame: (difficulty: Difficulty) => void;
  rotateCell: (x: number, y: number, clockwise: boolean) => void;
  undo: () => void;
  pause: () => void;
  resume: () => void;
  tick: () => void;
  reset: () => void;
  loadGame: (state: GameState) => void;
}

const levelGenerator = new LevelGenerator();
const connectionValidator = new ConnectionValidator();
const scoreCalculator = new ScoreCalculator();

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  isPlaying: false,
  history: [],
  lastScore: null,

  newGame: (difficulty: Difficulty) => {
    const gameState = levelGenerator.generate(difficulty);
    set({
      gameState,
      isPlaying: true,
      history: [],
      lastScore: null,
    });
  },

  rotateCell: (x: number, y: number, clockwise: boolean) => {
    const { gameState, history } = get();
    if (!gameState || gameState.isCompleted || gameState.isPaused) return;

    const cellData = gameState.grid[y]?.[x];
    if (!cellData || cellData.isLocked) return;

    // Save to history for undo
    const historyEntry: HistoryEntry = {
      x,
      y,
      previousRotation: cellData.rotation,
    };

    // Create new grid data with rotated cell
    const newGrid = gameState.grid.map((row, rowIdx) =>
      row.map((cell, colIdx) => {
        if (rowIdx === y && colIdx === x) {
          const newRotation = clockwise
            ? (cell.rotation + 1) % 4
            : (cell.rotation + 3) % 4;
          return { ...cell, rotation: newRotation };
        }
        return cell;
      })
    );

    // Check connections using Grid class
    const grid = Grid.fromData(newGrid);
    connectionValidator.findConnectedCells(grid);

    // Update grid data with connection status
    const updatedGrid: CellData[][] = [];
    for (let row = 0; row < gameState.height; row++) {
      const rowData: CellData[] = [];
      for (let col = 0; col < gameState.width; col++) {
        const cell = grid.getCell(col, row);
        if (cell) {
          rowData.push(cell.toData());
        }
      }
      updatedGrid.push(rowData);
    }

    // Check if puzzle is solved
    const isSolved = connectionValidator.isSolved(grid);

    const newState: GameState = {
      ...gameState,
      grid: updatedGrid,
      moves: gameState.moves + 1,
      isCompleted: isSolved,
    };

    let lastScore: ScoreResult | null = null;
    if (isSolved) {
      newState.elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
      lastScore = scoreCalculator.calculate(
        gameState.difficulty,
        newState.elapsedTime,
        newState.moves
      );
    }

    set({
      gameState: newState,
      history: [...history, historyEntry],
      lastScore,
    });
  },

  undo: () => {
    const { gameState, history } = get();
    if (!gameState || gameState.isCompleted || history.length === 0) return;

    const lastEntry = history[history.length - 1];
    if (!lastEntry) return;

    const newGrid = gameState.grid.map((row, rowIdx) =>
      row.map((cell, colIdx) => {
        if (rowIdx === lastEntry.y && colIdx === lastEntry.x) {
          return { ...cell, rotation: lastEntry.previousRotation };
        }
        return cell;
      })
    );

    // Update connections
    const grid = Grid.fromData(newGrid);
    connectionValidator.findConnectedCells(grid);

    const updatedGrid: CellData[][] = [];
    for (let row = 0; row < gameState.height; row++) {
      const rowData: CellData[] = [];
      for (let col = 0; col < gameState.width; col++) {
        const cell = grid.getCell(col, row);
        if (cell) {
          rowData.push(cell.toData());
        }
      }
      updatedGrid.push(rowData);
    }

    set({
      gameState: {
        ...gameState,
        grid: updatedGrid,
        moves: Math.max(0, gameState.moves - 1),
      },
      history: history.slice(0, -1),
    });
  },

  pause: () => {
    const { gameState } = get();
    if (!gameState || gameState.isCompleted) return;

    set({
      gameState: {
        ...gameState,
        isPaused: true,
        elapsedTime: Math.floor((Date.now() - gameState.startTime) / 1000),
      },
      isPlaying: false,
    });
  },

  resume: () => {
    const { gameState } = get();
    if (!gameState || gameState.isCompleted) return;

    set({
      gameState: {
        ...gameState,
        isPaused: false,
        startTime: Date.now() - gameState.elapsedTime * 1000,
      },
      isPlaying: true,
    });
  },

  tick: () => {
    const { gameState } = get();
    if (!gameState || gameState.isCompleted || gameState.isPaused) return;

    set({
      gameState: {
        ...gameState,
        elapsedTime: Math.floor((Date.now() - gameState.startTime) / 1000),
      },
    });
  },

  reset: () => {
    set({
      gameState: null,
      isPlaying: false,
      history: [],
      lastScore: null,
    });
  },

  loadGame: (state: GameState) => {
    // Restore connection state
    const grid = Grid.fromData(state.grid);
    connectionValidator.findConnectedCells(grid);

    const updatedGrid: CellData[][] = [];
    for (let row = 0; row < state.height; row++) {
      const rowData: CellData[] = [];
      for (let col = 0; col < state.width; col++) {
        const cell = grid.getCell(col, row);
        if (cell) {
          rowData.push(cell.toData());
        }
      }
      updatedGrid.push(rowData);
    }

    set({
      gameState: {
        ...state,
        grid: updatedGrid,
        startTime: Date.now() - state.elapsedTime * 1000,
        isPaused: false,
      },
      isPlaying: true,
      history: [],
      lastScore: null,
    });
  },
}));
