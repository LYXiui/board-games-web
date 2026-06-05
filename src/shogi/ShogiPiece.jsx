import { pieceLabel } from './logic.js';

/** 日式將棋駒：木製五邊形（參考 FUN! JAPAN 將棋入門） */
export default function ShogiPiece({ piece, size = 'md' }) {
  if (!piece) return null;
  const label = pieceLabel(piece);
  const isGote = piece.owner === 'gote';
  const sz = size === 'sm' ? 'text-base sm:text-lg w-[82%] h-[86%]' : 'text-lg sm:text-xl w-[85%] h-[88%]';

  return (
    <span
      className={`inline-flex items-center justify-center font-serif font-bold select-none shadow-sm ${sz} ${
        isGote ? 'rotate-180' : ''
      }`}
      style={{
        clipPath: 'polygon(50% 0%, 100% 14%, 100% 100%, 0% 100%, 0% 14%)',
        background: 'linear-gradient(165deg, #faf3e0 0%, #e8d5a8 45%, #d4bc82 100%)',
        borderBottom: '2px solid #8b6914',
        color: '#1a0f08',
        textShadow: '0 1px 0 rgba(255,255,255,0.35)',
      }}
      title={label}
    >
      {label}
    </span>
  );
}
