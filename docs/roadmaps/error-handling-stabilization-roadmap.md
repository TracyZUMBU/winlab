# Roadmap — stabilisation gestion d’erreurs (pré-phase de test)

Document de **suivi** pour homogénéiser progressivement la gestion d’erreurs sur le mobile, sans big bang.  
Référence normative : [error-handling-conventions.md](../error-handling-conventions.md).

**Légende** : `[ ]` à faire · `[x]` fait (à cocher au fil des PRs).

---

## Phase 1 — Actions critiques (priorité immédiate)

Objectif : même **contrat mental** partout sur les **mutations métier** : codes stables → i18n, **pas** de `error.message` en UI, monitoring pour **technical / unexpected** seulement (pas pour les échecs métier “normaux”).

### 1.1 Achat de ticket (`buy_ticket`)

| Statut | Tâche                                                                                                                                                                 |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [x]    | Service : `apps/mobile/src/features/lotteries/services/buyTicketService.ts` — union `success` + `kind` (`business` / `technical` / `unexpected`) + `errorCode` métier |
| [x]    | UI : `LotteryDetailScreen` — `getI18nMessageForCode` + clé générique pour tech/unexpected                                                                             |
| [x]    | i18n : `lottery.detail.purchase.errors.*` dans `fr.json` et `en.json` (vérifier tout code listé dans `BUSINESS_ERROR_CODES`)                                          |
| [x]    | **Audit rapide** : parcours manuel (succès + un code métier + mode avion / RPC en erreur) + vérifier qu’un événement monitoring part bien pour les cas tech           |

**Fichiers clés** : `buyTicketService.ts`, `LotteryDetailScreen.tsx`, `supabase/schemas/functions/buy_ticket.sql`

---

### 1.2 Soumission de mission (`submit_mission_completion`)

| Statut | Tâche                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [x]    | **Service** `apps/mobile/src/features/missions/services/missionService.ts` : aligner sur le modèle `buyTicketService` — `ErrorKind`, retour `{ success: false; kind; errorCode? }` (ou équivalent strict), `logger.warn` contextualisé, `monitoring.captureException` pour RPC / réponse invalide / code inconnu, **pas** de monitoring pour les `error_code` métier listés dans `BUSINESS_ERROR_CODES` |
| [x]    | **UI** `MissionDetailScreen.tsx` : **`getI18nMessageForCode`** pour `kind === "business"`, message **`missions.submission.errors.generic`** pour `technical` / `unexpected`                                                                                                                                                                                                                             |
| [x]    | **i18n** : clé **`missions.submission.errors.generic`** dans `fr.json` / `en.json` ; les codes métier existants inchangés                                                                                                                                                                                                                                                                               |
| [x]    | **Hook** `useSubmitMissionCompletionMutation` : aucun changement requis (`onSuccess` ne s’exécute que si `result.success`)                                                                                                                                                                                                                                                                              |
| [x]    | **Tests** : pas de mock du service ; intégration `submit-mission-completion.integration.test.ts` appelle le RPC directement (inchangé)                                                                                                                                                                                                                                                                  |

**Référence cible** : comportement de `buyTicketService.ts` + `deleteMyAccount.ts` (`shouldMonitorFailure`).

---

### 1.3 Suppression de compte (`delete-my-account`)

| Statut | Tâche                                                                                                                                     |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [x]    | Service : `deleteMyAccount.ts` — `kind` + `code`, monitoring seulement si `technical` / `unexpected`                                      |
| [x]    | UI : `ProfileScreen` — `getI18nMessageForCode` + `profile.deleteAccount.errors`                                                           |
| [x]    | i18n : codes + `generic` dans `fr.json` / `en.json`                                                                                       |
| [x]    | **Audit rapide** : un cas métier (ex. session refusée) ne doit **pas** spammer Slack/Sentry ; un `INVOKE_FAILED` / `INVALID_RESPONSE` oui |

---

## Phase 2 — Écarts explicites aux conventions (après phase 1)

| Statut | Tâche                                                                                                                                                                |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [x]    | **OTP** : `verifyEmailOtp` — **codes stables** + écran avec `getI18nMessageForCode` / `t(..., { length })` ; plus de `error?.message` côté résultat                  |
| [x]    | Repasser les écrans **auth** pour texte utilisateur : `OTPScreen`, `EmailScreen`, `DevPasswordLoginPanel` ; `AppPlaceholderScreen` / `AuthScreenLayout` déjà propres |

