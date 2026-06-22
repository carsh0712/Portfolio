@echo off
setlocal
chcp 65001 > nul

set "SCRIPT_DIR=%~dp0"
set "REPO_ROOT=%SCRIPT_DIR%.."
set "SERVER_DIR=%REPO_ROOT%\portfolio_project_server_flask"
set "VENV_ACTIVATE=%SERVER_DIR%\.venv\Scripts\activate.bat"
set "REQUIREMENTS_FILE=%SERVER_DIR%\requirements.txt"

echo ============================================
echo   Update server requirements.txt
echo ============================================
echo.

if exist "%VENV_ACTIVATE%" (
    echo [1/3] Activating virtual environment...
    call "%VENV_ACTIVATE%"
) else (
    echo [Error] .venv not found: %SERVER_DIR%\.venv
    echo         Run from the server directory: python -m venv .venv
    pause
    exit /b 1
)

echo [2/3] Exporting installed packages...

if exist "%REQUIREMENTS_FILE%" (
    copy /Y "%REQUIREMENTS_FILE%" "%REQUIREMENTS_FILE%.bak" > nul
    echo        - Backup created: requirements.txt.bak
)

pip freeze > "%REQUIREMENTS_FILE%"

echo [3/3] requirements.txt updated.
echo.
echo ============================================
echo   Result:
echo ============================================
echo.
type "%REQUIREMENTS_FILE%"
echo.
echo ============================================
for /f %%a in ('type "%REQUIREMENTS_FILE%" ^| find /c /v ""') do echo   Total %%a packages recorded.
echo ============================================

pause
