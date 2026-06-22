@echo off
setlocal
chcp 65001 > nul

set "SCRIPT_DIR=%~dp0"
set "REPO_ROOT=%SCRIPT_DIR%.."
set "SERVER_DIR=%REPO_ROOT%\portfolio_project_server_flask"
set "VENV_DIR=%SERVER_DIR%\.venv"
set "VENV_PYTHON=%VENV_DIR%\Scripts\python.exe"
set "VENV_CFG=%VENV_DIR%\pyvenv.cfg"
set "BASE_PYTHON=python"

if exist "%VENV_CFG%" (
    for /f "tokens=1,* delims==" %%A in ('findstr /b /c:"executable = " "%VENV_CFG%"') do (
        set "BASE_PYTHON=%%B"
    )
    for /f "tokens=* delims= " %%P in ("%BASE_PYTHON%") do set "BASE_PYTHON=%%P"
)

echo ============================================
echo   Reset Database
echo   (Drop tables - Recreate - Seed data)
echo ============================================
echo.

if exist "%VENV_PYTHON%" (
    echo [1/2] Checking virtual environment...
    "%VENV_PYTHON%" --version > nul 2>&1
    if errorlevel 1 (
        echo [Info] .venv Python is broken. Recreating .venv...
        "%BASE_PYTHON%" -m venv "%VENV_DIR%"
        if errorlevel 1 (
            pause
            exit /b 1
        )

        "%VENV_PYTHON%" -m pip install -r "%SERVER_DIR%\requirements.txt"
        if errorlevel 1 (
            pause
            exit /b 1
        )
    )
) else (
    echo [1/2] Creating virtual environment...
    "%BASE_PYTHON%" -m venv "%VENV_DIR%"
    if errorlevel 1 (
        pause
        exit /b 1
    )

    "%VENV_PYTHON%" -m pip install -r "%SERVER_DIR%\requirements.txt"
    if errorlevel 1 (
        pause
        exit /b 1
    )
)

echo [2/2] Running reset_db.py...
echo.
"%VENV_PYTHON%" "%SCRIPT_DIR%reset_db.py"
echo.

pause
