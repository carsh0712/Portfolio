@echo off
setlocal
chcp 65001 > nul

set "SCRIPT_DIR=%~dp0"
set "REPO_ROOT=%SCRIPT_DIR%.."
set "SERVER_DIR=%REPO_ROOT%\portfolio_project_server_flask"
set "VENV_DIR=%SERVER_DIR%\.venv"
set "VENV_PYTHON=%SERVER_DIR%\.venv\Scripts\python.exe"
set "VENV_CFG=%SERVER_DIR%\.venv\pyvenv.cfg"
set "BASE_PYTHON=python"

if exist "%VENV_CFG%" (
    for /f "tokens=1,* delims==" %%A in ('findstr /b /c:"executable = " "%VENV_CFG%"') do (
        set "BASE_PYTHON=%%B"
    )
    for /f "tokens=* delims= " %%P in ("%BASE_PYTHON%") do set "BASE_PYTHON=%%P"
)

cd /d "%SERVER_DIR%"

if exist "%VENV_PYTHON%" (
    "%VENV_PYTHON%" --version > nul 2>&1
    if errorlevel 1 (
        echo [backend] .venv Python is broken. Recreating .venv...
        "%BASE_PYTHON%" -m venv "%VENV_DIR%"
        if errorlevel 1 exit /b 1

        "%VENV_PYTHON%" -m pip install -r requirements.txt
        if errorlevel 1 exit /b 1
    )
) else (
    echo [backend] .venv not found. Creating .venv...
    "%BASE_PYTHON%" -m venv "%VENV_DIR%"
    if errorlevel 1 exit /b 1

    "%VENV_PYTHON%" -m pip install -r requirements.txt
    if errorlevel 1 exit /b 1
)

if not exist "%VENV_PYTHON%" (
    echo [Error] Python executable not found: %VENV_PYTHON%
    exit /b 1
)

"%VENV_PYTHON%" app.py
