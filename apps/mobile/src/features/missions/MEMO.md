# Mémo — Feature Missions (mobile)

**Dernière revue du mémo :** 2026-07-03

## Objectif

Permettre à l’utilisateur authentifié de parcourir les missions (liste « à faire », détail, historique des complétions), de soumettre une complétion via la RPC serveur, et de bénéficier de la mission **daily login** déclenchée au bootstrap (avec garde-fous serveur + cache local).

## Périmètre

- **Inclus :** listes missions todo / complétées, écran détail (états **terminée / en attente / refus + réessai** selon la dernière `mission_completion`), **règlement mission** (`rules_text` en Markdown, modale depuis la section « À propos »), soumission de complétion, codes d’erreur métier exposés au client, mission daily login (côté client + constantes), invalidation des caches liés après succès.
- **Hors périmètre (autres features / admin) :** approbation admin des complétions (`approve_mission_completion`), wallet UI détaillée.
- **Lien produit parrainage (hors UI missions) :** le bonus parrain est déclenché côté serveur après `approve_mission_completion` (`handle_referral_after_first_mission`) ; les types de mission **non qualifiants** pour la 1ʳᵉ récompense (ex. `daily_login`) sont exclus via SQL — voir **`src/features/profile/MEMO.md`**. Les invalidations TanStack actuelles après soumission **ne** couvrent **pas** `referralKeys` ; ajouter une invalidation ciblée seulement si l’UX profil doit se mettre à jour sans refetch manuel.

## Navigation (Expo Router)

| Route | Fichier |
|--------|---------|
| Liste | `apps/mobile/app/(app)/missions/index.tsx` |
| Détail `[missionId]` | `apps/mobile/app/(app)/missions/[missionId].tsx` |
| Layout stack | `apps/mobile/app/(app)/missions/_layout.tsx` (titres i18n `missions.layout.*`) |

## Cartographie code (`src/features/missions`)

| Rôle | Fichiers principaux |
|------|---------------------|
| **Clés TanStack Query** | `queries/missionListKeys.ts` — `all`, `todo(userId)`, `completed(userId)` ; `queries/missionKeys.ts` — `detail(missionId, userId)` pour le détail |
| **Détail mission** | `hooks/useGetMissionByIdQuery.ts` ; `services/getMissionById.ts` (`missions` + `brands` + `mission_completions` du user, RLS, champ **`rules_text`**) ; `utils/missionDetailInteractionState.ts` ; `components/MissionDetailReadonlyOutcome.tsx`, `MissionDetailRejectionBanner.tsx` ; résumé haut de page sans barre de progression (retirée : non branchée à une donnée métier) ; **`screens/detail-types/CommonMissionDetailSection.tsx`** (lien règlement + état modale) ; **`components/MissionRulesMarkdownModal.tsx`** (contenu Markdown, UX proche des modales légales / scroll) |
| **Liste todo (paginée)** | `hooks/useTodoMissionsQuery.ts`, `services/getAvailableMissionsPage.ts` → RPC `get_todo_missions_page` |
| **Liste complétions (paginée)** | `hooks/useCompletedMissionsQuery.ts`, `services/getCompletedMissionsPage.ts` → table `mission_completions` |
| **Soumission** | `hooks/useSubmitMissionCompletionMutation.ts`, `services/missionService.ts` → RPC `submit_mission_completion` |
| **Registre types (détail)** | `screens/detail-types/missionDetailTypeRuntimeRegistry.ts` — renderer + controller par `mission_type` |
| **Daily login** | `hooks/useDailyLoginMission.ts`, `constants/index.ts` ; appel depuis `apps/mobile/src/lib/bootstrap/sharedAppBootstrap.ts` |
| **Présentation** | `utils/missionDetailPresentation.ts`, `utils/missionThumbnailFallback.ts` |
| **Types** | `types/index.ts`, `types/surveyProof.ts` (`MissionSurveyProofPayload` pour `proof_data` survey) |

**Règle d’archi :** pas d’appel Supabase depuis les écrans ; services → hooks → UI (voir règles TanStack Query du repo).

## Types de mission

Enum Postgres / TypeScript : `survey`, `video`, `follow`, `referral`, `custom`, `daily_login`, `external_action` (`types/index.ts`).

| Type | Créable admin | Visible liste / home user | Renderer détail | Logique soumission |
|------|---------------|---------------------------|-----------------|-------------------|
| `survey` | oui | oui | `SurveyMissionDetail` | Client (formulaire) + **validation RPC** (`proof_data`) |
| `video` | oui | oui | `VideoMissionDetail` (lazy) | Client (lecture vidéo complète) puis RPC générique |
| `external_action` | oui | oui | `ExternalActionMissionDetail` | Client (ouverture lien + délai) puis RPC générique |
| `follow` | non | oui si mission en base | `FollowMissionDetail` (placeholder) | RPC générique |
| `referral` | non | oui si mission en base | `ReferralMissionDetail` (placeholder) | RPC générique |
| `custom` | non | oui si mission en base | `CustomMissionDetail` (placeholder) | RPC générique |
| `daily_login` | non (seed / SQL manuel) | **non** (exclu todo + home) | `DailyLoginMissionDetail` | Bootstrap automatique + **garde RPC UTC** |

