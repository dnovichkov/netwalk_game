import { useCallback } from 'react';
import { CellComponent } from './CellComponent';
import { useGameStore } from '../../store';
import './GameBoard.css';

export function GameBoard() {
  const gameState = useGameStore((state) => state.gameState);
  const rotateCell = useGameStore((state) => state.rotateCell);

  const handleClick = useCallback(
    (x: number, y: number) => {
      rotateCell(x, y, true);
    },
    [rotateCell]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, x: number, y: number) => {
      e.preventDefault();
      rotateCell(x, y, false);
    },
    [rotateCell]
  );

  if (!gameState) {
    return null;
  }

  return (
    <div
      className="game-board"
      style={{
        gridTemplateColumns: `repeat(${gameState.width}, 1fr)`,
        gridTemplateRows: `repeat(${gameState.height}, 1fr)`,
      }}
    >
      {gameState.grid.map((row, y) =>
        row.map((cell, x) => (
          <CellComponent
            key={`${x}-${y}`}
            cell={cell}
            onClick={() => handleClick(x, y)}
            onContextMenu={(e) => handleContextMenu(e, x, y)}
          />
        ))
      )}
    </div>
  );
}
