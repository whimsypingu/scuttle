@echo off
REM Check if venv exists
if not exist venv (
    echo Virtual environment not found. Running setup...
    python main.py --setup
)

REM Activate the virtual environment
call venv\Scripts\activate.bat

REM Prompt user for Discord webhook URL
set /p WEBHOOK_URL=Enter your Discord webhook URL (or leave empty to skip): 

REM Run the main script with optional webhook argument
if "%WEBHOOK_URL%"=="" (
    python main.py
) else (
    python main.py -w %WEBHOOK_URL%
)

pause
