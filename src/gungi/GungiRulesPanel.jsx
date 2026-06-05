/**
 * 軍儀（Gungi）規則說明 — 依官方解說書及社群中譯整理
 * 參考：巴哈姆特 Hunter 板 #11918、#12034
 */

const SECTIONS = [
  {
    id: 'overview',
    title: '一、遊戲概要',
    body: (
      <>
        <p>
          <strong>軍儀（ぐんぎ）</strong>為《獵人》世界觀中的原創棋戲，已由官方實體化（9×9 棋盤、50 枚木製駒、最多三層疊放）。雙方各持 25 枚，先<strong>捕獲對手帥</strong>，或使對手帥<strong>將死</strong>、對手<strong>投降</strong>者勝。
        </p>
        <p className="mt-2 text-xs text-[#8a9a78]">
          參考：
          <a href="https://forum.gamer.com.tw/C.php?bsn=1272&snA=11918" target="_blank" rel="noreferrer" className="underline ml-1 hover:text-[#d4e4c8]">簡易開箱</a>
          、
          <a href="https://forum.gamer.com.tw/C.php?bsn=1272&snA=12034" target="_blank" rel="noreferrer" className="underline hover:text-[#d4e4c8]">規則中譯</a>
        </p>
        <p className="mt-2 text-xs text-[#c9a227]">
          本模組為<strong>中級簡化 playable 版</strong>（AI 對弈）；完整 14 種駒與「謀」等特殊效果見下方規則全文。
        </p>
      </>
    ),
  },
  {
    id: 'board',
    title: '二、棋盤與駒',
    body: (
      <ul className="list-disc pl-5 space-y-1.5 text-xs">
        <li>9×9 方格，駒置於格中央；雙方各 25 枚，開局共 50 枚。</li>
        <li>駒為木製，可縱向<strong>疊加</strong>，上限<strong>三層</strong>（入門／初級上限二層）。</li>
        <li>共 <strong>14 種</strong>駒，各走法見解說書；段數越高，可達方格越多（淺藍→深藍→綠色範圍）。</li>
        <li>「大」「中」在紅色標示區域可<strong>無限制直線移動</strong>，段數不影響該能力。</li>
      </ul>
    ),
  },
  {
    id: 'pieces',
    title: '三、棋子種類（14 種）',
    body: (
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-[#4a5f3a]/60 text-[#d4e4c8]">
            <th className="text-left py-1 pr-2">駒</th>
            <th className="text-left py-1">概要</th>
          </tr>
        </thead>
        <tbody className="text-[#b8c9a8]">
          <tr><td className="py-0.5 pr-2 font-bold">帥</td><td>核心；被吃或無路可逃即敗。帥上不可疊加任何駒。</td></tr>
          <tr><td className="py-0.5 pr-2">侍</td><td>直線移動，段數增加射程。</td></tr>
          <tr><td className="py-0.5 pr-2">兵</td><td>向前移動。</td></tr>
          <tr><td className="py-0.5 pr-2">馬</td><td>日字跳。</td></tr>
          <tr><td className="py-0.5 pr-2">砲</td><td>特殊子：可飛越同段或較低段之駒（見下節）。</td></tr>
          <tr><td className="py-0.5 pr-2">筒</td><td>特殊子：飛越規則同砲、弓類。</td></tr>
          <tr><td className="py-0.5 pr-2">弓</td><td>特殊子：入門不使用；初級僅用弓。</td></tr>
          <tr><td className="py-0.5 pr-2">謀</td><td>疊於敵駒上時，若手中有相同駒可「回家睡覺」替換（僅該回合）。</td></tr>
          <tr><td className="py-0.5 pr-2">忍</td><td>一般駒，可參與疊加與「新」。</td></tr>
          <tr><td className="py-0.5 pr-2">小／中／大</td><td>階級駒；「大」「中」具無限直線移動區。</td></tr>
        </tbody>
      </table>
    ),
  },
  {
    id: 'setup',
    title: '四、開局配置',
    body: (
      <ul className="list-disc pl-5 space-y-1.5 text-xs">
        <li>決定先後：各執一帥，於盤中央放開，靠中央者先手。</li>
        <li>從<strong>帥</strong>起交替放置，限<strong>自陣三橫行</strong>內；可疊至三層，但<strong>帥上不可疊</strong>。</li>
        <li>可留駒作<strong>手駒</strong>不擺上盤；配置結束須宣言「<strong>完成（済み）</strong>」。</li>
        <li>先手宣言完成後，後手仍可繼續配置；後手宣言後配置結束。</li>
        <li>座標讀法：「橫-縱-段-駒」，例 4-7-2 侍 表示 (4,7) 二段之侍。</li>
      </ul>
    ),
  },
  {
    id: 'move',
    title: '五、移動與吃子',
    body: (
      <ul className="list-disc pl-5 space-y-1.5 text-xs">
        <li>輪流一手；手指離開駒即不可悔棋（不可從原處或他處再動）。</li>
        <li>僅<strong>最上層</strong>駒可移動；下層被壓住不可動。</li>
        <li>除砲・筒・弓外，一般駒<strong>不可飛越</strong>其他駒。</li>
        <li>重疊敵駒時可<strong>取走</strong>（移出棋局、不可再用）或<strong>疊加（ツケる）</strong>。</li>
        <li>敵柱<strong>段數高於</strong>己方攻擊駒時，不可取走亦不可疊加。</li>
        <li><strong>無強弱子之分</strong>：任何駒皆可攻擊帥（與象棋階級制不同）。</li>
        <li>2 段射程比 1 段多 1 格，3 段再多 1 格；疊加後移動範圍擴大。</li>
      </ul>
    ),
  },
  {
    id: 'stack',
    title: '六、疊加（ツケる）',
    body: (
      <ul className="list-disc pl-5 space-y-1.5 text-xs">
        <li>可不取敵子，將己駒疊在己方子或（段數允許時）敵方子上。</li>
        <li>上限三層；不可疊在<strong>低於己段</strong>的己方子（例：2 段不能疊在 1 段己子上）。</li>
        <li>可疊在<strong>同段或較低段</strong>的敵子上；吃三層敵柱時可只取敵子、保留己方子並重排段數。</li>
        <li>帥上<strong>絕不可</strong>疊加。</li>
      </ul>
    ),
  },
  {
    id: 'shin',
    title: '七、新（手駒打入）',
    body: (
      <ul className="list-disc pl-5 space-y-1.5 text-xs">
        <li>配置時未用的手駒，可在對局中打入盤面，稱「<strong>新</strong>」。</li>
        <li>打入範圍：自陣起算<strong>六橫行以內</strong>；不可比場上最遠己子更遠（不可越位）。</li>
        <li>使用「新」的回合<strong>不能再移動</strong>，直接換對手。</li>
        <li>「新」可打在空格，或<strong>僅疊在己方子</strong>上（不可疊敵子、不可疊帥、不可疊滿三層白子）。</li>
        <li>手駒疊加讀法例：4-7-2 忍<strong>新</strong>。</li>
      </ul>
    ),
  },
  {
    id: 'special',
    title: '八、砲・筒・弓',
    body: (
      <ul className="list-disc pl-5 space-y-1.5 text-xs">
        <li>可飛越<strong>同段或較低段</strong>的己方或敵方駒。</li>
        <li>1 段砲向前：飛越 2 格落第 3 格（淺藍）；2 段飛越 3 格落第 4 格（深藍）；3 段飛越 4 格落第 5 格（綠）。</li>
        <li>1 段時基本有效範圍較小（例：最多向前 2 格），高段時可達 3～5 格。</li>
        <li>入門不用特殊子；初級僅弓；中級以上使用砲・筒・弓・謀等。</li>
      </ul>
    ),
  },
  {
    id: 'bou',
    title: '九、謀（回家睡覺）',
    body: (
      <p className="text-xs">
        將「謀」疊在敵駒上時，若手中有<strong>與被疊敵駒相同</strong>的駒，可選擇用手中駒替換敵駒，敵駒移出棋局。效果及於被疊柱下所有敵子，<strong>僅該回合</strong>有效。亦可配合「新」達成三層組合。
      </p>
    ),
  },
  {
    id: 'end',
    title: '十、勝負與千日手',
    body: (
      <ul className="list-disc pl-5 space-y-1.5 text-xs">
        <li>先捕獲敵<strong>帥</strong>者勝；或帥遭將死；或對方<strong>投降</strong>。</li>
        <li>同一局面出現<strong>四次</strong>（千日手）則重開新局。</li>
        <li>本 playable 版含：帥・侍・兵・馬・砲・弓・忍等簡化走法、三層疊、手駒打入、降旗認輸。</li>
      </ul>
    ),
  },
  {
    id: 'ui',
    title: '十一、操作說明',
    body: (
      <ul className="list-disc pl-5 space-y-1.5 text-xs">
        <li>點選己柱頂子 → 綠格移動／吃／疊；角標數字為段數。</li>
        <li>持駒：點選後點自陣空位打入（「新」簡化版）。</li>
        <li>「降旗」即認輸（對應漫畫軍儀禮儀）。</li>
      </ul>
    ),
  },
];

export default function GungiRulesPanel({ defaultOpen = false, className = '' }) {
  return (
    <section className={`rounded-xl border border-[#4a5f3a] bg-[#1a2418]/95 overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-[#4a5f3a]">
        <h2 className="font-serif text-lg text-[#e8f0dc]">軍儀規則（完整整理）</h2>
        <p className="text-xs text-[#9ca88a] mt-0.5">官方解說書・繁中整理 · 9×9 · 三層疊</p>
      </div>
      <div className="divide-y divide-[#4a5f3a]/50 max-h-[min(70vh,32rem)] overflow-y-auto">
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
