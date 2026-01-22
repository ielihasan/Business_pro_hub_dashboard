@echo off
echo Starting Business Pro Hub Development Servers...
echo.
echo Landing Page will run on: http://localhost:3000
echo Dashboard will run on: http://localhost:3001
echo.
echo Press Ctrl+C to stop all servers
echo.

start "Landing Page" cmd /k "cd landing-page && npm run dev"
start "Dashboard" cmd /k "cd dashboard && npm run dev"

echo.
echo Both servers are starting in separate windows...
echo Close those windows or press Ctrl+C to stop the servers.
pause
