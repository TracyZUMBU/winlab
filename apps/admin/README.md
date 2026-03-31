# Winlab Admin

Application web interne (backoffice) du monorepo Winlab, en **React + TypeScript + Vite**.

## Structure `src/`

| Dossier | Rôle |
|--------|------|
| `app/` | `App` (déclaration des routes), `AdminLayout` (titre, nav, `<Outlet />`). |
| `pages/` | Écrans : liste loteries, détail loterie (`LotteryDetailPage` placeholder). |
| `features/lotteries/` | Code métier loteries à faire grossir (sans mélanger avec les pages). |
| `components/ui/` | Primitives UI réutilisables quand le besoin apparaît. |
| `lib/` | Utilitaires / clients légers partagés (`supabase.ts` : client anon centralisé). |
| `styles/` | Feuilles globales (ex. `global.css`). |
| `types/` | Types TS partagés côté admin. |

**React Router** (minimal) : `/` redirige vers `/lotteries`, détail sous `/lotteries/:lotteryId`. Pas de TanStack Query pour l’instant.

## Variables d’environnement (Supabase)

1. Copier `apps/admin/.env.example` vers `apps/admin/.env`.
2. Renseigner les clés **publiques** (même projet que l’app mobile) :

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL du projet (Settings → API → Project URL). |
| `VITE_SUPABASE_ANON_KEY` | Clé **anon** « public » (Settings → API → anon public). |

**Ne pas** mettre la `service_role` ni d’autres secrets dans le front : uniquement ce que le dashboard expose comme clé anon compatible client.

Usage dans le code : par exemple `import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase"` (ajuster le chemin relatif selon le fichier).

## Commandes

Depuis ce dossier :

```bash
npm install
npm run dev
```

Depuis la **racine du monorepo** :

```bash
npm run admin:dev
npm run admin:build
npm run admin:preview
```

## Suite possible

Auth dédiée admin, données détail loterie, filtres liste : quand le flux produit le demande.
