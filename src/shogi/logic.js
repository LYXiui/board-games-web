/** 日式將棋規則引擎（標準 9×9，含持駒、升變） */

export const SIZE = 9;
export const MAX_PIECES = 40;

/** @typedef {'K'|'R'|'B'|'G'|'S'|'N'|'L'|'P'} PieceType */
/** @typedef {{ type: PieceType, owner: 'sente'|'gote', promoted: boolean }|null} Cell */

export const PIECE_KANJI = {
  K: { sente: '王', gote: '玉' },
  R: '飛',
  B: '角',
  G: '金',
  S: '銀',
  N: '桂',
  L: '香',
  P: '歩',
  '+R': '龍',
  '+B': '馬',
  '+S': '全',
  '+N': '圭',
  '+L': '杏',
  '+P': 'と',
};

export function pieceLabel(piece) {
  if (!piece) return '';
  const key = piece.promoted ? `+${piece.type}` : piece.type;
  if (piece.type === 'K') return PIECE_KANJI.K[piece.owner];
  return PIECE_KANJI[key] || key;
}

export function emptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

export function cloneBoard(board) {
  return board.map((row) => row.map((c) => (c ? { ...c } : null)));
}

export function cloneHands(hands) {
  return {
    sente: [...hands.sente],
    gote: [...hands.gote],
  };
}

export function defaultGame() {
  const board = emptyBoard();
  const back = ['L', 'N', 'S', 'G', 'K', 'G', 'S', 'N', 'L'];
  const place = (r, owner, types) => {
    for (let c = 0; c < SIZE; c += 1) {
      if (types[c]) board[r][c] = { type: types[c], owner, promoted: false };
    }
  };
  place(0, 'gote', back);
  place(1, 'gote', [null, 'R', null, null, null, null, 'B', null, null]);
  place(2, 'gote', Array(SIZE).fill('P'));
  place(6, 'sente', Array(SIZE).fill('P'));
  place(7, 'sente', [null, 'B', null, null, null, null, 'R', null, null]);
  place(8, 'sente', back);

  const state = {
    board,
    hands: { sente: [], gote: [] },
    turn: 'sente',
    moveCount: 0,
    positionCounts: {},
  };
  const key = positionKey(state);
  state.positionCounts[key] = 1;
  return state;
}

function forward(owner) {
  return owner === 'sente' ? -1 : 1;
}

function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function promotionZone(owner) {
  return owner === 'sente' ? [0, 1, 2] : [6, 7, 8];
}

export function canPromote(piece, fr, fc, tr, tc) {
  if (!piece || piece.promoted || piece.type === 'G' || piece.type === 'K') return false;
  const zone = promotionZone(piece.owner);
  return zone.includes(fr) || zone.includes(tr);
}

function slide(board, r, c, dr, dc, owner) {
  const moves = [];
  let nr = r + dr;
  let nc = c + dc;
  while (inBounds(nr, nc)) {
    const t = board[nr][nc];
    if (!t) moves.push([nr, nc]);
    else {
      if (t.owner !== owner) moves.push([nr, nc]);
      break;
    }
    nr += dr;
    nc += dc;
  }
  return moves;
}

function step(board, r, c, deltas, owner) {
  const moves = [];
  for (const [dr, dc] of deltas) {
    const nr = r + dr;
    const nc = c + dc;
    if (!inBounds(nr, nc)) continue;
    const t = board[nr][nc];
    if (!t || t.owner !== owner) moves.push([nr, nc]);
  }
  return moves;
}

function goldDeltas(owner) {
  const f = forward(owner);
  return [
    [f, -1],
    [f, 0],
    [f, 1],
    [0, -1],
    [0, 1],
    [-f, 0],
  ];
}

function silverDeltas(owner) {
  const f = forward(owner);
  return [
    [f, -1],
    [f, 0],
    [f, 1],
    [-f, -1],
    [-f, 1],
  ];
}

function effectiveType(piece) {
  if (!piece.promoted) return piece.type;
  if (piece.type === 'R' || piece.type === 'B') return piece.type;
  return 'G';
}

export function getPieceMoves(board, r, c) {
  const piece = board[r][c];
  if (!piece) return [];
  const owner = piece.owner;
  const f = forward(owner);
  const t = effectiveType(piece);

  if (t === 'K') {
    return step(
      board,
      r,
      c,
      [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ],
      owner,
    );
  }
  if (t === 'G') return step(board, r, c, goldDeltas(owner), owner);
  if (t === 'R') {
    const orth = [
      ...slide(board, r, c, -1, 0, owner),
      ...slide(board, r, c, 1, 0, owner),
      ...slide(board, r, c, 0, -1, owner),
      ...slide(board, r, c, 0, 1, owner),
    ];
    if (piece.promoted) {
      return [...orth, ...step(board, r, c, [[-1, -1], [-1, 1], [1, -1], [1, 1]], owner)];
    }
    return orth;
  }
  if (t === 'B') {
    const diag = [
      ...slide(board, r, c, -1, -1, owner),
      ...slide(board, r, c, -1, 1, owner),
      ...slide(board, r, c, 1, -1, owner),
      ...slide(board, r, c, 1, 1, owner),
    ];
    if (piece.promoted) {
      return [...diag, ...step(board, r, c, [[-1, 0], [1, 0], [0, -1], [0, 1]], owner)];
    }
    return diag;
  }
  if (t === 'S') return step(board, r, c, silverDeltas(owner), owner);
  if (t === 'N') return step(board, r, c, [[2 * f, -1], [2 * f, 1]], owner);
  if (t === 'L') return slide(board, r, c, f, 0, owner);
  if (t === 'P') return step(board, r, c, [[f, 0]], owner);
  return [];
}

