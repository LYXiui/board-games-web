/** 西洋棋規則引擎（標準規則：王車易位、過路兵、升變、將軍、和棋） */

export const SIZE = 8;

export const PIECE_UNICODE = {
  white: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
  black: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' },
};

export const PIECE_ZH = { K: '王', Q: '后', R: '車', B: '象', N: '馬', P: '兵' };

export function opponent(color) {
  return color === 'white' ? 'black' : 'white';
}

export function pieceLabel(piece) {
  if (!piece) return '';
  return PIECE_UNICODE[piece.color][piece.type];
}

export function pieceNameZh(piece) {
  if (!piece) return '';
  const c = piece.color === 'white' ? '白' : '黑';
  return `${c}${PIECE_ZH[piece.type]}`;
}

export function emptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

export function cloneBoard(board) {
  return board.map((row) => row.map((c) => (c ? { ...c } : null)));
}

export function defaultGame() {
  const board = emptyBoard();
  const back = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  for (let c = 0; c < SIZE; c += 1) {
    board[0][c] = { type: back[c], color: 'black' };
    board[1][c] = { type: 'P', color: 'black' };
    board[6][c] = { type: 'P', color: 'white' };
    board[7][c] = { type: back[c], color: 'white' };
  }
  const state = {
    board,
    turn: 'white',
    castling: { white: { king: true, queen: true }, black: { king: true, queen: true } },
    enPassant: null,
    halfmoveClock: 0,
    fullmoveNumber: 1,
    positionCounts: {},
  };
  const key = positionKey(state);
  state.positionCounts[key] = 1;
  return state;
}

function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

export function findKing(board, color) {
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const p = board[r][c];
      if (p && p.type === 'K' && p.color === color) return [r, c];
    }
  }
  return null;
}

export function positionKey(state) {
  let b = '';
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const p = state.board[r][c];
      b += p ? `${p.color[0]}${p.type}` : '.';
    }
  }
  const cw = state.castling.white;
  const cb = state.castling.black;
  const ep = state.enPassant ? `${state.enPassant.r},${state.enPassant.c}` : '-';
  return `${b}|${state.turn}|${cw.king}${cw.queen}${cb.king}${cb.queen}|${ep}`;
}

function slide(board, r, c, deltas, color) {
  const moves = [];
  for (const [dr, dc] of deltas) {
    let nr = r + dr;
    let nc = c + dc;
    while (inBounds(nr, nc)) {
      const t = board[nr][nc];
      if (!t) moves.push([nr, nc]);
      else {
        if (t.color !== color) moves.push([nr, nc]);
        break;
      }
      nr += dr;
      nc += dc;
    }
  }
  return moves;
}

function step(board, r, c, deltas, color) {
  const moves = [];
  for (const [dr, dc] of deltas) {
    const nr = r + dr;
    const nc = c + dc;
    if (!inBounds(nr, nc)) continue;
    const t = board[nr][nc];
    if (!t || t.color !== color) moves.push([nr, nc]);
  }
  return moves;
}

function pawnDir(color) {
  return color === 'white' ? -1 : 1;
}

function pawnStartRank(color) {
  return color === 'white' ? 6 : 1;
}

function promotionRank(color) {
  return color === 'white' ? 0 : 7;
}

export function isSquareAttacked(board, tr, tc, byColor) {
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const p = board[r][c];
      if (!p || p.color !== byColor) continue;
      if (p.type === 'P') {
        const d = pawnDir(byColor);
        if (r + d === tr && (c - 1 === tc || c + 1 === tc)) return true;
        continue;
      }
      if (p.type === 'N') {
        for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
          if (r + dr === tr && c + dc === tc) return true;
        }
        continue;
      }
      if (p.type === 'K') {
        for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
          if (r + dr === tr && c + dc === tc) return true;
        }
        continue;
      }
      const dirs =
        p.type === 'R'
          ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
          : p.type === 'B'
            ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
            : [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (inBounds(nr, nc)) {
          if (nr === tr && nc === tc) return true;
          if (board[nr][nc]) break;
          nr += dr;
          nc += dc;
        }
      }
    }
  }
  return false;
}

export function isInCheck(state, color) {
  const king = findKing(state.board, color);
  if (!king) return false;
  return isSquareAttacked(state.board, king[0], king[1], opponent(color));
}

