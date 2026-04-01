# Winlab Admin

Application web interne (backoffice) du monorepo Winlab, en **React + TypeScript + Vite**.

## Structure `src/`

| Dossier | Rôle |
|--------|------|
| `app/` | `App` (routes sous garde auth), `AdminLayout` (titre, nav, déconnexion, `<Outlet />`). |
| `pages/` | Écrans : liste loteries, détail loterie. |
| `features/auth/` | Login, garde `AdminAuthGate`, `useCurrentUser`, contexte session admin. |
| `features/lotteries/` | Lecture loteries (services, table dev). |
| `lib/auth/` | `isAdminUser` + parsing allowlist emails. |
| `components/ui/` | Primitives UI réutilisables quand le besoin apparaît. |
| `lib/` | Utilitaires / clients légers partagés (`supabase.ts` : client anon centralisé). |
| `styles/` | Feuilles globales (ex. `global.css`). |
| `types/` | Types TS partagés côté admin. |

**React Router** (minimal) : `/` redirige vers `/lotteries`, détail sous `/lotteries/:lotteryId`. Pas de TanStack Query pour l’instant.

**Auth** : email + mot de passe via Supabase Auth ; accès réservé aux emails listés dans `VITE_ADMIN_EMAIL_ALLOWLIST` (virgules). Pas d’inscription depuis l’admin. Session persistée par défaut (localStorage).

## Variables d’environnement (Supabase)

1. Copier `apps/admin/.env.example` vers `apps/admin/.env`.
2. Renseigner les clés **publiques** (même projet que l’app mobile) :

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL du projet (Settings → API → Project URL). |
| `VITE_SUPABASE_ANON_KEY` | Clé **anon** « public » (Settings → API → anon public). |
| `VITE_ADMIN_EMAIL_ALLOWLIST` | Emails autorisés (séparés par des virgules, trim, casse ignorée). Vide = personne n’a accès. |

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

## Tester l’accès admin

1. Créer un utilisateur email/mot de passe dans Supabase Auth (Dashboard ou app mobile), ou réutiliser un compte existant.
2. Ajouter son email exact (ou équivalent après normalisation minuscules) dans `VITE_ADMIN_EMAIL_ALLOWLIST`.
3. `npm run dev` → écran de connexion → après succès, liste loteries ; sinon message « Accès non autorisé ».

## Suite possible

Rôles côté base, MFA, reset mot de passe : quand le flux produit le demande.
