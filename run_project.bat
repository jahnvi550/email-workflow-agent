@echo off
title Email-to-Workflow AI Agent - Batch 05 Runner
echo ===============================================================================
echo       EMAIL-TO-WORKFLOW AI AGENT AND TASK ORCHESTRATOR
echo       Batch-05 - LangGraph + Multi-LLM + HITL Safety System
echo ===============================================================================
echo.

cd /d "%~dp0"

:: 1. Check Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.10+.
    pause
    exit /b 1
)

:: 2. Setup Virtual Environment
if not exist "backend\venv" (
    echo [1/4] Creating Python virtual environment in backend\venv...
    python -m venv backend\venv
)

echo [2/4] Checking Python dependencies...
backend\venv\Scripts\pip install -q -r backend\requirements.txt

echo [3/4] Checking Frontend dependencies...
if not exist "frontend\node_modules" (
    cd frontend
    call npm install
    cd ..
)

echo [4/4] Initializing Database and Demo Workflows...
backend\venv\Scripts\python -c "import sys; sys.path.insert(0, '.'); from backend.app.database import init_db; from backend.app.seed_data import seed_database; init_db(); seed_database()"

echo.
echo ===============================================================================
echo  SERVICES READY TO LAUNCH:
echo  - Backend REST API:   http://localhost:8000 (Swagger: http://localhost:8000/docs)
echo  - Frontend Dashboard:  http://localhost:3000
echo ===============================================================================
echo.

:: Start Backend in separate window
start "Email Agent Backend (FastAPI)" cmd /k "cd /d "%~dp0" && backend\venv\Scripts\python backend\run.py"

:: Start Frontend in separate window
start "Email Agent Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Both services started in separate terminal windows!
echo Open your browser at http://localhost:3000 to interact with the dashboard.
echo.
pause
