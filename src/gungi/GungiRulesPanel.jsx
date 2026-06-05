/**
 * 軍儀（Gungi）規則面板 — 完整整理
 * 參考：Hunter Wiki、UMS 官方 Q&A、巴哈姆特中譯
 * @see docs/GUNGI.md
 */

const WIKI_ZH = 'https://hunterxhunter.fandom.com/zh/wiki/軍儀棋';
const WIKI_EN = 'https://hunterxhunter.fandom.com/wiki/Gungi';
const UMS_QA = 'https://www.universal-music.co.jp/other/hunter-gungi__qa/';
const GUNGI_WEB = 'https://gungi.2410.dev/rules.html';
const BAHAMUT_RULES = 'https://forum.gamer.com.tw/C.php?bsn=1272&snA=12034';

const PIECE_LINKS = [
  { name: '帥', ja: 'スイ', en: 'Marshal', href: 'https://static.wikia.nocookie.net/hunterxhunter/images/1/18/Gungi_piece_-_帥.svg' },
  { name: '侍', ja: 'Samurai', en: 'Samurai', href: 'https://static.wikia.nocookie.net/hunterxhunter/images/1/13/Gungi_piece_-_侍.svg' },
  { name: '兵', ja: 'ヒョウ', en: 'Soldier', href: 'https://static.wikia.nocookie.net/hunterxhunter/images/2/2d/Gungi_piece_-_兵.svg' },
  { name: '馬', ja: 'キバ', en: 'Knight', href: 'https://static.wikia.nocookie.net/hunterxhunter/images/5/5d/Gungi_piece_-_馬.svg' },
  { name: '忍', ja: 'シノビ', en: 'Shinobi', href: 'https://static.wikia.nocookie.net/hunterxhunter/images/3/3b/Gungi_piece_-_忍.svg' },
  { name: '弓', ja: 'ユミ', en: 'Bow', href: 'https://static.wikia.nocookie.net/hunterxhunter/images/2/29/Gungi_piece_-_弓.svg' },
  { name: '砲', ja: 'オオヅツ', en: 'Cannon', href: 'https://static.wikia.nocookie.net/hunterxhunter/images/f/f8/Gungi_piece_-_砲.svg' },
  { name: '筒', ja: 'ツツ', en: 'Musketeer', href: 'https://static.wikia.nocookie.net/hunterxhunter/images/5/56/Gungi_piece_-_筒.svg' },
  { name: '砦', ja: 'トリデ', en: 'Fort', href: 'https://static.wikia.nocookie.net/hunterxhunter/images/a/a7/Gungi_piece_-_砦.svg' },
  { name: '大', ja: 'タイショウ', en: 'General', href: 'https://static.wikia.nocookie.net/hunterxhunter/images/b/bb/Gungi_piece_-_大.svg' },
  { name: '中', ja: 'チュウジョウ', en: 'Lt. General', href: 'https://static.wikia.nocookie.net/hunterxhunter/images/9/9f/Gungi_piece_-_中.svg' },
  { name: '小', ja: 'ショウショウ', en: 'Major General', href: 'https://static.wikia.nocookie.net/hunterxhunter/images/e/eb/Gungi_piece_-_小.svg' },
  { name: '謀', ja: 'ボウショウ', en: 'Counsel', href: 'https://static.wikia.nocookie.net/hunterxhunter/images/1/1a/Gungi_piece_-_謀.svg' },
];