function countPawnInFile(board, owner, col) {
  let n = 0;
  for (let r = 0; r < SIZE; r += 1) {
    const p = board[r][col];
    if (p && p.owner === owner && p.type === 'P' && !p.promoted) n += 1;
  }
  return n;
}

export function getDropMoves(state, owner, type) {
  const { board, hands } = state;
  const hand = hands[owner];
  if (!hand.includes(type)) return [];

  const moves = [];
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (board[r][c]) continue;
      if (type === 'P') {
        const zone = promotionZone(owner);
        if (zone.includes(r)) continue;
        if (countPawnInFile(board, owner, c) > 0) continue;
      }
      if (type === 'N') {
        const f = forward(owner);
        const forbidden = owner === 'sente' ? [0, 1] : [7, 8];
        if (forbidden.includes(r)) continue;
      }
      if (type === 'L') {
        const zone = promotionZone(owner);
        if (zone.includes(r)) continue;
      }
      moves.push({ drop: true, type, tr: r, tc: c });
    }
  }
  return moves;
}

export function getAllMoves(state, owner) {
  const { board } = state;
  const moves = [];
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const p = board[r][c];
      if (!p || p.owner !== owner) continue;
      for (const [tr, tc] of getPieceMoves(board, r, c)) {
        moves.push({ fr: r, fc: c, tr, tc, promote: false });
        if (canPromote(p, r, c, tr, tc)) {
          moves.push({ fr: r, fc: c, tr, tc, promote: true });
        }
      }
    }
  }
  const types = [...new Set(state.hands[owner])];
  for (const type of types) {
    moves.push(...getDropMoves(state, owner, type));
  }
  return moves;
}

export function applyMove(state, move) {
  const next = {
    board: cloneBoard(state.board),
    hands: cloneHands(state.hands),
    turn: state.turn === 'sente' ? 'gote' : 'sente',
    moveCount: state.moveCount + 1,
  };

  if (move.drop) {
    next.board[move.tr][move.tc] = {
      type: move.type,
      owner: state.turn,
      promoted: false,
    };
    const hand = next.hands[state.turn];
    const idx = hand.indexOf(move.type);
    if (idx >= 0) hand.splice(idx, 1);
    const key = positionKey(next);
    next.positionCounts = { ...state.positionCounts };
    next.positionCounts[key] = (next.positionCounts[key] || 0) + 1;
    return next;
  }

  const { fr, fc, tr, tc, promote } = move;
  const piece = next.board[fr][fc];
  const captured = next.board[tr][tc];
  if (captured) {
    let capType = captured.type;
    if (captured.promoted && !['R', 'B'].includes(capType)) {
      capType = captured.type;
    }
    next.hands[state.turn].push(capType);
  }
  next.board[fr][fc] = null;
  next.board[tr][tc] = {
    type: piece.type,
    owner: piece.owner,
    promoted: promote || piece.promoted,
  };
  const key = positionKey(next);
  next.positionCounts = { ...state.positionCounts };
  next.positionCounts[key] = (next.positionCounts[key] || 0) + 1;
  return next;
}

export function isKingCaptured(board, owner) {
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const p = board[r][c];
      if (p && p.type === 'K' && p.owner === owner) return false;
    }
  }
  return true;
}

export function formatMoveBrief(state, move) {
  if (move.drop) {
    return `打${pieceLabel({ type: move.type, owner: state.turn, promoted: false })}→(${move.tr},${move.tc})`;
  }
  const p = state.board[move.fr][move.fc];
  const name = pieceLabel(p);
  const prom = move.promote ? '成' : '';
  return `${name}${prom} (${move.fr},${move.fc})→(${move.tr},${move.tc})`;
}

export function moveKey(m) {
  if (m.drop) return `D${m.type}@${m.tr},${m.tc}`;
  return `${m.fr},${m.fc}>${m.tr},${m.tc}${m.promote ? '+' : ''}`;
}

function opponent(owner) {
  return owner === 'sente' ? 'gote' : 'sente';
}

function findKing(board, owner) {
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const p = board[r][c];
      if (p && p.type === 'K' && p.owner === owner) return [r, c];
    }
  }
  return null;
}

