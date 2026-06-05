import { getLegalMoves, applyMove, getGameResult } from './logic.js';

const WIN = 500_000;
const DEPTH = 3;
const VAL = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };

function boardValue(board, color) {
  let s = 0;
  for (const row of board) {
    for (const p of row) {
      if (!p) continue;
      const v = VAL[p.type] || 0;
      if (p.color === color) s += v;
      else s -= v;
    }
  }
  return s;
}

function evaluate(state, aiColor) {
  const human = aiColor === 'white' ? 'black' : 'white';
  const result = getGameResult(state);
  if (result?.type === 'checkmate' && result.winner === aiColor) return WIN;
  if (result?.type === 'checkmate' && result.winner === human) return -WIN;
  if (result?.type === 'draw' || result?.type === 'stalemate') return 0;
  return boardValue(state.board, aiColor);
}

function alphaBeta(state, depth, alpha, beta, aiColor) {
  const turn = state.turn;
  const moves = getLegalMoves(state, turn);
  if (moves.length === 0) {
    const result = getGameResult(state);
    if (result?.type === 'checkmate') {
      return result.winner === aiColor ? WIN - state.fullmoveNumber : -WIN + state.fullmoveNumber;
    }
    return 0;
  }
  if (depth === 0) return evaluate(state, aiColor);
  const maximizing = turn === aiColor;
  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      const s = alphaBeta(applyMove(state, m), depth - 1, alpha, beta, aiColor);
      best = Math.max(best, s);
      alpha = Math.max(alpha, s);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Infinity;
  for (const m of moves) {
    const s = alphaBeta(applyMove(state, m), depth - 1, alpha, beta, aiColor);
    best = Math.min(best, s);
    beta = Math.min(beta, s);
    if (beta <= alpha) break;
  }
  return best;
}

export function findBestMove(state, aiColor) {
  if (state.turn !== aiColor) return null;
  const moves = getLegalMoves(state, aiColor);
  if (!moves.length) return null;
  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const score = alphaBeta(applyMove(state, m), DEPTH - 1, -Infinity, Infinity, aiColor);
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return { move: best, score: bestScore };
}
