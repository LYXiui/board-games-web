import { useState } from 'react';
import EZChessApp from './ezchess/EZChessApp.jsx';
import ShogiApp from './shogi/ShogiApp.jsx';
import ChessApp from './chess/ChessApp.jsx';
import GungiApp from './gungi/GungiApp.jsx';
import JunqiApp from './junqi/JunqiApp.jsx';

export default function App() {
  const [mode, setMode] = useState('ezchess');

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 flex flex-wrap border-b border-stone-700 bg-stone-950/95 backdrop-blur">
        <button
          type="button"
          onClick={() => setMode('ezchess')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            mode === 'ezchess'
              ? 'bg-stone-800 text-amber-100 border-b-2 border-amber-500'
              : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          EZChess
        </button>
        <button
          type="button"
          onClick={() => setMode('chess')}
          className={`flex-1 py-2.5 text-sm transition-colors ${
            mode === 'chess'
              ? 'bg-stone-800 text-emerald-100 border-b-2 border-emerald-600'
              : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          西洋棋
        </button>
        <button
          type="button"
          onClick={() => setMode('shogi')}
          className={`flex-1 py-2.5 text-sm font-serif transition-colors ${
            mode === 'shogi'
              ? 'bg-[#3d2817] text-[#f5ecd7] border-b-2 border-[#8b2500]'
              : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          将棋
        </button>
        <button
          type="button"
          onClick={() => setMode('gungi')}
          className={`flex-1 py-2.5 text-sm font-serif transition-colors ${
            mode === 'gungi'
              ? 'bg-[#1f2a1c] text-[#e8f0dc] border-b-2 border-[#6b8058]'
              : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          軍儀
        </button>
        <button
          type="button"
          onClick={() => setMode('junqi')}
          className={`flex-1 py-2.5 text-sm font-serif transition-colors ${
            mode === 'junqi'
              ? 'bg-[#3d2817] text-[#f5e6d3] border-b-2 border-[#c45c26]'
              : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          陸軍棋
        </button>
      </nav>
      {mode === 'ezchess' && <EZChessApp />}
      {mode === 'chess' && <ChessApp />}
      {mode === 'shogi' && <ShogiApp />}
      {mode === 'gungi' && <GungiApp />}
      {mode === 'junqi' && <JunqiApp />}
    </div>
  );
}
