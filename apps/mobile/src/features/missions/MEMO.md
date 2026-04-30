# Mémo — Feature Missions (mobile)

**Dernière revue du mémo :** 2026-04-30

## Objectif

Permettre à l’utilisateur authentifié de parcourir les missions (liste « à faire », détail, historique des complétions), de soumettre une complétion via la RPC serveur, et de bénéficier de la mission **daily login** déclenchée au bootstrap (avec garde-fous serveur + cache local).

## Périmètre

- **Inclus :** listes missions todo / complétées, écran détail, soumission de complétion, codes d’erreur métier exposés au client, mission daily login (côté client + constantes), invalidation des caches liés après succès.
- **Hors périmètre (autres features / admin) :** approbation admin des complétions (`approve_mission_completion`), wallet UI détaillée, referral — sauf impact **cache** documenté ci‑dessous.

## Navigation (Expo Router)

| Route | Fichier |
|--------|---------|
| Liste | `apps/mobile/app/(app)/missions/index.tsx` |
| Détail `[missionId]` | `apps/mobile/app/(app)/missions/[missionId].tsx` |
| Layout stack | `apps/mobile/app/(app)/missions/_layout.tsx` (titres i18n `missions.layout.*`) |

## Cartographie code (`src/features/missions`)

| Rôle | Fichiers principaux |
|------|---------------------|
| **Clés TanStack Query** | `queries/missionListKeys.ts` — `all`, `todo(userId)`, `completed(userId)` |
| **Détail mission** | `hooks/useGetMissionByIdQuery.ts` — `queryKey: ["missions", missionId]` ; `services/getMissionById.ts` (table `missions` + `brands`) |
| **Liste todo (paginée)** | `hooks/useTodoMissionsQuery.ts`, `services/getAvailableMissionsPage.ts` → RPC `get_todo_missions_page` |
| **Liste complétions (paginée)** | `hooks/useCompletedMissionsQuery.ts`, `services/getCompletedMissionsPage.ts` → table `mission_completions` |
| **Soumission** | `hooks/useSubmitMissionCompletionMutation.ts`, `services/missionService.ts` → RPC `submit_mission_completion` |
| **Daily login** | `hooks/useDailyLoginMission.ts`, `constants/index.ts` ; appel depuis `apps/mobile/src/lib/bootstrap/useAppBootstrap.ts` |
| **Présentation** | `utils/missionDetailPresentation.ts`, `utils/missionThumbnailFallback.ts` |
| **Types** | `types/index.ts` |

**Règle d’archi :** pas d’appel Supabase depuis les écrans ; services → hooks → UI (voir règles TanStack Query du repo).

## Backend Supabase (références)

- **RPC :** `get_todo_missions_page`, `submit_mission_completion`.
- **Lecture directe (client typé) :** `missions`, `mission_completions` (complétées), selon les services ci‑dessus.
- **Impact home :** `get_user_home_dashboard` peut exposer des missions / états liés ; garder cohérent avec les filtres produit (ex. daily login, exclusions de listes).
- **Schémas source :** `supabase/schemas/functions/*.sql` ; **migrations :** `supabase/migrations/` (chercher `daily_login`, `submit_mission_completion`, `todo_missions`, `mission_type`, etc.).

### Codes métier stables (soumission)

Définis côté client dans `missionService.ts` (`MissionSubmissionBusinessErrorCode`) :  
`UNAUTHENTICATED`, `MISSION_NOT_FOUND`, `MISSION_NOT_ACTIVE`, `MISSION_NOT_STARTED`, `MISSION_EXPIRED`, `MISSION_USER_LIMIT_REACHED`, `MISSION_TOTAL_LIMIT_REACHED`.  
Les libellés utilisateur passent par i18n sous `missions.submission.errors` (voir `missionService` et locales).

## Daily login (résumé)

- Déclenché dans **`useAppBootstrap`** après chargement du profil si session présente (`triggerDailyLoginMission`).
- **AsyncStorage :** clé `DAILY_LOGIN_LAST_COMPLETED_DATE_KEY` dans `constants/index.ts` (évite un double appel UX le même jour côté device ; le serveur reste autorité pour la règle métier).
- **Identifiant mission :** `DAILY_LOGIN_MISSION_ID` dans `constants/index.ts` — à aligner avec l’environnement / seed si la mission change.

## Invalidation cache après soumission réussie

`useSubmitMissionCompletionMutation` invalide notamment :

- tout le namespace listes missions : `queryKey` préfixe `missionListKeys.all` (`["missions", "list"]`) ;
- détail : `["missions", variables.missionId]` ;
- si `userId` : wallet (`balance`, `pendingRewards`, `transactions`), `homeDashboardKeys.detail(userId)`.

Toute nouvelle lecture affichée après une complétion doit être réfléchie ici ou dans le hook de mutation.

## Tests

- `apps/mobile/tests/integration/get-todo-missions-page.integration.test.ts`
- `apps/mobile/tests/integration/submit-mission-completion.integration.test.ts`
- `apps/mobile/tests/integration/get-user-home-dashboard.integration.test.ts` (si le dashboard home dépend des missions)
- `apps/mobile/src/features/missions/hooks/useDailyLoginMission.unit.test.ts`

## i18n

Préfixes typiques : `missions.layout.*`, contenus écran / erreurs sous l’objet `missions` dans `apps/mobile/src/i18n/locales/en.json` et `fr.json` (garder les deux fichiers synchrones).

---

## Maintenance — comment ce fichier reste utile

Ce mémo **ne se met pas à jour tout seul**. Il est **volontairement court** : il doit refléter la réalité du code au fil du temps.

### Quand le mettre à jour

1. **PR qui touche la feature missions** (mobile ou SQL qui change le contrat missions / daily login / listes) : ajuster les sections concernées (routes, RPC, clés de query, invalidation, constantes, tests).
2. **Nouveau comportement produit** (nouvelle mission spéciale, nouvelle erreur RPC, pagination) : documenter le flux ou pointer vers le fichier source plutôt que dupliquer tout le code.
3. **Régression ou piège** découvert en prod / review : ajouter une ligne dans une sous‑section « Pièges » (à créer si besoin) ou dans la section existante.

### Comment le mettre à jour

- **Même PR que le changement fonctionnel** de préférence (évite la dérive).
- Mettre à jour la date **Dernière revue du mémo** en haut du fichier.
- Si une section devient fausse, la corriger ou la supprimer — un mémo faux est pire que pas de mémo.

### Pour l’équipe / les agents

- En ouvrant une tâche sur les missions, **mentionner ce fichier** dans le prompt ou la description de PR pour cadrer périmètre et fichiers d’entrée.
- Option équipe : ajouter une case à cocher dans le template de PR : « Mémo `features/missions/MEMO.md` mis à jour si pertinent ».

### Réplication à d’autres features

Pour chaque `src/features/<nom>/`, un `MEMO.md` au même niveau avec les mêmes grandes rubriques (objectif, périmètre, navigation, carte code, backend, cache, tests, i18n, maintenance) adaptées au domaine.
