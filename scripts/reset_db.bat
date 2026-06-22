@echo off
setlocal
chcp 65001 > nul

set "SCRIPT_DIR=%~dp0"
set "REPO_ROOT=%SCRIPT_DIR%.."
set "SERVER_DIR=%REPO_ROOT%\portfolio_project_server_flask"
set "VENV_ACTIVATE=%SERVER_DIR%\.venv\Scripts\activate.bat"

echo ============================================
echo   Reset Database
echo   (Drop tables - Recreate - Seed data)
echo ============================================
echo.

if exist "%VENV_ACTIVATE%" (
    echo [1/2] Activating virtual environment...
    call "%VENV_ACTIVATE%"
) else (
    echo [Error] .venv not found: %SERVER_DIR%\.venv
    echo         Run from the server directory: python -m venv .venv
    pause
    exit /b 1
)

echo [2/2] Running reset_db.py...
echo.
python "%SCRIPT_DIR%reset_db.py"
echo.

pause
