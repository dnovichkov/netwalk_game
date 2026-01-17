import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { WinScreen, clearRecordedGames } from './WinScreen';
import { Difficulty } from '../../engine/types';

// Mock the stores
const mockIncrementGamesWon = vi.fn();
const mockAddEntry = vi.fn().mockReturnValue(true);
const mockAddTime = vi.fn();
const mockAddMoves = vi.fn();
const mockIsNewRecord = vi.fn().mockReturnValue(false);

const mockGameState = {
  difficulty: Difficulty.EASY,
  moves: 25,
  elapsedTime: 60,
  isCompleted: true,
  width: 5,
  height: 5,
  grid: [],
  startTime: Date.now() - 60000,
  isPaused: false,
  serverPosition: { x: 2, y: 2 },
  computerPositions: [],
};

const mockLastScore = {
  score: 5000,
  baseScore: 10000,
  timeMultiplier: 0.8,
  movesMultiplier: 0.625,
  timePenalty: 2000,
  movesPenalty: 3000,
};

vi.mock('../../store', () => ({
  useGameStore: (selector: (state: unknown) => unknown) => {
    const state = {
      gameState: mockGameState,
      lastScore: mockLastScore,
    };
    return selector(state);
  },
  useLeaderboardStore: (selector: (state: unknown) => unknown) => {
    const state = {
      addEntry: mockAddEntry,
      isNewRecord: mockIsNewRecord,
      incrementGamesWon: mockIncrementGamesWon,
      addTime: mockAddTime,
      addMoves: mockAddMoves,
    };
    return selector(state);
  },
}));

vi.mock('../../hooks', () => ({
  useSound: () => ({
    playWinMelody: vi.fn(),
  }),
}));

describe('WinScreen', () => {
  const mockOnPlayAgain = vi.fn();
  const mockOnMainMenu = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    clearRecordedGames();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders win screen with score', () => {
    render(
      <WinScreen onPlayAgain={mockOnPlayAgain} onMainMenu={mockOnMainMenu} />
    );

    expect(mockIncrementGamesWon).toHaveBeenCalled();
    expect(mockAddEntry).toHaveBeenCalled();
  });

  it('should only record statistics once even when component remounts', () => {
    // First render
    const { unmount } = render(
      <WinScreen onPlayAgain={mockOnPlayAgain} onMainMenu={mockOnMainMenu} />
    );

    // Simulate what React StrictMode does - unmount and remount
    unmount();

    // Second render (simulating StrictMode re-mount)
    render(
      <WinScreen onPlayAgain={mockOnPlayAgain} onMainMenu={mockOnMainMenu} />
    );

    // After fix with useRef, each function should be called exactly once
    // because we track whether recording has already happened
    expect(mockIncrementGamesWon).toHaveBeenCalledTimes(1);
    expect(mockAddEntry).toHaveBeenCalledTimes(1);
    expect(mockAddTime).toHaveBeenCalledTimes(1);
    expect(mockAddMoves).toHaveBeenCalledTimes(1);
  });

  it('should call addEntry with correct parameters', () => {
    render(
      <WinScreen onPlayAgain={mockOnPlayAgain} onMainMenu={mockOnMainMenu} />
    );

    expect(mockAddEntry).toHaveBeenCalledWith({
      difficulty: Difficulty.EASY,
      score: 5000,
      moves: 25,
      time: 60,
    });
  });

  it('should update time and moves statistics', () => {
    render(
      <WinScreen onPlayAgain={mockOnPlayAgain} onMainMenu={mockOnMainMenu} />
    );

    expect(mockAddTime).toHaveBeenCalledWith(60);
    expect(mockAddMoves).toHaveBeenCalledWith(25);
  });
});
