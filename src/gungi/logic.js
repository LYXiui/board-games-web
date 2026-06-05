/**
 * 軍儀（Gungi）官方規則引擎
 * 參考：官方解說書、巴哈姆特 #11918 / #12034 中譯
 * 9×9 · 14 種駒 · 各 25 枚 · 三層疊 · 新 · 段數制（非棋子強弱）
 */

export const SIZE = 9;
export const MAX_STACK = 3;
export const SHIN_ROWS = 6;

/** @typedef {'sente'|'gote'} Side */
/** @typedef {'M'|'G'|'S'|'K'|'Y'|'L'|'N'|'H'|'A'|'C'|'T'|'B'} PieceType */
/** @typedef {{ type: PieceType, owner: Side }} Piece */

export const PIECE = {
  M: { name: '帥', value: 100 },
  G: { name: '侍', value: 8 },
  S: { name: '兵', value: 3 },
  K: { name: '馬', value: 6 },
  Y: { name: '忍', value: 5 },
  L: { name: '小', value: 4 },
  N: { name: '中', value: 7 },
  H: { name: '大', value: 9 },
  A: { name: '弓', value: 6 },
  C: { name: '砲', value: 6 },
  T: { name: '筒', value: 6 },
  B: { name: '謀', value: 7 },
};

export const PIECE_ZH = Object.fromEntries(
  Object.entries(PIECE).map(([k, v]) => [k, v.name]),
);

/** 各方 25 枚（12 種常用配置；解說書共 14 種名稱） */
export const FULL_SET = [
  'M',
  'G', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S',
  'K', 'K',
  'Y', 'Y', 'Y',
  'L', 'L',
  'N', 'N',
  'H',
  'A', 'C', 'T', 'B',
];

const ORTHO = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const KING_DIRS = [...ORTHO, ...DIAG];
const KNIGHT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];

export function opponent(side) {
  return side === 'sente' ? 'gote' : 'sente';
}

export function pieceLabel(piece) {
  return piece ? PIECE[piece.type].name : '';
}

function forward(side) {
  return side === 'sente' ? -1 : 1;
}

function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function stackHeight(board, r, c) {
  return board[r][c].length;
}

function topPiece(board, r, c) {
  const s = board[r][c];
  return s.length ? s[s.length - 1] : null;
}

function hasMarshal(board, owner) {
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      for (const p of board[r][c]) {
        if (p.type === 'M' && p.owner === owner) return true;
      }
    }
  }
  return false;
}

/** 自陣三行（配置用） */
export function deployRows(side) {
  return side === 'sente' ? [6, 7, 8] : [0, 1, 2];
}

/** 「新」可打入：自陣起算 6 橫行以內 */
export function shinRows(side) {
  return side === 'sente' ? [3, 4, 5, 6, 7, 8] : [0, 1, 2, 3, 4, 5];
}

export function emptyBoard() {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => []),
  );
}

export function cloneBoard(board) {
  return board.map((row) => row.map((stack) => stack.map((p) => ({ ...p }))));
}

function cloneHands(hands) {
  return { sente: [...hands.sente], gote: [...hands.gote] };
}

function tierBonus(height) {
  return Math.max(0, height - 1);
}

/** 最前線己方棋子列（新 不可越過） */
function frontmostOwnRow(board, side) {
  let best = side === 'sente' ? SIZE : -1;
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (board[r][c].some((p) => p.owner === side)) {
        if (side === 'sente') best = Math.min(best, r);
        else best = Math.max(best, r);
      }
    }
  }
  return best;
}

function canShinAt(board, side, r) {
  if (!shinRows(side).includes(r)) return false;
  const front = frontmostOwnRow(board, side);
  if (side === 'sente') return r >= front;
  return r <= front;
}

/** 段數制：攻擊方柱高 >= 守方柱高 方可吃或疊敵 */
function canAssault(attackerH, defenderH) {
  return attackerH >= defenderH && defenderH > 0;
}

