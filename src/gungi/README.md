# 軍儀模組（Gungi）

《獵人》軍儀棋 playable 人機對弈，規則依 [官方解說書整理](../docs/GUNGI.md) 與 [Hunter Wiki（軍儀棋）](https://hunterxhunter.fandom.com/zh/wiki/軍儀棋)。

## 規則文件

完整規則、棋子表、Wiki 連結：**[docs/GUNGI.md](../docs/GUNGI.md)**

## 檔案

| 檔案 | 說明 |
|------|------|
| `GungiApp.jsx` | 主介面、降旗、著法選擇 |
| `GungiRulesPanel.jsx` | 遊戲內規則面板 |
| `GungiPiece.jsx` | 木製駒樣式 |
| `logic.js` | 官方核心規則引擎 |
| `ai.js` | Alpha-Beta AI |

## 已實作規則

- 9×9、三層疊、段數制（非子力強弱）
- 移動／取子／疊加／全取
- **新**（手駒打入，6 行內）
- 砲・筒・弓飛越、大・中直線
- 謀（回家睡覺）、千日手、詰、降旗

## 獨立 Repo

`npm run export-repos` → `../repos/gungi-web/`
