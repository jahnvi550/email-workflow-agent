# PowerShell Runner for Email-to-Workflow AI Agent (Batch-05)
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "      EMAIL-TO-WORKFLOW AI AGENT & TASK ORCHESTRATOR" -ForegroundColor Cyan
Write-Host "      Batch-05 - LangGraph + Multi-LLM + HITL Safety System" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$RootDir = $PSScriptRoot
Set-Location $RootDir

# 1. Virtual Environment Setup
if (-not (Test-Path "$RootDir\backend\venv")) {
    Write-Host "[1/4] Creating Python virtual environment in backend\venv..." -ForegroundColor Yellow
    python -m venv "$RootDir\backend\venv"
}

# 2. Python Dependencies
Write-Host "[2/4] Checking Python requirements..." -ForegroundColor Yellow
& "$RootDir\backend\venv\Scripts\pip.exe" install -q -r "$RootDir\backend\requirements.txt"

# 3. Frontend Packages
Write-Host "[3/4] Checking Frontend dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "$RootDir\frontend\node_modules")) {
    Set-Location "$RootDir\frontend"
    npm install
    Set-Location $RootDir
}

# 4. Initialize Database & Seed
Write-Host "[4/4] Initializing Database and Seed Workflows..." -ForegroundColor Yellow
& "$RootDir\backend\venv\Scripts\python.exe" -c "import sys; sys.path.insert(0, '.'); from backend.app.database import init_db; from backend.app.services.seed_service import seed_database; init_db(); seed_database()"

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host " SERVICES STARTING:" -ForegroundColor Green
Write-Host " - Backend API:  http://localhost:8000 (Swagger: http://localhost:8000/docs)" -ForegroundColor White
Write-Host " - Frontend:     http://localhost:3000" -ForegroundColor White
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""

# Start Backend in separate window
Start-Process cmd -ArgumentList "/k", "cd /d `"$RootDir`" && backend\venv\Scripts\python.exe backend\run.py" -WindowStyle Normal

# Start Frontend in separate window
Start-Process cmd -ArgumentList "/k", "cd /d `"$RootDir\frontend`" && npm run dev" -WindowStyle Normal

Write-Host "Both services started in separate terminal windows!" -ForegroundColor Green
Write-Host "Open your browser at http://localhost:3000 to interact with the dashboard." -ForegroundColor Cyan
Write-Host ""