/** 疊己方子：移動柱高 > 目標柱高，且未滿三層、目標非帥 */
function canStackOwn(board, tr, tc, attackerH, side) {
  const destH = stackHeight(board, tr, tc);
  if (destH === 0 || destH >= MAX_STACK) return false;
  const top = topPiece(board, tr, tc);
  if (!top || top.owner !== side) return false;
  if (top.type === 'M') return false;
  return attackerH > destH;
}

/** 疊敵方子：段數允許且未滿三層、頂子非帥上疊（帥上不可疊） */
function canStackEnemy(board, tr, tc, attackerH) {
  const destH = stackHeight(board, tr, tc);
  if (destH === 0 || destH >= MAX_STACK) return false;
  const top = topPiece(board, tr, tc);
  if (!top || top.type === 'M') return false;
  return canAssault(attackerH, destH);
}

function rayCells(board, r, c, dr, dc, maxSteps, canPass) {
  const cells = [];
  for (let i = 1; i <= maxSteps; i += 1) {
    const nr = r + dr * i;
    const nc = c + dc * i;
    if (!inBounds(nr, nc)) break;
    cells.push([nr, nc]);
    if (stackHeight(board, nr, nc) > 0 && !canPass(nr, nc)) break;
  }
  return cells;
}

/** 砲・筒・弓：飛越同段或較低段之柱 */
function specialJumpTargets(board, r, c, side, height, dirs) {
  const moves = [];
  const flyOver = 1 + height;
  const landDist = flyOver + 1;

  for (const [dr, dc] of dirs) {
    for (let d = 1; d <= landDist; d += 1) {
      const nr = r + dr * d;
      const nc = c + dc * d;
      if (!inBounds(nr, nc)) break;

      if (d <= flyOver) {
        const h = stackHeight(board, nr, nc);
        if (h > 0 && h > height) break;
        continue;
      }

      moves.push([nr, nc]);
      break;
    }
  }
  return moves;
}

function moveTargets(board, r, c, side) {
  const stack = board[r][c];
  const piece = stack[stack.length - 1];
  const h = stack.length;
  const bonus = tierBonus(h);
  const t = piece.type;
  const targets = new Set();
  const add = ([nr, nc]) => {
    if (inBounds(nr, nc)) targets.add(`${nr},${nc}`);
  };

  if (t === 'M') {
    for (const [dr, dc] of KING_DIRS) add([r + dr, c + dc]);
    return [...targets].map((k) => k.split(',').map(Number));
  }

  if (t === 'K') {
    for (const [dr, dc] of KNIGHT) add([r + dr, c + dc]);
    return [...targets].map((k) => k.split(',').map(Number));
  }

  if (t === 'Y') {
    for (const [dr, dc] of KING_DIRS) {
      for (let i = 1; i <= 1 + bonus; i += 1) add([r + dr * i, c + dc * i]);
    }
    return [...targets].map((k) => k.split(',').map(Number));
  }

  if (t === 'S') {
    const f = forward(side);
    for (let i = 1; i <= 1 + bonus; i += 1) add([r + f * i, c]);
    return [...targets].map((k) => k.split(',').map(Number));
  }

  if (t === 'G' || t === 'L') {
    const steps = (t === 'G' ? 1 : 1) + bonus;
    for (const [dr, dc] of ORTHO) {
      for (const [nr, nc] of rayCells(board, r, c, dr, dc, steps, () => false)) {
        add([nr, nc]);
      }
    }
    return [...targets].map((k) => k.split(',').map(Number));
  }

  if (t === 'N' || t === 'H') {
    for (const [dr, dc] of ORTHO) {
      for (const [nr, nc] of rayCells(board, r, c, dr, dc, SIZE, () => false)) {
        add([nr, nc]);
      }
    }
    return [...targets].map((k) => k.split(',').map(Number));
  }

  if (t === 'C' || t === 'T') {
    for (const [nr, nc] of specialJumpTargets(board, r, c, side, h, ORTHO)) add([nr, nc]);
    if (h === 1) {
      const f = forward(side);
      add([r + f, c]);
      add([r + f * 2, c]);
    }
    return [...targets].map((k) => k.split(',').map(Number));
  }

  if (t === 'A') {
    for (const [nr, nc] of specialJumpTargets(board, r, c, side, h, DIAG)) add([nr, nc]);
    return [...targets].map((k) => k.split(',').map(Number));
  }

  if (t === 'B') {
    for (const [dr, dc] of KING_DIRS) add([r + dr, c + dc]);
    return [...targets].map((k) => k.split(',').map(Number));
  }

  return [];
}

