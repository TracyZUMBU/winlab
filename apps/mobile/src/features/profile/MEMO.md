# Mémo — Feature Profil (mobile)

**Dernière revue du mémo :** 2026-07-20

## Objectif

Gérer le **profil** (lecture / édition, avatar), le **compte** (déconnexion, suppression), et le **parrainage** : code personnel, enregistrement du code à l’inscription, hub liste des filleuls + partage, aligné avec les RPC Supabase.

## Périmètre

- **Inclus :** `getMyProfile` / édition, upload avatar, création de profil (auth), champ optionnel code parrain + `register_referral_with_code`, écran hub parrainage (`/referral`), liste des filleuls via `get_my_referral_invitees`.
- **Lieu d’habitation :** `profiles.residence_country` (`FR`, `CH`, `LU`) obligatoire ; `profiles.department_code` obligatoire **uniquement** si `FR` (métropole + Corse + DOM `971`–`976`), `NULL` pour CH/LU. UI : `CountryPickerSheet`, `DepartmentPickerSheet` (création + édition profil).
- **Côté serveur (référence, pas code ici) :** qualification / bonus parrain après première mission **éligible** (`handle_referral_after_first_mission`, exclusions de `mission_type` dans `mission_type_counts_for_referral_qualification`) — déclenché depuis `approve_mission_completion` (soumission mission automatique ou autre chemin serveur).
- **Hors scope (itération actuelle) :** ville d’habitation, Allemagne, backoffice, tests Jest dédiés pays/département.

## Navigation (Expo Router)

| Route | Fichier |
|--------|---------|
| Onglet profil | `apps/mobile/app/(app)/profile.tsx` → `ProfileScreen` |
| Hub parrainage (tab masquée) | `apps/mobile/app/(app)/referral.tsx` → `ReferralHubScreen` |
| Mes participations | `apps/mobile/app/(app)/participations/` → feature `participations` |
| Mes résultats | `apps/mobile/app/(app)/results/` → feature `results` |
| Création profil (auth) | `apps/mobile/app/(auth)/create-profile.tsx` → `CreateProfileScreen` |

`referral`, `participations` et `results` sont enregistrés dans `app/(app)/_layout.tsx`.

## Cartographie code (`src/features/profile`)

| Rôle | Fichiers principaux |
|------|---------------------|
| **Clés TanStack Query (parrainage)** | `keys/referralKeys.ts` — `all`, `invitees(userId)` |
| **Liste filleuls (RPC)** | `hooks/useMyReferralInviteesQuery.ts`, `services/getMyReferralInvitees.ts` → RPC `get_my_referral_invitees` |
| **Enregistrement code (RPC)** | `services/registerReferralWithCode.ts` → RPC `register_referral_with_code` |
| **Pays / département** | `constants/residenceCountries.ts`, `constants/frenchDepartments.ts`, `utils/normalizeProfileLocation.ts`, `components/CountryPickerSheet.tsx`, `components/DepartmentPickerSheet.tsx` |
| **Création profil + parrain** | `screens/CreateProfileScreen.tsx`, `services/createProfile.ts`, schéma `validators/createProfileFormSchema.ts` |
| **Hub UI** | `screens/ReferralHubScreen.tsx` (partage natif `Share.share`) |
| **Profil « classique »** | `screens/ProfileScreen.tsx`, `hooks/useMyProfileQuery.ts`, `services/getMyProfile.ts`, `services/updateMyProfile.ts`, mutations update / avatar / delete. Avatar : affichage seul dans le hero ; changement via le formulaire « Modifier le profil » (champ photo en tête de formulaire). |
| **Support & documents légaux** | `ProfileScreen` : `mailto:` vers `legalEntityInfo.contactEmail` ; politique de confidentialité mise à jour (`@/src/legal/privacyBodies.ts`) pour FR/CH/LU et département FR. |

**Règle d’archi :** pas d’appel Supabase depuis les écrans ; services → hooks → UI.

## Backend Supabase (références)

- **Migration :** `supabase/migrations/20260522120000_profiles_residence_country.sql` — colonne `residence_country`, backfill `FR`, CHECK pays + cohérence pays/département, liste départements étendue (DOM).
- **Migration antérieure :** `20260506160000_profiles_department_code.sql` (département FR initial).
- **RPC :** `register_referral_with_code`, `get_my_referral_invitees`.
- **Bonus parrain (hors appel direct mobile) :** `handle_referral_after_first_mission` ; `mission_type_counts_for_referral_qualification` (exclut `daily_login`, extensible).
- **Schémas source :** `supabase/schemas/functions/register_referral_with_code.sql`, `get_my_referral_invitees.sql`, etc.

### Règles métier (DB)

| `residence_country` | `department_code` |
|---------------------|-------------------|
| `FR` | Obligatoire, code INSEE autorisé (01–95, 2A/2B, 971–976) |
| `CH`, `LU` | `NULL` |

Comptes existants : backfill `residence_country = 'FR'` ; `department_code` inchangé.

## Invalidation cache

- Après **création profil** : `invalidateAppBootstrapCache()` (bootstrap global).
- **Pas d’invalidation automatique** de `referralKeys.invitees(userId)` aujourd’hui après `register_referral_with_code` ; le hub se rafraîchit au focus / `staleTime`.

## Tests

- `apps/mobile/tests/integration/register-referral-with-code.integration.test.ts`
- `apps/mobile/tests/integration/get-my-referral-invitees.integration.test.ts`
- `apps/mobile/tests/integration/handle-referral-after-first-mission.integration.test.ts`
- Pas de test Jest dédié pays/département (recette manuelle).

## i18n

Préfixes : `profile.createProfile.*`, `profile.residenceCountry.*`, `profile.countryPicker.*`, `profile.departmentPicker.*`, `schema.createProfile.residenceCountry.*` — garder `en.json` et `fr.json` synchrones.

## Vérification manuelle (lieu d’habitation)

1. Création profil CH → pas de champ département ; en base `department_code` null.
2. Création profil FR + DOM (ex. `971`) → OK.
3. Édition FR → CH → `department_code` effacé en base.
4. Politique de confidentialité FR/EN : mention FR/CH/LU et département si France.

---

## Maintenance

Même discipline que `features/missions/MEMO.md` : mettre à jour **dans la même PR** quand le contrat RPC, les routes, les colonnes profil, les clés de query ou les écrans changent ; ajuster la date en tête de fichier.
