import {
  getLegalMoves,
  applyMove,
  getGameResult,
  PIECE,
  findMarshal,
} from './logic.js';

const WIN = 500_000;
const DEPTH = 2;

function stackValue(board, side) {
  let s = 0;
  for (let r = 0; r < board.length; r += 1) {
    for (let c = 0; c < board[r].length; c += 1) {
      const stack = board[r][c];
      for (let i = 0; i < stack.length; i += 1) {
        const p = stack[i];
        const v = (PIECE[p.type]?.value || 3) + i * 2;
        if (p.owner === side) s += v;
        else s -= v;
      }
    }
  }
  return s;
}

function handValue(hands, side) {
  return hands[side].reduce((sum, t) => sum + (PIECE[t]?.value || 3), 0);
}

function marshalBonus(board, side) {
  return findMarshal(board, side) ? 15 : -80;
}

function evaluate(state, aiSide) {
  const human = aiSide === 'sente' ? 'gote' : 'sente';
  const result = getGameResult(state);
  if (result?.type === 'win' && result.winner === aiSide) return WIN;
  if (result?.type === 'win' && result.winner === human) return -WIN;
  if (result?.type === 'draw') return 0;
  return (
    stackValue(state.board, aiSide)
    + handValue(state.hands, aiSide) * 0.8
    + marshalBonus(state.board, aiSide)
  );
}

function pickMoveScore(move) {
  if (move.kind === 'capture' || move.kind === 'captureStack') return 40;
  if (move.kind === 'strike') return 20;
  if (move.shin) return 5;
  return 0;
}

function alphaBeta(state, depth, alpha, beta, aiSide) {
  const turn = state.turn;
  const moves = getLegalMoves(state, turn);
  if (moves.length === 0) {
    const result = getGameResult(state);
    if (result?.type === 'win') {
      return result.winner === aiSide ? WIN - state.moveCount : -WIN + state.moveCount;
    }
    return 0;
  }
  if (depth === 0) return evaluate(state, aiSide);

  moves.sort((a, b) => pickMoveScore(b) - pickMoveScore(a));

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

  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const score = alphaBeta(applyMove(state, m), DEPTH - 1, -Infinity, Infinity, aiSide);
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return { move: best, score: bestScore };
}
