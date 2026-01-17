import { useEffect } from 'react';
import { useGameStore } from '../../store';
import './UI.css';

export function Timer() {
  const gameState = useGameStore((state) => state.gameState);
  const tick = useGameStore((state) => state.tick);
  const isPlaying = useGameStore((state) => state.isPlaying);

  useEffect(() => {
    if (!isPlaying || !gameState || gameState.isCompleted || gameState.isPaused) {
      return;
    }

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, gameState?.isCompleted, gameState?.isPaused, tick]);

  if (!gameState) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer">
      <span className="timer-icon">&#9202;</span>
      <span className="timer-value">{formatTime(gameState.elapsedTime)}</span>
    </div>
  );
}
