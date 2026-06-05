@echo off
REM Calls Start-EZChess.ps1 (UTF-8 / Unicode paths). ASCII only here.
cd /d "%~dp0"
where powershell >nul 2>&1
if errorlevel 1 (
  echo [ERROR] powershell.exe not found.
  pause
  exit /b 1
)
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-EZChess.ps1"
echo.
pause