---

## Phase 3 — Lectures (`useQuery`) et admin

| Statut | Tâche                                                                                                                                                                                                                                                                                   |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [x]    | Mobile : écrans **`useQuery`** — message **i18n** + **`userFacingQueryLoadHint`** quand pertinent + **Réessayer** ; pas de `error.message`                                                                                                                                              |
| [x]    | Écrans passés en revue : **Lotteries**, **LotteryDetail** (hint + garde-fous `lotteryId` / session), **Missions**, **MissionDetail** (déjà OK), **Wallet** (déjà OK), **Results** liste/détail (déjà OK), **Profil** (hint + `void refetch`) ; **Create profil** : textes écran en i18n |
| [x]    | Admin (`apps/admin`) : optionnel ; harmoniser messages d’erreur et `throw` si besoin                                                                                                                                                                                                    |

---

## Phase 3.5 — Monitoring des lectures (`useQuery`)

Implémenté dans `apps/mobile/src/lib/query/queryCacheOnError.ts` + `queryClient.ts`. Reste la **vérification staging** ci‑dessous.

### Principes

|                           |                                                                                                                                                                                                                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Point d’entrée unique** | Handler global **`QueryCache.onError`** sur `queryClient`, **pas** un `monitoring.*` dans chaque écran `isError`.                                                                                                                                                 |
| **Payload**               | Événement **sanitisé** : `name` stable (`tanstack_query_load_failed`), `feature` dérivé du **premier segment** de la `queryKey`, `extra` avec `queryKey` allégée (pas d’email/PII), code PostgREST si dispo — **pas** de `error.message` brut vers les providers. |
| **Exclusions**            | **Annulation / abort** ; erreurs **métier / attendues** (`PGRST116`) ; erreurs réseau typiques (marqueurs dans le message).                                                                                                                                       |
| **Anti-bruit**            | **Throttle** 90 s par bucket (`feature` + classe d’erreur).                                                                                                                                                                                                       |
| **Logger**                | Aligné règle projet : monitoring pour l’observabilité ciblée.                                                                                                                                                                                                     |

### Checklist d’implémentation

| Statut | Tâche                                                                                                                             |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| [x]    | Brancher `QueryCache.onError` sur **`queryClient`** — `queryClient.ts` + `queryCacheOnError.ts`.                                  |
| [x]    | Mapper **`queryKey[0]` → `feature`** (`missions`, `lotteries`, `wallet`, `results`, `profile`, `home`, sinon `unknown`).          |
| [x]    | **Filtres** : `CancelledError`, `PGRST116`, marqueurs réseau dans le message ; **throttle** 90 s par `feature` + bucket d’erreur. |
| [x]    | **`monitoring.captureException`** (`tanstack_query_load_failed`, `extra` string-only + queryKey sanitizée).                       |
| [x]    | Section **TanStack Query — lectures** dans **`error-handling-conventions.md`**.                                                   |
| [ ]    | Vérifier en **staging** : incident sur erreur serveur réelle ; pas de flood en offline / PGRST116.                                |

---

## Phase 4 — Avant d’ouvrir les tests

| Statut | Tâche                                                                                                                                           |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [ ]    | Build/typecheck/tests mobile verts                                                                                                              |
| [ ]    | Checklist manuelle : connexion, OTP, création profil, mission, achat ticket, wallet, suppression compte, **mode avion** sur une action critique |
| [ ]    | Vérifier config monitoring test/staging : `EXPO_PUBLIC_*`, edge `monitoring-slack`, Sentry si activé                                            |

---

## Journal (optionnel)

Utilise cette section pour noter la date et le scope de chaque merge.

| Date | PR / note | Scope |
| ---- | --------- | ----- |
|      |           |       |

---

## Fichiers de référence “or”

- `apps/mobile/src/features/lotteries/services/buyTicketService.ts`
- `apps/mobile/src/features/profile/services/deleteMyAccount.ts`
- `apps/mobile/src/lib/i18n/errorCodeMessage.ts`
- `apps/mobile/src/lib/errors/errorKinds.ts`
