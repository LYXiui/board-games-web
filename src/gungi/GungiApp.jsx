import { useCallback, useMemo, useRef, useState } from 'react';
import { findBestMove } from './ai.js';
import GungiRulesPanel from './GungiRulesPanel.jsx';
import {
  SIZE,
  defaultGame,
  getLegalMoves,
  applyMove,
  getGameResult,
  isMarshalThreatened,
  formatMoveBrief,
  pieceLabel,
  PIECE_ZH,
} from './logic.js';

function HandPanel({ owner, hand, selected, onSelect, disabled, label }) {
  const counts = {};
  hand.forEach((t) => { counts[t] = (counts[t] || 0) + 1; });
  const types = Object.keys(counts).sort();
  if (!types.length) return <span className="text-xs text-[#6b8058]">{label}：無持駒</span>;
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      <span className="text-xs text-[#9ca88a] mr-1">{label}</span>
      {types.map((type) => (
        <button
          key={type}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(selected === type ? null : type)}
          className={[
            'min-w-[2rem] h-8 px-1 rounded border font-serif text-sm font-bold',
            selected === type
              ? 'bg-[#c9a227] border-[#f0d878] text-[#1a1208]'
              : 'bg-[#2d3d28] border-[#5a7048] text-[#e8f0dc]',
            disabled ? 'opacity-40' : 'hover:bg-[#3d5235]',
          ].join(' ')}
        >
          {PIECE_ZH[type]}
          {counts[type] > 1 && (
            <span className="ml-0.5 text-[10px] opacity-80">×{counts[type]}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export default function GungiApp() {
  const [phase, setPhase] = useState('lobby');
  const [humanSide, setHumanSide] = useState('sente');
  const aiSide = humanSide === 'sente' ? 'gote' : 'sente';
  const flipped = humanSide === 'gote';

  const [game, setGame] = useState(() => defaultGame());
  const [selected, setSelected] = useState(null);
  const [dropType, setDropType] = useState(null);
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
      setDropType(null);
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
        if (result.type === 'draw') {
          endGame('draw', result.reason);
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
        const result = findBestMove(state, aiSide);
        if (!result) {
          endGame(humanSide, 'AI 無合法手');
          return;
        }
        const m = result.move;
        const next = applyMove(state, m);
        if (!m.drop) setLastMark({ fr: m.fr, fc: m.fc, tr: m.tr, tc: m.tc });
        else setLastMark({ tr: m.tr, tc: m.tc, drop: true });
        setLastResponse(`對手：${formatMoveBrief(state, m)}`);
        pushLog(`AI ${formatMoveBrief(state, m)}`);
        if (resolveAfterMove(next)) {
          aiBusyRef.current = false;
          return;
        }
        setSelected(null);
        setDropType(null);
        aiBusyRef.current = false;
        setPhase('playing');
      }, 50);
    },
    [aiSide, humanSide, pushLog, endGame, resolveAfterMove],
  );

  const commitMove = useCallback(
    (move) => {
      if (phase !== 'playing' || game.turn !== humanSide || aiBusyRef.current) return;
      const next = applyMove(game, move);
      if (!move.drop) setLastMark({ fr: move.fr, fc: move.fc, tr: move.tr, tc: move.tc });
      else setLastMark({ tr: move.tr, tc: move.tc, drop: true });
      setLastResponse(`我方：${formatMoveBrief(game, move)}`);
      pushLog(`我方 ${formatMoveBrief(game, move)}`);
      setSelected(null);
      setDropType(null);
      if (resolveAfterMove(next)) return;
      if (next.turn === aiSide) runAi(next);
    },
    [phase, game, humanSide, aiSide, pushLog, resolveAfterMove, runAi],
  );

  const startGame = useCallback(() => {
    const g = defaultGame();
    setGame(g);
    setPhase('playing');
    setSelected(null);
    setDropType(null);
    setLastMark(null);
    setLastResponse('');
    setLog([]);
    setWinner(null);
    setEndReason('');
    aiBusyRef.current = false;
    pushLog('軍儀開局：▲ 先手 vs △ 後手');
    if (humanSide === 'gote') runAi(g);
    else setLastResponse('請先手（▲）走棋');
  }, [humanSide, pushLog, runAi]);

  const surrender = useCallback(() => {
    if (phase !== 'playing') return;
    endGame(aiSide, `${humanSide === 'sente' ? '先手' : '後手'}降旗`);
  }, [phase, aiSide, humanSide, endGame]);

  const legalTargets = useMemo(() => {
    const map = new Map();
    if (phase !== 'playing' || game.turn !== humanSide) return map;
    if (dropType) {
      for (const m of getLegalMoves(game, humanSide)) {
        if (m.drop && m.type === dropType) map.set(`${m.tr},${m.tc}`, m);
      }
      return map;
    }
    if (!selected) return map;
    const { r, c } = selected;
    for (const m of getLegalMoves(game, humanSide)) {
      if (m.drop || m.fr !== r || m.fc !== c) continue;
      map.set(`${m.tr},${m.tc}`, m);
    }
    return map;
  }, [phase, game, humanSide, selected, dropType]);

  const threatened = phase === 'playing' && isMarshalThreatened(game, game.turn);
  const displayRows = flipped ? [...Array(SIZE).keys()] : [...Array(SIZE).keys()].reverse();

  const onCellClick = (r, c) => {
    if (phase !== 'playing' || game.turn !== humanSide) return;
    if (dropType) {
      const m = legalTargets.get(`${r},${c}`);
      if (m) commitMove(m);
      return;
    }
    const stack = game.board[r][c];
    const top = stack.length ? stack[stack.length - 1] : null;
    if (selected) {
      const m = legalTargets.get(`${r},${c}`);
      if (m) {
        commitMove(m);
        return;
      }
      if (top && top.owner === humanSide) {
        setSelected({ r, c });
        return;
      }
      setSelected(null);
      return;
    }
    if (top && top.owner === humanSide) {
      setSelected({ r, c });
      setDropType(null);
    }
  };

  return (
    <div className="min-h-screen p-3 sm:p-6 bg-[#141c12] text-[#e8f0dc]">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#4a5f3a] pb-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#e8f0dc]">軍儀</h1>
            <p className="text-xs text-[#9ca88a]">Gungi · 9×9 · 三層疊 · 降旗</p>
          </div>
          <button
            type="button"
            onClick={() => setShowRules((v) => !v)}
            className="px-3 py-1.5 rounded-lg border border-[#5a7048] text-sm hover:bg-[#243020]"
          >
            {showRules ? '隱藏規則' : '顯示規則'}
          </button>
          {phase === 'playing' && (
            <div className="text-right text-sm">
              手番：
              <strong className={game.turn === 'sente' ? 'text-amber-200' : 'text-sky-200'}>
                {game.turn === 'sente' ? '▲ 先手' : '△ 後手'}
              </strong>
              {threatened && <div className="text-red-400 font-bold">帥危！</div>}
            </div>
          )}
        </header>

        {showRules && (
          <div className="lg:hidden">
            <GungiRulesPanel defaultOpen={phase === 'lobby'} />
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_min(22rem,100%)] gap-4 items-start">
          <div className="space-y-4 min-w-0">
            {phase === 'lobby' && (
              <section className="rounded-xl border border-[#4a5f3a] bg-[#1f2a1c] p-5 space-y-4">
                <h2 className="font-serif text-lg">對局設定</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setHumanSide('sente')}
                    className={`px-4 py-2 rounded-lg border font-serif ${
                      humanSide === 'sente' ? 'bg-amber-900/60 border-amber-500' : 'border-[#5a7048]'
                    }`}
                  >
                    ▲ 先手
                  </button>
                  <button
                    type="button"
                    onClick={() => setHumanSide('gote')}
                    className={`px-4 py-2 rounded-lg border font-serif ${
                      humanSide === 'gote' ? 'bg-sky-900/60 border-sky-500' : 'border-[#5a7048]'
                    }`}
                  >
                    △ 後手
                  </button>
                </div>
                <button
                  type="button"
                  onClick={startGame}
                  className="px-5 py-2.5 rounded-lg bg-[#5a7048] hover:bg-[#6b8058] font-semibold"
                >
                  開始對局
                </button>
              </section>
            )}

            {lastResponse && phase !== 'lobby' && (
              <div className="rounded-lg border border-[#4a5f3a] bg-[#1f2a1c]/80 px-4 py-3 text-sm">
                {phase === 'thinking' ? '…' : lastResponse}
              </div>
            )}

            <HandPanel
              owner="gote"
              hand={game.hands.gote}
              selected={dropType}
              onSelect={(t) => { setDropType(t); setSelected(null); }}
              disabled={phase !== 'playing' || game.turn !== humanSide || humanSide !== 'gote'}
              label="△ 後手持駒"
            />

            <div className="inline-block p-3 rounded-lg border-4 border-[#4a5f3a] bg-[#2a3824]">
              <div
                className="inline-grid border-2 border-[#3d5235]"
                style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(2.5rem, 1fr))` }}
              >
                {displayRows.map((r) =>
                  Array.from({ length: SIZE }, (_, c) => {
                    const stack = game.board[r][c];
                    const top = stack.length ? stack[stack.length - 1] : null;
                    const h = stack.length;
                    const isFrom = lastMark && lastMark.fr === r && lastMark.fc === c;
                    const isTo = lastMark && lastMark.tr === r && lastMark.tc === c;
                    const isSel = selected?.r === r && selected?.c === c;
                    const isHint = legalTargets.has(`${r},${c}`);
                    const isGote = top?.owner === 'gote';

                    return (
                      <button
                        key={`${r}-${c}`}
                        type="button"
                        disabled={phase === 'lobby' || phase === 'ended' || phase === 'thinking'}
                        onClick={() => onCellClick(r, c)}
                        className={[
                          'relative w-11 h-14 sm:w-12 sm:h-16 flex flex-col items-center justify-end pb-1',
                          (r + c) % 2 === 0 ? 'bg-[#3d5235]' : 'bg-[#354830]',
                          'border border-[#4a5f3a]/50',
                          isHint ? 'ring-2 ring-emerald-500/80 ring-inset' : '',
                          isFrom ? 'ring-2 ring-red-600 ring-inset' : '',
                          isTo ? 'ring-2 ring-sky-500 ring-inset' : '',
                        ].join(' ')}
                      >
                        {h > 0 && (
                          <span className="absolute top-0.5 right-0.5 text-[10px] text-[#9ca88a] font-mono">
                            {h}
                          </span>
                        )}
                        {top && (
                          <span
                            className={[
                              'w-9 h-9 flex items-center justify-center rounded-sm border-2 font-serif text-base font-bold',
                              'bg-[#e8dcc0] text-[#1a1208] border-[#5a4a32]',
                              isGote ? 'rotate-180' : '',
                              isSel ? 'outline outline-2 outline-amber-400' : '',
                              h > 1 ? 'shadow-[0_-2px_0_#8b7355,0_-4px_0_#6b5a42]' : '',
                            ].join(' ')}
                            style={{ marginBottom: (h - 1) * 2 }}
                          >
                            {pieceLabel(top)}
                          </span>
                        )}
                      </button>
                    );
                  }),
                )}
              </div>
            </div>

            <HandPanel
              owner="sente"
              hand={game.hands.sente}
              selected={dropType}
              onSelect={(t) => { setDropType(t); setSelected(null); }}
              disabled={phase !== 'playing' || game.turn !== humanSide || humanSide !== 'sente'}
              label="▲ 先手持駒"
            />

            <div className="flex flex-wrap gap-2">
              {phase === 'playing' && (
                <button
                  type="button"
                  onClick={surrender}
                  className="px-4 py-2 rounded-lg border border-red-800/60 text-red-300 hover:bg-red-950/40 text-sm font-serif"
                >
                  降旗
                </button>
              )}
              {(phase === 'playing' || phase === 'ended' || phase === 'thinking') && (
                <button
                  type="button"
                  onClick={() => { setPhase('lobby'); setGame(defaultGame()); }}
                  className="px-3 py-2 rounded-lg border border-[#5a7048] text-sm hover:bg-[#243020]"
                >
                  終局・返回
                </button>
              )}
            </div>

            {phase === 'ended' && (
              <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4">
                <div className="text-lg font-bold">
                  {winner === 'draw' ? '和棋' : winner === humanSide ? '你贏了' : 'AI 獲勝'}
                </div>
                {endReason && <p className="text-sm text-[#9ca88a] mt-1">{endReason}</p>}
              </div>
            )}

            <div className="rounded-xl border border-[#4a5f3a] bg-[#141c12] p-3 max-h-36 overflow-y-auto">
              <div className="text-xs text-[#9ca88a] mb-2">棋譜</div>
              <ul className="text-xs font-mono text-[#b8c9a8] space-y-1">
                {log.map((row, i) => (
                  <li key={i}>
                    <span className="text-[#6b8058]">{row.t}</span> {row.line}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {showRules && (
            <aside className="hidden lg:block sticky top-4">
              <GungiRulesPanel defaultOpen className="max-h-[calc(100vh-2rem)]" />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
