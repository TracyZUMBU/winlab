# Winlab Admin

Application web interne (backoffice) du monorepo Winlab, en **React + TypeScript + Vite**.

## Structure `src/`

| Dossier | Rôle |
|--------|------|
| `app/` | `App` (routes sous garde auth), `AdminLayout` (titre, nav, déconnexion, `<Outlet />`). |
| `features/auth/` | `components/` (`AdminAuthGate`), `context/`, `hooks/`, `queries/`, `pages/` (login, accès refusé), `services/` (lecture `profiles.is_admin`). Point d’entrée `index.ts`. |
| `features/lotteries/` | `pages/`, `components/`, `services/` (appels RPC `admin_get_*`), `queries/`, `types/`, `index.ts`. |
| `components/ui/` | Primitives UI réutilisables quand le besoin apparaît. |
| `lib/` | Client Supabase, React Query, utilitaires. |
| `styles/` | Feuilles globales (ex. `global.css`). |
| `types/` | Types TS partagés côté admin. |

**React Router** : `/` redirige vers `/lotteries`, détail sous `/lotteries/:lotteryId`.

**Auth** : email + mot de passe via Supabase Auth. **Accès au backoffice** : uniquement si `profiles.is_admin = true` pour l’utilisateur connecté (lu via le client anon, RLS sur `profiles`). **Données loteries** : lectures via les RPC `admin_get_lotteries` et `admin_get_lottery_detail` (garde admin en base, pas les vues SQL legacy). Promouvoir un compte : `supabase/scripts/promote_admin_by_email.sql`. Pas d’inscription depuis l’admin. Session persistée par défaut (localStorage).

## Variables d’environnement (Supabase)

1. Copier `apps/admin/.env.example` vers `apps/admin/.env`.
2. Renseigner les clés **publiques** (même projet que l’app mobile) :

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL du projet (Settings → API → Project URL). |
| `VITE_SUPABASE_ANON_KEY` | Clé **anon** « public » (Settings → API → anon public). |

**Ne pas** mettre la `service_role` ni d’autres secrets dans le front.

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

## Tester l’accès admin

1. Créer un utilisateur email/mot de passe dans Supabase Auth (Dashboard ou app mobile), ou réutiliser un compte existant.
2. Lui donner le droit admin : exécuter `supabase/scripts/promote_admin_by_email.sql` (ou `UPDATE public.profiles SET is_admin = true WHERE …` avec une session postgres / service_role conforme aux triggers).
3. `npm run dev` → connexion → si `is_admin` est vrai, liste et détail loteries via RPC ; sinon écran « Accès non autorisé ».

## Suite possible

MFA, reset mot de passe : quand le flux produit le demande.
