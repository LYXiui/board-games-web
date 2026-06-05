import { pieceName } from './logic.js';

/** 陸軍棋棋子：長方體直立棋（參考維基百科陸軍棋圖示） */
export default function JunqiPiece({ piece, revealed }) {
  if (!piece) return null;
  const show = revealed;
  const isRed = piece.owner === 'red';

  if (!show) {
    return (
      <span
        className="relative z-10 flex items-center justify-center select-none"
        style={{ width: '1.65rem', height: '2.15rem' }}
      >
        <span
          className="absolute inset-0 rounded-[2px] shadow-md"
          style={{
            background: 'linear-gradient(180deg, #6b6560 0%, #4a4540 55%, #3a3530 100%)',
            border: '1.5px solid #2a2520',
          }}
        />
        <span
          className="relative text-[11px] font-bold text-stone-300"
          style={{ textShadow: '0 1px 0 rgba(0,0,0,0.5)' }}
        >
          ？
        </span>
      </span>
    );
  }

  return (
    <span
      className="relative z-10 flex items-center justify-center select-none"
      style={{ width: '1.65rem', height: '2.15rem' }}
    >
      <span
        className="absolute inset-0 rounded-[2px] shadow-md"
        style={{
          background: isRed
            ? 'linear-gradient(180deg, #e04545 0%, #b82020 45%, #8b1515 100%)'
            : 'linear-gradient(180deg, #3d7fd4 0%, #1e5aa8 45%, #123d78 100%)',
          border: isRed ? '1.5px solid #ff8080' : '1.5px solid #6eb0ff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      />
      <span
        className="relative text-[9px] sm:text-[10px] font-bold leading-none text-center px-0.5"
        style={{
          writingMode: 'vertical-rl',
          color: '#fff8f0',
          textShadow: '0 1px 1px rgba(0,0,0,0.55)',
          letterSpacing: '0.05em',
        }}
      >
        {pieceName(piece.type)}
      </span>
    </span>
  );
}
