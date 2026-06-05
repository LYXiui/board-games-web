/**
 * 軍儀（Gungi）— 參考《獵人》軍儀棋與降旗規則之原創實作
 * 9×9、三層疊子、階級制、降旗、持駒打入
 */

export const SIZE = 9;
export const MAX_STACK = 3;

/** @typedef {'sente'|'gote'} Side */
/** @typedef {'M'|'G'|'F'|'A'|'C'|'K'|'Y'|'S'} PieceType */
/** @typedef {{ type: PieceType, owner: Side }} Piece */

export const PIECE = {
  M: { name: '帥', rank: 8 },
  G: { name: '將', rank: 7 },
  F: { name: '砦', rank: 6 },
  A: { name: '弓', rank: 5 },
  C: { name: '砲', rank: 5 },
  K: { name: '馬', rank: 4 },
  Y: { name: '諜', rank: 4 },
  S: { name: '兵', rank: 3 },
};

export const PIECE_ZH = Object.fromEntries(
  Object.entries(PIECE).map(([k, v]) => [k, v.name]),
);

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

/** 己方陣地（可打入） */
export function homeZone(side) {
  return side === 'sente' ? [6, 7, 8] : [0, 1, 2];
}

export function emptyBoard() {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => []),
  );
}

export function cloneBoard(board) {
  return board.map((row) => row.map((stack) => stack.map((p) => ({ ...p }))));
}

function stackHeight(board, r, c) {
  return board[r][c].length;
}

function topPiece(board, r, c) {
  const s = board[r][c];
  return s.length ? s[s.length - 1] : null;
}

function effectiveRank(piece, height) {
  return PIECE[piece.type].rank + (height - 1);
}

function placeStack(board, r, c, pieces) {
  board[r][c] = pieces.map((p) => ({ ...p }));
}

/** 標準開局 */
export function defaultGame() {
  const board = emptyBoard();
  const back = ['F', 'C', 'A', 'G', 'M', 'G', 'A', 'C', 'F'];
  placeStack(board, 0, 4, [{ type: 'M', owner: 'gote' }]);
  for (let c = 0; c < SIZE; c += 1) {
    if (c !== 4 && back[c]) placeStack(board, 0, c, [{ type: back[c], owner: 'gote' }]);
    placeStack(board, 1, c, [{ type: 'S', owner: 'gote' }]);
    placeStack(board, 6, c, [{ type: 'S', owner: 'sente' }]);
    if (c !== 4 && back[c]) placeStack(board, 8, c, [{ type: back[c], owner: 'sente' }]);
  }
  placeStack(board, 8, 4, [{ type: 'M', owner: 'sente' }]);

  return {
    board,
    hands: { sente: [], gote: [] },
    turn: 'sente',
    moveCount: 0,
  };
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

function orthoSteps(board, r, c, steps, side) {
  const moves = [];
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    for (let i = 1; i <= steps; i += 1) {
      const nr = r + dr * i;
      const nc = c + dc * i;
      if (!inBounds(nr, nc)) break;
      moves.push([nr, nc]);
      if (stackHeight(board, nr, nc) > 0) break;
    }
  }
  return moves;
}

function diagSteps(board, r, c, steps) {
  const moves = [];
  for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    for (let i = 1; i <= steps; i += 1) {
      const nr = r + dr * i;
      const nc = c + dc * i;
      if (!inBounds(nr, nc)) break;
      moves.push([nr, nc]);
      if (stackHeight(board, nr, nc) > 0) break;
    }
  }
  return moves;
}

function stepAny(board, r, c, side) {
  const moves = [];
  for (const [dr, dc] of [
    [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1],
  ]) {
    const nr = r + dr;
    const nc = c + dc;
    if (inBounds(nr, nc)) moves.push([nr, nc]);
  }
  return moves;
}

