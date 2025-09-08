@echo off
echo Starting Python backend setup for Windows...
echo This script will set up the virtual environment, install libraries, and start the server.
echo.

REM Navigate to the backend directory relative to the script's location
cd "%~dp0backend"

echo [1/4] Creating Python virtual environment ('venv')...
python -m venv venv
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to create virtual environment. Make sure Python is installed and in PATH.
    pause
    exit /b
)
echo Done.
echo.

echo [2/4] Activating virtual environment...
call .\venv\Scripts\activate
echo Done.
echo.

echo [3/4] Installing required libraries from requirements.txt...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install libraries. Check your internet connection and requirements.txt.
    pause
    exit /b
)
echo Done.
echo.

echo [4/4] Starting the backend server...
echo Press Ctrl+C in this window to stop the server at any time.
echo.
python run_server.py

pause
