import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  SIZE,
  defaultGame,
  getLegalMoves,
  applyMove,
  getDropMoves,
  getGameResult,
  isInCheck,
  getImpasseStatus,
  formatMoveBrief,
  pieceLabel,
} from './logic.js';
import { findBestMove } from './ai.js';
import ShogiRulesPanel from './ShogiRulesPanel.jsx';
import ShogiBoard from './ShogiBoard.jsx';
import ShogiKomadai from './ShogiKomadai.jsx';

function sameMove(a, b) {
  if (!!a.drop !== !!b.drop) return false;
  if (a.drop) return a.type === b.type && a.tr === b.tr && a.tc === b.tc;
  return (
    a.fr === b.fr
    && a.fc === b.fc
    && a.tr === b.tr
    && a.tc === b.tc
    && !!a.promote === !!b.promote
  );
}

export default function ShogiApp() {
  const [phase, setPhase] = useState('lobby');
  const [humanSide, setHumanSide] = useState('sente');
  const aiSide = humanSide === 'sente' ? 'gote' : 'sente';
  const boardFlipped = humanSide === 'gote';

  const [gameState, setGameState] = useState(null);
  const [selected, setSelected] = useState(null);
  const [dropType, setDropType] = useState(null);
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
  const hands = gameState?.hands;

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
    setDropType(null);
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
      if (aiBusyRef.current || endedRef.current || state.turn !== aiSide) return;
      aiBusyRef.current = true;
      setPhase('thinking');

      window.setTimeout(() => {
        if (endedRef.current) {
          aiBusyRef.current = false;
          return;
        }

        const result = findBestMove(state, aiSide);
        if (!result) {
          aiBusyRef.current = false;
          const gr = getGameResult(state);
          endGame(gr || { type: 'checkmate', winner: humanSide, reason: 'AI 無合法手' });
          return;
        }

        const { move } = result;
        const next = applyMove(state, move);
        const brief = formatMoveBrief(state, move);
        setGameState(next);
        setLastMove(move);
        setLastResponse(brief);
        appendLog(`AI(${aiSide === 'sente' ? '▲' : '△'}) ${brief}`);
        setSelected(null);
        setDropType(null);

        aiBusyRef.current = false;

        if (resolveAfterMove(next)) return;

        setPhase('playing');
        if (next.turn === aiSide) runAiTurn(next);
      }, 40);
    },
    [aiSide, humanSide, appendLog, endGame, resolveAfterMove],
  );

  const beginPlay = useCallback(() => {
    const state = defaultGame();
    setGameState(state);
    setPhase('playing');
    setSelected(null);
    setDropType(null);
    setLastMove(null);
    setLastResponse('');
    setPromoteChoice(null);
    endedRef.current = false;
    aiBusyRef.current = false;
    appendLog(`對局開始：${humanSide === 'sente' ? '▲ 先手' : '△ 後手'}（你） vs AI`);

    if (state.turn === aiSide) {
      appendLog('AI 先手…');
      runAiTurn(state);
    }
  }, [humanSide, aiSide, appendLog, runAiTurn]);

  const executeMove = useCallback(
    (move) => {
      if (phase !== 'playing' || turn !== humanSide || aiBusyRef.current || endedRef.current) {
        return;
      }

      const legal = getLegalMoves(gameState, humanSide);
      if (!legal.some((m) => sameMove(m, move))) return;

      const next = applyMove(gameState, move);
      const brief = formatMoveBrief(gameState, move);
      setGameState(next);
      setLastMove(move);
      setLastResponse(brief);
      setSelected(null);
      setDropType(null);
      setPromoteChoice(null);
      appendLog(`我方(${humanSide === 'sente' ? '▲' : '△'}) ${brief}`);

      if (resolveAfterMove(next)) return;

      if (next.turn === aiSide) runAiTurn(next);
    },
    [phase, turn, humanSide, gameState, appendLog, resolveAfterMove, aiSide, runAiTurn],
  );

  const tryMoveTo = useCallback(
    (tr, tc) => {
      if (!gameState || turn !== humanSide) return;

      if (dropType) {
        const moves = getDropMoves(gameState, humanSide, dropType).filter((m) => m.tr === tr && m.tc === tc);
        if (moves.length === 1) executeMove(moves[0]);
        return;
      }

      if (!selected) return;
      const { r: fr, c: fc } = selected;
      const candidates = getLegalMoves(gameState, humanSide).filter(
        (m) => !m.drop && m.fr === fr && m.fc === fc && m.tr === tr && m.tc === tc,
      );
      if (candidates.length === 0) return;
      if (candidates.length === 1) {
        executeMove(candidates[0]);
        return;
      }
      setPromoteChoice({ fr, fc, tr, tc, candidates });
    },
    [gameState, turn, humanSide, dropType, selected, executeMove],
  );

  const toDisplayRow = (r) => (boardFlipped ? SIZE - 1 - r : r);

  const legalTargets = useMemo(() => {
    if (phase !== 'playing' || turn !== humanSide || !gameState) return new Set();
    if (dropType) {
      return new Set(
        getDropMoves(gameState, humanSide, dropType).map((m) => `${m.tr},${m.tc}`),
      );
    }
    if (!selected) return new Set();
    return new Set(
      getLegalMoves(gameState, humanSide)
        .filter((m) => !m.drop && m.fr === selected.r && m.fc === selected.c)
        .map((m) => `${m.tr},${m.tc}`),
    );
  }, [phase, turn, humanSide, gameState, selected, dropType]);

  const inCheckSide = useMemo(() => {
    if (!gameState) return null;
    if (isInCheck(gameState, 'sente')) return 'sente';
    if (isInCheck(gameState, 'gote')) return 'gote';
    return null;
  }, [gameState]);

  const impasse = useMemo(
    () => (gameState ? getImpasseStatus(gameState) : { claimable: false }),
    [gameState],
  );

  const handleCellClick = useCallback(
    (displayRow, col) => {
      if (phase === 'ended' || phase === 'thinking' || !board) return;
      const r = boardFlipped ? SIZE - 1 - displayRow : displayRow;

      if (turn !== humanSide || aiBusyRef.current) return;

      const piece = board[r][col];

      if (dropType) {
        if (legalTargets.has(`${r},${col}`)) tryMoveTo(r, col);
        else {
          setDropType(null);
          if (piece?.owner === humanSide) {
            setSelected({ r, c: col });
          }
        }
        return;
      }

      if (selected) {
        const { r: sr, c: sc } = selected;
        if (sr === r && sc === col) {
          setSelected(null);
          return;
        }
        if (legalTargets.has(`${r},${col}`)) {
          tryMoveTo(r, col);
          return;
        }
      }

      if (piece?.owner === humanSide) {
        setSelected({ r, c: col });
        setDropType(null);
      } else {
        setSelected(null);
      }
    },
    [phase, board, boardFlipped, turn, humanSide, dropType, selected, legalTargets, tryMoveTo],
  );

  const claimImpasse = useCallback(() => {
    if (!impasse.claimable || phase !== 'playing') return;
    endGame({ type: 'draw', reason: impasse.reason || '持將棋和棋' });
  }, [impasse, phase, endGame]);

  useEffect(() => {
    if (phase !== 'playing' || !gameState || endedRef.current) return;
    const result = getGameResult(gameState);
    if (result) endGame(result);
  }, [phase, gameState, endGame]);

  const humanTurnActive = phase === 'playing' && turn === humanSide && !aiBusyRef.current;

  return (
    <div className="min-h-screen bg-[#1a0f08] text-[#f5ecd7] p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div className="flex-1 min-w-0 space-y-4">
            <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-[#6b4423] pb-4">
              <div>
                <h1 className="text-2xl font-serif tracking-tight text-[#f5ecd7]">将棋</h1>
                <p className="text-sm text-[#c4a574] mt-1">人機対弈 · 標準 9×9 · 木製駒樣式</p>
              </div>
              {phase === 'thinking' && (
                <div className="font-serif text-[#d4a574] animate-pulse">AI 思考中…</div>
              )}
              {humanTurnActive && inCheckSide === humanSide && (
                <div className="text-red-400 font-serif font-semibold animate-pulse">王手！</div>
              )}
            </header>

            {phase === 'lobby' && (
              <section className="rounded-xl border border-[#6b4423] bg-[#3d2817]/90 p-4 space-y-4">
                <h2 className="font-serif text-lg text-[#f5ecd7]">対局設定</h2>
                <div className="space-y-2">
                  <div className="text-sm text-[#c4a574]">選擇你的手番</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setHumanSide('sente')}
                      className={`px-4 py-2 rounded-lg text-sm font-serif border ${
                        humanSide === 'sente'
                          ? 'bg-[#8b2500]/50 border-[#c44] text-[#ffe8d0]'
                          : 'bg-[#2a1810] border-[#6b4423] text-[#c4a574]'
                      }`}
                    >
                      ▲ 先手
                    </button>
                    <button
                      type="button"
                      onClick={() => setHumanSide('gote')}
                      className={`px-4 py-2 rounded-lg text-sm font-serif border ${
                        humanSide === 'gote'
                          ? 'bg-[#4a3728] border-[#8b6914] text-[#f5ecd7]'
                          : 'bg-[#2a1810] border-[#6b4423] text-[#c4a574]'
                      }`}
                    >
                      △ 後手
                    </button>
                  </div>
                  <p className="text-xs text-[#8b6914]">
                    選後手時 AI 為先手。不含 EZChess 自訂玩法。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={beginPlay}
                  className="px-4 py-2 rounded-lg bg-[#8b2500] hover:bg-[#a03000] text-[#ffe8d0] font-serif font-semibold"
                >
                  対局開始
                </button>
              </section>
            )}

            {(phase === 'playing' || phase === 'thinking' || phase === 'ended') && board && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="font-serif text-[#e8dcc0]">
                    手番：
                    <span className={turn === 'sente' ? 'text-[#ffe8d0]' : 'text-[#c4a574]'}>
                      {turn === 'sente' ? '▲ 先手' : '△ 後手'}
                    </span>
                    {phase === 'ended' && (
                      <span className="ml-2 text-[#d4a574]">
                        — {winner === 'draw' ? '和棋' : `${winner === 'sente' ? '▲' : '△'} 勝`}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRules((v) => !v)}
                      className="lg:hidden px-2 py-1 rounded border border-[#6b4423] text-xs text-[#c4a574]"
                    >
                      {showRules ? '關閉規則' : '規則說明'}
                    </button>
                    {impasse.claimable && phase === 'playing' && !impasse.autoDraw && (
                      <button
                        type="button"
                        onClick={claimImpasse}
                        className="px-2 py-1 rounded border border-[#6b4423] text-xs text-[#c4a574] hover:bg-[#2a1810]"
                      >
                        持將棋和棋
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={resetLobby}
                      className="px-2 py-1 rounded border border-[#6b4423] text-xs text-[#c4a574] hover:bg-[#2a1810]"
                    >
                      終局・戻回
                    </button>
                  </div>
                </div>

                {showRules && (
                  <div className="lg:hidden">
                    <ShogiRulesPanel defaultOpen />
                  </div>
                )}

                <div className="flex flex-col lg:flex-row gap-4 items-start">
                  <div className="order-2 lg:order-1 flex-1 w-full min-w-0 overflow-x-auto">
                    <ShogiBoard
                      size={SIZE}
                      boardFlipped={boardFlipped}
                      board={board}
                      phase={phase}
                      lastMove={lastMove}
                      selected={selected}
                      legalTargets={legalTargets}
                      inCheckSide={inCheckSide}
                      onCellClick={handleCellClick}
                    />
                  </div>

                  <div className="order-1 lg:order-2 w-full lg:w-56 space-y-3 shrink-0">
                    <ShogiKomadai
                      label="△ 後手持駒"
                      owner="gote"
                      hands={hands}
                      selectedType={turn === 'gote' && humanSide === 'gote' ? dropType : null}
                      onSelect={turn === 'gote' && humanSide === 'gote' ? setDropType : () => {}}
                      disabled={phase !== 'playing' || turn !== 'gote' || humanSide !== 'gote'}
                    />
                    <ShogiKomadai
                      label="▲ 先手持駒"
                      owner="sente"
                      hands={hands}
                      selectedType={turn === 'sente' && humanSide === 'sente' ? dropType : null}
                      onSelect={turn === 'sente' && humanSide === 'sente' ? setDropType : () => {}}
                      disabled={phase !== 'playing' || turn !== 'sente' || humanSide !== 'sente'}
                    />
                    {lastResponse && (
                      <div className="rounded-lg border border-[#6b4423] bg-[#2a1810]/60 p-3 text-sm">
                        <div className="text-[#8b6914] text-xs mb-1">對方著法</div>
                        <div className="font-serif text-[#e8dcc0]">{lastResponse}</div>
                      </div>
                    )}
                  </div>
                </div>

                {phase === 'ended' && endReason && (
                  <p className="text-center text-[#d4a574] font-serif">{endReason}</p>
                )}

                <div className="rounded-lg border border-[#6b4423] bg-[#2a1810]/40 p-3 max-h-40 overflow-y-auto">
                  <div className="text-xs text-[#8b6914] mb-2">棋譜</div>
                  <div className="space-y-0.5 text-xs font-mono text-[#c4a574]">
                    {log.map((entry, i) => (
                      <div key={`${entry.t}-${i}`}>
                        <span className="text-[#6b4423]">{entry.t}</span> {entry.line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-16">
              <ShogiRulesPanel defaultOpen />
            </div>
          </aside>
        </div>
      </div>

      {promoteChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-xl border border-[#6b4423] bg-[#3d2817] p-5 max-w-xs w-full space-y-4 shadow-xl">
            <h3 className="font-serif text-lg text-[#f5ecd7] text-center">升變しますか？</h3>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  const m = promoteChoice.candidates.find((c) => c.promote);
                  if (m) executeMove(m);
                }}
                className="px-4 py-2 rounded-lg bg-[#8b2500] text-[#ffe8d0] font-serif"
              >
                升變
              </button>
              <button
                type="button"
                onClick={() => {
                  const m = promoteChoice.candidates.find((c) => !c.promote);
                  if (m) executeMove(m);
                }}
                className="px-4 py-2 rounded-lg border border-[#6b4423] text-[#e8dcc0] font-serif"
              >
                不升變
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPromoteChoice(null)}
              className="w-full text-xs text-[#8b6914] hover:text-[#c4a574]"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
