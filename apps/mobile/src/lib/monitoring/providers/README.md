# Monitoring (Mobile) — apps/mobile/src/lib/monitoring

## Objectif

Centraliser la collecte d’événements applicatifs (messages + exceptions) derrière un service unique, afin de :

- garder une API stable (`monitoring.captureMessage`, `monitoring.captureException`)
- contrôler la confidentialité (PII) avant émission
- router les événements vers des providers (console, Slack, etc.)

## API publique

### Export

Le point d’entrée est le singleton :

- `apps/mobile/src/lib/monitoring/index.ts` (export `monitoring`)
- `apps/mobile/src/lib/monitoring/monitoring.ts` crée `new MonitoringService({ environment, service, providers })`

### Méthodes

`MonitoringService` (implémenté dans `monitoring-service.ts`) expose :

- `captureMessage(input: CaptureMessageInput): void`
- `captureException(input: CaptureExceptionInput): void`

### Sévérités

`MonitoringSeverity` : `"debug" | "info" | "warning" | "error" | "critical"`

## Types d’événements

Les événements sont typés dans `types.ts` :

- `MonitoringEventBase`
  - `name: string`
  - `message: string`
  - `severity: MonitoringSeverity`
  - `timestamp: number` (enrichi via `Date.now()`)
  - `environment: string` (enrichi par `MonitoringService`)
  - `service: string` (enrichi par `MonitoringService`)
  - `feature?: string`
  - `userId?: string`
    - **PII / confidentialité** : `userId` doit être **pseudonymisé (hashé)** avant émission.
  - `requestId?: string`
  - `tags?: Record<string, string>`
  - `extra?: SanitizedData`
    - `SanitizedData = Record<string, string>`
    - `extra` doit être **pré-sanitizé** (pas de PII, pas de secrets)

- `MonitoringMessageEvent` (`type: "message"`)
- `MonitoringExceptionEvent` (`type: "exception"`) avec `error: MonitoringError`

## PII & sanitization (obligatoire)

### Où ça se passe

Avant d’envoyer un événement à un provider, `MonitoringService.dispatch()` appelle :

- `sanitizeMonitoringEvent()` depuis `sanitize-monitoring-event.ts`

Ainsi, même si un code appelant fourni des valeurs brutes, le pipeline tente de protéger les transports.

### Comment c’est protégé

`sanitize-monitoring-event.ts` fait notamment :

- **hash/pseudonymisation de `userId`**
  - `hashUserId()` calcule un identifiant stable (préimage = `winlab-monitoring:${environment}:${service}:${userId}`)
  - SHA-256 via `crypto.subtle.digest` quand dispo, sinon fallback déterministe
- **redaction best-effort** (emails / tokens / secrets)
  - redaction dans `message`, `error.message`, `error.stack`
  - redaction dans `feature`, `requestId` (best-effort)
- **sanitization des objets**
  - `extra` et `tags` sont convertis en `Record<string, string>`
  - suppression de clés suspectes (keywords sensibles)
  - les objets inconnus ne sont pas stringify (remplacés par marqueur)

> Important : c’est du **best-effort**. La conformité “PII safe” doit aussi être assurée côté code métier (ne jamais mettre de PII dans les champs) et côté stockage/transports si besoin.

### TODO — rétention

`MonitoringService.dispatch()` contient un TODO :

- appliquer l’**enforcement de la politique de rétention** là où les événements sont stockés (ex : Slack edge function, Sentry, etc.).

## Providers (transports)

Les providers implémentent `MonitoringProvider` :

- `providers/monitoring-provider.ts` : `capture(event: MonitoringEvent): Promise<void>`

Providers actuels :

- `ConsoleMonitoringProvider`
  - `debug`/`info` => `logger.log`
  - `warning` et + => `logger.warn`
  - inclut `userId`, `requestId`, `tags`, `extra` dans le metadata (mais après sanitization)
- `SlackMonitoringProvider`
  - envoyé uniquement si `severity` >= `"warning"` (pas `debug`/`info`)
  - en production seulement, si `supabaseEnv.isConfigured`
  - envoie via Edge Function (nom configurable par `EXPO_PUBLIC_MONITORING_SLACK_EDGE_FUNCTION_NAME`)
- `SentryMonitoringProvider`
  - stub no-op pour l’instant (interface en place, branchement futur sans changer l’API métier)

## Sélection automatique des providers

Définie dans `monitoring.ts` :

- En dev : `ConsoleMonitoringProvider`
- En prod : `SlackMonitoringProvider` si configuré
- Si aucun provider en prod : fallback console + warning via `logger`

## Exemple d’usage

### Message

```ts
monitoring.captureMessage({
  name: "mission_completion_rpc_failed",
  severity: "critical",
  feature: "missions",
  message: error.message ?? "submit_mission_completion RPC failed",
  extra: { missionId }, // doit être SanitizedData (string-only)
});
```

### Exception

```ts
monitoring.captureException({
  name: "app_bootstrap_failed",
  severity: "error",
  feature: "bootstrap",
  message: "App bootstrap failed",
  error, // unknown
});
```

## Ajouter un nouveau provider

1. Créer `providers/<new-provider>.ts` implémentant `MonitoringProvider`
2. Brancher son instanciation dans `monitoring.ts` (selon environnement/config)
3. S’assurer que les champs restent **PII-safe** via le pipeline `sanitizeMonitoringEvent()` (déjà appliqué par `MonitoringService`)
