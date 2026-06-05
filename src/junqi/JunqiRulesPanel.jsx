const SECTIONS = [
  {
    title: '一、遊戲概要',
    body: (
      <p>
        軍棋（陸戰棋）為 12×5 棋盤兩人對戰。各方 25 枚棋子<strong>暗置</strong>，透過移動與攻擊逐步翻開，目標為<strong>奪取對方軍旗</strong>或使對方無棋可走。
      </p>
    ),
  },
  {
    title: '二、棋子階級',
    body: (
      <p className="text-xs leading-relaxed">
        司令 &gt; 軍長 &gt; 師長 &gt; 旅長 &gt; 團長 &gt; 營長 &gt; 連長 &gt; 排長 &gt; 工兵。
        <br />
        <strong>炸彈</strong>：與敵同歸於盡（除地雷特殊）。
        <br />
        <strong>地雷</strong>：不動；工兵可排雷，其餘攻擊者陣亡。
        <br />
        <strong>軍旗</strong>：不動；被任何棋子攻擊即敗。
      </p>
    ),
  },
  {
    title: '三、鐵路與行營',
    body: (
      <ul className="list-disc pl-5 space-y-1 text-xs">
        <li><strong>鐵路</strong>（斜線格）：沿鐵路可一次行進多格，工兵在鐵路轉彎不受限。</li>
        <li><strong>行營</strong>（雙圈格）：進入後該子不受相鄰攻擊（本簡化版：暗子於行營免攻）。</li>
        <li><strong>大本營</strong>：軍旗初始位置，其他棋子不可進入。</li>
      </ul>
    ),
  },
  {
    title: '四、操作說明',
    body: (
      <ul className="list-disc pl-5 space-y-1 text-xs">
        <li>選己方棋子 → 綠格移動或攻擊。</li>
        <li>己方棋子始終可見；對方為背面，交戰後翻開。</li>
        <li>紅方在下、藍方在上；先手紅方。</li>
      </ul>
    ),
  },
];

export default function JunqiRulesPanel({ defaultOpen = false, className = '' }) {
  return (
    <section className={`rounded-xl border border-[#8b4513] bg-[#2a1810]/95 overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-[#6b3410]">
        <h2 className="font-serif text-lg text-[#f5e6d3]">軍棋規則（陸戰棋）</h2>
      </div>
      <div className="divide-y divide-[#6b3410]/50 max-h-[min(70vh,28rem)] overflow-y-auto">
        {SECTIONS.map((sec, i) => (
          <details key={sec.title} open={defaultOpen ? i < 1 : undefined}>
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
