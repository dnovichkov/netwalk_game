import { useRef, useEffect, useState } from 'react';
import { CellData, CellType } from '../../engine/types';
import './GameBoard.css';

interface CellComponentProps {
  cell: CellData;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function CellComponent({ cell, onClick, onContextMenu }: CellComponentProps) {
  // Track cumulative rotation for smooth animation
  const rotationRef = useRef(cell.rotation * 90);
  const prevRotationRef = useRef(cell.rotation);
  const prevConnectedRef = useRef(cell.isConnected);
  const [justConnected, setJustConnected] = useState(false);

  useEffect(() => {
    const prevRotation = prevRotationRef.current;
    const newRotation = cell.rotation;

    if (prevRotation !== newRotation) {
      // Calculate the shortest rotation direction
      let delta = newRotation - prevRotation;

      // Handle wrap-around (e.g., 3 -> 0 should be +1, not -3)
      if (delta === -3) delta = 1;
      if (delta === 3) delta = -1;

      rotationRef.current += delta * 90;
      prevRotationRef.current = newRotation;
    }
  }, [cell.rotation]);

  // Track connection state changes for animation
  useEffect(() => {
    const wasConnected = prevConnectedRef.current;
    const isNowConnected = cell.isConnected;

    if (!wasConnected && isNowConnected) {
      // Cell just got connected - trigger animation
      setJustConnected(true);
      const timer = setTimeout(() => setJustConnected(false), 300);
      return () => clearTimeout(timer);
    }

    prevConnectedRef.current = isNowConnected;
  }, [cell.isConnected]);

  const getCellClass = () => {
    const classes = ['cell'];

    if (cell.isConnected) {
      classes.push('connected');
    }

    if (justConnected) {
      classes.push('just-connected');
    }

    if (cell.isLocked) {
      classes.push('locked');
    }

    classes.push(`cell-${cell.type}`);

    return classes.join(' ');
  };

  const renderCellContent = () => {
    switch (cell.type) {
      case CellType.SERVER:
        return <ServerIcon />;
      case CellType.COMPUTER:
        return <ComputerIcon connected={cell.isConnected} />;
      case CellType.STRAIGHT:
        return <StraightCable connected={cell.isConnected} />;
      case CellType.CORNER:
        return <CornerCable connected={cell.isConnected} />;
      case CellType.T_JUNCTION:
        return <TJunctionCable connected={cell.isConnected} />;
      case CellType.CROSS:
        return <CrossCable connected={cell.isConnected} />;
      case CellType.EMPTY:
      default:
        return null;
    }
  };

  return (
    <div
      className={getCellClass()}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{
        transform: `rotate(${rotationRef.current}deg)`,
      }}
    >
      {renderCellContent()}
    </div>
  );
}

function ServerIcon() {
  return (
    <svg viewBox="0 0 100 100" className="cell-icon server-icon">
      {/* Server connections */}
      <line x1="50" y1="0" x2="50" y2="25" className="cable connected" />
      <line x1="100" y1="50" x2="75" y2="50" className="cable connected" />
      <line x1="50" y1="100" x2="50" y2="75" className="cable connected" />
      <line x1="0" y1="50" x2="25" y2="50" className="cable connected" />
      {/* Server body */}
      <rect x="25" y="25" width="50" height="50" rx="5" className="server-body" />
      <circle cx="40" cy="40" r="5" className="server-led" />
      <circle cx="60" cy="40" r="5" className="server-led" />
      <rect x="35" y="55" width="30" height="5" rx="2" className="server-slot" />
      <rect x="35" y="63" width="30" height="5" rx="2" className="server-slot" />
    </svg>
  );
}

interface CableProps {
  connected: boolean;
}

function ComputerIcon({ connected }: CableProps) {
  const cableClass = connected ? 'cable connected' : 'cable';
  const screenClass = connected ? 'computer-screen on' : 'computer-screen';

  return (
    <svg viewBox="0 0 100 100" className="cell-icon">
      {/* Cable going up */}
      <line x1="50" y1="0" x2="50" y2="30" className={cableClass} />
      {/* Computer monitor */}
      <rect x="25" y="30" width="50" height="40" rx="3" className="computer-body" />
      <rect x="30" y="35" width="40" height="28" rx="2" className={screenClass} />
      {/* Stand */}
      <rect x="40" y="70" width="20" height="8" className="computer-stand" />
      <rect x="30" y="78" width="40" height="5" rx="2" className="computer-base" />
    </svg>
  );
}

function StraightCable({ connected }: CableProps) {
  const cableClass = connected ? 'cable connected' : 'cable';

  return (
    <svg viewBox="0 0 100 100" className="cell-icon">
      <line x1="50" y1="0" x2="50" y2="100" className={cableClass} />
    </svg>
  );
}

function CornerCable({ connected }: CableProps) {
  const cableClass = connected ? 'cable connected' : 'cable';

  return (
    <svg viewBox="0 0 100 100" className="cell-icon">
      <path d="M 50 0 L 50 50 L 100 50" fill="none" className={cableClass} />
    </svg>
  );
}

function TJunctionCable({ connected }: CableProps) {
  const cableClass = connected ? 'cable connected' : 'cable';

  return (
    <svg viewBox="0 0 100 100" className="cell-icon">
      {/* Vertical line up */}
      <line x1="50" y1="0" x2="50" y2="50" className={cableClass} />
      {/* Horizontal line */}
      <line x1="0" y1="50" x2="100" y2="50" className={cableClass} />
    </svg>
  );
}

function CrossCable({ connected }: CableProps) {
  const cableClass = connected ? 'cable connected' : 'cable';

  return (
    <svg viewBox="0 0 100 100" className="cell-icon">
      <line x1="50" y1="0" x2="50" y2="100" className={cableClass} />
      <line x1="0" y1="50" x2="100" y2="50" className={cableClass} />
    </svg>
  );
}
