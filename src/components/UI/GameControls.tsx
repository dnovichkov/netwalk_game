import { useGameStore } from '../../store';
import './UI.css';

interface GameControlsProps {
  onPause: () => void;
  onRestart: () => void;
}

export function GameControls({ onPause, onRestart }: GameControlsProps) {
  const undo = useGameStore((state) => state.undo);
  const history = useGameStore((state) => state.history);
  const isCompleted = useGameStore((state) => state.gameState?.isCompleted ?? false);

  const canUndo = history.length > 0 && !isCompleted;

  return (
    <div className="game-controls">
      <button
        className="control-button"
        onClick={undo}
        disabled={!canUndo}
        title="Отменить ход"
      >
        &#8630;
      </button>
      <button
        className="control-button"
        onClick={onPause}
        disabled={isCompleted}
        title="Пауза"
      >
        &#9208;
      </button>
      <button
        className="control-button"
        onClick={onRestart}
        title="Начать заново"
      >
        &#8635;
      </button>
    </div>
  );
}
