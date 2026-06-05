# Creates EZChess.lnk in project root -> EZChess-Start.bat (root bat avoids shortcuts to deep paths failing)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$starter = Join-Path $root 'EZChess-Start.bat'
if (-not (Test-Path -LiteralPath $starter)) {
    Write-Error "EZChess-Start.bat not found: $starter"
}
$lnkPath = Join-Path $root 'EZChess.lnk'
$shell = New-Object -ComObject WScript.Shell
$sc = $shell.CreateShortcut($lnkPath)
$sc.TargetPath = $starter
$sc.Arguments = ''
$sc.WorkingDirectory = $root
$sc.WindowStyle = 1
$sc.Description = 'EZChess: local server; close console to stop'
$sc.Save()
Write-Host "Shortcut created:"
Write-Host $lnkPath
Write-Host "Points to: $starter"
