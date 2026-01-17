import { useEffect } from 'react';
import { useGameStore, useLeaderboardStore } from '../../store';
import './UI.css';

interface WinScreenProps {
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export function WinScreen({ onPlayAgain, onMainMenu }: WinScreenProps) {
  const gameState = useGameStore((state) => state.gameState);
  const lastScore = useGameStore((state) => state.lastScore);
  const addEntry = useLeaderboardStore((state) => state.addEntry);
  const isNewRecord = useLeaderboardStore((state) => state.isNewRecord);
  const incrementGamesWon = useLeaderboardStore((state) => state.incrementGamesWon);
  const addTime = useLeaderboardStore((state) => state.addTime);
  const addMoves = useLeaderboardStore((state) => state.addMoves);

  useEffect(() => {
    if (gameState && lastScore) {
      // Update statistics
      incrementGamesWon();
      addTime(gameState.elapsedTime);
      addMoves(gameState.moves);

      // Add to leaderboard
      addEntry({
        difficulty: gameState.difficulty,
        score: lastScore.score,
        moves: gameState.moves,
        time: gameState.elapsedTime,
      });
    }
  }, []);

  if (!gameState || !lastScore) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const showNewRecord = isNewRecord(gameState.difficulty, lastScore.score);

  return (
    <div className="win-screen-overlay">
      <div className="win-screen">
        <h1 className="win-title">Победа!</h1>

        <div className="win-score">
          <span className="score-label">Очки</span>
          <span className="score-value">{lastScore.score}</span>
        </div>

        {showNewRecord && <div className="new-record">Новый рекорд!</div>}

        <div className="win-stats">
          <div className="stat">
            <span className="stat-label">Ходы</span>
            <span className="stat-value">{gameState.moves}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Время</span>
            <span className="stat-value">{formatTime(gameState.elapsedTime)}</span>
          </div>
        </div>

        <div className="win-multipliers">
          <div className="multiplier">
            <span>Множитель времени:</span>
            <span>x{lastScore.timeMultiplier.toFixed(1)}</span>
          </div>
          <div className="multiplier">
            <span>Множитель ходов:</span>
            <span>x{lastScore.movesMultiplier.toFixed(1)}</span>
          </div>
        </div>

        <div className="win-actions">
          <button className="btn btn-primary" onClick={onPlayAgain}>
            Играть снова
          </button>
          <button className="btn btn-secondary" onClick={onMainMenu}>
            Главное меню
          </button>
        </div>
      </div>
    </div>
  );
}
