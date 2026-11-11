import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.config import settings

# SQLite connection args if using sqlite
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI Dependency for database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes all tables in the database and runs lightweight migrations."""
    import backend.app.models  # Ensure all models are imported
    Base.metadata.create_all(bind=engine)

    # SQLite migration for newly added columns if table already existed
    if settings.DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            try:
                # Users table migration
                columns_result = conn.execute(text("PRAGMA table_info(users)"))
                existing_cols = [row[1] for row in columns_result.fetchall()]

                if "imap_server" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN imap_server VARCHAR(255) DEFAULT 'imap.gmail.com'"))
                if "imap_port" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN imap_port INTEGER DEFAULT 993"))
                if "imap_password" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN imap_password VARCHAR(255)"))

                # Tasks table migration
                task_cols_result = conn.execute(text("PRAGMA table_info(tasks)"))
                existing_task_cols = [row[1] for row in task_cols_result.fetchall()]

                if "priority_reason" not in existing_task_cols:
                    conn.execute(text("ALTER TABLE tasks ADD COLUMN priority_reason VARCHAR(255)"))
                if "estimated_hours" not in existing_task_cols:
                    conn.execute(text("ALTER TABLE tasks ADD COLUMN estimated_hours VARCHAR(50)"))
                if "subtasks" not in existing_task_cols:
                    conn.execute(text("ALTER TABLE tasks ADD COLUMN subtasks JSON DEFAULT '[]'"))

                conn.commit()
            except Exception as e:
                print(f"[Database] Migration note: {e}")


def recreate_all_tables():
    """Drops and recreates all database tables cleanly."""
    import backend.app.models
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[Database] Successfully recreated all clean tables.")

