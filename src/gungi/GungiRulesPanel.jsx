const SECTIONS = [
  {
    id: 'overview',
    title: '一、軍儀概要',
    body: (
      <>
        <p>
          <strong>軍儀</strong>為本專案參考《獵人》漫畫中軍儀棋與<strong>降旗</strong>概念所設計的<strong>原創棋戲</strong>（非官方規則全文）。在 9×9 棋盤上，棋子可縱向疊起最多三層，以帥為核心，透過階級、疊子與吃子爭奪勝負。
        </p>
        <p className="mt-2 text-[#9ca88a]">
          不含 EZChess 自訂走法。與将棋、西洋棋分屬獨立模組。
        </p>
      </>
    ),
  },
  {
    id: 'stack',
    title: '二、疊層與階級',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>每格可疊最多 <strong>3 枚</strong>；僅<strong>最上層</strong>可行動。</li>
        <li>棋子階級：帥 8 &gt; 將 7 &gt; 砦 6 &gt; 弓／砲 5 &gt; 馬／諜 4 &gt; 兵 3。</li>
        <li>疊層越高，有效階級 +1（最高 +2），利於壓制敵方頂子。</li>
        <li><strong>疊（stack）</strong>：移動到己方棋柱上方。</li>
        <li><strong>吃／打</strong>：階級足夠時攻擊敵方頂子；單層為吃，多層為打（移除頂子）。</li>
      </ul>
    ),
  },
  {
    id: 'pieces',
    title: '三、棋子走法（頂層）',
    body: (
      <table className="w-full text-xs">
        <tbody className="text-[#d4e4c8]">
          <tr><td className="py-1 pr-2">帥</td><td>八方向各一格</td></tr>
          <tr><td className="py-1 pr-2">將</td><td>直線一至二格（隨疊層增加）</td></tr>
          <tr><td className="py-1 pr-2">弓</td><td>斜線一至三格</td></tr>
          <tr><td className="py-1 pr-2">砲</td><td>越一子後攻擊直線目標</td></tr>
          <tr><td className="py-1 pr-2">馬</td><td>日字跳</td></tr>
          <tr><td className="py-1 pr-2">諜</td><td>八方向各一格</td></tr>
          <tr><td className="py-1 pr-2">兵</td><td>向前一格</td></tr>
          <tr><td className="py-1 pr-2">砦</td><td>單獨一格時不可動；在柱中可作為防禦層</td></tr>
        </tbody>
      </table>
    ),
  },
  {
    id: 'flag',
    title: '四、降旗與勝負',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>降旗</strong>：對局中按「降旗」即認輸，對方獲勝（參考軍儀禮儀中的投降）。</li>
        <li>帥被擊破或從棋盤消失：該方敗。</li>
        <li>帥遭將軍且無合法應手：詰，敗。</li>
        <li>擊破敵頂子後入<strong>持駒</strong>，可於己方陣地（最後三橫）空位打入。</li>
      </ul>
    ),
  },
  {
    id: 'ui',
    title: '五、操作說明',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>選己方頂子 → 綠格落子；數字為該柱層數。</li>
        <li>持駒：點選後點陣地內空格打入。</li>
        <li>紅框／藍框標示上一手起迄。</li>
      </ul>
    ),
  },
];

export default function GungiRulesPanel({ defaultOpen = false, className = '' }) {
  return (
    <section className={`rounded-xl border border-[#4a5f3a] bg-[#1a2418]/95 overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-[#4a5f3a]">
        <h2 className="font-serif text-lg text-[#e8f0dc]">軍儀規則（原創・繁中）</h2>
        <p className="text-xs text-[#9ca88a]">靈感來源：軍儀棋／降旗 · 教學用簡化版</p>
      </div>
      <div className="divide-y divide-[#4a5f3a]/50 max-h-[min(70vh,32rem)] overflow-y-auto">
        {SECTIONS.map((sec, i) => (
          <details key={sec.id} open={defaultOpen ? i < 2 : undefined}>
            <summary className="px-4 py-2.5 cursor-pointer text-sm text-[#d4e4c8] hover:bg-[#243020] list-none flex justify-between">
              {sec.title}
              <span className="text-[#6b8058] text-xs">▼</span>
            </summary>
            <div className="px-4 pb-4 text-sm text-[#b8c9a8] leading-relaxed">{sec.body}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
