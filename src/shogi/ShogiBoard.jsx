import ShogiPiece from './ShogiPiece.jsx';

/** 将棋盤星位：第 3、6 筋 × 第 3、6 段（四個） */
const HOSHI = new Set(['2,2', '2,5', '5,2', '5,5']);

const FILE_NUM = ['9', '8', '7', '6', '5', '4', '3', '2', '1'];
const RANK_KANJI = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

const WOOD_PATTERN = (
  <defs>
    <pattern id="shogiWood" patternUnits="userSpaceOnUse" width="64" height="64">
      <rect width="64" height="64" fill="#e3a869" />
      <path
        d="M0 32 Q16 27 32 32 T64 32"
        fill="none"
        stroke="#d4954a"
        strokeWidth="0.8"
        opacity="0.45"
      />
      <path
        d="M0 12 Q20 8 40 12 T64 12"
        fill="none"
        stroke="#c8873e"
        strokeWidth="0.6"
        opacity="0.3"
      />
      <path
        d="M0 52 Q24 48 64 52"
        fill="none"
        stroke="#c8873e"
        strokeWidth="0.6"
        opacity="0.25"
      />
    </pattern>
  </defs>
);

const CELL_H = 'calc(var(--shogi-cell) * 1.08)';

/** 木製 9×9 将棋盤（放大版，完整顯示駒形與駒名） */
export default function ShogiBoard({
  size,
  boardFlipped,
  board,
  phase,
  lastMove,
  selected,
  legalTargets,
  inCheckSide,
  onCellClick,
}) {
  return (
    <div
      className="inline-block"
      style={{ '--shogi-cell': 'clamp(3.25rem, 6.8vmin, 5.25rem)' }}
    >
      <div
        className="relative inline-block p-3 sm:p-4 rounded-sm"
        style={{
          background: 'linear-gradient(180deg, #c8873e 0%, #a66b2a 100%)',
          boxShadow: '0 10px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      >
        <div
          className="grid gap-0 mb-1.5"
          style={{ gridTemplateColumns: '1.75rem repeat(9, var(--shogi-cell))' }}
        >
          <span />
          {FILE_NUM.map((n) => (
            <span
              key={n}
              className="text-center text-sm text-[#fff8e8] font-serif"
              style={{ fontFamily: '"Yu Mincho", "Noto Serif JP", serif' }}
            >
              {n}
            </span>
          ))}
        </div>
        <div
          className="relative"
          style={{
            border: '4px solid #6b4423',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.2)',
          }}
        >
          <svg
            className="absolute pointer-events-none"
            style={{ left: '1.75rem', top: 0, width: 'calc(var(--shogi-cell) * 9)', height: `calc(${CELL_H} * 9)` }}
            aria-hidden
          >
            {WOOD_PATTERN}
            <rect width="100%" height="100%" fill="url(#shogiWood)" />
          </svg>
          <div
            className="relative grid gap-0"
            style={{ gridTemplateColumns: '1.75rem repeat(9, var(--shogi-cell))' }}
          >
            {Array.from({ length: size }, (_, dr) => {
              const r = boardFlipped ? size - 1 - dr : dr;
              return (
                <div key={`row-${dr}`} className="contents">
                  <span
                    className="flex items-center justify-center text-sm text-[#fff8e8] font-serif"
                    style={{
                      height: CELL_H,
                      fontFamily: '"Yu Mincho", "Noto Serif JP", serif',
                    }}
                  >
                    {RANK_KANJI[boardFlipped ? size - 1 - dr : dr]}
                  </span>
                  {Array.from({ length: size }, (_, dc) => {
                    const c = dc;
                    const piece = board[r][c];
                    const isFrom =
                      lastMove && !lastMove.drop && lastMove.fr === r && lastMove.fc === c;
                    const isTo = lastMove && lastMove.tr === r && lastMove.tc === c;
                    const isSelected = selected?.r === r && selected?.c === c;
                    const isHint = legalTargets.has(`${r},${c}`);
                    const kingHere = piece?.type === 'K' && inCheckSide === piece.owner;
                    const isHoshi = HOSHI.has(`${r},${c}`);

                    return (
                      <button
                        key={`${r}-${c}`}
                        type="button"
                        onClick={() => onCellClick(dr, dc)}
                        disabled={phase === 'ended' || phase === 'thinking'}
                        className={`relative flex items-center justify-center select-none transition-colors border border-black/85 bg-transparent ${
                          isSelected ? 'ring-2 ring-[#8b2500] ring-inset z-[1]' : ''
                        } ${isHint ? 'bg-emerald-400/35' : ''} ${kingHere ? 'ring-2 ring-red-600 ring-inset' : ''}`}
                        style={{
                          width: 'var(--shogi-cell)',
                          height: CELL_H,
                        }}
                      >
                        {isHoshi && (
                          <span
                            className="absolute pointer-events-none rounded-full bg-black"
                            style={{ width: '12%', height: '12%' }}
                          />
                        )}
                        {isFrom && (
                          <span className="absolute inset-0 ring-2 ring-red-500 ring-inset pointer-events-none z-[2]" />
                        )}
                        {isTo && (
                          <span className="absolute inset-0 ring-2 ring-sky-500 ring-inset pointer-events-none z-[2]" />
                        )}
                        {piece && <ShogiPiece piece={piece} size="lg" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        <div
          className="h-3 sm:h-4 mx-1 rounded-b-sm"
          style={{
            background: 'linear-gradient(180deg, #8b5a2b 0%, #5c3d1e 100%)',
            marginTop: '-1px',
          }}
        />
      </div>
    </div>
  );
}
