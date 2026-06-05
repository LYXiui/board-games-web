import { MAX_MOVES, getAllMoves, pieceScore } from './logic.js';
import {
  applyMoveOnState,
  boardMaterial,
  createGameState,
  resolveWinner,
} from './gameState.js';

const WIN = 1_000_000;
const DEFAULT_DEPTH = 5;

function moveCaptureValue(grid, move) {
  const target = grid[move.tr][move.tc];
  return target ? pieceScore(target) : 0;
}

function orderMoves(moves, grid) {
  return [...moves].sort(
    (a, b) => moveCaptureValue(grid, b) - moveCaptureValue(grid, a),
  );
}

export function evaluateState(state, aiSide) {
  const humanSide = aiSide === 'AB' ? 'UV' : 'AB';
  const aiKill = aiSide === 'AB' ? state.abKill : state.uvKill;
  const humanKill = aiSide === 'AB' ? state.uvKill : state.abKill;

  let score = (aiKill - humanKill) * 120;
  score += (boardMaterial(state.grid, aiSide) - boardMaterial(state.grid, humanSide)) * 8;

  const aiMobility = getAllMoves(state.grid, aiSide).length;
  const humanMobility = getAllMoves(state.grid, humanSide).length;
  score += (aiMobility - humanMobility) * 4;

  const remaining = MAX_MOVES - state.moveCount;
  score += remaining * (aiKill >= humanKill ? 0.5 : -0.5);

  return score;
}

function terminalScore(state, aiSide) {
  const winner = resolveWinner(state);
  if (winner === 'Tie') return 0;
  if (winner === aiSide) return WIN - state.moveCount;
  if (winner) return -WIN + state.moveCount;
  return null;
}

function alphaBeta(state, depth, alpha, beta, aiSide) {
  const terminal = terminalScore(state, aiSide);
  if (terminal !== null) return terminal;
  if (depth === 0 || state.moveCount >= MAX_MOVES) {
    return evaluateState(state, aiSide);
  }

  const side = state.turn;
  const moves = orderMoves(getAllMoves(state.grid, side), state.grid);
  if (moves.length === 0) {
    const winner = side === 'AB' ? 'UV' : 'AB';
    return winner === aiSide ? WIN - state.moveCount : -WIN + state.moveCount;
  }

  const maximizing = side === aiSide;

  if (maximizing) {
    let value = -Infinity;
    for (const move of moves) {
      const child = applyMoveOnState(state, move);
      value = Math.max(value, alphaBeta(child, depth - 1, alpha, beta, aiSide));
      alpha = Math.max(alpha, value);
      if (beta <= alpha) break;
    }
    return value;
  }

  let value = Infinity;
  for (const move of moves) {
    const child = applyMoveOnState(state, move);
    value = Math.min(value, alphaBeta(child, depth - 1, alpha, beta, aiSide));
    beta = Math.min(beta, value);
    if (beta <= alpha) break;
  }
  return value;
}

/**
 * Alpha-Beta 搜尋：在 state.turn 必須為 aiSide 時選最佳著法
 * @param {import('./gameState.js').createGameState extends Function ? ReturnType<typeof createGameState> : object} state
 */
export function findBestMove(state, aiSide, maxDepth = DEFAULT_DEPTH) {
  if (state.turn !== aiSide) return null;

  const moves = orderMoves(getAllMoves(state.grid, aiSide), state.grid);
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const child = applyMoveOnState(state, move);
    const score = alphaBeta(child, maxDepth - 1, -Infinity, Infinity, aiSide);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return { move: bestMove, score: bestScore };
}

export function buildAiState(grid, turn, moveCount, abKill, uvKill) {
  return createGameState(grid, { turn, moveCount, abKill, uvKill });
}
