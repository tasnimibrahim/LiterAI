@echo off
echo ===================================================
echo   LiterAI - Start Project (Windows)
echo ===================================================

echo Checking if node_modules exists...
if not exist "node_modules" (
    echo [ERROR] Dependencies not found. Please run 'setup.bat' first.
    pause
    exit /b
)

echo Starting LiterAI Backend and Evaluation Dashboard...
npm run dev:all

pause
