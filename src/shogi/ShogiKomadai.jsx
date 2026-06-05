import ShogiPiece from './ShogiPiece.jsx';

/** 駒台：木製持駒架 */
export default function ShogiKomadai({ owner, hands, selectedType, onSelect, disabled, label }) {
  const hand = hands[owner] || [];
  const counts = {};
  for (const t of hand) counts[t] = (counts[t] || 0) + 1;
  const types = Object.keys(counts).sort();

  return (
    <div
      className="rounded-sm p-2 border-2"
      style={{
        background: 'linear-gradient(180deg, #c8873e 0%, #a66b2a 100%)',
        borderColor: '#6b4423',
        boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
      }}
    >
      {label && (
        <div
          className="text-[10px] mb-1.5 font-serif tracking-wide text-[#fff8e8]"
          style={{ fontFamily: '"Yu Mincho", "Noto Serif JP", serif' }}
        >
          {label}
        </div>
      )}
      <div
        className="min-h-[3.5rem] rounded-sm px-2 py-2 flex flex-wrap gap-1 items-end justify-start"
        style={{
          background: 'linear-gradient(180deg, #f0d4a0 0%, #e3a869 60%, #d4954a 100%)',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.18)',
          border: '1px solid #8b6914',
        }}
      >
        {types.length === 0 ? (
          <div className="text-xs text-[#6b4423]/75 italic w-full text-center py-1 font-serif">持駒なし</div>
        ) : (
          types.map((type) => (
            <button
              key={type}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(selectedType === type ? null : type)}
              className={`relative transition-transform ${
                selectedType === type ? 'scale-105 -translate-y-0.5' : 'hover:-translate-y-0.5'
              } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <ShogiPiece piece={{ type, owner, promoted: false }} size="sm" />
              {counts[type] > 1 && (
                <span className="absolute -top-1 -right-1 text-[9px] bg-[#8b2500] text-[#faf3e0] rounded-full min-w-[1rem] h-4 px-0.5 flex items-center justify-center font-serif border border-[#5c1810]">
                  {counts[type]}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
