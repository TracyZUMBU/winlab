#!/usr/bin/env bash
# Lie le dépôt au projet Supabase distant (compte Winlab).
#
# Multi-comptes : charge SUPABASE_ACCESS_TOKEN depuis scripts/.env.supabase.local
# (PAT du bon compte). Le navigateur peut rester connecté sur un autre compte.
#
# Usage : npm run supabase:link:remote

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

load_env_file "$ROOT/scripts/.env.supabase.local"

: "${SUPABASE_PROJECT_ID:=lfmkzmgxopogmuyusdde}"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Erreur : SUPABASE_ACCESS_TOKEN manquant (voir scripts/.env.supabase.example)." >&2
  exit 1
fi

if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "Erreur : SUPABASE_DB_PASSWORD manquant (voir scripts/.env.supabase.example)." >&2
  exit 1
fi

export SUPABASE_ACCESS_TOKEN
export SUPABASE_DB_PASSWORD

exec supabase link \
  --project-ref "$SUPABASE_PROJECT_ID" \
  --password "$SUPABASE_DB_PASSWORD" \
  --workdir "$ROOT"
