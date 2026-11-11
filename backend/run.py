"""
Backend runner script for local development.
"""

import sys
import os
from pathlib import Path

# Add project root directory to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import uvicorn
from backend.app.database import init_db
from backend.app.seed_data import seed_database

if __name__ == "__main__":
    print("Initializing Database tables & seed records...")
    init_db()
    seed_database()
    print("Starting Uvicorn Server on http://0.0.0.0:8000 ...")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
