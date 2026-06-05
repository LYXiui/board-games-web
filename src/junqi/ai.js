import { getLegalMoves, applyMove, getGameResult, PIECE } from './logic.js';

const WIN = 500_000;
const DEPTH = 3;

function pieceVal(type) {
  const r = PIECE[type]?.rank;
  if (r === undefined) return 5;
  if (r < 0) return type === 'F' ? 1000 : type === 'B' ? 40 : 30;
  return r * 12;
}

function boardValue(board, side) {
  let s = 0;
  for (const row of board) {
    for (const p of row) {
      if (!p) continue;
      const v = pieceVal(p.type);
      if (p.owner === side) s += v;
      else s -= v * 0.9;
    }
  }
  return s;
}

function evaluate(state, aiSide) {
  const human = opponent(aiSide);
  const result = getGameResult(state);
  if (result?.type === 'win' && result.winner === aiSide) return WIN;
  if (result?.type === 'win' && result.winner === human) return -WIN;
  return boardValue(state.board, aiSide);
}

function opponent(s) {
  return s === 'red' ? 'blue' : 'red';
}

function alphaBeta(state, depth, alpha, beta, aiSide) {
  const turn = state.turn;
  const moves = getLegalMoves(state, turn);
  const result = getGameResult(state);
  if (result?.type === 'win') {
    return result.winner === aiSide ? WIN - state.moveCount : -WIN + state.moveCount;
  }
  if (moves.length === 0) return -500;
  if (depth === 0) return evaluate(state, aiSide);

  const maximizing = turn === aiSide;
  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      const s = alphaBeta(applyMove(state, m), depth - 1, alpha, beta, aiSide);
      best = Math.max(best, s);
      alpha = Math.max(alpha, s);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Infinity;
  for (const m of moves) {
    const s = alphaBeta(applyMove(state, m), depth - 1, alpha, beta, aiSide);
    best = Math.min(best, s);
    beta = Math.min(beta, s);
    if (beta <= alpha) break;
  }
  return best;
}

export function findBestMove(state, aiSide) {
  if (state.turn !== aiSide) return null;
  const moves = getLegalMoves(state, aiSide);
  if (!moves.length) return null;

  const attacks = moves.filter((m) => m.kind === 'attack');
  const pool = attacks.length ? attacks : moves;

  let best = pool[0];
  let bestScore = -Infinity;
  for (const m of pool) {
    const score = alphaBeta(applyMove(state, m), DEPTH - 1, -Infinity, Infinity, aiSide);
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return { move: best, score: bestScore };
}
