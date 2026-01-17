import { useGameStore } from '../../store';
import './UI.css';

export function MoveCounter() {
  const moves = useGameStore((state) => state.gameState?.moves ?? 0);

  return (
    <div className="move-counter">
      <span className="move-label">Ходы:</span>
      <span className="move-value">{moves}</span>
    </div>
  );
}
