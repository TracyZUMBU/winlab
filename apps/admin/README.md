# Winlab Admin

Application web interne (backoffice) du monorepo Winlab, en **React + TypeScript + Vite**.

## Structure `src/`

| Dossier | Rôle |
|--------|------|
| `app/` | `App` (routes sous garde auth), `AdminLayout` (titre, nav, déconnexion, `<Outlet />`). |
| `features/auth/` | `components/` (`AdminAuthGate`), `context/`, `hooks/`, `queries/`, `pages/` (login, accès refusé), `services/` (lecture `profiles.is_admin`). Point d’entrée `index.ts`. |
| `features/lotteries/` | `pages/`, `components/`, `services/` (appels RPC `admin_get_*`), `queries/`, `types/`, `index.ts`. |
| `features/missions/` | Liste + panneau détail (`?detail=`), `services/` (`admin_get_missions`, `admin_get_missions_count`, `admin_get_mission_detail`), `queries/`, `hooks/`, `types/`, `index.ts`. |
| `components/ui/` | Primitives UI réutilisables quand le besoin apparaît. |
| `lib/` | Client Supabase, React Query, utilitaires. |
| `styles/` | Feuilles globales (ex. `global.css`). |
| `types/` | Types TS partagés côté admin. |

**React Router** : `/` redirige vers `/lotteries`. **Loteries** : `/lotteries`, détail panneau via `?detail=` ; `/lotteries/:lotteryId` redirige vers ce paramètre. **Missions** : `/missions` (liste + panneau `?detail=` ) ; `/missions/:missionId` redirige vers `?detail=` (comme les loteries).

**Auth** : email + mot de passe via Supabase Auth. **Accès au backoffice** : uniquement si `profiles.is_admin = true` pour l’utilisateur connecté (lu via le client anon, RLS sur `profiles`). Sans session → écran de connexion ; connecté sans `is_admin` → « Accès non autorisé » ; config Supabase manquante → message dédié (`AdminAuthGate`).

**Données loteries** : lectures via les RPC `admin_get_lotteries` et `admin_get_lottery_detail` (garde `is_admin` en base, pas les vues SQL legacy).

**Données missions (V1 lecture)** : lectures métier **uniquement** via les RPC `admin_get_missions`, `admin_get_missions_count` et `admin_get_mission_detail` (même garde admin). Les composants UI n’appellent pas Supabase directement. **Exception** : le filtre « marque » sur la liste charge les **noms** des marques actives via `SELECT` sur `public.brands` (RLS `authenticated`, `is_active = true`) — pas de lecture des missions hors RPC.

**Missions — périmètre V1** : liste paginée (filtres / tri), détail avec agrégats de complétions et liste des utilisateurs ayant au moins une complétion (`user_id` + `username`). Pas d’exposition de `missions.metadata` ni de `mission_completions.proof_data` côté RPC.

**Missions — reporté (V2+)** : liste paginée des lignes `mission_completions`, édition / mutations de mission, fiche utilisateur dédiée, affichage `metadata` / `proof_data` si le produit le demande.

Promouvoir un compte : `supabase/scripts/promote_admin_by_email.sql`. Pas d’inscription depuis l’admin. Session persistée par défaut (localStorage).

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
3. `npm run dev` → connexion → si `is_admin` est vrai, listes / détails loteries et missions via RPC ; sinon écran « Accès non autorisé ». Pour les missions : tester filtres, pagination, tri, lien « Voir le détail » (panneau) ; un non-admin reçoit les codes d’erreur normalisés côté services si une RPC est appelée (en pratique la garde `AdminAuthGate` bloque avant).

## Suite possible

MFA, reset mot de passe : quand le flux produit le demande.
