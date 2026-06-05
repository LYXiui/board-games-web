# Board Games Web（EZChess-web）

多棋種人機對弈網頁平台：EZChess、西洋棋、将棋、軍儀、**軍棋（陸戰棋）**。

## 功能模組

| 分頁 | 目錄 | 說明 |
|------|------|------|
| EZChess | `src/ezchess/` | 課程規則 8×8、AB/UV、開局匯入、UV 調整 |
| 西洋棋 | `src/chess/` | 標準規則（易位、過路兵、升變） |
| 将棋 | `src/shogi/` | 日式完整規則（打入、升變、千日手等） |
| 軍儀 | `src/gungi/` | **原創** 9×9 三層疊、階級制、降旗 |
| 軍棋 | `src/junqi/` | 陸戰棋 12×5、暗棋、鐵路、行營、奪旗 |

各模組互不混入他棋規則。

## 快速開始

```bash
npm install
npm run dev:safe    # http://localhost:5199
```

或雙擊 `EZChess-Start.bat`（Windows）。

| 指令 | 說明 |
|------|------|
| `npm run dev:safe` | 開發伺服器，埠 **5199** |
| `npm run build` | 建置 `dist/` |
| `npm run desktop` | 建置後靜態預覽埠 **4188** |

## 技術棧

- React 19 + Vite 8 + Tailwind CSS 4（`@tailwindcss/vite`）
- 各棋種獨立 `logic.js` / `ai.js` / `*App.jsx`

## 專案結構

```
src/
  App.jsx           # 頂部分頁
  ezchess/
  chess/
  shogi/
  gungi/            # 軍儀（原創）
  junqi/            # 軍棋（陸戰棋）
```

## 上傳 GitHub

詳見 [docs/GITHUB.md](docs/GITHUB.md)。

- **方案 A（推薦）**：本 repo 含五棋合一，建議名稱 `board-games-web`
- **方案 B**：執行 `scripts/Export-GitHubRepos.ps1` 匯出五個獨立 repo 至 `../repos/`

```powershell
.\scripts\Export-GitHubRepos.ps1
```

CI：推送後 GitHub Actions 會執行 `npm ci` 與 `npm run build`（見 `.github/workflows/ci.yml`）。

## 授權

MIT License — 見 [LICENSE](LICENSE)

## 相關專案

- [ezchess](../ezchess) — Python CLI 版 EZChess
- [AI-Fake-News-Verification-System](../../Downloads/AI-Fake-News-Verification-System-main/AI-Fake-News-Verification-System-main) — 假新聞查證（獨立專案）

## 免責聲明

軍儀模組為教學用原創簡化規則，靈感來自虛構作品中的棋戲概念，非官方完整軍儀規則複製。
