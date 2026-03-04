@echo off
set "ROOT=%~dp0"

echo Starting Business Pro Hub Development Environment...
echo.

echo [1/2] Starting Spring Boot backend on http://localhost:8181
start "Spring Boot Backend" powershell.exe -ExecutionPolicy Bypass -NoExit -File "%ROOT%backend\start.ps1"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Next.js dashboard on http://localhost:3002
start "Next.js Dashboard" cmd /k "%ROOT%dashboard\start.cmd"

echo.
echo Both servers starting in separate windows:
echo.
echo   Backend API:        http://localhost:8181
echo.
echo   Landing Page:       http://localhost:3002/
echo   Login:              http://localhost:3002/auth/v1/login
echo   Register:           http://localhost:3002/auth/v1/register
echo   Business Dashboard: http://localhost:3002/business/dashboard
echo   Admin Dashboard:    http://localhost:3002/admin/dashboard
echo.