function addPawnMoves(state, r, c, moves) {
  const { board } = state;
  const p = board[r][c];
  const color = p.color;
  const d = pawnDir(color);
  const start = pawnStartRank(color);
  const promo = promotionRank(color);
  const one = r + d;
  if (inBounds(one, c) && !board[one][c]) {
    if (one === promo) {
      for (const pt of ['Q', 'R', 'B', 'N']) moves.push({ fr: r, fc: c, tr: one, tc: c, promote: pt });
    } else {
      moves.push({ fr: r, fc: c, tr: one, tc: c });
      const two = r + 2 * d;
      if (r === start && !board[two][c]) moves.push({ fr: r, fc: c, tr: two, tc: c });
    }
  }
  for (const dc of [-1, 1]) {
    const tr = r + d;
    const tc = c + dc;
    if (!inBounds(tr, tc)) continue;
    const target = board[tr][tc];
    if (target && target.color !== color) {
      if (tr === promo) {
        for (const pt of ['Q', 'R', 'B', 'N']) moves.push({ fr: r, fc: c, tr, tc, promote: pt });
      } else moves.push({ fr: r, fc: c, tr, tc });
    }
    if (state.enPassant && state.enPassant.r === tr && state.enPassant.c === tc) {
      moves.push({ fr: r, fc: c, tr, tc, enPassant: true });
    }
  }
}

function addCastling(state, color, moves) {
  const row = color === 'white' ? 7 : 0;
  const rights = state.castling[color];
  if (state.board[row][4]?.type !== 'K' || state.board[row][4]?.color !== color) return;
  if (rights.king && !state.board[row][5] && !state.board[row][6] && state.board[row][7]?.type === 'R') {
    moves.push({ fr: row, fc: 4, tr: row, tc: 6, castle: 'K' });
  }
  if (rights.queen && !state.board[row][1] && !state.board[row][2] && !state.board[row][3] && state.board[row][0]?.type === 'R') {
    moves.push({ fr: row, fc: 4, tr: row, tc: 2, castle: 'Q' });
  }
}

function getPseudoMovesForPiece(state, r, c) {
  const p = state.board[r][c];
  if (!p) return [];
  const { color, type } = p;
  const moves = [];
  if (type === 'P') {
    addPawnMoves(state, r, c, moves);
    return moves;
  }
  if (type === 'N') {
    for (const [tr, tc] of step(state.board, r, c, [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]], color)) {
      moves.push({ fr: r, fc: c, tr, tc });
    }
    return moves;
  }
  if (type === 'K') {
    for (const [tr, tc] of step(state.board, r, c, [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]], color)) {
      moves.push({ fr: r, fc: c, tr, tc });
    }
    addCastling(state, color, moves);
    return moves;
  }
  const dirs =
    type === 'R'
      ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
      : type === 'B'
        ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
        : [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [tr, tc] of slide(state.board, r, c, dirs, color)) moves.push({ fr: r, fc: c, tr, tc });
  return moves;
}

function castlingPassesCheck(state, move, color) {
  const row = move.fr;
  const squares = move.castle === 'K' ? [[row, 4], [row, 5], [row, 6]] : [[row, 4], [row, 3], [row, 2]];
  return squares.some(([r, c]) => isSquareAttacked(state.board, r, c, opponent(color)));
}

function applyMoveRaw(state, move) {
  const next = {
    board: cloneBoard(state.board),
    turn: opponent(state.turn),
    castling: { white: { ...state.castling.white }, black: { ...state.castling.black } },
    enPassant: null,
    halfmoveClock: state.halfmoveClock + 1,
    fullmoveNumber: state.fullmoveNumber,
    positionCounts: { ...state.positionCounts },
  };
  const color = state.turn;
  let resetHalf = false;
  if (move.castle) {
    const row = move.fr;
    next.board[row][4] = null;
    if (move.castle === 'K') {
      next.board[row][6] = { type: 'K', color };
      next.board[row][7] = null;
      next.board[row][5] = { type: 'R', color };
    } else {
      next.board[row][2] = { type: 'K', color };
      next.board[row][0] = null;
      next.board[row][3] = { type: 'R', color };
    }
    next.castling[color].king = false;
    next.castling[color].queen = false;
    resetHalf = true;
  } else {
    const { fr, fc, tr, tc } = move;
    const piece = next.board[fr][fc];
    const captured = next.board[tr][tc];
    if (piece.type === 'K') {
      next.castling[color].king = false;
      next.castling[color].queen = false;
    }
    if (piece.type === 'R') {
      if (color === 'white' && fr === 7 && (fc === 0 || fc === 7)) next.castling.white[fc === 0 ? 'queen' : 'king'] = false;
      if (color === 'black' && fr === 0 && (fc === 0 || fc === 7)) next.castling.black[fc === 0 ? 'queen' : 'king'] = false;
    }
    if (captured || move.enPassant || piece.type === 'P') resetHalf = true;
    if (move.enPassant) next.board[color === 'white' ? tr + 1 : tr - 1][tc] = null;
    next.board[fr][fc] = null;
    next.board[tr][tc] = { type: move.promote || piece.type, color: piece.color };
    if (piece.type === 'P' && Math.abs(tr - fr) === 2) next.enPassant = { r: (fr + tr) / 2, c: fc };
  }
  if (resetHalf) next.halfmoveClock = 0;
  if (next.turn === 'white') next.fullmoveNumber += 1;
  return next;
}

