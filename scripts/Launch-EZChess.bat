@echo off
REM ASCII only: CMD uses system ANSI; UTF-8 Chinese breaks parsing.
cd /d "%~dp0\.."
if not exist "package.json" (
  echo [ERROR] Not in EZChess-web root (package.json missing).
  pause
  exit /b 1
)

title EZChess

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] node not in PATH. Install Node.js LTS, then reboot or sign out/in.
  echo https://nodejs.org
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm not in PATH. Reinstall Node.js with "Add to PATH" checked.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo [EZChess] First run: npm install ...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

echo [EZChess] Building then static server (serve) on 4188. Close this window or Ctrl+C to stop.
echo Open: http://127.0.0.1:4188/  or  http://localhost:4188/
echo.

call npm run desktop
set EXITCODE=%errorlevel%

if not "%EXITCODE%"=="0" (
  echo.
  echo [ERROR] npm run desktop exit code: %EXITCODE%
  echo Common: port 4188 in use, or build failed. See messages above.
)

echo.
echo ----- Press any key to close -----
pause >nul
exit /b %EXITCODE%
