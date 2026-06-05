/** EZChess 規則引擎（與課程 Python 版一致） */

export const BOARD_SIZE = 8;
export const MAX_MOVES = 40;
export const RESPONSE_MS = 60_000;
export const EXTEND_MS = 120_000;
export const EXTEND_CHANCES = 3;

export const SCORES = {
  A: 3, B: 3, c: 1, d: 1, e: 1, f: 1,
  U: 3, V: 3, w: 1, x: 1, y: 1, z: 1,
};

const SIDE_AB = new Set(['A', 'B', 'c', 'd', 'e', 'f']);
const SIDE_UV = new Set(['U', 'V', 'w', 'x', 'y', 'z']);

const CARDINAL = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIAGONAL = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

export function getSide(piece) {
  if (!piece) return '';
  if (SIDE_AB.has(piece)) return 'AB';
  if (SIDE_UV.has(piece)) return 'UV';
  return '';
}

export function pieceScore(piece) {
  return SCORES[piece] ?? 0;
}

export function defaultGrid() {
  const g = emptyGrid();
  g[0][2] = 'A'; g[0][3] = 'B'; g[0][4] = 'c'; g[0][5] = 'd';
  g[1][2] = 'e'; g[1][3] = 'f';
  g[6][2] = 'U'; g[6][3] = 'V'; g[6][4] = 'w'; g[6][5] = 'x';
  g[7][2] = 'y'; g[7][3] = 'z';
  return g;
}

/** 簡報示意棋形（座標 0–7，空格為 ''） */
export function sampleGridFromSlides() {
  const g = emptyGrid();
  g[1][4] = 'A';
  g[3][5] = 'B';
  g[4][1] = 'c';
  g[3][4] = 'd';
  g[3][1] = 'e';
  g[5][5] = 'f';
  g[2][2] = 'U';
  g[4][3] = 'V';
  g[2][6] = 'x';
  g[6][3] = 'w';
  g[6][4] = 'y';
  g[6][6] = 'z';
  return g;
}

/** 隨機棋型開局：雙方 12 枚棋子隨機分布於棋盤（不重疊） */
export function randomGridOpening() {
  const g = emptyGrid();
  const pieces = ['A', 'B', 'c', 'd', 'e', 'f', 'U', 'V', 'w', 'x', 'y', 'z'];
  const cells = [];
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      cells.push([r, c]);
    }
  }

  for (let i = cells.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  pieces.forEach((piece, idx) => {
    const [r, c] = cells[idx];
    g[r][c] = piece;
  });
  return g;
}

export function emptyGrid() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(''));
}

export function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}

export function getValidMoves(piece, row, col, grid) {
  if (!piece || !(piece in SCORES)) return [];

  let directions = CARDINAL;
  let maxStep = 1;

  if ('AU'.includes(piece)) {
    directions = CARDINAL;
    maxStep = 2;
  } else if ('BV'.includes(piece)) {
    directions = DIAGONAL;
    maxStep = 2;
  } else if ('cdwx'.includes(piece)) {
    directions = CARDINAL;
    maxStep = 1;
  } else if ('efyz'.includes(piece)) {
    directions = DIAGONAL;
    maxStep = 1;
  }

  const side = getSide(piece);
  const moves = new Set();

  for (const [dr, dc] of directions) {
    for (let step = 1; step <= maxStep; step += 1) {
      const nr = row + dr * step;
      const nc = col + dc * step;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
      const target = grid[nr][nc];
      if (!target) {
        moves.add(`${nr},${nc}`);
      } else {
        if (getSide(target) !== side) moves.add(`${nr},${nc}`);
        break;
      }
    }
  }

  return [...moves].map((k) => {
    const [r, c] = k.split(',').map(Number);
    return [r, c];
  });
}

export function isValidMove(grid, piece, fr, fc, tr, tc) {
  if (grid[fr][fc] !== piece) return false;
  const ok = getValidMoves(piece, fr, fc, grid).some(([r, c]) => r === tr && c === tc);
  return ok;
}

/** 執行移動，回傳 { grid, eaten } */
export function applyMove(grid, piece, fr, fc, tr, tc) {
  const next = cloneGrid(grid);
  const eaten = next[tr][tc] || '';
  next[fr][fc] = '';
  next[tr][tc] = piece;
  return { grid: next, eaten };
}

export function formatMove(piece, fr, fc, tr, tc) {
  return `${piece}:(${fr},${fc})-(${tr},${tc})`;
}

/** 棋手介面用：僅棋子與起迄座標 */
export function formatMoveBrief(piece, fr, fc, tr, tc) {
  return `${piece}，從 (${fr},${fc}) 到 (${tr},${tc})`;
}

/** 解析棋步字串，如 B:(3,5)-(2,4) */
export function parseMove(str) {
  const s = str.replace(/\s/g, '');
  const colon = s.indexOf(':');
  if (colon < 0) return null;
  const piece = s.slice(0, colon);
  if (piece.length !== 1 || !(piece in SCORES)) return null;
  const rest = s.slice(colon + 1);
  const dash = rest.indexOf('-');
  if (dash < 0) return null;
  const from = rest.slice(0, dash).replace(/[()]/g, '');
  const to = rest.slice(dash + 1).replace(/[()]/g, '');
  const [fr, fc] = from.split(',').map(Number);
  const [tr, tc] = to.split(',').map(Number);
  if ([fr, fc, tr, tc].some((n) => Number.isNaN(n) || n < 0 || n >= BOARD_SIZE)) return null;
  return { piece, fr, fc, tr, tc };
}

/** 從文字檔 8 行載入 */
export function parseBoardText(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 8);
  const g = emptyGrid();
  for (let r = 0; r < lines.length; r += 1) {
    const row = lines[r].replace(/\s/g, '');
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      const ch = row[c];
      g[r][c] = ch === '.' || ch === '+' || !ch ? '' : ch;
    }
  }
  return g;
}

/** UV 開局調整：任一枚棋子移到任一空格（不限走法） */
export function isValidUvSetup(grid, fr, fc, tr, tc) {
  if (fr === tr && fc === tc) return false;
  const p = grid[fr][fc];
  if (!p) return false;
  if (grid[tr][tc]) return false;
  return true;
}

export function applyUvSetup(grid, fr, fc, tr, tc) {
  if (!isValidUvSetup(grid, fr, fc, tr, tc)) return null;
  const next = cloneGrid(grid);
  const piece = next[fr][fc];
  next[fr][fc] = '';
  next[tr][tc] = piece;
  return next;
}

export function getAllMoves(grid, side) {
  const symbols = side === 'AB' ? SIDE_AB : SIDE_UV;
  const out = [];
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      const p = grid[r][c];
      if (!p || !symbols.has(p)) continue;
      for (const [tr, tc] of getValidMoves(p, r, c, grid)) {
        out.push({ piece: p, fr: r, fc: c, tr, tc });
      }
    }
  }
  return out;
}
