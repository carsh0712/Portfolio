"""
Reset the server database from the repository-level scripts directory.

Usage from the repository root:
    python scripts/reset_db.py
"""

from pathlib import Path
import os
import sys


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
SERVER_DIR = REPO_ROOT / "portfolio_project_server_flask"
SQL_FILE = SCRIPT_DIR / "seed_data.sql"

if not SERVER_DIR.exists():
    raise RuntimeError(f"Server directory not found: {SERVER_DIR}")

sys.path.insert(0, str(SERVER_DIR))
os.chdir(SERVER_DIR)

from sqlalchemy import text  # noqa: E402
from core.config import ENV  # noqa: E402
from database import Base, MYSQL_DB, engine  # noqa: E402

# Import models so Base.metadata knows every table.
import models  # noqa: E402,F401


def _read_seed_statements() -> list[str]:
    with SQL_FILE.open("r", encoding="utf-8") as f:
        sql_content = f.read()

    statements = []
    for stmt in sql_content.split(";"):
        cleaned = stmt.strip()
        lines = [
            line for line in cleaned.splitlines()
            if not line.strip().startswith("--")
        ]
        cleaned = "\n".join(lines).strip()
        if cleaned:
            statements.append(cleaned)
    return statements


def reset_db() -> None:
    print("=" * 50)
    print(f"  Reset database [{ENV}]")
    print("=" * 50)

    print("\n[1/4] Updating database charset...")
    with engine.connect() as conn:
        conn.execute(text(
            f"ALTER DATABASE `{MYSQL_DB}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        ))
        conn.commit()
    print("       Done")

    print("[2/4] Dropping existing tables...")
    with engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        conn.commit()
    Base.metadata.drop_all(bind=engine)
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS portfolio_item_detail"))
        conn.execute(text("DROP TABLE IF EXISTS portfolio_item"))
        conn.execute(text("DROP TABLE IF EXISTS portfolio_category"))
        conn.execute(text("DROP TABLE IF EXISTS category"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))
        conn.commit()
    print("       Done")

    print("[3/4] Recreating tables...")
    Base.metadata.create_all(bind=engine)
    print("       Done")

    print("[4/4] Loading seed data...")
    statements = _read_seed_statements()
    with engine.connect() as conn:
        for stmt in statements:
            conn.execute(text(stmt))
        conn.commit()

    print(f"       Done ({len(statements)} statements)")
    print("\n" + "=" * 50)
    print("  Reset complete! (admin / admin123)")
    print("=" * 50)


if __name__ == "__main__":
    reset_db()
