# Mémo — Feature Profil (mobile)

**Dernière revue du mémo :** 2026-05-06

## Objectif

Gérer le **profil** (lecture / édition, avatar), le **compte** (déconnexion, suppression), et le **parrainage** : code personnel, enregistrement du code à l’inscription, hub liste des filleuls + partage, aligné avec les RPC Supabase.

## Périmètre

- **Inclus :** `getMyProfile` / édition, upload avatar, création de profil (auth), champ optionnel code parrain + `register_referral_with_code`, écran hub parrainage (`/referral`), liste des filleuls via `get_my_referral_invitees`.
- **Côté serveur (référence, pas code ici) :** qualification / bonus parrain après première mission **éligible** (`handle_referral_after_first_mission`, exclusions de `mission_type` dans `mission_type_counts_for_referral_qualification`) — déclenché depuis `approve_mission_completion` (soumission mission automatique ou autre chemin serveur).

## Navigation (Expo Router)

| Route | Fichier |
|--------|---------|
| Onglet profil | `apps/mobile/app/(app)/profile.tsx` → `ProfileScreen` |
| Hub parrainage (tab masquée) | `apps/mobile/app/(app)/referral.tsx` → `ReferralHubScreen` |
| Création profil (auth) | `apps/mobile/app/(auth)/create-profile.tsx` → `CreateProfileScreen` |

`referral` est enregistré dans `app/(app)/_layout.tsx` avec `href: null` (comme `results`).

## Cartographie code (`src/features/profile`)

| Rôle | Fichiers principaux |
|------|---------------------|
| **Clés TanStack Query (parrainage)** | `keys/referralKeys.ts` — `all`, `invitees(userId)` |
| **Liste filleuls (RPC)** | `hooks/useMyReferralInviteesQuery.ts`, `services/getMyReferralInvitees.ts` → RPC `get_my_referral_invitees` |
| **Enregistrement code (RPC)** | `services/registerReferralWithCode.ts` → RPC `register_referral_with_code` |
| **Création profil + parrain** | `screens/CreateProfileScreen.tsx`, `services/createProfile.ts`, schéma `validators/createProfileFormSchema.ts` |
| **Hub UI** | `screens/ReferralHubScreen.tsx` (partage natif `Share.share`) |
| **Profil « classique »** | `screens/ProfileScreen.tsx`, `hooks/useMyProfileQuery.ts`, `services/getMyProfile.ts`, mutations update / avatar / delete |

**Règle d’archi :** pas d’appel Supabase depuis les écrans ; services → hooks → UI.

## Backend Supabase (références)

- **RPC :** `register_referral_with_code`, `get_my_referral_invitees`.
- **Bonus parrain (hors appel direct mobile) :** `handle_referral_after_first_mission` ; `mission_type_counts_for_referral_qualification` (exclut `daily_login`, extensible).
- **Schémas source :** `supabase/schemas/functions/register_referral_with_code.sql`, `get_my_referral_invitees.sql`, `handle_referral_after_first_mission.sql`, `mission_type_counts_for_referral_qualification.sql`.

## Invalidation cache

- Après **création profil** : `invalidateAppBootstrapCache()` (bootstrap global).
- **Pas d’invalidation automatique** de `referralKeys.invitees(userId)` aujourd’hui après `register_referral_with_code` ; le hub se rafraîchit au focus / `staleTime`. Si besoin UX immédiat : `queryClient.invalidateQueries({ queryKey: referralKeys.invitees(userId) })` au bon endroit (ex. après succès RPC parrain).

## Tests

- `apps/mobile/tests/integration/register-referral-with-code.integration.test.ts`
- `apps/mobile/tests/integration/get-my-referral-invitees.integration.test.ts`
- `apps/mobile/tests/integration/handle-referral-after-first-mission.integration.test.ts`

## i18n

Préfixes : `profile.createProfile.*`, `profile.referralHub.*`, entrées menu `profile.menu.referral*` — garder `en.json` et `fr.json` synchrones.

---

## Maintenance

Même discipline que `features/missions/MEMO.md` : mettre à jour **dans la même PR** quand le contrat RPC, les routes, les clés de query ou les écrans parrainage / profil changent ; ajuster la date en tête de fichier.
