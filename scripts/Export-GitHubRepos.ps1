# Export five standalone chess game repos (wrapper)
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
Push-Location $Root
try {
    node scripts/export-repos.mjs
} finally {
    Pop-Location
}
