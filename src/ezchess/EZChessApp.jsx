import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  BOARD_SIZE,
  MAX_MOVES,
  RESPONSE_MS,
  EXTEND_MS,
  EXTEND_CHANCES,
  defaultGrid,
  randomGridOpening,
  sampleGridFromSlides,
  parseBoardText,
  getValidMoves,
  formatMoveBrief,
  getAllMoves,
  getSide,
  applyUvSetup,
  isValidUvSetup,
  isValidMove,
  parseMove,
  SCORES,
} from './logic.js';
import { createGameState, applyMoveOnState, resolveWinner, opponent } from './gameState.js';
import { findBestMove } from './ai.js';

function formatClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${r.toString().padStart(2, '0')}` : `${r}s`;
}

function toDisplayRow(logicalRow, flipped) {
  return flipped ? BOARD_SIZE - 1 - logicalRow : logicalRow;
}

function toLogicalRow(displayRow, flipped) {
  return flipped ? BOARD_SIZE - 1 - displayRow : displayRow;
}

export default function EZChessApp() {
  const [phase, setPhase] = useState('lobby');
  const [humanSide, setHumanSide] = useState('UV');
  const aiSide = humanSide === 'AB' ? 'UV' : 'AB';
  const boardFlipped = humanSide === 'AB';

  const [previewGrid, setPreviewGrid] = useState(() => defaultGrid());
  const [boardText, setBoardText] = useState('');
  const [gameState, setGameState] = useState(null);
  const [selected, setSelected] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [lastResponse, setLastResponse] = useState('');
  const [moveInput, setMoveInput] = useState('');
  const [log, setLog] = useState([]);
  const [winner, setWinner] = useState(null);
  const [endReason, setEndReason] = useState('');
  const [extendedTurn, setExtendedTurn] = useState(false);
  const [abExtendUsed, setAbExtendUsed] = useState(0);
  const [uvExtendUsed, setUvExtendUsed] = useState(0);
  const [uvSetupDeadline, setUvSetupDeadline] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const turnStartRef = useRef(0);
  const aiBusyRef = useRef(false);
  const endedRef = useRef(false);

  const grid = gameState?.grid ?? previewGrid;
  const turn = gameState?.turn ?? 'AB';
  const moveCount = gameState?.moveCount ?? 0;
  const abKill = gameState?.abKill ?? 0;
  const uvKill = gameState?.uvKill ?? 0;
  const abTimeMs = gameState?.abTimeMs ?? 0;
  const uvTimeMs = gameState?.uvTimeMs ?? 0;

  const appendLog = useCallback((line) => {
    setLog((prev) => [...prev, { t: new Date().toLocaleTimeString(), line }]);
  }, []);

  const endGame = useCallback(
    (win, reason) => {
      if (endedRef.current) return;
      endedRef.current = true;
      aiBusyRef.current = false;
      setPhase('ended');
      setWinner(win);
      setEndReason(reason || '');
      if (reason) appendLog(`終局：${reason}`);
    },
    [appendLog],
  );

  const checkTerminal = useCallback(
    (state, note) => {
      const win = resolveWinner(state);
      if (win) {
        endGame(win, note || (win === 'Tie' ? '平手' : `${win} 方獲勝`));
        return true;
      }
      return false;
    },
    [endGame],
  );

  const turnLimitMs = useMemo(() => {
    if (moveCount < 4) return EXTEND_MS;
    return extendedTurn ? EXTEND_MS : RESPONSE_MS;
  }, [moveCount, extendedTurn]);

  const turnRemainingMs = useMemo(() => {
    if (phase !== 'playing' || !turnStartRef.current) return 0;
    return Math.max(0, turnLimitMs - (now - turnStartRef.current));
  }, [phase, turnLimitMs, now]);

  const uvSetupRemainingMs = useMemo(() => {
    if (phase !== 'uvSetup' || !uvSetupDeadline) return 0;
    return Math.max(0, uvSetupDeadline - now);
  }, [phase, uvSetupDeadline, now]);

  const validTargets = useMemo(() => {
    if (phase !== 'playing' || !selected || turn !== humanSide) return new Set();
    const piece = grid[selected.r][selected.c];
    if (!piece || getSide(piece) !== humanSide) return new Set();
    return new Set(
      getValidMoves(piece, selected.r, selected.c, grid).map(([r, c]) => `${r},${c}`),
    );
  }, [phase, selected, turn, humanSide, grid]);

  const resetLobby = useCallback(() => {
    setPreviewGrid(defaultGrid());
    setPhase('lobby');
    setGameState(null);
    setSelected(null);
    setLastMove(null);
    setLastResponse('');
    setMoveInput('');
    setLog([]);
    setWinner(null);
    setEndReason('');
    setExtendedTurn(false);
    setAbExtendUsed(0);
    setUvExtendUsed(0);
    setUvSetupDeadline(0);
    turnStartRef.current = 0;
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
          endGame(humanSide, `${aiSide} 方已無合法棋步`);
          return;
        }

        const { move } = result;
        const next = applyMoveOnState(state, move);
        setGameState(next);
        setLastMove(move);
        setLastResponse(formatMoveBrief(move.piece, move.fr, move.fc, move.tr, move.tc));
        appendLog(`AI(${aiSide}) ${formatMoveBrief(move.piece, move.fr, move.fc, move.tr, move.tc)}`);

        aiBusyRef.current = false;
        turnStartRef.current = Date.now();
        setExtendedTurn(false);

        if (checkTerminal(next, `滿 ${MAX_MOVES} 手或無合法棋步`)) return;

        setPhase('playing');
        if (next.turn === aiSide) runAiTurn(next);
      }, 30);
    },
    [aiSide, humanSide, appendLog, checkTerminal, endGame],
  );

  const beginPlay = useCallback(
    (startGrid) => {
      const state = createGameState(startGrid);
      setGameState(state);
      setPreviewGrid(startGrid);
      setPhase('playing');
      setSelected(null);
      setLastMove(null);
      setLastResponse('');
      setExtendedTurn(false);
      setAbExtendUsed(0);
      setUvExtendUsed(0);
      turnStartRef.current = Date.now();
      endedRef.current = false;
      aiBusyRef.current = false;
      appendLog('對局開始：AB（紅）先手，UV（藍）後手。');

      if (state.turn === aiSide) {
        appendLog(`AI（${aiSide}）先手運算中…`);
        runAiTurn(state);
      } else {
        appendLog(`輪到你（${humanSide}）走棋。`);
      }
    },
    [aiSide, humanSide, appendLog, runAiTurn],
  );

  const submitOpening = useCallback(() => {
    let nextGrid = previewGrid;
    if (boardText.trim()) {
      try {
        nextGrid = parseBoardText(boardText);
        setPreviewGrid(nextGrid);
      } catch {
        window.alert('棋盤文字解析失敗');
        return;
      }
    }

    setLog([]);
    setWinner(null);
    setEndReason('');
    endedRef.current = false;

    if (humanSide === 'UV') {
      setPhase('uvSetup');
      setUvSetupDeadline(Date.now() + EXTEND_MS);
      setSelected(null);
      appendLog('開局已載入。UV 方可將任一枚棋子（含敵我）移至空格一次，完成後 AB 先手。');
    } else {
      beginPlay(nextGrid);
    }
  }, [previewGrid, boardText, humanSide, appendLog, beginPlay]);

  const finishHumanMove = useCallback(
    (move, sourceLabel) => {
      if (phase !== 'playing' || turn !== humanSide || aiBusyRef.current || endedRef.current) {
        return false;
      }
      if (!isValidMove(grid, move.piece, move.fr, move.fc, move.tr, move.tc)) {
        appendLog(`非法棋步：${formatMoveBrief(move.piece, move.fr, move.fc, move.tr, move.tc)}`);
        return false;
      }

      const elapsed = Date.now() - turnStartRef.current;
      let next = applyMoveOnState(gameState, move);
      next = {
        ...next,
        abTimeMs: next.abTimeMs + (humanSide === 'AB' ? elapsed : 0),
        uvTimeMs: next.uvTimeMs + (humanSide === 'UV' ? elapsed : 0),
      };

      setGameState(next);
      setLastMove(move);
      setSelected(null);
      appendLog(
        `我方(${humanSide}) ${formatMoveBrief(move.piece, move.fr, move.fc, move.tr, move.tc)}（${sourceLabel}，${(elapsed / 1000).toFixed(2)}s）`,
      );

      turnStartRef.current = Date.now();
      setExtendedTurn(false);

      if (checkTerminal(next)) return true;

      if (next.turn === aiSide) runAiTurn(next);
      return true;
    },
    [phase, turn, humanSide, grid, gameState, aiSide, appendLog, checkTerminal, runAiTurn],
  );

  const handleCellClick = useCallback(
    (displayRow, displayCol) => {
      const r = toLogicalRow(displayRow, boardFlipped);
      const c = displayCol;

      if (phase === 'ended' || phase === 'thinking') return;

      if (phase === 'uvSetup') {
        const piece = grid[r][c];
        if (!selected) {
          if (piece) setSelected({ r, c });
          return;
        }
        const { r: sr, c: sc } = selected;
        if (sr === r && sc === c) {
          setSelected(null);
          return;
        }
        if (piece) {
          setSelected({ r, c });
          return;
        }
        if (!isValidUvSetup(grid, sr, sc, r, c)) return;
        const nextGrid = applyUvSetup(grid, sr, sc, r, c);
        if (!nextGrid) return;
        setPreviewGrid(nextGrid);
        setSelected(null);
        appendLog(`UV 開局調整：(${sr},${sc}) → (${r},${c})`);
        beginPlay(nextGrid);
        return;
      }

      if (phase !== 'playing' || turn !== humanSide || aiBusyRef.current) return;

      const piece = grid[r][c];
      if (!selected) {
        if (piece && getSide(piece) === humanSide) setSelected({ r, c });
        return;
      }

      const { r: sr, c: sc } = selected;
      const moving = grid[sr][sc];
      if (sr === r && sc === c) {
        setSelected(null);
        return;
      }
      if (piece && getSide(piece) === humanSide) {
        setSelected({ r, c });
        return;
      }

      finishHumanMove({ piece: moving, fr: sr, fc: sc, tr: r, tc: c }, '點選');
    },
    [
      phase,
      boardFlipped,
      grid,
      selected,
      turn,
      humanSide,
      appendLog,
      beginPlay,
      finishHumanMove,
    ],
  );

  const skipUvSetup = useCallback(() => {
    appendLog('跳過 UV 開局調整。');
    beginPlay(previewGrid);
  }, [appendLog, beginPlay, previewGrid]);

  const useExtend = useCallback(() => {
    if (phase !== 'playing' || turn !== humanSide || extendedTurn || moveCount < 4) return;
    const used = humanSide === 'AB' ? abExtendUsed : uvExtendUsed;
    if (used >= EXTEND_CHANCES) return;
    setExtendedTurn(true);
    if (humanSide === 'AB') setAbExtendUsed((n) => n + 1);
    else setUvExtendUsed((n) => n + 1);
    appendLog(`${humanSide} 使用延長，本步上限 ${EXTEND_MS / 1000} 秒（已用 ${used + 1}/${EXTEND_CHANCES} 次）`);
  }, [phase, turn, humanSide, extendedTurn, moveCount, abExtendUsed, uvExtendUsed, appendLog]);

  const handleMoveSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (phase !== 'playing' || turn !== humanSide || aiBusyRef.current) {
        window.alert('目前輪到 AI，請等待回應。');
        return;
      }
      const parsed = parseMove(moveInput.trim());
      if (!parsed) {
        window.alert('格式錯誤，例：B:(3,5)-(2,4)');
        return;
      }
      const { piece, fr, fc, tr, tc } = parsed;
      if (getSide(piece) !== humanSide) {
        window.alert('只能輸入己方棋子');
        return;
      }
      if (grid[fr][fc] !== piece) {
        window.alert('起點無該子');
        return;
      }
      if (finishHumanMove({ piece, fr, fc, tr, tc }, '手動輸入')) setMoveInput('');
      else window.alert('非法移動');
    },
    [phase, turn, humanSide, moveInput, grid, finishHumanMove],
  );

  const tickTimeout = useCallback(() => {
    const t = Date.now();
    if (phase === 'uvSetup' && uvSetupDeadline && t >= uvSetupDeadline) {
      appendLog('UV 調整逾時，直接開局。');
      beginPlay(previewGrid);
      return;
    }
    if (phase !== 'playing' || endedRef.current || aiBusyRef.current || turn !== humanSide) return;

    const elapsed = t - turnStartRef.current;
    if (elapsed >= turnLimitMs) {
      endGame(opponent(humanSide), `${turn} 方逾時（${turnLimitMs / 1000} 秒）`);
      return;
    }

    if (getAllMoves(grid, turn).length === 0) {
      endGame(opponent(turn), `${turn} 方已無合法棋步`);
    }
  }, [
    phase,
    uvSetupDeadline,
    turn,
    humanSide,
    turnLimitMs,
    grid,
    appendLog,
    beginPlay,
    previewGrid,
    endGame,
  ]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
      tickTimeout();
    }, 250);
    return () => window.clearInterval(id);
  }, [tickTimeout]);

  useEffect(() => {
    if (phase !== 'playing' || endedRef.current || aiBusyRef.current || turn !== humanSide) return;
    if (getAllMoves(grid, turn).length > 0) return;
    const id = window.setTimeout(() => endGame(opponent(turn), `${turn} 方已無合法棋步`), 0);
    return () => window.clearTimeout(id);
  }, [phase, grid, turn, humanSide, endGame]);

  const humanTurnActive = phase === 'playing' && turn === humanSide && !aiBusyRef.current;
  const extendRemaining = EXTEND_CHANCES - (humanSide === 'AB' ? abExtendUsed : uvExtendUsed);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-3 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-stone-700 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-amber-100">EZChess</h1>
            <p className="text-sm text-stone-400 mt-1">
              人機對弈 · AB 先手 / UV 後手 · Alpha-Beta AI · UV 開局可調整任一子至空格
            </p>
          </div>

          {humanTurnActive && (
            <div className="text-right text-sm">
              <div className="text-amber-200 font-mono text-lg">
                本步剩餘 {formatClock(turnRemainingMs)}
              </div>
              <div className="text-stone-500">
                {moveCount < 4
                  ? `前四手每步 ${EXTEND_MS / 1000} 秒`
                  : `每步 ${RESPONSE_MS / 1000} 秒，可延長至 ${EXTEND_MS / 1000} 秒（各 ${EXTEND_CHANCES} 次）`}
              </div>
            </div>
          )}

          {phase === 'thinking' && (
            <div className="text-right font-mono text-violet-300 animate-pulse">
              AI 運算中（Alpha-Beta）…
            </div>
          )}

          {phase === 'uvSetup' && (
            <div className="text-right font-mono text-amber-200">
              UV 調整剩餘 {formatClock(uvSetupRemainingMs)}
            </div>
          )}
        </header>

        {phase === 'lobby' && (
          <section className="rounded-xl border border-stone-700 bg-stone-900/80 p-4 space-y-3">
            <h2 className="font-semibold text-stone-200">開局設定</h2>

            <div className="space-y-2">
              <div className="text-sm text-stone-400">選擇你的陣營</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setHumanSide('AB')}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    humanSide === 'AB'
                      ? 'bg-rose-800 border-rose-500'
                      : 'bg-stone-800 border-stone-600'
                  }`}
                >
                  我執 AB（紅）
                </button>
                <button
                  type="button"
                  onClick={() => setHumanSide('UV')}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    humanSide === 'UV'
                      ? 'bg-sky-800 border-sky-500'
                      : 'bg-stone-800 border-stone-600'
                  }`}
                >
                  我執 UV（藍）
                </button>
              </div>
              <p className="text-xs text-stone-500">
                對手由 AI 擔任（{aiSide} 方），使用 Alpha-Beta 剪枝搜尋。提交開局後 AB 先手；若你為
                UV，可先調整棋盤再由 AI 回應。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="px-3 py-2 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-sm border border-rose-700"
                onClick={() => setPreviewGrid(defaultGrid())}
              >
                標準開局
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-sm border border-stone-600"
                onClick={() => setPreviewGrid(randomGridOpening())}
              >
                隨機棋型開局
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-sm border border-stone-600"
                onClick={() => setPreviewGrid(sampleGridFromSlides())}
              >
                簡報示意開局
              </button>
            </div>

            <label className="block text-sm text-stone-400">
              開局棋盤（8 行，
              <code className="text-amber-200/90">.</code> 為空）
              <textarea
                className="mt-1 w-full h-28 rounded-lg bg-stone-950 border border-stone-700 p-2 font-mono text-xs text-stone-300"
                placeholder={'........\n........\n....A...'}
                value={boardText}
                onChange={(e) => setBoardText(e.target.value)}
              />
            </label>

            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold"
              onClick={submitOpening}
            >
              提交開局並開始（AB 先手）
            </button>
          </section>
        )}

        {phase === 'uvSetup' && (
          <div className="rounded-lg bg-sky-950/40 border border-sky-800 px-3 py-2 text-sm text-sky-100">
            你執行 UV：請點選<strong>任一枚棋子</strong>（己方或敵方皆可），再點
            <strong>空格</strong>完成一次開局調整，或按「跳過」。完成後 AI 以 AB 先手回應。
          </div>
        )}

        {((lastResponse && phase !== 'lobby' && phase !== 'uvSetup') || phase === 'thinking') && (
          <div className="rounded-lg border border-violet-700/60 bg-violet-950/30 px-4 py-3">
            <div className="text-xs text-violet-300 uppercase tracking-wide">對方著法</div>
            <div className="mt-1 font-mono text-sm text-violet-100 break-all">
              {phase === 'thinking' ? '運算中…' : lastResponse || '—'}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-3">
            <div
              className="inline-grid gap-1 p-2 rounded-xl bg-stone-900 border border-stone-700"
              style={{ gridTemplateColumns: `auto repeat(${BOARD_SIZE}, minmax(2.25rem, 1fr))` }}
            >
              <div />
              {Array.from({ length: BOARD_SIZE }, (_, col) => (
                <div key={`h-${col}`} className="text-center text-xs text-stone-500 font-mono">
                  {col}
                </div>
              ))}

              {Array.from({ length: BOARD_SIZE }, (_, displayRow) => {
                const logicalRow = toLogicalRow(displayRow, boardFlipped);
                return (
                  <div key={`row-${displayRow}`} className="contents">
                    <div className="text-xs text-stone-500 font-mono flex items-center pr-1">
                      {logicalRow}
                    </div>
                    {Array.from({ length: BOARD_SIZE }, (_, col) => {
                      const piece = grid[logicalRow][col];
                      const side = getSide(piece);
                      const isSelected = selected?.r === logicalRow && selected?.c === col;
                      const isTarget = validTargets.has(`${logicalRow},${col}`);
                      const isFrom =
                        lastMove &&
                        lastMove.fr === logicalRow &&
                        lastMove.fc === col;
                      const isTo =
                        lastMove &&
                        lastMove.tr === logicalRow &&
                        lastMove.tc === col;
                      const checker = (logicalRow + col) % 2 === 0;

                      return (
                        <button
                          key={`${logicalRow}-${col}`}
                          type="button"
                          disabled={phase === 'ended' || phase === 'lobby' || phase === 'thinking'}
                          onClick={() => handleCellClick(displayRow, col)}
                          className={[
                            'h-10 w-10 sm:h-12 sm:w-12 rounded-md text-sm font-bold transition-all flex items-center justify-center',
                            checker ? 'bg-stone-800/90' : 'bg-stone-700/90',
                            piece
                              ? side === 'AB'
                                ? 'bg-rose-600/90 text-white shadow-inner'
                                : side === 'UV'
                                  ? 'bg-sky-600/90 text-white shadow-inner'
                                  : ''
                              : 'text-stone-500',
                            isFrom ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-stone-900 z-10' : '',
                            isTo ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-stone-900 z-10' : '',
                            isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-stone-900 z-10' : '',
                            isTarget ? 'ring-2 ring-emerald-400/80' : '',
                            phase === 'lobby' ? 'opacity-40' : 'hover:brightness-110',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {piece || (phase === 'uvSetup' ? '·' : '')}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              {phase === 'uvSetup' && (
                <button
                  type="button"
                  onClick={skipUvSetup}
                  className="px-3 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-sm"
                >
                  跳過 UV 調整
                </button>
              )}
              {humanTurnActive && moveCount >= 4 && !extendedTurn && (
                <button
                  type="button"
                  onClick={useExtend}
                  disabled={extendRemaining <= 0}
                  className="px-3 py-2 rounded-lg bg-violet-800 hover:bg-violet-700 disabled:opacity-40 text-sm"
                >
                  延長本步至 {EXTEND_MS / 1000} 秒（剩 {extendRemaining} 次）
                </button>
              )}
              {(phase === 'playing' || phase === 'ended' || phase === 'thinking') && (
                <button
                  type="button"
                  onClick={resetLobby}
                  className="px-3 py-2 rounded-lg border border-stone-600 text-sm hover:bg-stone-800"
                >
                  回到大廳重開
                </button>
              )}
            </div>

            {humanTurnActive && (
              <form onSubmit={handleMoveSubmit} className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs text-stone-500">輸入己方棋步（例 B:(3,5)-(2,4)）</label>
                  <input
                    className="w-full mt-1 rounded-lg bg-stone-950 border border-stone-700 px-2 py-2 font-mono text-sm"
                    placeholder="B:(3,5)-(2,4)"
                    value={moveInput}
                    onChange={(e) => setMoveInput(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-stone-600 hover:bg-stone-500 text-sm"
                >
                  送出棋步
                </button>
              </form>
            )}
          </div>

          <aside className="w-full lg:w-72 space-y-3 text-sm">
            <div className="rounded-xl border border-stone-700 bg-stone-900/60 p-3 space-y-2">
              <div className="font-semibold text-stone-300">狀態</div>
              <div>
                你方：{humanSide === 'AB' ? 'AB（紅）' : 'UV（藍）'} · AI：{aiSide}
              </div>
              <div>
                輪到：
                {phase === 'playing' || phase === 'thinking'
                  ? turn === 'AB'
                    ? 'AB（紅）'
                    : 'UV（藍）'
                  : phase}
              </div>
              <div>
                手數：{moveCount} / {MAX_MOVES}
              </div>
              <div>
                獵殺分 — AB：
                <span className="text-rose-300 font-mono">{abKill}</span> UV：
                <span className="text-sky-300 font-mono">{uvKill}</span>
              </div>
              <div className="text-stone-400 text-xs">
                累計用時 AB {(abTimeMs / 1000).toFixed(1)}s / UV {(uvTimeMs / 1000).toFixed(1)}s
              </div>
            </div>

            <div className="rounded-xl border border-stone-700 bg-stone-900/60 p-3">
              <div className="font-semibold text-stone-300 mb-2">棋子分數</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-mono text-stone-400">
                {Object.entries(SCORES).map(([k, v]) => (
                  <div key={k}>
                    {k} = {v}
                  </div>
                ))}
              </div>
            </div>

            {phase === 'ended' && (
              <div className="rounded-xl border border-amber-700/60 bg-amber-950/40 p-3">
                <div className="font-bold text-amber-200">對局結束</div>
                <div className="mt-1 text-lg">
                  {winner === 'Tie' ? '平手' : winner === humanSide ? '你獲勝' : 'AI 獲勝'}
                </div>
                {endReason && <div className="text-xs text-stone-400 mt-1">{endReason}</div>}
              </div>
            )}

            <div className="rounded-xl border border-stone-700 bg-stone-900/60 p-3 max-h-64 overflow-y-auto">
              <div className="font-semibold text-stone-300 mb-2">棋譜</div>
              <ul className="space-y-1 font-mono text-xs text-stone-400">
                {log.map((entry, idx) => (
                  <li key={`${idx}-${entry.line.slice(0, 24)}`}>
                    <span className="text-stone-600">{entry.t}</span> {entry.line}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