function classifyTarget(board, fr, fc, tr, tc, side, attackerH, top) {
  const destH = stackHeight(board, tr, tc);
  const moves = [];

  if (destH === 0) {
    moves.push({ fr, fc, tr, tc, kind: 'move' });
    return moves;
  }

  const destTop = topPiece(board, tr, tc);

  if (destTop.owner === side) {
    if (canStackOwn(board, tr, tc, attackerH, side)) {
      moves.push({ fr, fc, tr, tc, kind: 'stack' });
    }
    return moves;
  }

  if (!canAssault(attackerH, destH)) return moves;

  if (destH === 1) {
    moves.push({ fr, fc, tr, tc, kind: 'capture' });
  } else {
    moves.push({ fr, fc, tr, tc, kind: 'strike' });
    if (attackerH >= destH) {
      moves.push({ fr, fc, tr, tc, kind: 'captureStack' });
    }
  }

  if (canStackEnemy(board, tr, tc, attackerH)) {
    moves.push({ fr, fc, tr, tc, kind: 'stack' });
  }

  if (top.type === 'B' && destTop.owner !== side) {
    moves.push({ fr, fc, tr, tc, kind: 'stack', oubou: true });
  }

  return moves;
}

function getMovesFromCell(state, r, c, owner) {
  const { board, hands } = state;
  const stack = board[r][c];
  if (!stack.length) return [];
  const top = stack[stack.length - 1];
  if (top.owner !== owner) return [];

  const attackerH = stack.length;
  const moves = [];

  for (const [tr, tc] of moveTargets(board, r, c, owner)) {
    moves.push(...classifyTarget(board, r, c, tr, tc, owner, attackerH, top));
  }

  return moves;
}

function getShinMoves(state, owner, type) {
  const { board, hands } = state;
  if (!hands[owner].includes(type) || type === 'M') return [];

  const moves = [];
  for (const r of shinRows(owner)) {
    if (!canShinAt(board, owner, r)) continue;
    for (let c = 0; c < SIZE; c += 1) {
      const h = stackHeight(board, r, c);
      if (h === 0) {
        moves.push({ shin: true, type, tr: r, tc: c, kind: 'shinDrop' });
      } else {
        const top = topPiece(board, r, c);
        if (top.owner === owner && top.type !== 'M' && h < MAX_STACK) {
          moves.push({ shin: true, type, tr: r, tc: c, kind: 'shinStack' });
        }
      }
    }
  }
  return moves;
}

function getOubouMoves(state, owner) {
  const { board, hands } = state;
  const moves = [];
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const stack = board[r][c];
      if (stack.length < 2) continue;
      const top = stack[stack.length - 1];
      if (top.type !== 'B' || top.owner !== owner) continue;
      const enemy = stack[stack.length - 2];
      if (enemy.owner === owner) continue;
      if (hands[owner].includes(enemy.type)) {
        moves.push({ oubou: true, tr: r, tc: c, replaceType: enemy.type });
      }
    }
  }
  return moves;
}

function getPseudoLegalMoves(state, owner) {
  const moves = [];
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      moves.push(...getMovesFromCell(state, r, c, owner));
    }
  }
  const types = [...new Set(state.hands[owner])];
  for (const type of types) {
    moves.push(...getShinMoves(state, owner, type));
  }
  moves.push(...getOubouMoves(state, owner));
  return moves;
}

