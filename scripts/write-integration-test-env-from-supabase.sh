#!/usr/bin/env bash
# Aligne les apps Jest sur les clés de `supabase status` (même logique que
# `.github/workflows/supabase-integration.yml`). À lancer depuis la racine du repo
# après `npm run supabase:test:prepare` (ou stack locale déjà prête).

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

supabase status -o env --workdir . \
  | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=' \
  | sed -e 's/^API_URL=/SUPABASE_URL=/' \
        -e 's/^ANON_KEY=/SUPABASE_ANON_KEY=/' \
        -e 's/^SERVICE_ROLE_KEY=/SUPABASE_SERVICE_ROLE_KEY=/' \
        -e 's/^\([^=]*\)="\(.*\)"$/\1=\2/' \
  > apps/mobile/.env.test.local

cp apps/mobile/.env.test.local apps/admin/.env.test.local

test "$(wc -l < apps/mobile/.env.test.local | tr -d ' ')" -eq 3
grep -Eq '^SUPABASE_ANON_KEY=.+' apps/mobile/.env.test.local
grep -Eq '^SUPABASE_SERVICE_ROLE_KEY=.+' apps/mobile/.env.test.local
grep -Eq '^SUPABASE_URL=http://(127\.0\.0\.1|localhost):54321$' apps/mobile/.env.test.local
