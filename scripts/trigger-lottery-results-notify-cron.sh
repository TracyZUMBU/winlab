#!/usr/bin/env bash
# Déclenche manuellement l’Edge Function lottery-results-notify-cron
# (équivalent au job pg_cron, utile en dev / debug).
#
# Prérequis :
#   - apps/mobile/.env : EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
#   - LOTTERY_RESULTS_NOTIFY_CRON_SECRET : même valeur que le secret Edge
#     (export dans le shell, ou scripts/.env.lottery-cron.local — gitignored)
#
# Usage :
#   npm run lottery:notify-cron
#   # ou
#   bash scripts/trigger-lottery-results-notify-cron.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

load_env_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  set -a
  # shellcheck disable=SC1090
  source "$file"
  set +a
}

MOBILE_ENV="$ROOT/apps/mobile/.env"
if [[ -f "$MOBILE_ENV" ]]; then
  set -a
  # shellcheck disable=SC1090
  source <(
    grep -E '^(EXPO_PUBLIC_SUPABASE_URL|EXPO_PUBLIC_SUPABASE_ANON_KEY)=' "$MOBILE_ENV" \
      | sed 's/^[[:space:]]*//'
  )
  set +a
fi

load_env_file "$ROOT/scripts/.env.lottery-cron.local"

SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-}"
ANON_KEY="${EXPO_PUBLIC_SUPABASE_ANON_KEY:-}"
CRON_SECRET="${LOTTERY_RESULTS_NOTIFY_CRON_SECRET:-}"

if [[ -z "$SUPABASE_URL" || -z "$ANON_KEY" ]]; then
  echo "Erreur : EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY requis (apps/mobile/.env)." >&2
  exit 1
fi

if [[ -z "$CRON_SECRET" ]]; then
  cat >&2 <<'EOF'
Erreur : LOTTERY_RESULTS_NOTIFY_CRON_SECRET manquant.

  export LOTTERY_RESULTS_NOTIFY_CRON_SECRET='<valeur du secret Edge Functions>'
  # ou créer scripts/.env.lottery-cron.local (voir scripts/.env.lottery-cron.example)
EOF
  exit 1
fi

FUNCTION_URL="${SUPABASE_URL%/}/functions/v1/lottery-results-notify-cron"

curl -i -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "X-Winlab-Cron-Secret: ${CRON_SECRET}" \
  -d '{}'
