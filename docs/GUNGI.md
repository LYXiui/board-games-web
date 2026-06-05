# 軍儀（Gungi）完整規則

> 繁體中文整理 · 本專案 playable 模組：`src/gungi/`  
> 玩法：9×9 棋盤、三層疊、段數制、新（手駒打入）、降旗

---

## 一、作品背景（Hunter × Hunter）

**軍儀（ぐんぎ，Gungi）** 意為「儀式／軍儀」，是《獵人》中**東果陀共和國**原創的雙人策略棋類。幾乎全民會下，並有世界大賽；**小麥**為該國連續五屆冠軍。

- 漫畫初登場：第 244 話  
- 蟻王 **梅路艾姆** 與小麥的對局為嵌合蟻篇重要主線  
- 勝負目標：將死或捕獲對方 **帥（スイ）**

### 參考連結（Wiki 與官方）

| 資源 | 連結 |
|------|------|
| **中文 Wiki（軍儀棋）** | https://hunterxhunter.fandom.com/zh/wiki/軍儀棋 |
| **English Hunterpedia（Gungi）** | https://hunterxhunter.fandom.com/wiki/Gungi |
| **Universal Music 軍儀 Q&A（官方商品）** | https://www.universal-music.co.jp/other/hunter-gungi__qa/ |
| **軍儀 Web（UMS 規則準拠）** | https://gungi.2410.dev/rules.html |
| **巴哈姆特・開箱** | https://forum.gamer.com.tw/C.php?bsn=1272&snA=11918 |
| **巴哈姆特・規則中譯** | https://forum.gamer.com.tw/C.php?bsn=1272&snA=12034 |

> **注意**：2022 年 Universal Music 實體版「軍儀」為**作中描寫的具體化**，入門／初級編含部分作中未詳述的規則；與純漫畫想像可能略有差異（見 UMS Q&A）。

---

## 二、棋盤與用具

| 項目 | 說明 |
|------|------|
| 棋盤 | 9×9＝81 格，**無格線色差**（作中為素色木盤） |
| 駒數 | 雙方各 **25 枚**，共 50 枚 |
| 材質 | 官方版為木製駒，可縱向疊放 |
| 陣營 | 黑／白（作中）或紅／藍（本 Web 版 ▲先手／△後手） |
| 疊放上限 | **三層**（入門／初級部分模式為二層） |

---

## 三、棋子一覽（13+ 種）

作中與官方解說書棋子名稱對照（漢字／讀音／英文 Wiki 名）：

| 漢字 | 讀音 | 英文名（Wiki） | 概要 |
|------|------|----------------|------|
| **帥** | スイ Sui | King / Marshal | 核心；被吃或詰死即敗；帥上不可疊（入門） |
| **侍** | Samurai | Samurai | 直線移動，段數增加射程 |
| **兵** | ヒョウ Hyō | Soldier / Pawn | 向前移動 |
| **馬** | キバ Kiba | Cavalry / Knight | 日字跳 |
| **忍** | シノビ Shinobi | Shinobi / Spy | 八方向；作中常見二段柱 |
| **弓** | ユミ Yumi | Bow / Archer | 特殊子：斜向飛越 |
| **砲** | オオヅツ Ōdzutsu | Cannon | 特殊子：直線飛越 |
| **筒** | ツツ Tsutsu | Musketeer / Mortar | 特殊子：直線飛越 |
| **砦** | トリデ Toride | Fort / Fortress | 防禦；常作疊柱中層 |
| **大** | タイショウ Taishō | Prince / General | 大將；紅區域無限直線 |
| **中** | チュウジョウ Chūjō | Duke / Lt. General | 中將；紅區域無限直線 |
| **小** | ショウショウ Shōshō | Captain / Major General | 少將；直線有限 |
| **謀** | ボウショウ Bōshō | Counsel / Strategist | 「回家睡覺（寝返り）」 |

**「新（アラタ Arata）」**：配置時未上盤的手駒，可在對局中打入，如 **忍新**、**弓新**、**中新**。

### Wiki 棋子圖示

