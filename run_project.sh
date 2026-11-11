#!/bin/bash
set -e

echo "==============================================================================="
echo "      EMAIL-TO-WORKFLOW AI AGENT & TASK ORCHESTRATOR"
echo "      Batch-05 | LangGraph + Multi-LLM + HITL Safety System"
echo "==============================================================================="
echo ""

# Navigate to script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# 1. Virtual Environment Setup
if [ ! -d "backend/venv" ]; then
    echo "[1/4] Creating Python virtual environment in backend/venv..."
    python3 -m venv backend/venv
fi

echo "[2/4] Installing Python requirements..."
backend/venv/bin/pip install -q -r backend/requirements.txt

echo "[3/4] Installing Frontend npm packages..."
if [ ! -d "frontend/node_modules" ]; then
    (cd frontend && npm install)
fi

echo "[4/4] Initializing Database & Seed Workflows..."
backend/venv/bin/python -c "import sys; sys.path.insert(0, '.'); from backend.app.database import init_db; from backend.app.seed_data import seed_database; init_db(); seed_database()"

echo ""
echo "==============================================================================="
echo " SERVICES STARTING:"
echo " - Backend API:  http://localhost:8000 (Docs: http://localhost:8000/docs)"
echo " - Frontend:     http://localhost:3000"
echo "==============================================================================="
echo ""

# Trap Ctrl+C to kill background processes on exit
trap 'kill $(jobs -p)' EXIT

# Launch backend in background
backend/venv/bin/python backend/run.py &
BACKEND_PID=$!

# Launch frontend
(cd frontend && npm run dev) &
FRONTEND_PID=$!

wait
