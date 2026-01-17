import './UI.css';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export function PauseMenu({ onResume, onRestart, onMainMenu }: PauseMenuProps) {
  return (
    <div className="pause-menu-overlay">
      <div className="pause-menu">
        <h2 className="pause-title">Пауза</h2>
        <div className="pause-actions">
          <button className="btn btn-primary" onClick={onResume}>
            Продолжить
          </button>
          <button className="btn btn-secondary" onClick={onRestart}>
            Начать заново
          </button>
          <button className="btn btn-secondary" onClick={onMainMenu}>
            Главное меню
          </button>
        </div>
      </div>
    </div>
  );
}