function knightJumps(r, c) {
  const moves = [];
  for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
    const nr = r + dr;
    const nc = c + dc;
    if (inBounds(nr, nc)) moves.push([nr, nc]);
  }
  return moves;
}

function cannonStrike(board, r, c, side, reach) {
  const moves = [];
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    let jumped = false;
    for (let i = 1; i <= reach + 2; i += 1) {
      const nr = r + dr * i;
      const nc = c + dc * i;
      if (!inBounds(nr, nc)) break;
      const h = stackHeight(board, nr, nc);
      if (!jumped) {
        if (h > 0) jumped = true;
        continue;
      }
      if (h > 0) {
        const top = topPiece(board, nr, nc);
        if (top.owner !== side) moves.push([nr, nc]);
        break;
      }
      moves.push([nr, nc]);
      if (i > reach) break;
    }
  }
  return moves;
}

/** 依棋子與疊層高度產生候選落點 */
function moveTargets(board, r, c, side) {
  const stack = board[r][c];
  const piece = stack[stack.length - 1];
  const h = stack.length;
  const bonus = h - 1;
  const t = piece.type;

  if (t === 'F' && h === 1) return [];

  if (t === 'M') return stepAny(board, r, c, side);
  if (t === 'G') return orthoSteps(board, r, c, 1 + Math.min(bonus, 1), side);
  if (t === 'A') return diagSteps(board, r, c, 1 + Math.min(bonus, 2));
  if (t === 'C') return cannonStrike(board, r, c, side, 2 + bonus);
  if (t === 'K') return knightJumps(r, c);
  if (t === 'Y') return stepAny(board, r, c, side);
  if (t === 'S') {
    const f = forward(side);
    const nr = r + f;
    if (inBounds(nr, c)) return [[nr, c]];
    return [];
  }
  return [];
}

function canStackOn(board, fr, fc, tr, tc, side, attacker) {
  const destH = stackHeight(board, tr, tc);
  if (destH >= MAX_STACK) return false;
  if (destH === 0) return false;

  const destTop = topPiece(board, tr, tc);
  const attH = stackHeight(board, fr, fc);
  const attRank = effectiveRank(attacker, attH);

  if (destTop.owner === side) return true;

  const defRank = effectiveRank(destTop, destH);
  return attRank >= defRank;
}

function canCaptureTop(board, tr, tc, side, attacker, fr, fc) {
  const destTop = topPiece(board, tr, tc);
  if (!destTop || destTop.owner === side) return false;
  const attRank = effectiveRank(attacker, stackHeight(board, fr, fc));
  const defRank = effectiveRank(destTop, stackHeight(board, tr, tc));
  return attRank >= defRank;
}

function getMovesFromCell(state, r, c, owner) {
  const { board } = state;
  const stack = board[r][c];
  if (!stack.length) return [];
  const top = stack[stack.length - 1];
  if (top.owner !== owner) return [];

  const moves = [];
  const targets = moveTargets(board, r, c, owner);

  for (const [tr, tc] of targets) {
    const destH = stackHeight(board, tr, tc);

    if (destH === 0) {
      moves.push({ fr: r, fc: c, tr, tc, kind: 'move' });
      continue;
    }

    const destTop = topPiece(board, tr, tc);

    if (destTop.owner === owner && canStackOn(board, r, fc, tr, tc, owner, top)) {
      moves.push({ fr: r, fc: c, tr, tc, kind: 'stack' });
    }

    if (destTop.owner !== owner && canCaptureTop(board, tr, tc, owner, top, r, c)) {
      if (destH === 1) {
        moves.push({ fr: r, fc: c, tr, tc, kind: 'capture' });
      } else {
        moves.push({ fr: r, fc: c, tr, tc, kind: 'strike' });
      }
    }
  }

  return moves;
}

