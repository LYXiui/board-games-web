/** 將棋完整規則（繁體中文）與本介面操作說明 */

const SECTIONS = [
  {
    id: 'overview',
    title: '一、遊戲概要',
    body: (
      <>
        <p>
          將棋（しょうぎ）在 9×9 棋盤上進行，分<strong>先手（▲）</strong>與<strong>後手（△）</strong>。目標是將死對方王將（先手稱「王」、後手稱「玉」）。
        </p>
        <p className="mt-2">
          本模組為日式將棋規則，棋盤為 9×9 81 格，駒以<strong>木製五邊形</strong>漢字標示（王／玉、飛、角、金、銀、桂、香、歩）。樣式參考
          <a
            href="https://www.fun-japan.jp/hk/articles/9563"
            target="_blank"
            rel="noreferrer"
            className="underline text-[#d4a574] hover:text-[#f5ecd7] ml-1"
          >
            FUN! JAPAN 将棋入門
          </a>
          。
        </p>
      </>
    ),
  },
  {
    id: 'pieces',
    title: '二、棋子與走法',
    body: (
      <div className="space-y-3">
        <p>各方 20 枚，漢字標示。升變後走法多數等同<strong>金將</strong>（飛・角升變後保留部分原走法，見下節）。</p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#6b4423]/60 text-[#c4a574]">
              <th className="text-left py-1 pr-2">棋子</th>
              <th className="text-left py-1">走法</th>
            </tr>
          </thead>
          <tbody className="text-[#e8dcc0]">
            <tr><td className="py-1 pr-2 font-serif">王／玉</td><td>前後左右斜共 8 格，每格一步。</td></tr>
            <tr><td className="py-1 pr-2 font-serif">飛</td><td>直線任意格；可吃子。升變為<strong>龍</strong>：飛車走法＋斜向四格各一步。</td></tr>
            <tr><td className="py-1 pr-2 font-serif">角</td><td>斜線任意格。升變為<strong>馬</strong>：角行走法＋縱橫四格各一步。</td></tr>
            <tr><td className="py-1 pr-2 font-serif">金</td><td>前、前斜、左右、後一步（共 6 方向），不可升變。</td></tr>
            <tr><td className="py-1 pr-2 font-serif">銀</td><td>前與前斜、後斜共 5 方向。升變後走法同金。</td></tr>
            <tr><td className="py-1 pr-2 font-serif">桂</td><td>向前跳兩格、左右偏一格（可越子）。升變後走法同金。</td></tr>
            <tr><td className="py-1 pr-2 font-serif">香</td><td>直線向前任意格。升變後走法同金。</td></tr>
            <tr><td className="py-1 pr-2 font-serif">歩</td><td>向前一步。升變後走法同金。</td></tr>
          </tbody>
        </table>
        <p className="text-[#c4a574]">先手在棋盤下方（第 8、9 路），向上為「前」；後手相反。後手棋子在本介面會旋轉 180° 顯示。</p>
      </div>
    ),
  },
  {
    id: 'promote',
    title: '三、升變',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>
          <strong>敵陣</strong>：先手為最上三橫（第 1～3 路），後手為最下三橫（第 7～9 路）。棋子從敵陣出發、進入或停在敵陣時，可選擇升變（金將除外）。
        </li>
        <li>
          <strong>強制升變</strong>：歩、香若走到最後一橫（底線）必須升變；桂若走到敵陣最後兩橫（先手第 1～2 路、後手第 8～9 路）必須升變。
        </li>
        <li>升變不可還原。本介面若同格可「升變／不升變」，會跳出選項；僅一種合法走法時自動執行。</li>
        <li>被吃掉的升變子，除<strong>龍（升飛）</strong>、<strong>馬（升角）</strong>外，入駒台時還原為未升變的飛、角、銀、桂、香、歩。</li>
      </ul>
    ),
  },
  {
    id: 'drop',
    title: '四、持駒與打入',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>吃掉對方棋子後，該子進入己方<strong>持駒台</strong>，可在之後任意回合打入空位（一回合一手，打入後不能再移動其他子）。</li>
        <li>打入時棋子為未升變狀態，之後若符合條件仍可再升變。</li>
        <li>
          <strong>禁打格</strong>：歩不可打在敵陣最後一橫；桂不可打在敵陣最後兩橫；香不可打在敵陣最後一橫（否則無法再前進）。
        </li>
        <li>
          <strong>二步</strong>：同一筋（直線）上，己方已有未升變歩時，不可再打歩到該筋。
        </li>
        <li>
          <strong>打步詰</strong>：用歩打入後若直接將死對方（對方無合法應手），該打歩為非法，系統不會列出。
        </li>
      </ul>
    ),
  },
  {
    id: 'check',
    title: '五、王手、詰み與和棋',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>
          <strong>王手</strong>：若王將正被攻擊，必須應手（移開、擋子、吃掉攻擊子或打入解將）。不能下成「自陷將軍」（走完後己方王將仍被攻擊或新被將軍）。
        </li>
        <li>
          <strong>詰み</strong>：輪到一方走棋且處於王手，且無任何合法手，則該方負。本介面會顯示「王手！」並以紅框標示被將的王將。
        </li>
        <li>
          <strong>千日手</strong>：含持駒與手番在內的完全相同局面出現第 4 次時，自動和棋。
        </li>
        <li>
          <strong>持將棋</strong>：雙方王將皆在敵陣內，且雙方都無法再將死對方時，可協議和棋。若雙方皆無飛車、角行（含持駒），自動和棋；若雙方在敵陣內之子力點數皆不超過 24 點，可按下「持將棋和棋」。
        </li>
        <li>王將被吃（異常情況）亦判負。持將棋子力：王不計，歩 1、香 3、桂 4、銀 5、金 6、角 10、飛 10。</li>
      </ul>
    ),
  },
  {
    id: 'ui',
    title: '六、本介面操作',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>大廳選擇<strong>▲ 先手</strong>或<strong>△ 後手</strong>，按「對局開始」。選後手時 AI 先手。</li>
        <li>
          <strong>移動</strong>：點己方棋子選取，再點綠色高亮格落子。上一手：<span className="text-red-400">紅框</span>起點、<span className="text-sky-400">藍框</span>終點。
        </li>
        <li>
          <strong>打入</strong>：點己方持駒台上的棋子，再點棋盤空位（僅顯示合法格）。
        </li>
        <li>升變時依提示選「升變」或「不升變」。對局中可見手番、王手提示、對方著法與棋譜。</li>
        <li>「終局・戻回」返回大廳；符合條件時可使用「持將棋和棋」。</li>
      </ul>
    ),
  },
];

export default function ShogiRulesPanel({ defaultOpen = false, className = '' }) {
  return (
    <section
      className={`rounded-xl border border-[#6b4423] bg-[#3d2817]/90 overflow-hidden ${className}`}
      aria-label="將棋規則說明"
    >
      <div className="px-4 py-3 border-b border-[#6b4423]/60 bg-[#2a1810]/50">
        <h2 className="font-serif text-lg text-[#f5ecd7]">將棋規則（繁體中文）</h2>
        <p className="text-xs text-[#c4a574] mt-0.5">含棋子走法、升變、持駒、特殊規定與操作方式</p>
      </div>
      <div className="divide-y divide-[#6b4423]/40 max-h-[min(70vh,32rem)] overflow-y-auto">
        {SECTIONS.map((sec, i) => (
          <details
            key={sec.id}
            className="group"
            open={defaultOpen ? i < 2 : undefined}
          >
            <summary className="px-4 py-2.5 cursor-pointer font-serif text-sm text-[#e8dcc0] hover:bg-[#2a1810]/40 list-none flex items-center justify-between gap-2">
              <span>{sec.title}</span>
              <span className="text-[#8b6914] text-xs group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-4 pb-4 text-sm text-[#d4c4a8] leading-relaxed">{sec.body}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
