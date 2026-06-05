import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outBase = path.join(root, '..', 'repos');

const games = [
  {
    id: 'ezchess-web',
    folder: 'ezchess',
    app: 'EZChessApp',
    title: 'EZChess',
    desc: '課程 EZChess 8×8 人機對弈（AB/UV、開局匯入、UV 調整）',
    port: 5191,
  },
  {
    id: 'chess-web',
    folder: 'chess',
    app: 'ChessApp',
    title: '西洋棋',
    desc: '標準西洋棋（易位、過路兵、升變、和棋規則）',
    port: 5192,
  },
  {
    id: 'shogi-web',
    folder: 'shogi',
    app: 'ShogiApp',
    title: '将棋',
    desc: '日式将棋完整規則（打入、升變、千日手、持將棋）',
    port: 5193,
  },
  {
    id: 'gungi-web',
    folder: 'gungi',
    app: 'GungiApp',
    title: '軍儀',
    desc: '原創軍儀棋（9×9 三層疊、降旗）',
    port: 5194,
  },
  {
    id: 'junqi-web',
    folder: 'junqi',
    app: 'JunqiApp',
    title: '軍棋',
    desc: '陸戰棋（12×5 暗棋、鐵路、行營、奪旗）',
    port: 5195,
  },
];

const copyFiles = ['vite.config.js', 'eslint.config.js', 'LICENSE', '.gitignore'];

function copyFile(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function cp(src, dst) {
  if (fs.statSync(src).isDirectory()) copyDir(src, dst);
  else copyFile(src, dst);
}

function rm(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

for (const g of games) {
  const out = path.join(outBase, g.id);
  rm(out);
  fs.mkdirSync(out, { recursive: true });

  for (const f of copyFiles) {
    const p = path.join(root, f);
    if (fs.existsSync(p)) cp(p, path.join(out, f));
  }

  cp(path.join(root, 'src', 'main.jsx'), path.join(out, 'src', 'main.jsx'));
  cp(path.join(root, 'src', 'index.css'), path.join(out, 'src', 'index.css'));
  cp(path.join(root, 'src', g.folder), path.join(out, 'src', g.folder));

  const appJsx = `import ${g.app} from './${g.folder}/${g.app}.jsx';

export default function App() {
  return <${g.app} />;
}
`;
  fs.writeFileSync(path.join(out, 'src', 'App.jsx'), appJsx, 'utf8');

  const html = `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${g.title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
  fs.writeFileSync(path.join(out, 'index.html'), html, 'utf8');

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  pkg.name = g.id;
  pkg.description = g.desc;
  pkg.scripts['dev:safe'] = `vite --port ${g.port} --strictPort`;
  delete pkg.scripts['export-repos'];
  pkg.repository = {
    type: 'git',
    url: `https://github.com/LYXiui/${g.id}.git`,
  };
  fs.writeFileSync(path.join(out, 'package.json'), JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  const readme = `# ${g.title} Web

${g.desc}

從 [board-games-web](https://github.com/LYXiui/board-games-web) 匯出的獨立模組。

## 快速開始

\`\`\`bash
npm install
npm run dev:safe
\`\`\`

開啟 http://localhost:${g.port}

## 建置

\`\`\`bash
npm run build
\`\`\`

## 授權

MIT License
`;
  fs.writeFileSync(path.join(out, 'README.md'), readme, 'utf8');

  const ciSrc = path.join(root, '.github', 'workflows', 'ci.yml');
  if (fs.existsSync(ciSrc)) {
    cp(ciSrc, path.join(out, '.github', 'workflows', 'ci.yml'));
  }

  console.log('Exported:', out);
}

console.log('Done. Five repos at:', outBase);
