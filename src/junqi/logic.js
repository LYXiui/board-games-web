/**
 * 軍棋（陸戰棋）規則引擎 — 暗棋、鐵路、行營、比大小、炸彈、地雷、工兵、軍旗
 */

export const ROWS = 12;
export const COLS = 5;

/** @typedef {'red'|'blue'} Side */
/** @typedef {'F'|'M'|'B'|'E'|'P9'|'P8'|'P7'|'P6'|'P5'|'P4'|'P3'|'P2'} PieceType */

export const PIECE = {
  F: { name: '軍旗', rank: -10, movable: false },
  M: { name: '地雷', rank: -9, movable: false },
  B: { name: '炸彈', rank: -8, movable: true },
  E: { name: '工兵', rank: 1, movable: true },
  P2: { name: '排長', rank: 2, movable: true },
  P3: { name: '連長', rank: 3, movable: true },
  P4: { name: '營長', rank: 4, movable: true },
  P5: { name: '團長', rank: 5, movable: true },
  P6: { name: '旅長', rank: 6, movable: true },
  P7: { name: '師長', rank: 7, movable: true },
  P8: { name: '軍長', rank: 8, movable: true },
  P9: { name: '司令', rank: 9, movable: true },
};

export const SET_TEMPLATE = [
  'F', 'M', 'M', 'M', 'B', 'B',
  'P9', 'P8', 'P7', 'P7', 'P6', 'P6', 'P5', 'P5', 'P4', 'P4',
  'P3', 'P3', 'P3', 'P2', 'P2', 'P2', 'E', 'E', 'E',
];

export const HQ = {
  red: [[11, 1], [11, 3]],
  blue: [[0, 1], [0, 3]],
};

/** 行營座標 */
export const CAMPS = new Set(
  [
    [2, 1], [2, 3], [3, 2], [4, 1], [4, 3],
    [7, 1], [7, 3], [8, 2], [9, 1], [9, 3],
  ].map(([r, c]) => `${r},${c}`),
);

/** 鐵路格（依維基百科陸軍棋：中央直線 + 三條橫向鐵路連接兩陣） */
export const RAILS = new Set(
  [
    ...Array.from({ length: ROWS }, (_, r) => [r, 2]),
    [1, 0], [1, 1], [1, 2], [1, 3], [1, 4],
    [5, 0], [5, 1], [5, 2], [5, 3], [5, 4],
    [6, 0], [6, 1], [6, 2], [6, 3], [6, 4],
    [10, 0], [10, 1], [10, 2], [10, 3], [10, 4],
  ].map(([r, c]) => `${r},${c}`),
);

/** 前線／山界（中央兩橫） */
export const FRONTLINE = new Set(['5,0', '5,1', '5,2', '5,3', '5,4', '6,0', '6,1', '6,2', '6,3', '6,4']);

const RAIL_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export function opponent(side) {
  return side === 'red' ? 'blue' : 'red';
}

export function pieceName(type) {
  return PIECE[type]?.name || type;
}

function inBounds(r, c) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

function isRail(r, c) {
  return RAILS.has(`${r},${c}`);
}

function isHq(r, c, side) {
  return HQ[side].some(([hr, hc]) => hr === r && hc === c);
}

