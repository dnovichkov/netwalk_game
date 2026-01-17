import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store';
import './Screens.css';

export function SettingsScreen() {
  const navigate = useNavigate();
  const {
    soundEnabled,
    vibrationEnabled,
    showTimer,
    showMoveCounter,
    toggleSound,
    toggleVibration,
    toggleTimer,
    toggleMoveCounter,
  } = useSettingsStore();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="screen settings-screen">
      <h2 className="screen-title">Настройки</h2>

      <div className="settings-list">
        <div className="setting-item">
          <span className="setting-label">Звук</span>
          <button
            className={`toggle ${soundEnabled ? 'on' : 'off'}`}
            onClick={toggleSound}
          >
            {soundEnabled ? 'Вкл' : 'Выкл'}
          </button>
        </div>

        <div className="setting-item">
          <span className="setting-label">Вибрация</span>
          <button
            className={`toggle ${vibrationEnabled ? 'on' : 'off'}`}
            onClick={toggleVibration}
          >
            {vibrationEnabled ? 'Вкл' : 'Выкл'}
          </button>
        </div>

        <div className="setting-item">
          <span className="setting-label">Показывать таймер</span>
          <button
            className={`toggle ${showTimer ? 'on' : 'off'}`}
            onClick={toggleTimer}
          >
            {showTimer ? 'Вкл' : 'Выкл'}
          </button>
        </div>

        <div className="setting-item">
          <span className="setting-label">Показывать счетчик ходов</span>
          <button
            className={`toggle ${showMoveCounter ? 'on' : 'off'}`}
            onClick={toggleMoveCounter}
          >
            {showMoveCounter ? 'Вкл' : 'Выкл'}
          </button>
        </div>
      </div>

      <button className="btn btn-secondary" onClick={handleBack}>
        Назад
      </button>
    </div>
  );
}
