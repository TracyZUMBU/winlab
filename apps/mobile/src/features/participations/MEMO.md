# Mémo — Feature Participations (mobile)

**Dernière revue du mémo :** 2026-07-20

## Objectif

Lister **toutes les loteries** auxquelles l’utilisateur connecté a participé (au moins un ticket, tous statuts de ticket), avec pagination, et permettre d’ouvrir la fiche loterie ou la page résultat selon le statut.

## Périmètre

- **Inclus :** écran liste `/participations`, RPC `get_user_participations`, service + hook infinite query, navigation depuis Profil (« Mes participations »).
- **Hors scope :** realtime, filtres (en cours / terminées), modification Wallet « Mes tickets », refonte de `/results`.

## Navigation (Expo Router)

| Route | Fichier |
|--------|---------|
| Liste | `apps/mobile/app/(app)/participations/index.tsx` → `ParticipationsListScreen` |
| Layout stack | `apps/mobile/app/(app)/participations/_layout.tsx` (titre i18n `participations.layout.listTitle`) |

Enregistrement stack parent : `apps/mobile/app/(app)/_layout.tsx` (`participations`).

Entrées Profil (`ProfileScreen`) :

- **Mes participations** → `/participations`
- **Mes résultats** → `/results` (liste des loteries tirées ; inchangée côté feature results)

Au clic sur une ligne :

- `status === "drawn"` → `/results/:lotteryId`
- sinon (active, cancelled, closed, …) → `/lotteries/:lotteryId`

## Cartographie code (`src/features/participations`)

| Rôle | Fichiers principaux |
|------|---------------------|
| **Types** | `types/userParticipation.ts` |
| **Clés TanStack Query** | `queries/participationKeys.ts` — `all`, `lists()`, `list(userId)`, `anonymous()` |
| **Query options** | `queries/userParticipationsQuery.ts` → `userParticipationsInfiniteOptions(userId)` |
| **Service** | `services/getUserParticipationsPage.ts` → RPC `get_user_participations` |
| **Parser RPC** | `services/parseUserParticipationRpcRow.ts` |
| **Hook** | `hooks/useUserParticipationsQuery.ts` (session + `select` UI) |
| **UI** | `components/ParticipationListRow.tsx`, `screens/ParticipationsListScreen.tsx` |

**Règle d’archi :** pas d’appel Supabase depuis les écrans ; services → hooks → UI.

## Backend (Supabase)

| Élément | Emplacement |
|---------|-------------|
| Schema canonique | `supabase/schemas/functions/get_user_participations.sql` |
| Migration | `supabase/migrations/20260720140000_get_user_participations.sql` |
| Contrat | `p_limit` (1–100), `p_offset` (≥ 0) ; lignes : `lottery_id`, `title`, `image_url`, `draw_at`, `status`, `user_tickets_count` (tous statuts), `last_participated_at` (`MAX(purchased_at)`) |
| Tri | `last_participated_at DESC`, `lottery_id ASC` |
| Sécurité | `SECURITY DEFINER`, filtrage `auth.uid()` ; brands actives uniquement |

Types client : `apps/mobile/src/lib/supabase.types.ts` (`Functions.get_user_participations`).

## i18n

Préfixe `participations.*` (layout, screen, list) + menu Profil `profile.menu.results` / `resultsA11y` dans `fr.json` / `en.json`.

## Tests

| Type | Fichier |
|------|---------|
| Unitaire parser | `services/parseUserParticipationRpcRow.unit.test.ts` |
| Unitaire service | `services/getUserParticipationsPage.unit.test.ts` |
| Intégration RPC | `apps/mobile/tests/integration/get-user-participations.integration.test.ts` |

## Vérifs manuelles

1. Appliquer la migration locale (`supabase migration up --local`).
2. Profil → Mes participations : liste / empty / load more.
3. Clic loterie active ou cancelled → fiche loterie.
4. Clic loterie drawn → page résultat.
5. Profil → Mes résultats → `/results` (comportement historique).

## Références croisées

- Home (teaser max 5) : `features/home` + RPC `get_user_home_dashboard`
- Résultats (tirées uniquement) : `features/results`
- Profil : `features/profile/screens/ProfileScreen.tsx`
