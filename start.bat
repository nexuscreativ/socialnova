@echo off
echo ========================================
echo   SocialNova - Quick Start
echo ========================================
echo.

echo [1/4] Checking prerequisites...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed
    exit /b 1
)
echo   ✓ Node.js found

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed
    exit /b 1
)
echo   ✓ Python found

echo.
echo [2/4] Installing dependencies...
cd apps\web
call npm install
cd ..\..
cd apps\api
pip install -r requirements.txt
cd ..\..

echo.
echo [3/4] Setting up environment...
if not exist .env (
    copy .env.example .env
    echo   Created .env from .env.example
    echo   Please edit .env with your API keys
)

echo.
echo [4/4] Starting services...
echo.
echo Starting API server...
start "SocialNova API" cmd /k "cd apps\api && python -m uvicorn main:app --reload --port 8000"

echo Starting Web server...
start "SocialNova Web" cmd /k "cd apps\web && npm run dev"

echo.
echo ========================================
echo   SocialNova is starting!
echo ========================================
echo.
echo   Web:  http://localhost:3000
echo   API:  http://localhost:8000
echo   Docs: http://localhost:8000/docs
echo.
echo Press any key to exit...
pause >nul
