const SECTIONS = [
  {
    title: '一、遊戲概要',
    body: (
      <>
        <p>
          <strong>陸軍棋</strong>（又稱<strong>陸戰棋</strong>，簡稱<strong>軍棋</strong>）為中國近代雙人棋類，依軍階比大小。各方 25 枚棋子，先<strong>奪得對方軍旗</strong>者勝。
        </p>
        <p className="mt-2 text-xs text-[#a08060]">
          規則參考：
          <a
            href="https://zh.wikipedia.org/zh-tw/%E9%99%B8%E8%BB%8D%E6%A3%8B"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-[#f5e6d3] ml-1"
          >
            維基百科〈陸軍棋〉
          </a>
        </p>
      </>
    ),
  },
  {
    title: '二、棋子與階級（各方 25 枚）',
    body: (
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-[#6b4423]/60 text-[#e8d4b8]">
            <th className="text-left py-1 pr-2">棋子</th>
            <th className="text-left py-1 pr-2">數量</th>
            <th className="text-left py-1">說明</th>
          </tr>
        </thead>
        <tbody className="text-[#c4a574]">
          <tr><td className="py-0.5 pr-2">司令</td><td>1</td><td>最高階；部分規則規定被滅則動搖軍心</td></tr>
          <tr><td className="py-0.5 pr-2">軍長</td><td>1</td><td>—</td></tr>
          <tr><td className="py-0.5 pr-2">師長</td><td>2</td><td>—</td></tr>
          <tr><td className="py-0.5 pr-2">旅長</td><td>2</td><td>—</td></tr>
          <tr><td className="py-0.5 pr-2">團長</td><td>2</td><td>—</td></tr>
          <tr><td className="py-0.5 pr-2">營長</td><td>2</td><td>—</td></tr>
          <tr><td className="py-0.5 pr-2">連長</td><td>3</td><td>—</td></tr>
          <tr><td className="py-0.5 pr-2">排長</td><td>3</td><td>—</td></tr>
          <tr><td className="py-0.5 pr-2">工兵</td><td>3</td><td>鐵路轉彎不限；可排雷</td></tr>
          <tr><td className="py-0.5 pr-2">地雷</td><td>3</td><td>不動；工兵可滅，其餘攻擊多同歸於盡</td></tr>
          <tr><td className="py-0.5 pr-2">炸彈</td><td>2</td><td>與敵子（含地雷）相遇同歸於盡，不含軍旗</td></tr>
          <tr><td className="py-0.5 pr-2">軍旗</td><td>1</td><td>置於大本營，不動；被攻即敗</td></tr>
        </tbody>
      </table>
    ),
  },
  {
    title: '三、勝負一覽',
    body: (
      <ul className="list-disc pl-5 space-y-1 text-xs">
        <li>司令 &gt; 軍長 &gt; 師長 &gt; 旅長 &gt; 團長 &gt; 營長 &gt; 連長 &gt; 排長 &gt; 工兵</li>
        <li>相同棋子相遇，同歸於盡</li>
        <li>炸彈與任何敵子（含地雷、軍旗、敵炸彈）同歸於盡</li>
        <li>工兵 &gt; 地雷（地雷不動）</li>
      </ul>
    ),
  },
  {
    title: '四、棋盤',
    body: (
      <ul className="list-disc pl-5 space-y-1 text-xs">
        <li><strong>兵站</strong>：長方形格，可停子。</li>
        <li><strong>大本營</strong>（▣）：每方 2 格，軍旗必放此；進入後不可再移出。</li>
        <li><strong>行營</strong>（●）：每方 5 格圓形，進入後對方不可攻擊。</li>
        <li><strong>前線／山界</strong>：中央分界；三條<strong>鐵路</strong>連接兩陣。</li>
        <li><strong>鐵路</strong>（■）：沿鐵路可直線多格；工兵轉彎不限，其餘棋子鐵路上最多三格（可拐彎）。</li>
        <li><strong>公路</strong>：每回合沿公路任意方向走一格。</li>
      </ul>
    ),
  },
  {
    title: '五、暗棋規則（本模組）',
    body: (
      <ul className="list-disc pl-5 space-y-1 text-xs">
        <li>棋子暗置於己方兵站或大本營（不行營）；軍旗必在大本營；炸彈不可放第一排。</li>
        <li>輪流行棋；選己方子 → 綠格移動或攻擊。</li>
        <li>己方始終可見；敵方背面，交戰後翻開。</li>
        <li>奪旗即勝；紅方在下、藍方在上，紅方先手。</li>
      </ul>
    ),
  },
];

export default function JunqiRulesPanel({ defaultOpen = false, className = '' }) {
  return (
    <section className={`rounded-xl border border-[#8b4513] bg-[#2a1810]/95 overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-[#6b3410]">
        <h2 className="font-serif text-lg text-[#f5e6d3]">陸軍棋規則</h2>
        <p className="text-xs text-[#a08060] mt-0.5">陸戰棋 · 暗棋 · 12×5 標準棋盤</p>
      </div>
      <div className="divide-y divide-[#6b3410]/50 max-h-[min(70vh,28rem)] overflow-y-auto">
        {SECTIONS.map((sec, i) => (
          <details key={sec.title} open={defaultOpen ? i < 2 : undefined}>
            <summary className="px-4 py-2 cursor-pointer text-sm text-[#e8d4b8] hover:bg-[#3d2817] list-none">
              {sec.title}
            </summary>
            <div className="px-4 pb-3 text-sm text-[#c4a574] leading-relaxed">{sec.body}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
