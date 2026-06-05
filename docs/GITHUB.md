# GitHub 上傳指南

## 方案 A：一個 Repo（五棋合一，推薦）

Repo 名稱建議：`board-games-web`

```bash
cd EZChess-web
git init
git add .
git commit -m "Initial commit: five board games web platform"
git branch -M main
git remote add origin https://github.com/LYXiui/board-games-web.git
git push -u origin main
```

## 方案 B：五個獨立 Repo

執行匯出腳本後，於 `../repos/` 取得五個獨立專案：

```powershell
.\scripts\Export-GitHubRepos.ps1
# 或：node scripts/export-repos.mjs
```

| 資料夾 | 建議 GitHub 名稱 | 內容 |
|--------|------------------|------|
| `repos/ezchess-web` | `ezchess-web` | EZChess 人機 |
| `repos/chess-web` | `chess-web` | 西洋棋 |
| `repos/shogi-web` | `shogi-web` | 将棋 |
| `repos/gungi-web` | `gungi-web` | 軍儀（原創） |
| `repos/junqi-web` | `junqi-web` | 軍棋（陸戰棋） |

各 repo 上傳：

```bash
cd repos/ezchess-web   # 或其他
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/LYXiui/REPO_NAME.git
git push -u origin main
```

## 上傳前檢查

- [ ] 未包含 `node_modules/`、`dist/`（已在 `.gitignore`）
- [ ] 無 `.env` 或 API 金鑰
- [ ] 本地 `npm install && npm run build` 成功
- [ ] `LICENSE`、`README.md` 已存在

## Python EZChess CLI（第六個可選 Repo）

路徑：`../ezchess/` — 與網頁五棋分開，建議 repo 名稱 `ezchess-cli`。
