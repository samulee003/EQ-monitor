#!/usr/bin/env bash
# 檢查 InsForge PostgreSQL 是否啟用 pg_cron / pg_net extension
# 用法：
#   DATABASE_URL=postgresql://... bash server/scripts/check-pg-cron.sh
# 或：
#   bash server/scripts/check-pg-cron.sh "$DATABASE_URL"

set -euo pipefail

DB_URL="${1:-${DATABASE_URL:-}}"
if [[ -z "${DB_URL}" ]]; then
  echo "[ERR] 請提供 DATABASE_URL 參數或環境變數" >&2
  exit 2
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "[ERR] 未找到 psql。請先安裝 PostgreSQL client（brew install libpq）" >&2
  exit 2
fi

echo "[INFO] 連線檢查 pg_cron / pg_net..."
RESULT=$(psql "${DB_URL}" -At -c "select extname from pg_extension where extname in ('pg_cron','pg_net') order by extname;")

HAS_CRON=0
HAS_NET=0
while IFS= read -r line; do
  case "$line" in
    pg_cron) HAS_CRON=1 ;;
    pg_net)  HAS_NET=1 ;;
  esac
done <<< "$RESULT"

if [[ $HAS_CRON -eq 1 ]]; then
  echo "[OK]  pg_cron 已啟用"
else
  echo "[MISS] pg_cron 未啟用 — 以 superuser 執行：create extension if not exists pg_cron;"
fi

if [[ $HAS_NET -eq 1 ]]; then
  echo "[OK]  pg_net 已啟用"
else
  echo "[MISS] pg_net 未啟用 — 以 superuser 執行：create extension if not exists pg_net;"
fi

if [[ $HAS_CRON -eq 1 ]]; then
  echo ""
  echo "[INFO] 既有 cron.job："
  psql "${DB_URL}" -c "select jobid, jobname, schedule, active from cron.job order by jobname;" || true
fi

if [[ $HAS_CRON -ne 1 || $HAS_NET -ne 1 ]]; then
  echo ""
  echo "[HINT] InsForge 雲端託管若不允許安裝 extension，請改用 GitHub Actions 備援："
  echo "       .github/workflows/cron-fallback.yml"
  exit 1
fi

echo ""
echo "[DONE] pg_cron / pg_net 就緒，可執行：psql \"\$DATABASE_URL\" \\"
echo "       -v insforge_base_url=https://b88egxiz.ap-southeast.insforge.app \\"
echo "       -v service_role_key=... \\"
echo "       -f server/insforge/schedules/000_install.sql"
