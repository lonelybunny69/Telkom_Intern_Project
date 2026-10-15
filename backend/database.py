from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Iterator, Sequence

PROJECT_ROOT = Path(__file__).resolve().parents[1]
# Allow DB_PATH env var override for Railway Volume persistence
DB_PATH = Path(os.getenv("DB_PATH", str(PROJECT_ROOT / "revenue_workspace.db")))
DB_NAME = str(DB_PATH)

TRANSACTION_COLUMNS = (
    "tahun",
    "bulan",
    "tanggal",
    "perusahaan",
    "jenis_transaksi",
    "pengujian_stel",
    "laboratorium",
    "keterangan",
    "nominal_revenue",
    "ppn",
    "pph23",
    "kategori_utama",
    "unit_org",
    "kategori_uji",
    "domain_lab",
    "status_lost",
    "nominal_lost",
)

TRANSACTIONS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tahun INTEGER NOT NULL,
    bulan TEXT NOT NULL,
    tanggal TEXT NOT NULL DEFAULT '',
    perusahaan TEXT NOT NULL,
    jenis_transaksi TEXT NOT NULL DEFAULT '',
    pengujian_stel TEXT NOT NULL DEFAULT '',
    laboratorium TEXT NOT NULL DEFAULT '',
    keterangan TEXT NOT NULL DEFAULT '',
    nominal_revenue REAL NOT NULL DEFAULT 0,
    ppn REAL NOT NULL DEFAULT 0,
    pph23 REAL NOT NULL DEFAULT 0,
    kategori_utama TEXT NOT NULL DEFAULT '',
    unit_org TEXT NOT NULL DEFAULT '',
    kategori_uji TEXT NOT NULL DEFAULT '',
    domain_lab TEXT NOT NULL DEFAULT '',
    status_lost TEXT NOT NULL DEFAULT 'No Loss Identified',
    nominal_lost REAL NOT NULL DEFAULT 0
)
"""

INDEX_STATEMENTS = (
    "CREATE INDEX IF NOT EXISTS idx_transactions_year_month ON transactions(tahun, bulan)",
    "CREATE INDEX IF NOT EXISTS idx_transactions_company ON transactions(perusahaan)",
    "CREATE INDEX IF NOT EXISTS idx_transactions_domain ON transactions(domain_lab)",
    "CREATE INDEX IF NOT EXISTS idx_transactions_status_lost ON transactions(status_lost)",
)

IMPORTS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS imported_workbooks (
    sha256 TEXT PRIMARY KEY,
    source_name TEXT NOT NULL,
    records_imported INTEGER NOT NULL,
    imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
"""


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH, timeout=30)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 30000")
    return connection


@contextmanager
def database_session() -> Iterator[sqlite3.Connection]:
    connection = get_connection()
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def init_db() -> None:
    with database_session() as connection:
        connection.execute(TRANSACTIONS_TABLE_SQL)
        connection.execute(IMPORTS_TABLE_SQL)
        for statement in INDEX_STATEMENTS:
            connection.execute(statement)
        connection.execute("PRAGMA user_version = 1")


def backup_database() -> Path | None:
    """Create a transactionally consistent SQLite backup."""
    if not DB_PATH.exists() or DB_PATH.stat().st_size == 0:
        return None
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    backup_path = DB_PATH.with_name(f"{DB_PATH.stem}.backup_{timestamp}{DB_PATH.suffix}")
    source = sqlite3.connect(DB_PATH, timeout=30)
    destination = sqlite3.connect(backup_path)
    try:
        source.backup(destination)
    finally:
        destination.close()
        source.close()
    return backup_path


def workbook_was_imported(source_hash: str) -> bool:
    with database_session() as connection:
        return connection.execute(
            "SELECT 1 FROM imported_workbooks WHERE sha256 = ?", (source_hash,)
        ).fetchone() is not None


class DuplicateWorkbookError(ValueError):
    pass


def insert_transactions(
    rows: Sequence[tuple[object, ...]],
    *,
    source_hash: str | None = None,
    source_name: str = "uploaded workbook",
) -> int:
    if not rows:
        return 0
    columns_sql = ", ".join(f'"{column}"' for column in TRANSACTION_COLUMNS)
    placeholders = ", ".join("?" for _ in TRANSACTION_COLUMNS)
    with database_session() as connection:
        connection.execute("BEGIN IMMEDIATE")
        if source_hash and connection.execute(
            "SELECT 1 FROM imported_workbooks WHERE sha256 = ?", (source_hash,)
        ).fetchone():
            raise DuplicateWorkbookError(f"Workbook '{source_name}' was already imported.")
        cursor = connection.executemany(
            f"INSERT INTO transactions ({columns_sql}) VALUES ({placeholders})",
            rows,
        )
        if source_hash:
            connection.execute(
                "INSERT INTO imported_workbooks (sha256, source_name, records_imported) VALUES (?, ?, ?)",
                (source_hash, source_name, len(rows)),
            )
        return cursor.rowcount


def replace_transactions(
    rows: Sequence[tuple[object, ...]],
    *,
    source_hash: str | None = None,
    source_name: str = "core workbook",
    make_backup: bool = False,
) -> tuple[int, Path | None]:
    """Atomically replace transaction rows and record source identity."""
    if not rows:
        raise ValueError("Refusing to replace the database with an empty workbook.")

    columns_sql = ", ".join(f'"{column}"' for column in TRANSACTION_COLUMNS)
    placeholders = ", ".join("?" for _ in TRANSACTION_COLUMNS)
    staging_table_sql = TRANSACTIONS_TABLE_SQL.replace("transactions", "transactions_staging", 1)
    backup_path: Path | None = None
    with database_session() as connection:
        connection.execute("BEGIN IMMEDIATE")
        if source_hash and connection.execute(
            "SELECT 1 FROM imported_workbooks WHERE sha256 = ?", (source_hash,)
        ).fetchone():
            raise DuplicateWorkbookError(f"Workbook '{source_name}' was already imported.")
        if make_backup:
            # Hold the SQLite write reservation while taking the snapshot so concurrent API writes cannot be lost.
            backup_path = backup_database()
        connection.execute("DROP TABLE IF EXISTS transactions_staging")
        connection.execute(staging_table_sql)
        connection.executemany(
            f"INSERT INTO transactions_staging ({columns_sql}) VALUES ({placeholders})",
            rows,
        )
        staged_count = connection.execute("SELECT COUNT(*) FROM transactions_staging").fetchone()[0]
        if staged_count != len(rows):
            raise RuntimeError(f"Expected {len(rows)} staged rows, found {staged_count}.")

        connection.execute("DROP TABLE transactions")
        connection.execute("ALTER TABLE transactions_staging RENAME TO transactions")
        for statement in INDEX_STATEMENTS:
            connection.execute(statement)
        if source_hash:
            connection.execute(
                "INSERT INTO imported_workbooks (sha256, source_name, records_imported) VALUES (?, ?, ?)",
                (source_hash, source_name, len(rows)),
            )
        connection.execute("PRAGMA user_version = 1")
    return len(rows), backup_path
