import {
  MAX_MOVES,
  applyMove,
  getAllMoves,
  getSide,
  pieceScore,
  cloneGrid,
} from './logic.js';

export function createGameState(grid, overrides = {}) {
  return {
    grid: cloneGrid(grid),
    turn: 'AB',
    moveCount: 0,
    abKill: 0,
    uvKill: 0,
    abTimeMs: 0,
    uvTimeMs: 0,
    ...overrides,
  };
}

export function opponent(side) {
  return side === 'AB' ? 'UV' : 'AB';
}

export function applyMoveOnState(state, move) {
  const { piece, fr, fc, tr, tc } = move;
  const { grid: nextGrid, eaten } = applyMove(state.grid, piece, fr, fc, tr, tc);
  const mover = getSide(piece);
  let { abKill, uvKill } = state;
  if (eaten) {
    const pts = pieceScore(eaten);
    if (mover === 'AB') abKill += pts;
    else uvKill += pts;
  }
  return {
    ...state,
    grid: nextGrid,
    turn: opponent(mover),
    moveCount: state.moveCount + 1,
    abKill,
    uvKill,
  };
}

/** @returns {'AB'|'UV'|'Tie'|null} */
export function resolveWinner(state) {
  const abMoves = getAllMoves(state.grid, 'AB').length;
  const uvMoves = getAllMoves(state.grid, 'UV').length;

  if (state.turn === 'AB' && abMoves === 0) return 'UV';
  if (state.turn === 'UV' && uvMoves === 0) return 'AB';

  if (state.moveCount < MAX_MOVES) return null;

  const { abKill, uvKill, abTimeMs, uvTimeMs } = state;
  if (abKill > uvKill) return 'AB';
  if (uvKill > abKill) return 'UV';
  if (abTimeMs < uvTimeMs) return 'AB';
  if (uvTimeMs < abTimeMs) return 'UV';
  return 'Tie';
}

export function boardMaterial(grid, side) {
  let total = 0;
  for (const row of grid) {
    for (const p of row) {
      if (p && getSide(p) === side) total += pieceScore(p);
    }
  }
  return total;
}