/** 己方部署區：紅 7–11 行、藍 0–4 行（不含敵區） */
function deployZone(side) {
  return side === 'red'
    ? Array.from({ length: 5 }, (_, i) => i + 7)
    : Array.from({ length: 5 }, (_, i) => i);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deploySlots(side) {
  const slots = [];
  for (const r of deployZone(side)) {
    for (let c = 0; c < COLS; c += 1) slots.push([r, c]);
  }
  return { slots, hqSlots: HQ[side] };
}

function autoDeploy(board, side) {
  const types = shuffle(SET_TEMPLATE.filter((t) => t !== 'F'));
  const { slots, hqSlots } = deploySlots(side);
  const flagHq = hqSlots[Math.floor(Math.random() * hqSlots.length)];
  board[flagHq[0]][flagHq[1]] = { type: 'F', owner: side, revealed: false };

  const rest = shuffle(slots.filter(([r, c]) => r !== flagHq[0] || c !== flagHq[1]));
  types.forEach((type, i) => {
    const [r, c] = rest[i];
    board[r][c] = { type, owner: side, revealed: false };
  });
}

function rowsDeploy(side) {
  return deployZone(side);
}

export function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export function cloneBoard(board) {
  return board.map((row) =>
    row.map((p) => (p ? { ...p } : null)),
  );
}

export function defaultGame() {
  const board = emptyBoard();
  autoDeploy(board, 'red');
  autoDeploy(board, 'blue');
  return {
    board,
    turn: 'red',
    moveCount: 0,
    winner: null,
    reason: '',
  };
}

function canEnter(r, c, side, board) {
  if (!inBounds(r, c)) return false;
  if (isHq(r, c, side)) return false;
  return true;
}

function slideRail(board, r, c, dr, dc, side) {
  const moves = [];
  let nr = r + dr;
  let nc = c + dc;
  while (inBounds(nr, nc) && isRail(nr, nc) && canEnter(nr, nc, side, board)) {
    moves.push([nr, nc]);
    if (board[nr][nc]) break;
    nr += dr;
    nc += dc;
  }
  return moves;
}

function stepMoves(board, r, c, side) {
  const moves = [];
  for (const [dr, dc] of RAIL_DIRS) {
    const nr = r + dr;
    const nc = c + dc;
    if (!inBounds(nr, nc) || !canEnter(nr, nc, side, board)) continue;
    moves.push([nr, nc]);
  }
  return moves;
}

function railMoves(board, r, c, side, piece) {
  const moves = [];
  for (const [dr, dc] of RAIL_DIRS) {
    moves.push(...slideRail(board, r, c, dr, dc, side));
  }
  if (piece.type === 'E') {
    return moves;
  }
  return moves.filter(([tr, tc]) => {
    if (tr === r && tc === c) return false;
    const dist = Math.abs(tr - r) + Math.abs(tc - c);
    return dist === 1 || (isRail(r, c) && isRail(tr, tc));
  });
}

export function getMoveTargets(board, r, c, side) {
  const piece = board[r][c];
  if (!piece || piece.owner !== side || !PIECE[piece.type].movable) return [];

  if (isRail(r, c)) {
    const targets = railMoves(board, r, c, side, piece);
    const set = new Map();
    for (const [tr, tc] of targets) {
      const k = `${tr},${tc}`;
      if (!set.has(k)) set.set(k, [tr, tc]);
    }
    return [...set.values()];
  }
  return stepMoves(board, r, c, side);
}

/** 戰鬥結果：'attacker' | 'defender' | 'both' | 'flag' */
export function resolveBattle(attacker, defender) {
  if (defender.type === 'F') return 'flag';
  if (attacker.type === 'B' || defender.type === 'B') return 'both';
  if (defender.type === 'M') {
    return attacker.type === 'E' ? 'defender' : 'attacker';
  }
  const ar = PIECE[attacker.type].rank;
  const dr = PIECE[defender.type].rank;
  if (ar > dr) return 'defender';
  if (ar < dr) return 'attacker';
  return 'both';
}

function getPseudoMoves(state, side) {
  const { board } = state;
  const moves = [];
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const p = board[r][c];
      if (!p || p.owner !== side) continue;
      for (const [tr, tc] of getMoveTargets(board, r, c, side)) {
        const target = board[tr][tc];
        if (!target) {
          moves.push({ fr: r, fc: c, tr, tc, kind: 'move' });
        } else if (target.owner !== side) {
          if (CAMPS.has(`${tr},${tc}`) && !target.revealed) continue;
          moves.push({ fr: r, fc: c, tr, tc, kind: 'attack' });
        }
      }
    }
  }
  return moves;
}

export function getLegalMoves(state, side) {
  if (state.turn !== side || state.winner) return [];
  return getPseudoMoves(state, side);
}

export function applyMove(state, move) {
  const next = {
    board: cloneBoard(state.board),
    turn: opponent(state.turn),
    moveCount: state.moveCount + 1,
    winner: null,
    reason: '',
  };

  const { fr, fc, tr, tc, kind } = move;
  const attacker = next.board[fr][fc];
  attacker.revealed = true;

  if (kind === 'move') {
    next.board[tr][tc] = attacker;
    next.board[fr][fc] = null;
    return next;
  }

  const defender = next.board[tr][tc];
  defender.revealed = true;
  const outcome = resolveBattle(attacker, defender);

  if (outcome === 'flag') {
    next.board[tr][tc] = attacker;
    next.board[fr][fc] = null;
    next.winner = attacker.owner;
    next.reason = '奪得軍旗，獲勝！';
    return next;
  }
  if (outcome === 'both') {
    next.board[tr][tc] = null;
    next.board[fr][fc] = null;
    return next;
  }
  if (outcome === 'attacker') {
    next.board[fr][fc] = null;
    return next;
  }
  next.board[tr][tc] = attacker;
  next.board[fr][fc] = null;
  return next;
}

function hasFlag(board, side) {
  for (const row of board) {
    for (const p of row) {
      if (p && p.type === 'F' && p.owner === side) return true;
    }
  }
  return false;
}

export function getGameResult(state) {
  if (state.winner) {
    return { type: 'win', winner: state.winner, reason: state.reason };
  }
  if (!hasFlag(state.board, 'red')) {
    return { type: 'win', winner: 'blue', reason: '紅方軍旗被奪' };
  }
  if (!hasFlag(state.board, 'blue')) {
    return { type: 'win', winner: 'red', reason: '藍方軍旗被奪' };
  }

  const turn = state.turn;
  if (getLegalMoves(state, turn).length === 0) {
    return {
      type: 'win',
      winner: opponent(turn),
      reason: turn === 'red' ? '紅方無棋可走' : '藍方無棋可走',
    };
  }
  return null;
}

export function formatMoveBrief(state, move) {
  const p = state.board[move.fr][move.fc];
  const name = pieceName(p.type);
  if (move.kind === 'move') {
    return `${name} (${move.fr},${move.fc})→(${move.tr},${move.tc})`;
  }
  const t = state.board[move.tr][move.tc];
  const tname = t ? pieceName(t.type) : '?';
  return `${name} 攻 (${move.fr},${move.fc})→${tname}(${move.tr},${move.tc})`;
}
