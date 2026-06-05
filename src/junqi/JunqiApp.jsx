import { useCallback, useMemo, useRef, useState } from 'react';
import { findBestMove } from './ai.js';
import JunqiRulesPanel from './JunqiRulesPanel.jsx';
import JunqiBoard from './JunqiBoard.jsx';
import JunqiPiece from './JunqiPiece.jsx';
import {
  ROWS,
  defaultGame,
  getLegalMoves,
  applyMove,
  getGameResult,
  formatMoveBrief,
} from './logic.js';

export default function JunqiApp() {
  const [phase, setPhase] = useState('lobby');
  const [humanColor, setHumanColor] = useState('red');
  const aiColor = humanColor === 'red' ? 'blue' : 'red';
  const flipped = humanColor === 'blue';

  const [game, setGame] = useState(() => defaultGame());
  const [selected, setSelected] = useState(null);
  const [lastMark, setLastMark] = useState(null);
  const [lastResponse, setLastResponse] = useState('');
  const [log, setLog] = useState([]);
  const [winner, setWinner] = useState(null);
  const [endReason, setEndReason] = useState('');
  const [showRules, setShowRules] = useState(true);
  const aiBusyRef = useRef(false);

  const pushLog = useCallback((line) => {
    setLog((prev) => [...prev, { t: new Date().toLocaleTimeString(), line }]);
  }, []);

  const endGame = useCallback(
    (w, reason) => {
      setPhase('ended');
      setWinner(w);
      setEndReason(reason || '');
      aiBusyRef.current = false;
      if (reason) pushLog(reason);
    },
    [pushLog],
  );

  const resolveAfterMove = useCallback(
    (next) => {
      const result = getGameResult(next);
      if (result) {
        setGame(next);
        if (result.type === 'win') {
          endGame(result.winner, result.reason);
          return true;
        }
      }
      setGame(next);
      return false;
    },
    [endGame],
  );

  const runAi = useCallback(
    (state) => {
      if (aiBusyRef.current) return;
      aiBusyRef.current = true;
      setPhase('thinking');
      setTimeout(() => {
        const result = findBestMove(state, aiColor);
        if (!result) {
          endGame(humanColor, 'AI 無合法手');
          return;
        }
        const m = result.move;
        const next = applyMove(state, m);
        setLastMark({ fr: m.fr, fc: m.fc, tr: m.tr, tc: m.tc });
        setLastResponse(`對手：${formatMoveBrief(state, m)}`);
        pushLog(`AI ${formatMoveBrief(state, m)}`);
        if (resolveAfterMove(next)) {
          aiBusyRef.current = false;
          return;
        }
        setSelected(null);
        aiBusyRef.current = false;
        setPhase('playing');
      }, 60);
    },
    [aiColor, humanColor, pushLog, endGame, resolveAfterMove],
  );

  const commitMove = useCallback(
    (move) => {
      if (phase !== 'playing' || game.turn !== humanColor || aiBusyRef.current) return;
      const next = applyMove(game, move);
      setLastMark({ fr: move.fr, fc: move.fc, tr: move.tr, tc: move.tc });
      setLastResponse(`我方：${formatMoveBrief(game, move)}`);
      pushLog(`我方 ${formatMoveBrief(game, move)}`);
      setSelected(null);
      if (resolveAfterMove(next)) return;
      if (next.turn === aiColor) runAi(next);
    },
    [phase, game, humanColor, aiColor, pushLog, resolveAfterMove, runAi],
  );

  const startGame = useCallback(() => {
    const g = defaultGame();
    setGame(g);
    setPhase('playing');
    setSelected(null);
    setLastMark(null);
    setLastResponse('');
    setLog([]);
    setWinner(null);
    setEndReason('');
    aiBusyRef.current = false;
    pushLog('軍棋開局：紅方先手');
    if (humanColor === 'blue') runAi(g);
    else setLastResponse('請紅方走棋');
  }, [humanColor, pushLog, runAi]);

  const legalTargets = useMemo(() => {
    const map = new Map();
    if (phase !== 'playing' || game.turn !== humanColor || !selected) return map;
    const { r, c } = selected;
    for (const m of getLegalMoves(game, humanColor)) {
      if (m.fr !== r || m.fc !== c) continue;
      map.set(`${m.tr},${m.tc}`, m);
    }
    return map;
  }, [phase, game, humanColor, selected]);

  const displayRows = flipped ? [...Array(ROWS).keys()] : [...Array(ROWS).keys()].reverse();

  const pieceRevealed = (piece) => piece && (piece.owner === humanColor || piece.revealed);

  const onCellClick = (r, c) => {
    if (phase !== 'playing' || game.turn !== humanColor) return;
    const piece = game.board[r][c];
    if (selected) {
      const m = legalTargets.get(`${r},${c}`);
      if (m) {
        commitMove(m);
        return;
      }
      if (piece && piece.owner === humanColor) {
        setSelected({ r, c });
        return;
      }
      setSelected(null);
      return;
    }
    if (piece && piece.owner === humanColor && piece.type !== 'F' && piece.type !== 'M') {
      setSelected({ r, c });
    }
  };

  return (
    <div className="min-h-screen p-3 sm:p-6 bg-[#1a1208] text-[#f5e6d3]">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#6b4423] pb-4">
          <div>
            <h1 className="text-2xl font-serif font-bold">陸軍棋</h1>
            <p className="text-xs text-[#c4a574]">陸戰棋 · 12×5 標準棋盤 · 暗棋</p>
          </div>
          <button
            type="button"
            onClick={() => setShowRules((v) => !v)}
            className="px-3 py-1.5 rounded border border-[#6b4423] text-sm hover:bg-[#3d2817]"
          >
            {showRules ? '隱藏規則' : '顯示規則'}
          </button>
          {phase === 'playing' && (
            <div className="text-sm">
              手番：
              <strong className={game.turn === 'red' ? 'text-red-300' : 'text-blue-300'}>
                {game.turn === 'red' ? '紅方' : '藍方'}
              </strong>
            </div>
          )}
        </header>

        {showRules && (
          <div className="lg:hidden">
            <JunqiRulesPanel defaultOpen={phase === 'lobby'} />
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_min(20rem,100%)] gap-4 items-start">
          <div className="space-y-4 min-w-0">
            {phase === 'lobby' && (
              <section className="rounded-xl border border-[#6b4423] bg-[#3d2817]/80 p-5 space-y-4">
                <h2 className="font-serif text-lg">對局設定</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setHumanColor('red')}
                    className={`px-4 py-2 rounded-lg border ${
                      humanColor === 'red' ? 'bg-red-900/70 border-red-500' : 'border-[#6b4423]'
                    }`}
                  >
                    紅方（先手）
                  </button>
                  <button
                    type="button"
                    onClick={() => setHumanColor('blue')}
                    className={`px-4 py-2 rounded-lg border ${
                      humanColor === 'blue' ? 'bg-blue-900/70 border-blue-500' : 'border-[#6b4423]'
                    }`}
                  >
                    藍方
                  </button>
                </div>
                <button
                  type="button"
                  onClick={startGame}
                  className="px-5 py-2.5 rounded-lg bg-[#8b4513] hover:bg-[#a0522d] font-semibold"
                >
                  隨機佈局・開始
                </button>
                <p className="text-xs text-[#c4a574]">開局自動暗棋佈陣，奪旗即勝。</p>
              </section>
            )}

            {lastResponse && phase !== 'lobby' && (
              <div className="rounded-lg border border-[#6b4423] bg-[#3d2817]/60 px-4 py-2 text-sm">
                {phase === 'thinking' ? '…' : lastResponse}
              </div>
            )}

            <JunqiBoard displayRows={displayRows}>
                {displayRows.map((r) =>
                  Array.from({ length: 5 }, (_, c) => {
                    const piece = game.board[r][c];
                    const isFrom = lastMark && lastMark.fr === r && lastMark.fc === c;
                    const isTo = lastMark && lastMark.tr === r && lastMark.tc === c;
                    const isSel = selected?.r === r && selected?.c === c;
                    const isHint = legalTargets.has(`${r},${c}`);

                    return (
                      <button
                        key={`${r}-${c}`}
                        type="button"
                        disabled={phase === 'lobby' || phase === 'ended' || phase === 'thinking'}
                        onClick={() => onCellClick(r, c)}
                        className={[
                          'relative w-full h-full min-h-0 flex items-center justify-center bg-transparent',
                          isHint ? 'ring-2 ring-emerald-500 ring-inset z-[2]' : '',
                          isFrom ? 'ring-2 ring-red-500 ring-inset z-[2]' : '',
                          isTo ? 'ring-2 ring-sky-500 ring-inset z-[2]' : '',
                          isSel ? 'outline outline-2 outline-amber-500 z-[2]' : '',
                        ].join(' ')}
                      >
                        {piece && (
                          <JunqiPiece piece={piece} revealed={pieceRevealed(piece)} />
                        )}
                      </button>
                    );
                  }),
                )}
              </JunqiBoard>

            <div className="flex flex-wrap gap-x-4 text-xs text-[#c4a574]">
              <span>虛線粗線＝鐵路</span>
              <span>細實線＝公路</span>
              <span>○ 行營</span>
              <span>■ 大本營</span>
              <span>◎ 山界</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {(phase === 'playing' || phase === 'ended' || phase === 'thinking') && (
                <button
                  type="button"
                  onClick={() => { setPhase('lobby'); setGame(defaultGame()); }}
                  className="px-3 py-2 rounded border border-[#6b4423] text-sm hover:bg-[#3d2817]"
                >
                  終局・返回
                </button>
              )}
            </div>

            {phase === 'ended' && (
              <div className="rounded-xl border border-amber-800/50 bg-amber-950/30 p-4">
                <div className="text-lg font-bold">
                  {winner === humanColor ? '你贏了！' : 'AI 獲勝'}
                </div>
                {endReason && <p className="text-sm text-[#c4a574] mt-1">{endReason}</p>}
              </div>
            )}

            <div className="rounded-xl border border-[#6b4423] bg-[#2a1810] p-3 max-h-32 overflow-y-auto">
              <div className="text-xs text-[#c4a574] mb-1">棋譜</div>
              <ul className="text-xs font-mono text-[#d4ad4a] space-y-0.5">
                {log.map((row, i) => (
                  <li key={i}>
                    <span className="text-[#8b6914]">{row.t}</span> {row.line}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {showRules && (
            <aside className="hidden lg:block sticky top-4">
              <JunqiRulesPanel defaultOpen className="max-h-[calc(100vh-2rem)]" />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
