@echo off
title StudySmart Pro - Quick Start

echo.
echo ==========================================
echo    Welcome to StudySmart Pro!
echo ==========================================
echo.
echo This will start both the frontend and backend servers.
echo.
echo Frontend: http://localhost:8080
echo Backend:  http://localhost:3001
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

echo.
echo Starting application...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies... This may take a few minutes.
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Failed to install dependencies!
        echo Please check your internet connection and try again.
        pause
        exit /b 1
    )
)

echo.
echo ==========================================
echo    Starting StudySmart Pro...
echo ==========================================
echo.
echo Opening browser in 5 seconds...
echo Press Ctrl+C to stop the servers
echo.

REM Start the application
start "" cmd /c "timeout /t 5 >nul && start http://localhost:8080"
npm run dev

pause
