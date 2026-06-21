@echo off
chcp 65001 > nul
echo ============================================
echo   Reset Database
echo   (Drop tables - Recreate - Seed data)
echo ============================================
echo.

REM Activate venv
if exist "..\.venv\Scripts\activate.bat" (
    echo [1/2] Activating virtual environment...
    call ..\.venv\Scripts\activate.bat
) else (
    echo [Error] .venv not found.
    echo         Run: python -m venv .venv
    pause
    exit /b 1
)

echo [2/2] Running reset_db.py...
echo.
python "%~dp0reset_db.py"
echo.

pause
