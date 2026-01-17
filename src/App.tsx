import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  MainMenu,
  DifficultySelect,
  GameScreen,
  LeaderboardScreen,
  SettingsScreen,
} from './screens';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/difficulty" element={<DifficultySelect />} />
          <Route path="/game" element={<GameScreen />} />
          <Route path="/leaderboard" element={<LeaderboardScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
