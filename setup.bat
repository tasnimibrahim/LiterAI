@echo off
echo ===================================================
echo   LiterAI - Project Setup (Windows)
echo ===================================================

echo [1/4] Installing Node.js dependencies...
call npm install

echo [2/4] Checking Python Virtual Environment...
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
) else (
    echo Virtual environment already exists.
)

echo [3/4] Installing Python dependencies...
call .\venv\Scripts\pip install --upgrade pip
call .\venv\Scripts\pip install -r evaluation\requirements.txt

echo [4/4] Initializing Database and Seeding Data...
call .\venv\Scripts\python evaluation\seed_db.py

echo ===================================================
echo   Setup Complete!
echo   You can now use 'run.bat' to start the project.
echo ===================================================
pause
