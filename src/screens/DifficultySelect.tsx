import { useNavigate } from 'react-router-dom';
import { Difficulty, DIFFICULTY_CONFIG } from '../engine/types';
import { useGameStore, useLeaderboardStore } from '../store';
import './Screens.css';

export function DifficultySelect() {
  const navigate = useNavigate();
  const newGame = useGameStore((state) => state.newGame);
  const incrementGamesPlayed = useLeaderboardStore((state) => state.incrementGamesPlayed);

  const handleSelectDifficulty = (difficulty: Difficulty) => {
    incrementGamesPlayed();
    newGame(difficulty);
    navigate('/game');
  };

  const handleBack = () => {
    navigate('/');
  };

  const difficulties = [
    {
      key: Difficulty.EASY,
      name: 'Легкий',
      description: '5×5',
      color: '#00d26a',
    },
    {
      key: Difficulty.MEDIUM,
      name: 'Средний',
      description: '7×7',
      color: '#ffd93d',
    },
    {
      key: Difficulty.HARD,
      name: 'Сложный',
      description: '9×9',
      color: '#ff4757',
    },
  ];

  return (
    <div className="screen difficulty-select">
      <h2 className="screen-title">Выберите сложность</h2>

      <div className="difficulty-cards">
        {difficulties.map((diff) => {
          const config = DIFFICULTY_CONFIG[diff.key];
          return (
            <button
              key={diff.key}
              className="difficulty-card"
              onClick={() => handleSelectDifficulty(diff.key)}
              style={{ '--accent-color': diff.color } as React.CSSProperties}
            >
              <span className="difficulty-name">{diff.name}</span>
              <span className="difficulty-size">{diff.description}</span>
              <span className="difficulty-info">
                {config.minComputers}-{config.maxComputers} ПК
              </span>
            </button>
          );
        })}
      </div>

      <button className="btn btn-secondary" onClick={handleBack}>
        Назад
      </button>
    </div>
  );
}
