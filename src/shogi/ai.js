import { getAllMoves, applyMove, isKingCaptured, moveKey } from './logic.js';

const WIN = 500_000;
const DEPTH = 3;

const VAL = { P: 1, L: 3, N: 4, S: 5, G: 6, B: 8, R: 10, K: 99 };

function handValue(hands, owner) {
  return hands[owner].reduce((s, t) => s + (VAL[t] || 1), 0);
}

function boardValue(board, owner) {
  let s = 0;
  for (const row of board) {
    for (const p of row) {
      if (!p) continue;
      const v = (VAL[p.type] || 1) + (p.promoted ? 4 : 0);
      if (p.owner === owner) s += v;
      else s -= v;
    }
  }
  return s;
}

function evaluate(state, aiOwner) {
  const human = aiOwner === 'sente' ? 'gote' : 'sente';
  if (isKingCaptured(state.board, aiOwner)) return -WIN;
  if (isKingCaptured(state.board, human)) return WIN;
  return (
    boardValue(state.board, aiOwner)
    + handValue(state.hands, aiOwner) * 1.2
    - boardValue(state.board, human)
    - handValue(state.hands, human) * 1.2
  );
}

function alphaBeta(state, depth, alpha, beta, aiOwner) {
  const turn = state.turn;
  const moves = getAllMoves(state, turn);
  if (moves.length === 0) {
    return turn === aiOwner ? -WIN : WIN;
  }
  if (depth === 0) return evaluate(state, aiOwner);

  const maximizing = turn === aiOwner;
  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      const child = applyMove(state, m);
      const s = alphaBeta(child, depth - 1, alpha, beta, aiOwner);
      best = Math.max(best, s);
      alpha = Math.max(alpha, s);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Infinity;
  for (const m of moves) {
    const child = applyMove(state, m);
    const s = alphaBeta(child, depth - 1, alpha, beta, aiOwner);
    best = Math.min(best, s);
    beta = Math.min(beta, s);
    if (beta <= alpha) break;
  }
  return best;
}

export function findBestMove(state, aiOwner) {
  if (state.turn !== aiOwner) return null;
  const moves = getAllMoves(state, aiOwner);
  if (!moves.length) return null;

  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const child = applyMove(state, m);
    const score = alphaBeta(child, DEPTH - 1, -Infinity, Infinity, aiOwner);
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return { move: best, score: bestScore };
}