function applyCaptureStack(board, tr, tc, attackerPiece, attackerH) {
  const stack = board[tr][tc];
  const enemy = stack.filter((p) => p.owner !== attackerPiece.owner);
  const own = stack.filter((p) => p.owner === attackerPiece.owner);

  if (enemy.length === 0) {
    board[tr][tc] = [attackerPiece];
    return;
  }

  if (attackerH >= stack.length) {
    board[tr][tc] = [attackerPiece];
    return;
  }

  const kept = own.length ? [own[0]] : [];
  board[tr][tc] = [...kept, attackerPiece];
}

function applyMoveRaw(state, move) {
  const next = {
    board: cloneBoard(state.board),
    hands: cloneHands(state.hands),
    turn: opponent(state.turn),
    moveCount: state.moveCount + 1,
    positionCounts: { ...state.positionCounts },
  };
  const side = state.turn;

  if (move.oubou && !move.fr) {
    const stack = next.board[move.tr][move.tc];
    const enemyType = move.replaceType;
    const filtered = stack.filter((p, i) => i < stack.length - 2 || p.type !== enemyType || p.owner === side);
    next.board[move.tr][move.tc] = filtered.length ? filtered : stack.slice(0, -1);
    const idx = next.hands[side].indexOf(enemyType);
    if (idx >= 0) next.hands[side].splice(idx, 1);
    next.board[move.tr][move.tc].push({ type: enemyType, owner: side });
    return next;
  }

  if (move.shin) {
    const hand = next.hands[side];
    const idx = hand.indexOf(move.type);
    if (idx >= 0) hand.splice(idx, 1);
    if (move.kind === 'shinDrop') {
      next.board[move.tr][move.tc].push({ type: move.type, owner: side });
    } else {
      next.board[move.tr][move.tc].push({ type: move.type, owner: side });
    }
    return next;
  }

  const { fr, fc, tr, tc, kind } = move;
  const fromStack = next.board[fr][fc];
  const attackerH = fromStack.length;
  const piece = fromStack.pop();
  if (fromStack.length === 0) next.board[fr][fc] = [];

  if (kind === 'move') {
    next.board[tr][tc].push(piece);
  } else if (kind === 'stack') {
    next.board[tr][tc].push(piece);
  } else if (kind === 'strike') {
    next.board[tr][tc].pop();
    next.board[tr][tc].push(piece);
  } else if (kind === 'capture') {
    next.board[tr][tc] = [piece];
  } else if (kind === 'captureStack') {
    applyCaptureStack(next.board, tr, tc, piece, attackerH);
  }

  return next;
}

function leavesMarshalSafe(state, owner) {
  return hasMarshal(state.board, owner);
}

export function getLegalMoves(state, owner) {
  if (state.turn !== owner) return [];
  return getPseudoLegalMoves(state, owner).filter((m) => {
    const sim = applyMoveRaw(state, m);
    return leavesMarshalSafe(sim, owner);
  });
}

export function applyMove(state, move) {
  const next = applyMoveRaw(state, move);
  const key = positionKey(next);
  next.positionCounts[key] = (next.positionCounts[key] || 0) + 1;
  return next;
}

function positionKey(state) {
  const parts = [];
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const s = state.board[r][c];
      if (s.length) {
        parts.push(`${r}${c}:${s.map((p) => `${p.owner[0]}${p.type}`).join('/')}`);
      }
    }
  }
  parts.push(`h${state.hands.sente.sort().join('')}|${state.hands.gote.sort().join('')}`);
  parts.push(state.turn);
  return parts.join(';');
}

/** 入門推薦配置（盤面 22 枚／方，餘 3 枚持駒可「新」） */
function placeOpening(board, side) {
  const back = side === 'gote' ? 0 : 8;
  const mid = side === 'gote' ? 1 : 7;
  const o = side;

  board[back][4] = [{ type: 'M', owner: o }];
  const backTypes = ['G', 'K', 'Y', 'N', 'L', 'N', 'Y', 'K', 'G'];
  for (let c = 0; c < SIZE; c += 1) {
    if (c === 4) continue;
    board[back][c] = [{ type: backTypes[c], owner: o }];
  }
  for (let c = 0; c < SIZE; c += 1) {
    board[mid][c] = [{ type: 'S', owner: o }];
  }
}

