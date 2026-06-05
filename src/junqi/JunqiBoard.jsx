import { COLS, CAMPS, HQ, RAILS, FRONTLINE } from './logic.js';

function isHq(r, c) {
  return HQ.red.some(([hr, hc]) => hr === r && hc === c)
    || HQ.blue.some(([hr, hc]) => hr === r && hc === c);
}

function isMountain(r, c) {
  return (r === 5 || r === 6) && (c === 1 || c === 3);
}

function isFrontPost(r, c) {
  return (r === 5 || r === 6) && (c === 0 || c === 2 || c === 4);
}

function cellKind(r, c) {
  if (isHq(r, c)) return 'hq';
  if (isMountain(r, c)) return 'mountain';
  if (isFrontPost(r, c)) return 'front';
  if (CAMPS.has(`${r},${c}`)) return 'camp';
  return 'station';
}

function nodeLabel(r, c) {
  const kind = cellKind(r, c);
  if (kind === 'hq') return '大本營';
  if (kind === 'mountain') return '山界';
  if (kind === 'front') return '前線';
  if (kind === 'camp') return '行營';
  return '兵站';
}

function pos(c, dr, cellW, cellH) {
  return { x: (c + 0.5) * cellW, y: (dr + 0.5) * cellH };
}

function roadSegs(displayRows, cellW, cellH) {
  const segs = [];
  const h = displayRows.length;
  const add = (dr0, c0, dr1, c1) => {
    const p0 = pos(c0, dr0, cellW, cellH);
    const p1 = pos(c1, dr1, cellW, cellH);
    segs.push({ x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y });
  };

  for (let dr = 0; dr < h; dr += 1) {
    const r = displayRows[dr];
    for (let c = 0; c < COLS - 1; c += 1) {
      const r1 = displayRows[dr];
      if (!isMountain(r, c) && !isMountain(r1, c + 1)) add(dr, c, dr, c + 1);
    }
  }
  for (let c = 0; c < COLS; c += 1) {
    for (let dr = 0; dr < h - 1; dr += 1) {
      const r0 = displayRows[dr];
      const r1 = displayRows[dr + 1];
      if (!isMountain(r0, c) && !isMountain(r1, c)) add(dr, c, dr + 1, c);
    }
  }

  for (let dr = 0; dr < h; dr += 1) {
    const r = displayRows[dr];
    for (let c = 0; c < COLS; c += 1) {
      if (!CAMPS.has(`${r},${c}`)) continue;
      for (const [ddr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
        const ndr = dr + ddr;
        const nc = c + dc;
        if (ndr < 0 || ndr >= h || nc < 0 || nc >= COLS) continue;
        const nr = displayRows[ndr];
        if (isMountain(nr, nc) || isMountain(r, c)) continue;
        if (CAMPS.has(`${nr},${nc}`)) continue;
        add(dr, c, ndr, nc);
      }
    }
  }

  return segs;
}

function railSegs(displayRows, cellW, cellH) {
  const segs = [];
  const h = displayRows.length;
  const add = (dr0, c0, dr1, c1) => {
    const p0 = pos(c0, dr0, cellW, cellH);
    const p1 = pos(c1, dr1, cellW, cellH);
    segs.push({ x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y });
  };

  for (let dr = 0; dr < h; dr += 1) {
    for (let c = 0; c < COLS - 1; c += 1) {
      const r = displayRows[dr];
      if (RAILS.has(`${r},${c}`) && RAILS.has(`${r},${c + 1}`)) add(dr, c, dr, c + 1);
    }
  }
  for (let c = 0; c < COLS; c += 1) {
    for (let dr = 0; dr < h - 1; dr += 1) {
      const r0 = displayRows[dr];
      const r1 = displayRows[dr + 1];
      if (RAILS.has(`${r0},${c}`) && RAILS.has(`${r1},${c}`)) add(dr, c, dr + 1, c);
    }
  }
  return segs;
}

function NodeShape({ r, c, dr, cellW, cellH, displayRows }) {
  const kind = cellKind(r, c);
  const label = nodeLabel(r, c);
  const { x, y } = pos(c, dr, cellW, cellH);
  const isTopHalf = r <= 5;
  const fontSize = Math.min(cellW, cellH) * 0.17;

  if (kind === 'mountain') {
    const rad = Math.min(cellW, cellH) * 0.34;
    return (
      <g>
        <circle cx={x} cy={y} r={rad} fill="#fff" stroke="#000" strokeWidth="1.8" />
        <circle cx={x} cy={y} r={rad * 0.62} fill="none" stroke="#000" strokeWidth="1.2" />
        <text
          x={x}
          y={y + fontSize * 0.35}
          textAnchor="middle"
          fontSize={fontSize}
          fill="#000"
          fontFamily="'Noto Serif TC', 'SimSun', serif"
        >
          {label}
        </text>
      </g>
    );
  }

  if (kind === 'hq') {
    const w = cellW * 0.72;
    const h = cellH * 0.42;
    const archH = cellH * 0.28;
    const left = x - w / 2;
    const flatY = isTopHalf ? y + h * 0.15 : y - h * 0.15;
    const path = isTopHalf
      ? `M ${left} ${flatY} L ${left} ${flatY - archH} A ${w / 2} ${archH} 0 0 1 ${left + w} ${flatY - archH} L ${left + w} ${flatY} Z`
      : `M ${left} ${flatY} L ${left} ${flatY + archH} A ${w / 2} ${archH} 0 0 0 ${left + w} ${flatY + archH} L ${left + w} ${flatY} Z`;
    return (
      <g>
        <path d={path} fill="#000" stroke="#000" strokeWidth="1" />
        <text
          x={x}
          y={y + (isTopHalf ? fontSize * 0.2 : -fontSize * 0.15)}
          textAnchor="middle"
          fontSize={fontSize}
          fill="#fff"
          fontFamily="'Noto Serif TC', 'SimSun', serif"
        >
          {label}
        </text>
      </g>
    );
  }

  if (kind === 'camp') {
    const rad = Math.min(cellW, cellH) * 0.3;
    return (
      <g>
        <circle cx={x} cy={y} r={rad} fill="#fff" stroke="#000" strokeWidth="1.5" />
        <text
          x={x}
          y={y + fontSize * 0.35}
          textAnchor="middle"
          fontSize={fontSize}
          fill="#000"
          fontFamily="'Noto Serif TC', 'SimSun', serif"
        >
          {label}
        </text>
      </g>
    );
  }

  const rw = cellW * 0.78;
  const rh = cellH * 0.34;
  return (
    <g>
      <rect
        x={x - rw / 2}
        y={y - rh / 2}
        width={rw}
        height={rh}
        fill="#fff"
        stroke="#000"
        strokeWidth="1.5"
        rx="1"
      />
      <text
        x={x}
        y={y + fontSize * 0.35}
        textAnchor="middle"
        fontSize={fontSize}
        fill="#000"
        fontFamily="'Noto Serif TC', 'SimSun', serif"
      >
        {label}
      </text>
    </g>
  );
}

/** 陸軍棋棋盤示意圖（黑白線稿，對照標準棋盤配圖） */
export default function JunqiBoard({ children, displayRows }) {
  const w = COLS;
  const h = displayRows.length;
  const cellW = 100;
  const cellH = 100;
  const vbW = w * cellW;
  const vbH = h * cellH;

  const roads = roadSegs(displayRows, cellW, cellH);
  const rails = railSegs(displayRows, cellW, cellH);

  return (
    <div
      className="relative inline-block bg-white border-2 border-black shadow-lg"
      style={{ width: 'min(100%, 20rem)' }}
    >
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="block w-full h-auto pointer-events-none"
        aria-hidden
      >
        <rect width={vbW} height={vbH} fill="#fff" />
        {roads.map((s, i) => (
          <line
            key={`rd-${i}`}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke="#000"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        ))}
        {rails.map((s, i) => (
          <line
            key={`rl-${i}`}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke="#000"
            strokeWidth="5"
            strokeDasharray="10 8"
            strokeLinecap="round"
          />
        ))}
        {displayRows.map((r, dr) =>
          Array.from({ length: COLS }, (_, c) => (
            <NodeShape
              key={`node-${r}-${c}`}
              r={r}
              c={c}
              dr={dr}
              cellW={cellW}
              cellH={cellH}
              displayRows={displayRows}
            />
          )),
        )}
      </svg>
      <div
        className="absolute inset-0 grid"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${h}, 1fr)` }}
      >
        {children}
      </div>
    </div>
  );
}

export { cellKind, nodeLabel };