const SECTIONS = [
  {
    id: 'overview',
    title: '一、軍儀概要（作中設定）',
    body: (
      <>
        <p>
          <strong>軍儀（ぐんぎ，Gungi）</strong>意為「儀式／軍儀」，是《獵人》<strong>東果陀共和國</strong>的雙人策略棋。81 格 9×9 棋盤、各方 25 枚駒，可縱向疊至三層；目標為<strong>將死或捕獲敵帥</strong>。
        </p>
        <p className="mt-2 text-xs">
          小麥為作中世界冠軍；梅路艾姆與其對局為嵌合蟻篇主線。漫畫第 244 話起詳述規則與名局（如「心行 Kokoriko」「離巢金」）。
        </p>
        <p className="mt-2 text-xs text-[#8a9a78]">
          <a href={WIKI_ZH} target="_blank" rel="noreferrer" className="underline hover:text-[#d4e4c8]">中文 Wiki・軍儀棋</a>
          {' · '}
          <a href={WIKI_EN} target="_blank" rel="noreferrer" className="underline hover:text-[#d4e4c8]">Hunterpedia (EN)</a>
          {' · '}
          <a href={UMS_QA} target="_blank" rel="noreferrer" className="underline hover:text-[#d4e4c8]">UMS 官方 Q&A</a>
        </p>
      </>
    ),
  },
  {
    id: 'board',
    title: '二、棋盤與用具',
    body: (
      <ul className="list-disc pl-5 space-y-1 text-xs">
        <li>9×9 方格（作中為無色差素色木盤）。</li>
        <li>雙方各 25 枚，共 50 枚木製駒；黑／白或 ▲／△ 對弈。</li>
        <li>駒可縱向疊放，上限<strong>三層</strong>（入門／初級部分為二層）。</li>
        <li>段數越高，可達範圍越大（解說書以淺藍→深藍→綠色標示）。</li>
      </ul>
    ),
  },
  {
    id: 'pieces',
    title: '三、棋子一覽（13 種＋「新」）',
    body: (
      <div className="space-y-2">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#4a5f3a]/60 text-[#d4e4c8]">
              <th className="text-left py-1 pr-1">駒</th>
              <th className="text-left py-1 pr-1">讀音</th>
              <th className="text-left py-1">說明</th>
            </tr>
          </thead>
          <tbody className="text-[#b8c9a8]">
            {PIECE_LINKS.map((p) => (
              <tr key={p.name} className="border-b border-[#4a5f3a]/20">
                <td className="py-0.5 pr-1">
                  <a href={p.href} target="_blank" rel="noreferrer" className="font-bold underline hover:text-[#e8f0dc]">
                    {p.name}
                  </a>
                </td>
                <td className="py-0.5 pr-1 text-[#8a9a78]">{p.ja}</td>
                <td className="py-0.5">{p.en}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-[#9ca88a]">
          「<strong>新（アラタ）</strong>」：手駒打入，如忍新、弓新、中新。Wiki 棋子 SVG 圖示見上表連結。
        </p>
      </div>
    ),
  },
  {
    id: 'setup',
    title: '四、開局配置',
    body: (
      <ul className="list-disc pl-5 space-y-1 text-xs">
        <li>各執一帥於盤中央放開，靠中央者<strong>先手（▲）</strong>。</li>
        <li>從帥起交替放置，限<strong>自陣三橫行</strong>；可疊至三層，<strong>帥上不可疊</strong>（入門）。</li>
        <li>可留手駒；宣言「<strong>完成（済み）</strong>」結束。先手完成後後手仍可繼續。</li>
        <li>讀法：「橫-縱-段-駒」，例 4-7-2 侍；打入讀「新」。</li>
        <li>入門／初級有解說書推薦配置；中級以上自由配置（UMS Q&A）。</li>
      </ul>
    ),
  },
  {
    id: 'tier',
    title: '五、段數制（核心）',
    body: (
      <ul className="list-disc pl-5 space-y-1 text-xs">
        <li>以柱<strong>段數（1～3）</strong>判定攻防，<strong>非</strong>棋子種類強弱。</li>
        <li>僅最上層駒可動；2 段比 1 段多 1 格射程，3 段再多 1 格。</li>
        <li>攻擊敵柱：己方段數 ≥ 敵方段數方可取走或疊加。</li>
        <li><strong>任何駒皆可攻擊帥</strong>（與象棋／軍棋階級制不同）。</li>
      </ul>
    ),
  },
  {
    id: 'move',
    title: '六、移動・吃子・疊加',
    body: (
      <ul className="list-disc pl-5 space-y-1 text-xs">
        <li>輪流一手；手指離開不可悔棋。</li>
        <li>除砲・筒・弓外，一般駒不可飛越他駒。</li>
        <li>遇敵可<strong>取走</strong>（移出棋局）或<strong>疊加（ツケる）</strong>。</li>
        <li>疊己方：移動柱段數須大於目標柱段數；帥上絕不可疊。</li>
        <li>多層敵柱可「打」（去頂）或「全取」（依段數規則重排）。</li>
      </ul>
    ),
  },
  {
    id: 'shin',
    title: '七、新（手駒打入）',
    body: (
      <ul className="list-disc pl-5 space-y-1 text-xs">
        <li>配置剩餘手駒可在對局中打入，稱「<strong>新</strong>」。</li>
        <li>範圍：自陣起算<strong>六橫行以內</strong>；不可比最前己子更遠（不可越位）。</li>
        <li>「新」回合不可再移動；可打空格或<strong>僅疊己方子</strong>。</li>
        <li>最上段全可見之己子為「新」基準；被敵疊住者不算（UMS Q&A）。</li>
      </ul>
    ),
  },
  {
    id: 'special',
    title: '八、砲・筒・弓',
    body: (
      <ul className="list-disc pl-5 space-y-1 text-xs">
        <li>可飛越<strong>同段或較低段</strong>之駒（己／敵皆可）。</li>
        <li>1 段向前：飛越 2 格落第 3 格；2 段飛 3 落 4；3 段飛 4 落 5。</li>
        <li>「大」「中」在紅色區域可<strong>無限直線</strong>移動，段數不影響該能力。</li>
        <li>入門不用特殊子；初級僅弓；中級以上含砲・筒・弓・謀。</li>
      </ul>
    ),
  },
  {
    id: 'bou',
    title: '九、謀（回家睡覺・寝返り）',
    body: (
      <p className="text-xs">
        「謀」疊在敵駒上時，若手中有<strong>相同種類</strong>敵駒，可選擇替換：敵駒移出棋局，換己駒上盤。效果及於被疊柱下敵子，<strong>僅該回合</strong>有效；入替為任意（UMS Q&A）。
      </p>
    ),
  },
  {
    id: 'end',
    title: '十、勝負・千日手・降旗',
    body: (
      <ul className="list-disc pl-5 space-y-1 text-xs">
        <li>捕獲敵帥、將死（詰）、或對方<strong>投降</strong>者勝。</li>
        <li>同一局面四次（<strong>千日手</strong>）→ 和棋／重開。</li>
        <li><strong>降旗</strong>：作中與軍儀禮儀相關之認輸；本 Web 版提供降旗按鈕。</li>
      </ul>
    ),
  },
  {
    id: 'manga',
    title: '十一、作中名局用語',
    body: (
      <ul className="list-disc pl-5 space-y-1 text-xs">
        <li><strong>心行（Kokoriko）</strong>：小麥發明戰法；梅路艾姆後來獨立想出同名布局。</li>
        <li><strong>離巢金</strong>：梅路艾姆自創布局名（detached castling）。</li>
        <li>軍儀與「蟻」：漢字「儀」與「蟻」旁部不同（人 vs 虫），象徵蟻王經對局接近人性（Wiki 瑣聞）。</li>
      </ul>
    ),
  },
  {
    id: 'refs',
    title: '十二、參考連結',
    body: (
      <ul className="list-disc pl-5 space-y-1 text-xs break-all">
        <li><a href={WIKI_ZH} target="_blank" rel="noreferrer" className="underline hover:text-[#d4e4c8]">Hunter Wiki 中文・軍儀棋</a></li>
        <li><a href={WIKI_EN} target="_blank" rel="noreferrer" className="underline hover:text-[#d4e4c8]">Hunterpedia English・Gungi</a></li>
        <li><a href={UMS_QA} target="_blank" rel="noreferrer" className="underline hover:text-[#d4e4c8]">Universal Music 軍儀 Q&A</a></li>
        <li><a href={GUNGI_WEB} target="_blank" rel="noreferrer" className="underline hover:text-[#d4e4c8]">Gungi Web（UMS 規則）</a></li>
        <li><a href={BAHAMUT_RULES} target="_blank" rel="noreferrer" className="underline hover:text-[#d4e4c8]">巴哈姆特・規則中譯</a></li>
        <li><a href="https://github.com/LYXiui/board-games-web/blob/main/docs/GUNGI.md" target="_blank" rel="noreferrer" className="underline hover:text-[#d4e4c8]">GitHub docs/GUNGI.md</a></li>
      </ul>
    ),
  },
  {
    id: 'ui',
    title: '十三、本 Web 操作',
    body: (
      <ul className="list-disc pl-5 space-y-1 text-xs">
        <li>點己柱頂子 → 綠格著手；同格多種著法時彈窗選擇（移／疊／取）。</li>
        <li>持駒（新）：點選後點 6 行內空格或己柱。</li>
        <li>「降旗」＝認輸。已實作段數制、千日手、謀、特殊駒飛越。</li>
      </ul>
    ),
  },
];

export default function GungiRulesPanel({ defaultOpen = false, className = '' }) {
  return (
    <section className={`rounded-xl border border-[#4a5f3a] bg-[#1a2418]/95 overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-[#4a5f3a]">
        <h2 className="font-serif text-lg text-[#e8f0dc]">軍儀規則（完整版）</h2>
        <p className="text-xs text-[#9ca88a] mt-0.5">
          Hunter Wiki · UMS 官方 · 9×9 · 三層疊
        </p>
      </div>
      <div className="divide-y divide-[#4a5f3a]/50 max-h-[min(70vh,36rem)] overflow-y-auto">
        {SECTIONS.map((sec, i) => (
          <details key={sec.id} open={defaultOpen ? i < 2 : undefined}>
            <summary className="px-4 py-2.5 cursor-pointer text-sm text-[#d4e4c8] hover:bg-[#243020] list-none">
              {sec.title}
            </summary>
            <div className="px-4 pb-4 text-sm text-[#b8c9a8] leading-relaxed">{sec.body}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