export function isSquareAttacked(board, tr, tc, byOwner) {
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const p = board[r][c];
      if (!p || p.owner !== byOwner) continue;
      for (const [nr, nc] of getPieceMoves(board, r, c)) {
        if (nr === tr && nc === tc) return true;
      }
    }
  }
  return false;
}

export function isInCheck(state, owner) {
  const king = findKing(state.board, owner);
  if (!king) return true;
  return isSquareAttacked(state.board, king[0], king[1], opponent(owner));
}

export function positionKey(state) {
  let b = '';
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const p = state.board[r][c];
      b += p ? `${p.owner[0]}${p.promoted ? '+' : ''}${p.type}` : '.';
    }
  }
  const hs = [...state.hands.sente].sort().join('');
  const hg = [...state.hands.gote].sort().join('');
  return `${b}|${state.turn}|${hs}|${hg}`;
}

function mustPromote(piece, tr) {
  if (!piece || piece.promoted) return false;
  const owner = piece.owner;
  if (piece.type === 'P' || piece.type === 'L') {
    return owner === 'sente' ? tr === 0 : tr === 8;
  }
  if (piece.type === 'N') {
    return owner === 'sente' ? tr <= 1 : tr >= 7;
  }
  return false;
}

function isUsurpation(state, move) {
  const next = applyMove(state, move);
  return isInCheck(next, state.turn);
}

function isDropPawnMate(state, move) {
  if (!move.drop || move.type !== 'P') return false;
  const next = applyMove(state, move);
  const opp = opponent(state.turn);
  if (!isInCheck(next, opp)) return false;
  return filterLegalMovesRaw(next, opp, false).length === 0;
}

function filterLegalMovesRaw(state, owner, checkDropPawnMate) {
  if (state.turn !== owner) return [];
  return getAllMoves(state, owner).filter((m) => {
    if (!m.drop && !m.promote) {
      const p = state.board[m.fr][m.fc];
      if (mustPromote(p, m.tr)) return false;
    }
    if (isUsurpation(state, m)) return false;
    if (checkDropPawnMate && isDropPawnMate(state, m)) return false;
    return true;
  });
}

export function getLegalMoves(state, owner) {
  return filterLegalMovesRaw(state, owner, true);
}

const IMPASSE_VAL = { P: 1, L: 3, N: 4, S: 5, G: 6, B: 10, R: 10 };

function kingInEnemyZone(board, owner) {
  const king = findKing(board, owner);
  if (!king) return false;
  return promotionZone(owner).includes(king[0]);
}

function hasRookOrBishop(board, hands, owner) {
  if (hands[owner].some((t) => t === 'R' || t === 'B')) return true;
  for (const row of board) {
    for (const p of row) {
      if (p && p.owner === owner && (p.type === 'R' || p.type === 'B')) return true;
    }
  }
  return false;
}

function zonePoints(board, owner) {
  const zone = promotionZone(owner);
  let pts = 0;
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const p = board[r][c];
      if (p && p.owner === owner && zone.includes(r)) {
        pts += IMPASSE_VAL[p.type] || 1;
      }
    }
  }
  return pts;
}

export function getImpasseStatus(state) {
  const { board, hands } = state;
  if (!kingInEnemyZone(board, 'sente') || !kingInEnemyZone(board, 'gote')) {
    return { claimable: false, autoDraw: false };
  }
  const senteNoRB = !hasRookOrBishop(board, hands, 'sente');
  const goteNoRB = !hasRookOrBishop(board, hands, 'gote');
  if (senteNoRB && goteNoRB) {
    return { claimable: true, autoDraw: true, reason: '雙方皆無飛角，持將棋和棋' };
  }
  const sentePts = zonePoints(board, 'sente');
  const gotePts = zonePoints(board, 'gote');
  if (sentePts <= 24 && gotePts <= 24) {
    return {
      claimable: true,
      autoDraw: false,
      reason: '雙方敵陣內子力皆不超過 24 點，可持將棋和棋',
    };
  }
  return { claimable: false, autoDraw: false };
}

export function getGameResult(state) {
  if (isKingCaptured(state.board, 'sente')) {
    return { type: 'checkmate', winner: 'gote', reason: '先手王將被吃，後手勝' };
  }
  if (isKingCaptured(state.board, 'gote')) {
    return { type: 'checkmate', winner: 'sente', reason: '後手玉將被吃，先手勝' };
  }

  const key = positionKey(state);
  if ((state.positionCounts?.[key] || 0) >= 4) {
    return { type: 'draw', reason: '千日手和棋' };
  }

  const impasse = getImpasseStatus(state);
  if (impasse.autoDraw) {
    return { type: 'draw', reason: impasse.reason };
  }

  const turn = state.turn;
  const legal = getLegalMoves(state, turn);
  if (legal.length === 0) {
    if (isInCheck(state, turn)) {
      return {
        type: 'checkmate',
        winner: opponent(turn),
        reason: turn === 'sente' ? '先手詰み' : '後手詰み',
      };
    }
    return { type: 'draw', reason: '無合法手，和棋' };
  }
  return null;
}