- [帥](https://static.wikia.nocookie.net/hunterxhunter/images/1/18/Gungi_piece_-_帥.svg)
- [侍](https://static.wikia.nocookie.net/hunterxhunter/images/1/13/Gungi_piece_-_侍.svg)
- [兵](https://static.wikia.nocookie.net/hunterxhunter/images/2/2d/Gungi_piece_-_兵.svg)
- [馬](https://static.wikia.nocookie.net/hunterxhunter/images/5/5d/Gungi_piece_-_馬.svg)
- [忍](https://static.wikia.nocookie.net/hunterxhunter/images/3/3b/Gungi_piece_-_忍.svg)
- [弓](https://static.wikia.nocookie.net/hunterxhunter/images/2/29/Gungi_piece_-_弓.svg)
- [砲](https://static.wikia.nocookie.net/hunterxhunter/images/f/f8/Gungi_piece_-_砲.svg)
- [筒](https://static.wikia.nocookie.net/hunterxhunter/images/5/56/Gungi_piece_-_筒.svg)
- [砦](https://static.wikia.nocookie.net/hunterxhunter/images/a/a7/Gungi_piece_-_砦.svg)
- [大](https://static.wikia.nocookie.net/hunterxhunter/images/b/bb/Gungi_piece_-_大.svg)
- [中](https://static.wikia.nocookie.net/hunterxhunter/images/9/9f/Gungi_piece_-_中.svg)
- [小](https://static.wikia.nocookie.net/hunterxhunter/images/e/eb/Gungi_piece_-_小.svg)
- [謀](https://static.wikia.nocookie.net/hunterxhunter/images/1/1a/Gungi_piece_-_謀.svg)

---

## 四、開局配置

1. **決定先後**：各執一帥於盤中央放開，靠中央者先手（▲）。
2. **交替配置**：從 **帥** 起，在 **自陣三橫行** 內自由放置。
3. 可將駒 **疊至三層**；**帥上不可疊**（入門／初級）。
4. 可留駒作 **手駒**；宣言「**完成（済み）**」結束配置。
5. 先手完成後，後手仍可繼續；後手完成後正式開局。

**讀法**：`橫-縱-段-駒`，例 `4-7-2 侍`；手駒打入讀 **新**，例 `4-7-2 忍新`。

---

## 五、段數制（核心）

- 每格柱子的 **段數（1～3）** 決定攻擊／移動範圍，**不是**棋子種類強弱。
- 僅 **最上層** 駒可移動。
- 攻擊敵柱：己方段數 **≥** 敵方段數 方可 **取走** 或 **疊加**。
- **無子力強弱**：任何駒皆可攻擊帥（與陸戰棋不同）。
- 2 段比 1 段射程多 1 格，3 段再多 1 格。

---

## 六、移動、吃子、疊加

### 一般規則

- 輪流一手；手指離開即不可悔棋。
- 除 **砲・筒・弓** 外，不可飛越其他駒。
- 重疊敵駒時：**取走**（移出棋局、不可再用）或 **疊加（ツケる）**。

### 疊加（ツケる）

- 可疊在己方子或（段數允許時）敵子上。
- 上限三層；**帥上絕不可疊**。
- 疊己方：移動柱段數須 **大於** 目標柱段數。
- 多層敵柱被「全取」時，依規則保留己方子並重排段數。

### 新（手駒打入）

- 配置剩餘手駒可在對局中打入。
- 範圍：自陣起算 **六橫行以內**；不可比場上最前己子更遠。
- 使用「新」的回合 **不可再移動**。
- 可打空格，或 **僅疊在己方子** 上。

### 砲・筒・弓（特殊）

- 可飛越 **同段或較低段** 的駒。
- 1 段向前：飛越 2 格，落第 3 格；2 段飛 3 落 4；3 段飛 4 落 5。

### 謀（回家睡覺／寝返り）

- 「謀」疊在敵駒上時，若手中有 **相同種類** 敵駒，可替換：敵駒移出棋局，換己駒。**僅該回合**。

---

## 七、勝負

| 條件 | 結果 |
|------|------|
| 捕獲敵 **帥** | 勝 |
| 敵帥 **將死（詰）** | 勝 |
| 對方 **投降（降旗）** | 勝 |
| 同一局面 **四次**（千日手） | 和棋／重開 |

---

## 八、作中名局用語（Wiki）

| 用語 | 說明 |
|------|------|
| **離巢金（離れ.castle 類）** | 梅路艾姆自創布局「離巢金」 |
| **心行（ココリコ Kokoriko）** | 小麥十年前發明的戰法；後被反制 |
| **降旗** | 認輸；作中與「軍儀」禮儀相關 |

---

## 九、本 Web 模組實作對照

| 官方規則 | 本專案 `src/gungi/logic.js` |
|----------|----------------------------|
| 段數制吃子／疊加 | ✅ |
| 新（6 行內） | ✅ |
| 砲・筒・弓飛越 | ✅ |
| 大・中無限直線 | ✅ |
| 謀・回家睡覺 | ✅ |
| 千日手 | ✅ |
| 降旗 | ✅ UI |
| 配置階段 UI | ⏳ 使用推薦開局；可擴充 |
| 14 種駒完整數量配置 | ⏳ 12 種／25 枚 playable 集 |

---

## 十、授權與免責

- 軍儀為《獵人》／冨樫義博先生創作之虛構棋戲；角色與設定 © 冨樫義博。
- 本 repo 為**非官方** fan 實作，供學習與對弈；規則以 UMS 解說書及 Wiki 整理為準。
- 本專案程式碼：MIT License（見根目錄 [LICENSE](../LICENSE)）。
