"""
Seed Data Script - Backward Compatibility Hook.
"""

from backend.app.services.seed_service import seed_database

if __name__ == "__main__":
    seed_database()
