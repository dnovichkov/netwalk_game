import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameBoard } from '../components/GameBoard';
import { Timer, MoveCounter, GameControls, PauseMenu, WinScreen } from '../components/UI';
import { useGameStore } from '../store';
import { Difficulty } from '../engine/types';
import './Screens.css';

const DIFFICULTY_NAMES: Record<Difficulty, string> = {
  [Difficulty.EASY]: 'Легкий',
  [Difficulty.MEDIUM]: 'Средний',
  [Difficulty.HARD]: 'Сложный',
};

export function GameScreen() {
  const navigate = useNavigate();
  const gameState = useGameStore((state) => state.gameState);
  const newGame = useGameStore((state) => state.newGame);
  const pause = useGameStore((state) => state.pause);
  const resume = useGameStore((state) => state.resume);

  useEffect(() => {
    if (!gameState) {
      navigate('/');
    }
  }, [gameState, navigate]);

  if (!gameState) {
    return null;
  }

  const handlePause = () => {
    pause();
  };

  const handleResume = () => {
    resume();
  };

  const handleRestart = () => {
    newGame(gameState.difficulty);
  };

  const handleMainMenu = () => {
    navigate('/');
  };

  const handlePlayAgain = () => {
    newGame(gameState.difficulty);
  };

  return (
    <div className="screen game-screen">
      <header className="game-header">
        <div className="game-info">
          <span className="difficulty-badge">
            {DIFFICULTY_NAMES[gameState.difficulty]}
          </span>
        </div>
        <div className="game-stats">
          <MoveCounter />
          <Timer />
        </div>
      </header>

      <main className="game-main">
        <GameBoard />
      </main>

      <footer className="game-footer">
        <GameControls onPause={handlePause} onRestart={handleRestart} />
      </footer>

      {gameState.isPaused && (
        <PauseMenu
          onResume={handleResume}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
        />
      )}

      {gameState.isCompleted && (
        <WinScreen onPlayAgain={handlePlayAgain} onMainMenu={handleMainMenu} />
      )}
    </div>
  );
}
