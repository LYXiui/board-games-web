import { PIECE_ZH } from './logic.js';

/** 軍儀木製駒（參考官方實體版：可疊放、漢字標示） */
export default function GungiPiece({ type, owner, height = 1, compact = false }) {
  const name = PIECE_ZH[type] || type;
  const isSente = owner === 'sente';

  return (
    <span
      className={`relative inline-flex items-center justify-center font-serif font-bold select-none ${
        compact ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 sm:w-10 sm:h-10 text-xs sm:text-sm'
      } ${isSente ? 'text-[#1a1208]' : 'text-[#f5ecd7]'}`}
      style={{
        clipPath: 'polygon(50% 0%, 100% 12%, 100% 100%, 0% 100%, 0% 12%)',
        background: isSente
          ? 'linear-gradient(165deg, #f5e6c8 0%, #c9a86c 55%, #a08050 100%)'
          : 'linear-gradient(165deg, #4a4035 0%, #2a2218 100%)',
        borderBottom: `2px solid ${isSente ? '#6b5030' : '#1a1208'}`,
        boxShadow: height > 1 ? `0 -${(height - 1) * 3}px 0 rgba(0,0,0,0.15)` : undefined,
      }}
      title={height > 1 ? `${name}（${height}段）` : name}
    >
      {name}
      {height > 1 && !compact && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#c9a227] text-[#1a1208] text-[9px] flex items-center justify-center font-sans">
          {height}
        </span>
      )}
    </span>
  );
}
