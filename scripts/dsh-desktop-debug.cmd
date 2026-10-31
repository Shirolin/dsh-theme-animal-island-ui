@echo off
setlocal EnableExtensions
set "PORT=9222"
set "EXE="

for %%P in (
  "%ProgramFiles%\DeepSeek Harness\DeepSeek Harness.exe"
  "%LOCALAPPDATA%\Programs\DeepSeek Harness\DeepSeek Harness.exe"
  "C:\Software\DeepSeek Harness\DeepSeek Harness.exe"
) do (
  if not defined EXE if exist "%%~P" set "EXE=%%~P"
)

if not defined EXE (
  echo [dsh-debug] DeepSeek Harness.exe not found.
  echo [dsh-debug] Edit this script and set EXE to your install path.
  exit /b 1
)

curl.exe -fsS --max-time 1 "http://127.0.0.1:%PORT%/json/version" >nul 2>&1
if not errorlevel 1 (
  echo [dsh-debug] CDP is already listening on 127.0.0.1:%PORT%.
  exit /b 0
)

netstat -ano | findstr ":%PORT%" | findstr "LISTENING" >nul
if not errorlevel 1 (
  echo [dsh-debug] Port %PORT% is already in use by another process.
  echo [dsh-debug] Close that process, or change PORT here and in capture-desktop.ps1.
  exit /b 1
)

tasklist /FI "IMAGENAME eq DeepSeek Harness.exe" 2>nul | find /I "DeepSeek Harness.exe" >nul
if not errorlevel 1 (
  echo [dsh-debug] DeepSeek Harness is already running.
  echo [dsh-debug] The debug port only applies at launch. Quit the app, then run this script again.
  exit /b 1
)

echo [dsh-debug] Starting "%EXE%" with --remote-debugging-port=%PORT% ...
start "" "%EXE%" --remote-debugging-port=%PORT%

timeout /t 3 /nobreak >nul
curl.exe -fsS --max-time 2 "http://127.0.0.1:%PORT%/json/version" >nul 2>&1
if errorlevel 1 (
  echo [dsh-debug] CDP did not come up on 127.0.0.1:%PORT%.
  echo [dsh-debug] Check that the app started and no other process owns the port.
  exit /b 1
)

echo [dsh-debug] CDP ready: http://127.0.0.1:%PORT%/json/list
echo [dsh-debug] Capture with: powershell -ExecutionPolicy Bypass -File scripts\capture-desktop.ps1
exit /b 0