**Création admin :** seuls `survey`, `video`, `external_action` (`MISSION_CREATE_TYPES` dans `apps/admin/src/features/missions/types/missionAdmin.ts`).

**Qualification parrainage :** `daily_login` exclu (`mission_type_counts_for_referral_qualification`).

### `survey`

- **Hooks :** `useSurveyMissionForm`, `useSurveyMissionDetailController`.
- **Contrat `proof_data` (mobile) :** `MissionSurveyProofPayload` dans `types/surveyProof.ts` :
  - `surveyId` : réservé backoffice (peut être vide).
  - `answers` : tableau ordonné `{ questionId, value }[]` (parcours réel, branchement inclus).
  - `value` : `string` (texte / choix unique) ou `string[]` (choix multiples).
- **Définition questionnaire :** sous-clé `survey` dans `missions.metadata`, validée par `submit_mission_completion` (migration `20260501140000_submit_mission_completion_survey_validation.sql`) :
  - `startQuestionId`, `questions` (tableau non vide).
  - Types de question : `text`, `single_choice`, `multi_choice` (voir schéma SQL).
- **Erreurs RPC dédiées :** `SURVEY_CONFIG_INVALID`, `SURVEY_PROOF_INVALID`, `SURVEY_ANSWERS_INVALID`.

### `video`

- **Hooks :** `useMissionDetailVideo`, `useWatchVideoMission`, `useVideoMissionDetailController`.
- **`missions.metadata` attendu :** `video_url` (obligatoire), `title` (optionnel, repli sur l’URL), `thumbnail_url` (optionnel) — parsing `utils/videoMissionMetadata.ts`.
- **Flux UX :** lecture complète de la vidéo → bouton « Valider » → `submit_mission_completion` avec `proof_data: {}`.
- **Pas de validation type-spécifique côté RPC** (hors garde-fous communs : statut, quotas, dates).

### `external_action`

- **Hooks :** `useMissionDetailExternalAction`, `useExternalActionMission`, `useExternalActionMissionDetailController`.
- **`missions.metadata` attendu :** `external_url`, `platform`, `action_label` ; optionnel `min_external_duration_seconds` — parsing `utils/parseExternalActionMissionMetadata.ts`.
- **Flux UX :** ouverture du lien externe → compte à rebours (durée min.) → soumission RPC avec `proof_data: {}`.
- **Pas de validation type-spécifique côté RPC.**

### `follow`, `referral`, `custom`

- Renderers détail = section commune uniquement (`CommonMissionDetailSection`) ; pas de flux interactif dédié côté mobile aujourd’hui.
- Présents dans l’enum pour compatibilité / évolutions futures ; non exposés à la création admin.

### `daily_login`

- **Hors parcours liste :** exclu de `get_todo_missions_page` et `get_user_home_dashboard`.
- **Déclenchement :** `triggerDailyLoginMission` dans `sharedAppBootstrap` après chargement du profil (session + ligne `profiles` requise).
- **Constantes :** `DAILY_LOGIN_MISSION_ID`, `DAILY_LOGIN_TOKEN_REWARD`, `DAILY_LOGIN_LAST_COMPLETED_DATE_KEY` (`constants/index.ts`) — **l’ID doit exister en base** (seed / SQL manuel par environnement).
- **Cache local :** AsyncStorage pour éviter un double appel UX le même jour UTC ; le serveur reste autorité (`has_daily_login_completion_for_current_utc_day`, garde dans `submit_mission_completion`).
- **Éligibilité :** pas de récompense le jour UTC de création du profil (client + RPC `DAILY_LOGIN_INELIGIBLE_FIRST_UTC_DAY`).
- **Monitoring :** échecs métier inattendus (`MISSION_NOT_FOUND`, `MISSION_NOT_ACTIVE`, etc.) loggés dans `useDailyLoginMission` ; les cas normaux (`MISSION_USER_LIMIT_REACHED`, premier jour UTC) restent silencieux.
- **Modale récompense :** `apps/mobile/app/_layout.tsx` (via `dailyLoginMissionResult` du bootstrap).

## Backend Supabase (transversal)

