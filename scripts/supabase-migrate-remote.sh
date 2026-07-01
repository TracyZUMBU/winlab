#!/usr/bin/env bash
# Applique les migrations sur le projet Supabase distant lié.
#
# Multi-comptes : charge SUPABASE_ACCESS_TOKEN depuis scripts/.env.supabase.local
# (PAT du bon compte). Le navigateur peut rester connecté sur un autre compte.
#
# Prérequis :
#   1. Copier scripts/.env.supabase.example → scripts/.env.supabase.local
#   2. Renseigner SUPABASE_ACCESS_TOKEN (PAT sbp_...) et SUPABASE_DB_PASSWORD
#   3. Une fois : npm run supabase:link:remote
#
# Usage : npm run migrate:remote

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

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Erreur : SUPABASE_ACCESS_TOKEN manquant." >&2
  echo "Copiez scripts/.env.supabase.example vers scripts/.env.supabase.local" >&2
  echo "et renseignez le PAT (sbp_...) du compte Supabase qui possède ce projet." >&2
  exit 1
fi

if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "Erreur : SUPABASE_DB_PASSWORD manquant." >&2
  echo "Renseignez le mot de passe Postgres dans scripts/.env.supabase.local" >&2
  echo "(Dashboard → Settings → Database)." >&2
  exit 1
fi

export SUPABASE_ACCESS_TOKEN
export SUPABASE_DB_PASSWORD

exec supabase migration up --linked --include-all --workdir "$ROOT"
