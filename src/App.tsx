import { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import {
  MainMenu,
  DifficultySelect,
  GameScreen,
  LeaderboardScreen,
  SettingsScreen,
} from './screens';
import { setupBackButton, exitApp } from './utils/capacitor';
import './App.css';

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const cleanup = setupBackButton(() => {
      // If on main menu, exit the app
      // Otherwise, go back in history
      if (location.pathname === '/') {
        exitApp();
      } else {
        navigate(-1);
      }
    });

    return cleanup;
  }, [navigate, location.pathname]);

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/difficulty" element={<DifficultySelect />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/leaderboard" element={<LeaderboardScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