function remainingHand(fullSet, placed) {
  const hand = [...fullSet];
  for (const t of placed) {
    const i = hand.indexOf(t);
    if (i >= 0) hand.splice(i, 1);
  }
  return hand;
}

export function defaultGame() {
  const board = emptyBoard();
  placeOpening(board, 'gote');
  placeOpening(board, 'sente');

  const placedSente = [];
  const placedGote = [];
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      for (const p of board[r][c]) {
        if (p.owner === 'sente') placedSente.push(p.type);
        else placedGote.push(p.type);
      }
    }
  }

  const state = {
    board,
    hands: {
      sente: remainingHand(FULL_SET, placedSente),
      gote: remainingHand(FULL_SET, placedGote),
    },
    turn: 'sente',
    moveCount: 0,
    positionCounts: {},
  };
  const key = positionKey(state);
  state.positionCounts[key] = 1;
  return state;
}

export function findMarshal(board, owner) {
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      for (const p of board[r][c]) {
        if (p.type === 'M' && p.owner === owner) return [r, c];
      }
    }
  }
  return null;
}

export function isMarshalThreatened(state, owner) {
  const pos = findMarshal(state.board, owner);
  if (!pos) return true;
  const [mr, mc] = pos;
  const opp = opponent(owner);
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      for (const m of getMovesFromCell({ ...state, turn: opp }, r, c, opp)) {
        if (m.tr === mr && m.tc === mc && ['capture', 'strike', 'captureStack'].includes(m.kind)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function getGameResult(state) {
  if (!hasMarshal(state.board, 'sente')) {
    return { type: 'win', winner: 'gote', reason: '先手帥被移出棋局' };
  }
  if (!hasMarshal(state.board, 'gote')) {
    return { type: 'win', winner: 'sente', reason: '後手帥被移出棋局' };
  }

  const rep = Object.values(state.positionCounts || {}).find((n) => n >= 4);
  if (rep) {
    return { type: 'draw', reason: '千日手（同一局面四次）' };
  }

  const turn = state.turn;
  const legal = getLegalMoves(state, turn);
  if (legal.length === 0) {
    if (isMarshalThreatened(state, turn)) {
      return {
        type: 'win',
        winner: opponent(turn),
        reason: turn === 'sente' ? '先手帥被將死' : '後手帥被將死',
      };
    }
    return { type: 'draw', reason: '無合法手' };
  }

  return null;
}

export function formatMoveBrief(state, move) {
  if (move.oubou && !move.fr) {
    return `謀・回家睡覺 ${PIECE_ZH[move.replaceType]}@(${move.tr},${move.tc})`;
  }
  if (move.shin) {
    const k = move.kind === 'shinStack' ? '新疊' : '新';
    return `${k}${PIECE_ZH[move.type]}→(${move.tr},${move.tc})`;
  }
  const p = state.board[move.fr][move.fc];
  const top = p[p.length - 1];
  const h = p.length;
  const kindZh = {
    move: '移',
    stack: '疊',
    capture: '取',
    strike: '打',
    captureStack: '全取',
  }[move.kind] || '';
  return `${h}-${PIECE_ZH[top.type]}${kindZh} (${move.fr},${move.fc})→(${move.tr},${move.tc})`;
}

/** 同格多種著法時供 UI 選擇 */
export function getMovesForTarget(state, owner, fr, fc, tr, tc) {
  if (fr != null) {
    return getLegalMoves(state, owner).filter(
      (m) => !m.shin && !m.oubou && m.fr === fr && m.fc === fc && m.tr === tr && m.tc === tc,
    );
  }
  return getLegalMoves(state, owner).filter(
    (m) => m.shin && m.tr === tr && m.tc === tc,
  );
}

export function homeZone(side) {
  return deployRows(side);
}
