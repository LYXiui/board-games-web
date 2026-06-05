/** 西洋棋完整規則（繁體中文）與本介面操作說明 */

const SECTIONS = [
  {
    id: 'overview',
    title: '一、遊戲概要',
    body: (
      <>
        <p>
          西洋棋在 8×8 棋盤上進行，<strong>白方</strong>先走，<strong>黑方</strong>後走。目標是將死對方國王（王）。
        </p>
        <p className="mt-2">
          本模組為標準西洋棋規則，不含 EZChess 自訂走法、文字匯入開局等功能。系統會過濾非法手（含自陷將軍）。
        </p>
      </>
    ),
  },
  {
    id: 'pieces',
    title: '二、棋子與走法',
    body: (
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-stone-600 text-stone-400">
            <th className="text-left py-1 pr-2">棋子</th>
            <th className="text-left py-1">走法</th>
          </tr>
        </thead>
        <tbody className="text-stone-200">
          <tr><td className="py-1 pr-2">♔ 王</td><td>上下左右斜各一格。</td></tr>
          <tr><td className="py-1 pr-2">♕ 后</td><td>直線、斜線任意格，不可越子。</td></tr>
          <tr><td className="py-1 pr-2">♖ 車</td><td>直線任意格。</td></tr>
          <tr><td className="py-1 pr-2">♗ 象</td><td>斜線任意格。</td></tr>
          <tr><td className="py-1 pr-2">♘ 馬</td><td>日字跳，可越子。</td></tr>
          <tr><td className="py-1 pr-2">♙ 兵</td><td>向前一格；首著可前進兩格；斜吃一格。不可後退、不可直吃。</td></tr>
        </tbody>
      </table>
    ),
  },
  {
    id: 'special',
    title: '三、特殊著法',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>
          <strong>王車易位</strong>：王與車均未動過、中間空格、王未處於被將軍且所經過與到達格未被攻擊時，王可與車同時移位（王翼或后翼）。本程式以移動王完成易位。
        </li>
        <li>
          <strong>過路兵</strong>：對方兵從起始位置一次走兩格，若與己方兵形成「貼身」可斜吃至其經過格，並移走該兵（非目標格上的子）。
        </li>
        <li>
          <strong>兵升變</strong>：兵到達底線必須升變為后、車、象、馬之一（不可保持兵）。本介面會請你選擇升變棋子；AI 通常升后。
        </li>
      </ul>
    ),
  },
  {
    id: 'check',
    title: '四、將軍、將死與和棋',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>將軍</strong>：王被攻擊時必須應手，不可走完後己方王仍被攻擊（自陷將軍）。</li>
        <li><strong>將死</strong>：輪到走棋且被將軍，又無任何合法手，則負。</li>
        <li><strong>逼和</strong>：未被將軍但無合法手，和棋。</li>
        <li><strong>三次重複</strong>：含易位權、過路兵格與手番的相同局面出現第三次時，和棋。</li>
        <li><strong>五十步規則</strong>：連續 50 回合（100 半回合）無吃子、無動兵，和棋。</li>
        <li><strong>子力不足</strong>：如王對王、王對王＋象等無法將死之局面，和棋。</li>
      </ul>
    ),
  },
  {
    id: 'ui',
    title: '五、本介面操作',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>大廳選擇<strong>白方</strong>或<strong>黑方</strong>，按「開始對局」。選黑方時 AI 先手。</li>
        <li><strong>移子</strong>：點己方棋子，再點綠色高亮格。上一手：<span className="text-red-400">紅框</span>起點、<span className="text-sky-400">藍框</span>終點。</li>
        <li>兵升變時選后／車／象／馬。王被將軍時會顯示「將軍！」。</li>
        <li>「結束・返回」回大廳。棋譜區記錄本局著法。</li>
      </ul>
    ),
  },
];

export default function ChessRulesPanel({ defaultOpen = false, className = '' }) {
  return (
    <section
      className={`rounded-xl border border-stone-600 bg-stone-900/90 overflow-hidden ${className}`}
      aria-label="西洋棋規則說明"
    >
      <div className="px-4 py-3 border-b border-stone-700 bg-stone-950/80">
        <h2 className="font-semibold text-lg text-stone-100">西洋棋規則（繁體中文）</h2>
        <p className="text-xs text-stone-400 mt-0.5">標準規則 · 不含 EZChess 自訂玩法</p>
      </div>
      <div className="divide-y divide-stone-700/60 max-h-[min(70vh,32rem)] overflow-y-auto">
        {SECTIONS.map((sec, i) => (
          <details key={sec.id} className="group" open={defaultOpen ? i < 2 : undefined}>
            <summary className="px-4 py-2.5 cursor-pointer text-sm text-stone-200 hover:bg-stone-800/50 list-none flex items-center justify-between gap-2">
              <span>{sec.title}</span>
              <span className="text-stone-500 text-xs group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-4 pb-4 text-sm text-stone-300 leading-relaxed">{sec.body}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
