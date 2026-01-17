import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Difficulty,
  LeaderboardEntry,
  GameStatistics,
} from '../engine/types';

interface LeaderboardStore {
  // State
  leaderboard: Record<Difficulty, LeaderboardEntry[]>;
  statistics: GameStatistics;

  // Actions
  addEntry: (entry: Omit<LeaderboardEntry, 'id' | 'date'>) => boolean;
  getTopScores: (difficulty: Difficulty, limit?: number) => LeaderboardEntry[];
  isNewRecord: (difficulty: Difficulty, score: number) => boolean;
  incrementGamesPlayed: () => void;
  incrementGamesWon: () => void;
  addTime: (seconds: number) => void;
  addMoves: (moves: number) => void;
  resetStatistics: () => void;
  resetLeaderboard: () => void;
}

const MAX_ENTRIES_PER_DIFFICULTY = 10;

const defaultLeaderboard: Record<Difficulty, LeaderboardEntry[]> = {
  [Difficulty.EASY]: [],
  [Difficulty.MEDIUM]: [],
  [Difficulty.HARD]: [],
};

const defaultStatistics: GameStatistics = {
  gamesPlayed: 0,
  gamesWon: 0,
  totalTime: 0,
  totalMoves: 0,
};

export const useLeaderboardStore = create<LeaderboardStore>()(
  persist(
    (set, get) => ({
      leaderboard: defaultLeaderboard,
      statistics: defaultStatistics,

      addEntry: (entry) => {
        const { leaderboard } = get();
        const entries = leaderboard[entry.difficulty];

        const newEntry: LeaderboardEntry = {
          ...entry,
          id: crypto.randomUUID(),
          date: new Date().toISOString().split('T')[0] ?? '',
        };

        const updatedEntries = [...entries, newEntry]
          .sort((a, b) => b.score - a.score)
          .slice(0, MAX_ENTRIES_PER_DIFFICULTY);

        const isTopScore = updatedEntries.some((e) => e.id === newEntry.id);

        if (isTopScore) {
          set({
            leaderboard: {
              ...leaderboard,
              [entry.difficulty]: updatedEntries,
            },
          });
        }

        return isTopScore;
      },

      getTopScores: (difficulty, limit = MAX_ENTRIES_PER_DIFFICULTY) => {
        const { leaderboard } = get();
        return leaderboard[difficulty].slice(0, limit);
      },

      isNewRecord: (difficulty, score) => {
        const { leaderboard } = get();
        const entries = leaderboard[difficulty];

        if (entries.length < MAX_ENTRIES_PER_DIFFICULTY) {
          return true;
        }

        const lowestScore = entries[entries.length - 1]?.score ?? 0;
        return score > lowestScore;
      },

      incrementGamesPlayed: () => {
        set((state) => ({
          statistics: {
            ...state.statistics,
            gamesPlayed: state.statistics.gamesPlayed + 1,
          },
        }));
      },

      incrementGamesWon: () => {
        set((state) => ({
          statistics: {
            ...state.statistics,
            gamesWon: state.statistics.gamesWon + 1,
          },
        }));
      },

      addTime: (seconds) => {
        set((state) => ({
          statistics: {
            ...state.statistics,
            totalTime: state.statistics.totalTime + seconds,
          },
        }));
      },

      addMoves: (moves) => {
        set((state) => ({
          statistics: {
            ...state.statistics,
            totalMoves: state.statistics.totalMoves + moves,
          },
        }));
      },

      resetStatistics: () => {
        set({ statistics: defaultStatistics });
      },

      resetLeaderboard: () => {
        set({ leaderboard: defaultLeaderboard });
      },
    }),
    {
      name: 'netwalk-leaderboard',
    }
  )
);
