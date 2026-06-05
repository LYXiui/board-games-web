import { pieceDisplayLabel } from './logic.js';

const SIZE_SCALE = {
  lg: {
    K: { w: '86%', h: '92%' },
    R: { w: '82%', h: '88%' },
    B: { w: '82%', h: '88%' },
    G: { w: '78%', h: '84%' },
    S: { w: '76%', h: '82%' },
    N: { w: '74%', h: '80%' },
    L: { w: '74%', h: '80%' },
    P: { w: '62%', h: '68%' },
  },
  md: {
    K: { w: '88%', h: '94%' },
    R: { w: '84%', h: '90%' },
    B: { w: '84%', h: '90%' },
    G: { w: '80%', h: '86%' },
    S: { w: '78%', h: '84%' },
    N: { w: '76%', h: '82%' },
    L: { w: '76%', h: '82%' },
    P: { w: '68%', h: '74%' },
  },
  sm: {
    K: { w: '80%', h: '86%' },
    R: { w: '76%', h: '82%' },
    B: { w: '76%', h: '82%' },
    G: { w: '72%', h: '78%' },
    S: { w: '70%', h: '76%' },
    N: { w: '68%', h: '74%' },
    L: { w: '68%', h: '74%' },
    P: { w: '60%', h: '66%' },
  },
};

const FONT_PX = {
  lg: { K: 24, R: 21, B: 21, G: 20, S: 19, N: 18, L: 18, P: 16, promoted: 19 },
  md: { K: 19, R: 17, B: 17, G: 16, S: 15, N: 14, L: 14, P: 13, promoted: 15 },
  sm: { K: 15, R: 13, B: 13, G: 12, S: 11, N: 11, L: 11, P: 10, promoted: 11 },
};

const CHAR_GAP = { lg: '-0.12em', md: '-0.1em', sm: '-0.08em' };

function scaleFor(piece, sizeKey) {
  return SIZE_SCALE[sizeKey][piece.type] || SIZE_SCALE[sizeKey].P;
}

function fontPx(piece, sizeKey) {
  const map = FONT_PX[sizeKey];
  if (piece.promoted) return map.promoted;
  return map[piece.type] || map.P;
}

/** 直排駒名：上為第一字（尖端方向），下為第二字 */
function VerticalKomaText({ label, fontSize, gap, promoted }) {
  const chars = [...label];
  return (
    <span
      className="shogi-koma-text inline-flex flex-col items-center justify-center"
      style={{
        fontFamily: promoted
          ? '"Yuji Mai", "Yuji Syuku", "Yu Mincho", serif'
          : '"Yuji Syuku", "Yu Mincho", "MS Mincho", serif',
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        gap,
        paddingTop: '4%',
      }}
    >
      {chars.map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className="block"
          style={{
            transform: i === 0 && chars.length > 1 ? 'scale(1.02)' : undefined,
          }}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

/** 日式將棋駒：木製五邊形楔子＋勘亭流風直排書法 */
export default function ShogiPiece({ piece, size = 'md' }) {
  if (!piece) return null;
  const label = pieceDisplayLabel(piece);
  const isGote = piece.owner === 'gote';
  const sizeKey = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md';
  const { w, h } = scaleFor(piece, sizeKey);
  const fs = fontPx(piece, sizeKey);
  const promoted = piece.promoted;

  return (
    <span
      className={`inline-flex items-center justify-center select-none ${
        isGote ? 'rotate-180' : ''
      }`}
      style={{
        width: w,
        height: h,
        clipPath: 'polygon(50% 0%, 100% 11%, 100% 100%, 0% 100%, 0% 11%)',
        background: 'linear-gradient(168deg, #fffef8 0%, #fdf5e6 40%, #f0e4cc 100%)',
        borderBottom: sizeKey === 'lg' ? '3px solid #b8956a' : '2px solid #b8956a',
        boxShadow: '0 2px 5px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.65)',
        color: promoted ? '#b91c1c' : '#141414',
      }}
      title={label}
    >
      <VerticalKomaText
        label={label}
        fontSize={fs}
        gap={CHAR_GAP[sizeKey]}
        promoted={promoted}
      />
    </span>
  );
}