function leavesKingInCheck(state, move, color) {
  if (move.castle) {
    if (isInCheck(state, color)) return true;
    if (castlingPassesCheck(state, move, color)) return true;
  }
  return isInCheck(applyMoveRaw({ ...state, turn: color }, move), color);
}

function getPseudoLegalMoves(state, color) {
  const moves = [];
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const p = state.board[r][c];
      if (p && p.color === color) moves.push(...getPseudoMovesForPiece(state, r, c));
    }
  }
  return moves;
}

export function getLegalMoves(state, color) {
  if (state.turn !== color) return [];
  return getPseudoLegalMoves(state, color).filter((m) => !leavesKingInCheck(state, m, color));
}

export function applyMove(state, move) {
  const next = applyMoveRaw(state, move);
  const key = positionKey(next);
  next.positionCounts = { ...state.positionCounts };
  next.positionCounts[key] = (next.positionCounts[key] || 0) + 1;
  return next;
}

export function isInsufficientMaterial(board) {
  const nonKing = [];
  for (const row of board) {
    for (const p of row) {
      if (p && p.type !== 'K') nonKing.push(p);
    }
  }
  if (nonKing.length === 0) return true;
  if (nonKing.length === 1) return nonKing[0].type === 'B' || nonKing[0].type === 'N';
  if (nonKing.length === 2) {
    const [a, b] = nonKing;
    if (a.type === 'B' && b.type === 'B' && a.color !== b.color) {
      const colors = new Set();
      for (let r = 0; r < SIZE; r += 1) {
        for (let c = 0; c < SIZE; c += 1) {
          const p = board[r][c];
          if (p?.type === 'B') colors.add((r + c) % 2);
        }
      }
      return colors.size <= 1;
    }
  }
  return false;
}

export function isThreefold(state) {
  const key = positionKey(state);
  return (state.positionCounts[key] || 0) >= 3;
}

export function getGameResult(state) {
  const turn = state.turn;
  const legal = getLegalMoves(state, turn);
  if (legal.length === 0) {
    if (isInCheck(state, turn)) {
      return { type: 'checkmate', winner: opponent(turn), reason: turn === 'white' ? '白方被將死' : '黑方被將死' };
    }
    return { type: 'stalemate', reason: '逼和（無合法手且未被將軍）' };
  }
  if (state.halfmoveClock >= 100) return { type: 'draw', reason: '五十步規則和棋' };
  if (isThreefold(state)) return { type: 'draw', reason: '三次重複局面和棋' };
  if (isInsufficientMaterial(state.board)) return { type: 'draw', reason: '子力不足以將死，和棋' };
  return null;
}

export function formatMoveBrief(state, move) {
  if (move.castle === 'K') return '王翼易位';
  if (move.castle === 'Q') return '后翼易位';
  const p = state.board[move.fr][move.fc];
  const cap = state.board[move.tr][move.tc] || move.enPassant;
  const prom = move.promote ? `升${PIECE_ZH[move.promote]}` : '';
  const file = String.fromCharCode(97 + move.fc);
  const tfile = String.fromCharCode(97 + move.tc);
  return `${pieceNameZh(p)}${cap || move.enPassant ? '吃' : ''} ${file}${8 - move.fr}→${tfile}${8 - move.tr}${prom}`;
}
