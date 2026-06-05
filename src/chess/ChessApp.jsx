import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  SIZE,
  defaultGame,
  getLegalMoves,
  applyMove,
  getGameResult,
  isInCheck,
  formatMoveBrief,
  pieceLabel,
  PIECE_ZH,
} from './logic.js';
import { findBestMove } from './ai.js';
import ChessRulesPanel from './ChessRulesPanel.jsx';

function sameMove(a, b) {
  if (a.castle !== b.castle) return false;
  if (a.castle) return a.castle === b.castle;
  return (
    a.fr === b.fr
    && a.fc === b.fc
    && a.tr === b.tr
    && a.tc === b.tc
    && (a.promote || null) === (b.promote || null)
    && !!a.enPassant === !!b.enPassant
  );
}

export default function ChessApp() {
  const [phase, setPhase] = useState('lobby');
  const [humanColor, setHumanColor] = useState('white');
  const aiColor = humanColor === 'white' ? 'black' : 'white';
  const boardFlipped = humanColor === 'black';

  const [gameState, setGameState] = useState(null);
  const [selected, setSelected] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [lastResponse, setLastResponse] = useState('');
  const [log, setLog] = useState([]);
  const [endReason, setEndReason] = useState('');
  const [winner, setWinner] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [promoteChoice, setPromoteChoice] = useState(null);

  const aiBusyRef = useRef(false);
  const endedRef = useRef(false);

  const turn = gameState?.turn;
  const board = gameState?.board;

  const appendLog = useCallback((line) => {
    setLog((prev) => [...prev, { t: new Date().toLocaleTimeString(), line }]);
  }, []);

  const endGame = useCallback(
    (result) => {
      if (endedRef.current) return;
      endedRef.current = true;
      aiBusyRef.current = false;
      setPhase('ended');
      if (result?.type === 'checkmate') {
        setWinner(result.winner);
        setEndReason(result.reason);
      } else {
        setWinner('draw');
        setEndReason(result?.reason || '和棋');
      }
      appendLog(`終局：${result?.reason || '和棋'}`);
    },
    [appendLog],
  );

  const resolveAfterMove = useCallback(
    (next) => {
      const result = getGameResult(next);
      if (result) {
        endGame(result);
        return true;
      }
      return false;
    },
    [endGame],
  );

  const resetLobby = useCallback(() => {
    setPhase('lobby');
    setGameState(null);
    setSelected(null);
    setLastMove(null);
    setLastResponse('');
    setLog([]);
    setWinner(null);
    setEndReason('');
    setPromoteChoice(null);
    aiBusyRef.current = false;
    endedRef.current = false;
  }, []);

  const runAiTurn = useCallback(
    (state) => {
      if (aiBusyRef.current || endedRef.current || state.turn !== aiColor) return;
      aiBusyRef.current = true;
      setPhase('thinking');

      window.setTimeout(() => {
        if (endedRef.current) {
          aiBusyRef.current = false;
          return;
        }

        const result = findBestMove(state, aiColor);
        if (!result) {
          aiBusyRef.current = false;
          const gr = getGameResult(state);
          endGame(gr || { type: 'checkmate', winner: humanColor, reason: 'AI 無合法手' });
          return;
        }

        const { move } = result;
        const next = applyMove(state, move);
        const brief = formatMoveBrief(state, move);
        setGameState(next);
        setLastMove(move);
        setLastResponse(brief);
        appendLog(`AI(${aiColor === 'white' ? '白' : '黑'}) ${brief}`);
        setSelected(null);

        aiBusyRef.current = false;

        if (resolveAfterMove(next)) return;

        setPhase('playing');
        if (next.turn === aiColor) runAiTurn(next);
      }, 40);
    },
    [aiColor, humanColor, appendLog, endGame, resolveAfterMove],
  );

  const beginPlay = useCallback(() => {
    const state = defaultGame();
    setGameState(state);
    setPhase('playing');
    setSelected(null);
    setLastMove(null);
    setLastResponse('');
    setPromoteChoice(null);
    endedRef.current = false;
    aiBusyRef.current = false;
    appendLog(`對局開始：你執${humanColor === 'white' ? '白' : '黑'} vs AI`);

    if (state.turn === aiColor) {
      appendLog('AI 先手…');
      runAiTurn(state);
    }
  }, [humanColor, aiColor, appendLog, runAiTurn]);

  const executeMove = useCallback(
    (move) => {
      if (phase !== 'playing' || turn !== humanColor || aiBusyRef.current || endedRef.current) {
        return;
      }

      const legal = getLegalMoves(gameState, humanColor);
      if (!legal.some((m) => sameMove(m, move))) return;

      const next = applyMove(gameState, move);
      const brief = formatMoveBrief(gameState, move);
      setGameState(next);
      setLastMove(move);
      setLastResponse(brief);
      setSelected(null);
      setPromoteChoice(null);
      appendLog(`我方(${humanColor === 'white' ? '白' : '黑'}) ${brief}`);

      if (resolveAfterMove(next)) return;

      if (next.turn === aiColor) runAiTurn(next);
    },
    [phase, turn, humanColor, gameState, appendLog, resolveAfterMove, aiColor, runAiTurn],
  );

  const tryMoveTo = useCallback(
    (tr, tc) => {
      if (!gameState || !selected || turn !== humanColor) return;
      const { r: fr, c: fc } = selected;
      const candidates = getLegalMoves(gameState, humanColor).filter(
        (m) => m.fr === fr && m.fc === fc && m.tr === tr && m.tc === tc,
      );
      if (candidates.length === 0) return;
      if (candidates.length === 1) {
        executeMove(candidates[0]);
        return;
      }
      setPromoteChoice({ candidates });
    },
    [gameState, selected, turn, humanColor, executeMove],
  );

  const legalTargets = useMemo(() => {
    if (phase !== 'playing' || turn !== humanColor || !gameState || !selected) return new Set();
    return new Set(
      getLegalMoves(gameState, humanColor)
        .filter((m) => m.fr === selected.r && m.fc === selected.c)
        .map((m) => `${m.tr},${m.tc}`),
    );
  }, [phase, turn, humanColor, gameState, selected]);

  const inCheckColor = useMemo(() => {
    if (!gameState) return null;
    if (isInCheck(gameState, 'white')) return 'white';
    if (isInCheck(gameState, 'black')) return 'black';
    return null;
  }, [gameState]);

  const handleCellClick = useCallback(
    (displayRow, col) => {
      if (phase === 'ended' || phase === 'thinking' || !board) return;
      const r = boardFlipped ? SIZE - 1 - displayRow : displayRow;
      const c = col;

      if (turn !== humanColor || aiBusyRef.current) return;

      const piece = board[r][c];

      if (selected) {
        const { r: sr, c: sc } = selected;
        if (sr === r && sc === c) {
          setSelected(null);
          return;
        }
        if (legalTargets.has(`${r},${c}`)) {
          tryMoveTo(r, c);
          return;
        }
      }

      if (piece?.color === humanColor) {
        setSelected({ r, c });
      } else {
        setSelected(null);
      }
    },
    [phase, board, boardFlipped, turn, humanColor, selected, legalTargets, tryMoveTo],
  );

  useEffect(() => {
    if (phase !== 'playing' || !gameState || endedRef.current) return;
    const result = getGameResult(gameState);
    if (result) endGame(result);
  }, [phase, gameState, endGame]);

  const humanTurnActive = phase === 'playing' && turn === humanColor && !aiBusyRef.current;
  const files = 'abcdefgh';

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div className="flex-1 min-w-0 space-y-4">
            <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-stone-700 pb-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-emerald-100">西洋棋</h1>
                <p className="text-sm text-stone-400 mt-1">人機對弈 · 標準規則 · Alpha-Beta AI</p>
              </div>
              {phase === 'thinking' && (
                <div className="text-emerald-300 animate-pulse">AI 思考中…</div>
              )}
              {humanTurnActive && inCheckColor === humanColor && (
                <div className="text-red-400 font-semibold animate-pulse">將軍！</div>
              )}
            </header>

            {phase === 'lobby' && (
              <section className="rounded-xl border border-stone-700 bg-stone-900/80 p-4 space-y-4">
                <h2 className="font-semibold text-stone-200">對局設定</h2>
                <div className="space-y-2">
                  <div className="text-sm text-stone-400">選擇你的顏色</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setHumanColor('white')}
                      className={`px-4 py-2 rounded-lg text-sm border ${
                        humanColor === 'white'
                          ? 'bg-stone-100 text-stone-900 border-stone-300'
                          : 'bg-stone-800 border-stone-600 text-stone-300'
                      }`}
                    >
                      ♔ 白方
                    </button>
                    <button
                      type="button"
                      onClick={() => setHumanColor('black')}
                      className={`px-4 py-2 rounded-lg text-sm border ${
                        humanColor === 'black'
                          ? 'bg-stone-800 text-stone-100 border-stone-500'
                          : 'bg-stone-800 border-stone-600 text-stone-300'
                      }`}
                    >
                      ♚ 黑方
                    </button>
                  </div>
                  <p className="text-xs text-stone-500">選黑方時 AI 先手。不含 EZChess 自訂玩法。</p>
                </div>
                <button
                  type="button"
                  onClick={beginPlay}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold"
                >
                  開始對局
                </button>
              </section>
            )}

            {(phase === 'playing' || phase === 'thinking' || phase === 'ended') && board && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="text-stone-300">
                    手番：
                    <span className={turn === 'white' ? 'text-stone-100' : 'text-stone-400'}>
                      {turn === 'white' ? '白方' : '黑方'}
                    </span>
                    {phase === 'ended' && (
                      <span className="ml-2 text-emerald-300">
                        — {winner === 'draw' ? '和棋' : `${winner === 'white' ? '白' : '黑'}方勝`}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRules((v) => !v)}
                      className="lg:hidden px-2 py-1 rounded border border-stone-600 text-xs text-stone-400"
                    >
                      {showRules ? '關閉規則' : '規則說明'}
                    </button>
                    <button
                      type="button"
                      onClick={resetLobby}
                      className="px-2 py-1 rounded border border-stone-600 text-xs text-stone-400 hover:bg-stone-800"
                    >
                      結束・返回
                    </button>
                  </div>
                </div>

                {showRules && (
                  <div className="lg:hidden">
                    <ChessRulesPanel defaultOpen />
                  </div>
                )}

                <div className="mx-auto w-fit">
                  <div className="flex mb-1 pl-6">
                    {files.split('').map((f) => (
                      <div
                        key={f}
                        className="w-10 sm:w-12 text-center text-xs text-stone-500"
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                  <div className="flex">
                    <div className="flex flex-col justify-around pr-1 text-xs text-stone-500">
                      {Array.from({ length: SIZE }, (_, i) => {
                        const rank = boardFlipped ? i + 1 : SIZE - i;
                        return (
                          <div key={rank} className="h-10 sm:h-12 flex items-center">
                            {rank}
                          </div>
                        );
                      })}
                    </div>
                    <div
                      className="inline-grid border-2 border-stone-600 rounded overflow-hidden shadow-lg"
                      style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
                    >
                      {Array.from({ length: SIZE }, (_, dr) =>
                        Array.from({ length: SIZE }, (_, dc) => {
                          const r = boardFlipped ? SIZE - 1 - dr : dr;
                          const c = dc;
                          const piece = board[r][c];
                          const isLight = (r + c) % 2 === 0;
                          const isFrom = lastMove && lastMove.fr === r && lastMove.fc === c;
                          const isTo = lastMove && lastMove.tr === r && lastMove.tc === c;
                          const isSelected = selected?.r === r && selected?.c === c;
                          const isHint = legalTargets.has(`${r},${c}`);
                          const kingHere = piece?.type === 'K' && inCheckColor === piece.color;

                          return (
                            <button
                              key={`${r}-${c}`}
                              type="button"
                              onClick={() => handleCellClick(dr, dc)}
                              disabled={phase === 'ended' || phase === 'thinking'}
                              className={`relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-2xl sm:text-3xl select-none transition-colors ${
                                isLight ? 'bg-[#eeeed2]' : 'bg-[#769656]'
                              } ${isSelected ? 'ring-2 ring-amber-400 ring-inset' : ''} ${
                                isHint ? 'bg-emerald-400/40' : ''
                              } ${kingHere ? 'ring-2 ring-red-500 ring-inset' : ''}`}
                            >
                              {isFrom && (
                                <span className="absolute inset-0 ring-2 ring-red-500 ring-inset pointer-events-none" />
                              )}
                              {isTo && (
                                <span className="absolute inset-0 ring-2 ring-sky-400 ring-inset pointer-events-none" />
                              )}
                              {piece && (
                                <span
                                  className={
                                    piece.color === 'white' ? 'text-stone-100 drop-shadow' : 'text-stone-900'
                                  }
                                >
                                  {pieceLabel(piece)}
                                </span>
                              )}
                            </button>
                          );
                        }),
                      )}
                    </div>
                  </div>
                </div>

                {lastResponse && (
                  <div className="rounded-lg border border-stone-700 bg-stone-900/60 p-3 text-sm max-w-md">
                    <div className="text-stone-500 text-xs mb-1">對方著法</div>
                    <div className="text-stone-200">{lastResponse}</div>
                  </div>
                )}

                {phase === 'ended' && endReason && (
                  <p className="text-center text-emerald-300">{endReason}</p>
                )}

                <div className="rounded-lg border border-stone-700 bg-stone-900/40 p-3 max-h-40 overflow-y-auto">
                  <div className="text-xs text-stone-500 mb-2">棋譜</div>
                  <div className="space-y-0.5 text-xs font-mono text-stone-400">
                    {log.map((entry, i) => (
                      <div key={`${entry.t}-${i}`}>
                        <span className="text-stone-600">{entry.t}</span> {entry.line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-16">
              <ChessRulesPanel defaultOpen />
            </div>
          </aside>
        </div>
      </div>

      {promoteChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-xl border border-stone-600 bg-stone-900 p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-semibold text-lg text-stone-100 text-center">兵升變</h3>
            <p className="text-sm text-stone-400 text-center">請選擇升變棋子</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Q', 'R', 'B', 'N'].map((pt) => {
                const move = promoteChoice.candidates.find((c) => c.promote === pt);
                if (!move) return null;
                return (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => executeMove(move)}
                    className="px-4 py-3 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-600 text-2xl"
                    title={PIECE_ZH[pt]}
                  >
                    {pieceLabel({ type: pt, color: humanColor })}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setPromoteChoice(null)}
              className="w-full text-xs text-stone-500 hover:text-stone-300"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
