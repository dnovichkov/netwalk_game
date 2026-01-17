import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Difficulty } from '../engine/types';
import { useLeaderboardStore } from '../store';
import './Screens.css';

const DIFFICULTY_NAMES: Record<Difficulty, string> = {
  [Difficulty.EASY]: 'Легкий',
  [Difficulty.MEDIUM]: 'Средний',
  [Difficulty.HARD]: 'Сложный',
};

export function LeaderboardScreen() {
  const navigate = useNavigate();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const getTopScores = useLeaderboardStore((state) => state.getTopScores);
  const statistics = useLeaderboardStore((state) => state.statistics);

  const entries = getTopScores(selectedDifficulty);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="screen leaderboard-screen">
      <h2 className="screen-title">Рекорды</h2>

      <div className="difficulty-tabs">
        {Object.values(Difficulty).map((diff) => (
          <button
            key={diff}
            className={`tab ${selectedDifficulty === diff ? 'active' : ''}`}
            onClick={() => setSelectedDifficulty(diff)}
          >
            {DIFFICULTY_NAMES[diff]}
          </button>
        ))}
      </div>

      <div className="leaderboard-table">
        {entries.length === 0 ? (
          <div className="no-entries">
            Пока нет записей
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Очки</th>
                <th>Ходы</th>
                <th>Время</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={entry.id}>
                  <td className="rank">{index + 1}</td>
                  <td className="score">{entry.score}</td>
                  <td>{entry.moves}</td>
                  <td>{formatTime(entry.time)}</td>
                  <td className="date">{entry.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="statistics">
        <h3>Статистика</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{statistics.gamesPlayed}</span>
            <span className="stat-label">Игр сыграно</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{statistics.gamesWon}</span>
            <span className="stat-label">Побед</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{formatTime(statistics.totalTime)}</span>
            <span className="stat-label">Общее время</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{statistics.totalMoves}</span>
            <span className="stat-label">Всего ходов</span>
          </div>
        </div>
      </div>

      <button className="btn btn-secondary" onClick={handleBack}>
        Назад
      </button>
    </div>
  );
}
