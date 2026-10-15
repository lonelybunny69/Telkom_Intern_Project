from __future__ import annotations

import argparse
from pathlib import Path

try:
    from .data_pipeline import DEFAULT_WORKBOOK, import_workbook
except ImportError:  # Supports running `python backend/seed_data.py` from the repo root.
    from data_pipeline import DEFAULT_WORKBOOK, import_workbook


def seed_from_excel(workbook_path: Path = DEFAULT_WORKBOOK) -> int:
    imported_count, backup_path = import_workbook(workbook_path)
    if backup_path:
        print(f"Database backup created: {backup_path}")
    print(f"Replaced the live transaction data with {imported_count} workbook records.")
    return imported_count


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Replace live SQLite transaction data from the core workbook.")
    parser.add_argument("--workbook", type=Path, default=DEFAULT_WORKBOOK, help="Path to the Database_Core workbook.")
    args = parser.parse_args()
    seed_from_excel(args.workbook)
