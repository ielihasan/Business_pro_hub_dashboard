@echo off
echo Starting Business Pro Hub Development Server...
echo.
echo Application will run on: http://localhost:3001
echo   - Landing Page: http://localhost:3001/
echo   - Login: http://localhost:3001/auth/v1/login
echo   - Register: http://localhost:3001/auth/v1/register
echo.
echo Press Ctrl+C in the server window to stop
echo.

cd dashboard
npm run dev

pause
