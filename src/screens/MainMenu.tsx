import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store';
import './Screens.css';

export function MainMenu() {
  const navigate = useNavigate();
  const gameState = useGameStore((state) => state.gameState);
  const hasSavedGame = gameState !== null && !gameState.isCompleted;

  const handleNewGame = () => {
    navigate('/difficulty');
  };

  const handleContinue = () => {
    navigate('/game');
  };

  const handleLeaderboard = () => {
    navigate('/leaderboard');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="screen main-menu">
      <div className="menu-content">
        <h1 className="game-title">NetWalk</h1>
        <p className="game-subtitle">Соедини сеть</p>

        <div className="menu-buttons">
          <button className="btn btn-primary btn-large" onClick={handleNewGame}>
            Новая игра
          </button>

          {hasSavedGame && (
            <button className="btn btn-secondary btn-large" onClick={handleContinue}>
              Продолжить
            </button>
          )}

          <button className="btn btn-secondary btn-large" onClick={handleLeaderboard}>
            Рекорды
          </button>

          <button className="btn btn-secondary btn-large" onClick={handleSettings}>
            Настройки
          </button>
        </div>
      </div>
    </div>
  );
}
