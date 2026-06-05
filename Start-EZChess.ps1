# EZChess launcher (UTF-8 safe). Double-click EZChess-Start.bat to run.
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'package.json'))) {
  Write-Host '[ERROR] package.json not found. Put this script in EZChess-web root.'
  Read-Host 'Press Enter to exit'
  exit 1
}

$pkgPath = Join-Path $PSScriptRoot 'package.json'
$pkgRaw = Get-Content -LiteralPath $pkgPath -Raw -Encoding UTF8
if ($pkgRaw -notmatch '"name"\s*:\s*"ezchess-web"') {
  Write-Host '[ERROR] Wrong project folder. package.json must be for "ezchess-web", not the graduation frontend.'
  Write-Host "Folder: $PSScriptRoot"
  Read-Host 'Press Enter to exit'
  exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host '[ERROR] node not in PATH. Install Node.js LTS from https://nodejs.org then reboot.'
  Read-Host 'Press Enter to exit'
  exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host '[ERROR] npm not in PATH. Reinstall Node.js with Add to PATH.'
  Read-Host 'Press Enter to exit'
  exit 1
}

if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules'))) {
  Write-Host '[EZChess] Running npm install (first time)...'
  npm install
  if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] npm install failed, exit $LASTEXITCODE"
    Read-Host 'Press Enter to exit'
    exit $LASTEXITCODE
  }
}

Write-Host '=== EZChess dev:safe (NOT graduation project) ==='
Write-Host 'Will auto-open: http://localhost:5199/'
Write-Host '(Graduation app is usually port 5173 — not 5199.)'
Write-Host ''
Write-Host '[EZChess] npm run dev:safe'
Write-Host 'Press Ctrl+C here to stop the server.'
Write-Host ''

Start-Process 'http://localhost:5199/'
npm run dev:safe

$code = if ($null -ne $LASTEXITCODE) { $LASTEXITCODE } else { 0 }
Write-Host ''
Write-Host "[EZChess] Done. Exit code: $code"
Read-Host 'Press Enter to close'
exit $code
