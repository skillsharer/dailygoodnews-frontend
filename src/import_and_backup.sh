#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/ubuntu/git/dailygoodnews-frontend"
PYTHON="$APP_DIR/.venv/bin/python"

DATA_DIR="${DAILYGOODNEWS_DATA_DIR:-/var/lib/dailygoodnews}"
DB_PATH="$DATA_DIR/news.db"
BACKUP_DIR="$DATA_DIR/backups"
LATEST_BACKUP="$BACKUP_DIR/news-latest.db"
LATEST_TMP="$BACKUP_DIR/news-latest.db.tmp"

LOG_DIR="$APP_DIR/logs"

mkdir -p "$DATA_DIR"
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

cd "$APP_DIR"

echo "========================================"
echo "Daily Good News EC2 import started at $(date)"
echo "APP_DIR=$APP_DIR"
echo "DATA_DIR=$DATA_DIR"
echo "DB_PATH=$DB_PATH"
echo "========================================"

echo "Importing JSON files into SQLite..."
"$PYTHON" -m src.importer

echo "Creating rolling SQLite backup..."

export DB_PATH
export LATEST_BACKUP
export LATEST_TMP

"$PYTHON" - <<'PY'
import os
import sqlite3
from pathlib import Path

db_path = Path(os.environ["DB_PATH"])
latest_backup = Path(os.environ["LATEST_BACKUP"])
latest_tmp = Path(os.environ["LATEST_TMP"])

latest_backup.parent.mkdir(parents=True, exist_ok=True)

if not db_path.exists():
    print(f"Database does not exist yet, skipping backup: {db_path}")
    raise SystemExit(0)

# Remove stale temp file if previous run died.
latest_tmp.unlink(missing_ok=True)

# Safe SQLite backup while Flask/Gunicorn may be reading the DB.
source = sqlite3.connect(db_path)
target = sqlite3.connect(latest_tmp)

with target:
    source.backup(target)

target.close()
source.close()

# Atomic overwrite.
latest_tmp.replace(latest_backup)

print(f"Rolling backup updated: {latest_backup}")
PY

echo "Import and rolling backup completed at $(date)"