- **RPC lecture :** `get_todo_missions_page`.
- **RPC écriture :** `submit_mission_completion` (tous types) ; `has_daily_login_completion_for_current_utc_day` (daily login uniquement).
- **Table `missions` :** colonne **`rules_text`** (Markdown FR, `NOT NULL`, max 32 000 caractères, non vide après `btrim`) — édition **admin** (`profiles.is_admin`) ; migration `20260516120000_missions_rules_text_admin_rls.sql`.
- **Affichage mobile :** lien « Voir le règlement » si `rules_text.trim().length > 0` ; rendu Markdown via `react-native-markdown-display`.
- **Lecture directe (client typé) :** `missions`, `mission_completions` (complétées), selon les services ci‑dessus.
- **Impact home :** `get_user_home_dashboard` — cohérence avec exclusions produit (`daily_login`, etc.).
- **Schémas source :** `supabase/schemas/functions/*.sql` ; **migrations :** `supabase/migrations/`.

### Codes métier stables (soumission)

Définis côté client dans `missionService.ts` (`MissionSubmissionBusinessErrorCode`) :

- **Communs :** `UNAUTHENTICATED`, `MISSION_NOT_FOUND`, `MISSION_NOT_ACTIVE`, `MISSION_NOT_STARTED`, `MISSION_EXPIRED`, `MISSION_USER_LIMIT_REACHED`, `MISSION_TOTAL_LIMIT_REACHED`, `DAILY_LOGIN_INELIGIBLE_FIRST_UTC_DAY`.
- **`survey` uniquement :** `SURVEY_CONFIG_INVALID`, `SURVEY_PROOF_INVALID`, `SURVEY_ANSWERS_INVALID`.

Libellés utilisateur : i18n `missions.submission.errors.*`.

## Invalidation cache après soumission réussie

`useSubmitMissionCompletionMutation` invalide notamment :

- tout le namespace listes missions : `queryKey` préfixe `missionListKeys.all` (`["missions", "list"]`) ;
- détail : préfixe `["missions", "detail", variables.missionId]` (toutes variantes `userId` invalidées) ;
- si `userId` : wallet (`balance`, `pendingRewards`, `transactions`), `homeDashboardKeys.detail(userId)`.

Les hooks `useWatchVideoMission` et `useExternalActionMission` invalident aussi localement après succès. Toute nouvelle lecture affichée après une complétion doit être réfléchie ici ou dans le hook de mutation concerné.

## Tests

- Intégration RLS admin missions : `apps/mobile/tests/integration/missions-admin-rls.integration.test.ts`.
- `apps/mobile/tests/integration/get-todo-missions-page.integration.test.ts`
- `apps/mobile/tests/integration/submit-mission-completion.integration.test.ts`
- `apps/mobile/tests/integration/get-user-home-dashboard.integration.test.ts`
- `apps/mobile/tests/integration/has-daily-login-completion-for-current-utc-day.integration.test.ts`
- `apps/mobile/src/features/missions/hooks/useDailyLoginMission.unit.test.ts`

## i18n

Préfixes typiques : `missions.layout.*`, contenus écran / erreurs sous l’objet `missions` dans `apps/mobile/src/i18n/locales/en.json` et `fr.json` (garder les deux fichiers synchrones). **Règlement (détail) :** `missions.detail.rulesLink`, `missions.detail.rulesLinkA11y`, `missions.detail.rulesModalTitle`. **Daily login :** `missions.dailyLogin.*`.

---

## Maintenance — comment ce fichier reste utile

Ce mémo **ne se met pas à jour tout seul**. Il doit refléter la réalité du code au fil du temps.

### Quand le mettre à jour

1. **PR qui touche la feature missions** (mobile ou SQL) : ajuster les sections concernées (routes, RPC, clés de query, invalidation, **table / sous-section du type concerné**).
2. **Nouveau `mission_type` ou nouveau flux par type** : mettre à jour `## Types de mission` (table + sous-section).
3. **Régression ou piège** découvert en prod / review : ajouter une ligne dans la sous-section du type ou une section « Pièges ».

### Comment le mettre à jour

- **Même PR que le changement fonctionnel** de préférence (évite la dérive).
- Mettre à jour la date **Dernière revue du mémo** en haut du fichier.
- Si une section devient fausse, la corriger ou la supprimer — un mémo faux est pire que pas de mémo.

### Pour l’équipe / les agents

- En ouvrant une tâche sur les missions, **mentionner ce fichier** dans le prompt ou la description de PR pour cadrer périmètre et fichiers d’entrée.
- Option équipe : ajouter une case à cocher dans le template de PR : « Mémo `features/missions/MEMO.md` mis à jour si pertinent ».

### Réplication à d’autres features

Pour chaque `src/features/<nom>/`, un `MEMO.md` au même niveau avec les mêmes grandes rubriques (objectif, périmètre, navigation, carte code, types / domaine, backend, cache, tests, i18n, maintenance) adaptées au domaine.
