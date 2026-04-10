# Winlab Admin

Application web interne (backoffice) du monorepo Winlab, en **React + TypeScript + Vite**.

## Structure `src/`

| Dossier | Rôle |
|--------|------|
| `app/` | `App` (routes sous garde auth), `AdminLayout` (titre, nav, déconnexion, `<Outlet />`). |
| `features/auth/` | Sous-dossiers : `components/` (`AdminAuthGate`), `context/`, `hooks/`, `pages/` (login, accès refusé), `services/` (allowlist, lecture `is_admin`). Point d’entrée `index.ts`. |
| `features/lotteries/` | `pages/` (liste, détail), `components/`, `services/`, `types/`, `index.ts`. |
| `components/ui/` | Primitives UI réutilisables quand le besoin apparaît. |
| `lib/` | Utilitaires / clients légers partagés (`supabase.ts` : client anon centralisé). |
| `styles/` | Feuilles globales (ex. `global.css`). |
| `types/` | Types TS partagés côté admin. |

**React Router** (minimal) : `/` redirige vers `/lotteries`, détail sous `/lotteries/:lotteryId`. Pas de TanStack Query pour l’instant.

**Auth** : email + mot de passe via Supabase Auth. **Données (autorité serveur)** : les vues `admin_*` sont protégées par RLS qui ne laisse lire les lignes que si `public.is_admin(auth.uid())` est vrai, c’est-à-dire si `profiles.is_admin = true` pour l’utilisateur connecté — **c’est la règle opposable pour l’accès aux données**, pas l’allowlist. **Interface (transition)** : après connexion, l’entrée dans le backoffice est autorisée si `profiles.is_admin` est vrai **ou** si l’email figure dans `VITE_ADMIN_EMAIL_ALLOWLIST` : combinaison **OR** (pas **AND**) entre le flag profil et l’allowlist ; l’allowlist est **un repli côté UI uniquement** et **ne remplace pas** l’application des politiques en base (un compte autorisé uniquement par l’allowlist sans `is_admin` n’obtient pas les données `admin_*`). Promouvoir un compte : `supabase/scripts/promote_admin_by_email.sql`. Pas d’inscription depuis l’admin. Session persistée par défaut (localStorage).

## Variables d’environnement (Supabase)

1. Copier `apps/admin/.env.example` vers `apps/admin/.env`.
2. Renseigner les clés **publiques** (même projet que l’app mobile) :

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL du projet (Settings → API → Project URL). |
| `VITE_SUPABASE_ANON_KEY` | Clé **anon** « public » (Settings → API → anon public). |
| `VITE_ADMIN_EMAIL_ALLOWLIST` | Repli **optionnel** de transition : emails autorisés à **ouvrir l’UI** lorsque `profiles.is_admin` n’est pas encore positionné (virgules, trim, casse ignorée). **OR** avec `is_admin` pour l’accès au shell ; **ne contourne pas** RLS sur les vues `admin_*`. Vide → ce repli n’autorise personne (les comptes avec `is_admin = true` restent autorisés). |

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
2. Lui donner le droit **données + UI** : exécuter `supabase/scripts/promote_admin_by_email.sql` (ou mettre `profiles.is_admin = true` avec les mêmes garde-fous). **Alternative de transition** : ajouter son email dans `VITE_ADMIN_EMAIL_ALLOWLIST` pour débloquer **seulement** le shell si `is_admin` n’est pas encore là (les listes / détails `admin_*` resteront vides tant que le flag n’est pas posé côté base).
3. `npm run dev` → écran de connexion → après succès, liste loteries si `is_admin` est effectif ; sinon message « Accès non autorisé » (ou UI sans données si seul l’allowlist s’applique).

## Suite possible

Rôles côté base, MFA, reset mot de passe : quand le flux produit le demande.
