"""Reset the database contents while keeping the tables intact."""

from __future__ import annotations

import os
import sqlite3
from urllib.parse import urlparse


def _get_sqlite_path(database_url: str) -> str:
    """Extract the local SQLite file path from a DATABASE_URL."""
    parsed = urlparse(database_url)
    if parsed.scheme != "sqlite":
        raise ValueError("reset_database.py only supports SQLite DATABASE_URL values")

    if parsed.path in {"", "/", "."}:
        return "industrial_news.db"

    if parsed.path.startswith("/"):
        return parsed.path.lstrip("/")

    return parsed.path


def reset_database() -> None:
    """Delete all rows from every user table in the SQLite database."""
    database_url = os.getenv("DATABASE_URL", "sqlite:///./industrial_news.db")
    database_path = _get_sqlite_path(database_url)

    if not os.path.exists(database_path):
        print(f"[WARN] Database file not found: {database_path}")
        print("[INFO] Nothing to clear.")
        return

    connection = sqlite3.connect(database_path)
    try:
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys = OFF;")

        tables = cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
        ).fetchall()

        print(f"[RESET] Clearing {len(tables)} tables in {database_path}...")
        for (table_name,) in tables:
            cursor.execute(f'DELETE FROM "{table_name}";')

        sequence_table = cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='sqlite_sequence';"
        ).fetchone()
        if sequence_table:
            cursor.execute("DELETE FROM sqlite_sequence;")
        connection.commit()
        print("[OK] Database contents cleared. Tables were kept intact.")
    finally:
        connection.close()


if __name__ == "__main__":
    reset_database()