@echo off
cd /d "%~dp0"

REM Kill anything on port 3002
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3002 " 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Starting Next.js dashboard on http://localhost:3002
node node_modules\next\dist\bin\next dev -p 3002
