# Winlab — Conventions de gestion d’erreurs (Mobile + Supabase Edge Functions)

Objectif : rendre le parcours d’erreur **prévisible**, **traduisible**, **observable**, sans exposer de messages techniques à l’utilisateur.

Portée :
- `apps/mobile/src/**` (feature-first)
- `supabase/functions/**` (edge functions appelées par l’app)
- (optionnel) `supabase/schemas/functions/**` pour les RPC Postgres (si retour structuré)

**Plan de stabilisation (checklist pré-tests, phases suivantes)** : [error-handling-stabilization-roadmap.md](./error-handling-stabilization-roadmap.md).

## Principes (non négociables)

### 1) Typologie d’erreurs

- **Business error** (attendue)  
  Exemple : tokens insuffisants, ressource indisponible, limite atteinte, non authentifié.
  - Doit être représentée par un **code stable** (ex : `INSUFFICIENT_TOKENS`).
  - Doit être **mappée vers i18n** via ce code.
  - Ne doit **pas** polluer le monitoring (c’est du “normal”).

- **Technical error** (infrastructure/SDK/réseau/DB)  
  Exemple : timeout, problème Supabase, erreur PostgREST, edge function down.
  - UI : message générique traduisible + possibilité de retry.
  - Logs : trace utile au diagnostic.
  - Monitoring : **oui**, selon sévérité et contexte.

- **Unexpected error** (bug/invariant cassé)  
  Exemple : “invalid server response”, null impossible, parsing impossible.
  - UI : message générique + retry si possible.
  - Logs : **oui** (avec contexte).
  - Monitoring : **oui** (souvent error/critical).

### 2) Interdictions côté UI (screens/components)

- **Interdit** : afficher `error.message` brut à l’utilisateur (même dans un “helper text”).  
  Raison : instable, non traduisible, souvent trop technique, parfois sensible.

- **Interdit** : faire du mapping métier via `message.includes(...)`, regex, parsing de texte d’erreur Supabase.  
  Raison : couplage fragile à des messages non contractuels.

### 3) Codes stables pour les erreurs métier

Les erreurs métier doivent être exprimées par un **code stable** :
- Priorité : code renvoyé explicitement par un RPC / edge function / service (ex : `errorCode`).
- Les codes doivent être **versionnés** (dans le code TS ou côté DB), pas déduits d’un texte.

### 4) Mapping i18n basé sur code

- Le mapping utilisateur se fait **à partir d’un code stable** (ex : `t("lottery.purchase.errors.INSUFFICIENT_TOKENS")`).
- Le fallback doit être une clé générique (ex : `...errors.generic`), jamais un texte en dur.
- Recommandation pratique : centraliser le mapping dans un helper minimal qui fait :
  - `baseKey + "." + code` si la clé existe
  - sinon `fallbackKey`

### 5) Où logger / où monitorer

#### Logging (principal)

- Le **log principal** doit être fait au niveau **service / use case** (là où l’erreur est comprise et contextualisée).
- **Éviter la duplication** : ne pas logger la même erreur à la fois dans service + hook + screen.
  - Exception : un écran peut ajouter un log **UI** uniquement si c’est un événement distinct (ex : “user cancelled”, “form validation failed”), pas une répétition du même échec réseau.

#### Monitoring

- Réservé aux **technical** et **unexpected** errors.
- **Ne pas envoyer** au monitoring les business errors “normales” (ex : “insufficient tokens”), sauf si c’est anormalement fréquent (dans ce cas : métrique dédiée, pas un incident).

### 6) Catch silencieux / fallback

Les `catch { ...fallback }` sont parfois nécessaires (UX/robustesse), mais :
- **Minimum requis** : laisser une trace (log ou monitoring) indiquant qu’un fallback a été déclenché.
- La trace doit contenir : feature/use case, action, et au moins un identifiant utile (ex : `userId`, `missionId`, `lotteryId`) **sans données sensibles**.

## Conventions par couche (feature-first)

### Services (`apps/mobile/src/features/**/services`)

Rôle : parler à Supabase (DB/RPC/edge functions) et produire un contrat consommable.

Attendus :
- Normaliser la sortie : soit un **résultat structuré** (avec `errorCode`), soit un **throw** clairement technique/unexpected.
- Inclure le contexte utile dans le log (feature, action, ids).
- Ne pas faire de logique UI (pas de `Alert`, pas de `t(...)`, pas de navigation).

### Hooks (`apps/mobile/src/features/**/hooks`)

Rôle : TanStack Query (cache, invalidation, retry) + exposition simple aux écrans.

Attendus :
- Ne pas parse des messages d’erreur pour la logique métier.
- Ne pas multiplier les logs : si le service log déjà, le hook ne re-log pas (sauf besoin exceptionnel et justifié).

### Screens (`apps/mobile/src/features/**/screens`)

Rôle : UI states (loading/error/empty/success).

Attendus :
- Afficher uniquement des messages i18n stables.
- Aucun `error.message` brut.
- Si le flow n’a pas encore de code stable : afficher un fallback non-technique (ex : hint générique “réessayer / vérifier connexion”).

### Edge functions (`supabase/functions/**`)

Attendus :
- Retourner des erreurs **contractuelles** pour l’app (idéalement `errorCode`) plutôt que des strings techniques.
- Ne pas inclure de détails sensibles dans des champs renvoyés à l’app.

## Checklist de review (rapide)

- [ ] L’UI n’affiche pas `error.message` (ni en petit texte).
- [ ] Aucune logique métier ne dépend de `message.includes(...)` / parsing de texte.
- [ ] Les erreurs métier sont représentées par des **codes stables** (ex : `errorCode`).
- [ ] Le mapping i18n dépend d’un code stable, avec fallback générique.
- [ ] Les logs principaux sont au niveau service/use case (pas en triple).
- [ ] Les business errors “normales” ne partent pas au monitoring.
- [ ] Tout fallback silencieux laisse au minimum une trace (log/monitoring) avec contexte non sensible.