function getDropMoves(state, owner, type) {
  const { board, hands } = state;
  if (!hands[owner].includes(type)) return [];
  const zone = homeZone(owner);
  const moves = [];

  for (const r of zone) {
    for (let c = 0; c < SIZE; c += 1) {
      if (stackHeight(board, r, c) > 0) continue;
      if (type === 'M') continue;
      moves.push({ drop: true, type, tr: r, tc: c });
    }
  }
  return moves;
}

function getPseudoLegalMoves(state, owner) {
  const { board } = state;
  const moves = [];
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      moves.push(...getMovesFromCell(state, r, c, owner));
    }
  }
  const types = [...new Set(state.hands[owner])];
  for (const type of types) {
    moves.push(...getDropMoves(state, owner, type));
  }
  return moves;
}

function applyMoveRaw(state, move) {
  const next = {
    board: cloneBoard(state.board),
    hands: { sente: [...state.hands.sente], gote: [...state.hands.gote] },
    turn: opponent(state.turn),
    moveCount: state.moveCount + 1,
  };

  if (move.drop) {
    next.board[move.tr][move.tc].push({ type: move.type, owner: state.turn });
    const hand = next.hands[state.turn];
    const idx = hand.indexOf(move.type);
    if (idx >= 0) hand.splice(idx, 1);
    return next;
  }

  const { fr, fc, tr, tc, kind } = move;
  const fromStack = next.board[fr][fc];
  const piece = fromStack.pop();

  if (kind === 'move') {
    next.board[tr][tc] = [...next.board[tr][tc], piece];
  } else if (kind === 'stack') {
    next.board[tr][tc].push(piece);
  } else if (kind === 'capture' || kind === 'strike') {
    const captured = next.board[tr][tc].pop();
    next.hands[state.turn].push(captured.type);
    next.board[tr][tc].push(piece);
  }

  return next;
}

function leavesMarshalSafe(state, owner) {
  return findMarshal(state.board, owner) !== null;
}

export function getLegalMoves(state, owner) {
  if (state.turn !== owner) return [];
  return getPseudoLegalMoves(state, owner).filter((m) => {
    const sim = applyMoveRaw(state, m);
    return leavesMarshalSafe(sim, owner);
  });
}

export function applyMove(state, move) {
  return applyMoveRaw(state, move);
}

export function isMarshalThreatened(state, owner) {
  const pos = findMarshal(state.board, owner);
  if (!pos) return true;
  const [mr, mc] = pos;
  const opp = opponent(owner);
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      for (const m of getMovesFromCell({ ...state, turn: opp }, r, c, opp)) {
        if (m.tr === mr && m.tc === mc && (m.kind === 'capture' || m.kind === 'strike')) {
          return true;
        }
      }
    }
  }
  return false;
}

export function getGameResult(state) {
  const senteMarshal = findMarshal(state.board, 'sente');
  const goteMarshal = findMarshal(state.board, 'gote');

  if (!senteMarshal) {
    return { type: 'win', winner: 'gote', reason: '先手帥被擊破' };
  }
  if (!goteMarshal) {
    return { type: 'win', winner: 'sente', reason: '後手帥被擊破' };
  }

  const turn = state.turn;
  const legal = getLegalMoves(state, turn);
  if (legal.length === 0) {
    if (isMarshalThreatened(state, turn)) {
      return {
        type: 'win',
        winner: opponent(turn),
        reason: turn === 'sente' ? '先手帥無路可逃（詰）' : '後手帥無路可逃（詰）',
      };
    }
    return { type: 'draw', reason: '無合法手（和棋）' };
  }

  return null;
}

export function formatMoveBrief(state, move) {
  if (move.drop) {
    return `打${PIECE_ZH[move.type]}→(${move.tr},${move.tc})`;
  }
  const p = state.board[move.fr][move.fc];
  const top = p[p.length - 1];
  const kindZh = { move: '移', stack: '疊', capture: '吃', strike: '打' }[move.kind] || '';
  return `${PIECE_ZH[top.type]}${kindZh} (${move.fr},${move.fc})→(${move.tr},${move.tc})`;
}
