@echo off
chcp 65001 > nul
echo ============================================
echo   Requirements.txt 갱신 스크립트
echo ============================================
echo.

REM 가상환경 활성화
if exist "..\.venv\Scripts\activate.bat" (
    echo [1/3] 가상환경 활성화 중...
    call ..\.venv\Scripts\activate.bat
) else (
    echo [오류] .venv 폴더를 찾을 수 없습니다.
    echo        먼저 python -m venv .venv 를 실행하세요.
    pause
    exit /b 1
)

echo [2/3] 현재 설치된 패키지 목록 추출 중...

REM 기존 requirements.txt 백업
if exist "..\requirements.txt" (
    copy /Y ..\requirements.txt ..\requirements.txt.bak > nul
    echo        - 기존 파일 백업: requirements.txt.bak
)

REM pip freeze로 새로운 requirements.txt 생성
pip freeze > ..\requirements.txt

echo [3/3] requirements.txt 갱신 완료!
echo.
echo ============================================
echo   결과:
echo ============================================
echo.
type ..\requirements.txt
echo.
echo ============================================
for /f %%a in ('type ..\requirements.txt ^| find /c /v ""') do echo   총 %%a 개 패키지가 기록되었습니다.
echo ============================================

pause
