import { BrowserRouter, Routes, Route } from 'react-router-dom';

function MainMenu() {
  return (
    <div className="menu">
      <h1>NetWalk</h1>
      <p>Игра в разработке...</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
