# `@winlab/monitoring`

Couche **framework-agnostic** pour le monitoring incident (messages + exceptions) partagée entre les apps Winlab.

## Contenu

- Types d’événements (`MonitoringEvent`, sévérités, `extra` string-only, etc.)
- `MonitoringService` (`captureMessage`, `captureException`)
- Sanitization / pseudonymisation (`sanitizeMonitoringEvent`, hash `userId`)
- `normalizeError`
- Providers : `ConsoleMonitoringProvider`, `SlackMonitoringProvider`, `SentryMonitoringProvider` (stub)

## Convention `service`

Le champ **`service`** sur chaque événement distingue les clients (pas de champ `source` séparé) :

| Application | Valeur stable |
|-------------|----------------|
| Mobile Expo | `winlab-mobile` (défaut ; surcharge possible via `EXPO_PUBLIC_SERVICE_NAME`) |
| Admin Vite | `winlab-admin` |

## Slack (Edge Function)

Le provider Slack appelle `supabase.functions.invoke(<nom>, { body: { event } })`.  
L’Edge Function `supabase/functions/monitoring-slack` attend ce contrat ; le secret `SLACK_WEBHOOK_URL` reste côté Supabase.

### Sévérités envoyées vers Slack

**Debug (temporaire)** : toutes les sévérités (`debug`, `info`, `warning`, `error`, `critical`) sont relayées vers Slack. Il existe des **TODO** dans `SlackMonitoringProvider` et dans `supabase/functions/monitoring-slack` pour rétablir un filtre (ex. seulement `warning+`) une fois l’investigation terminée.

Sans `SLACK_WEBHOOK_URL` sur la fonction, aucun message Slack ne part ; la fonction répond en erreur pour que l’échec de configuration soit visible côté client.

La réponse réussie attendue par le provider mobile est le corps **`ok`** (voir implémentation).

## Bootstrap par app

Chaque app instancie `MonitoringService` avec ses propres providers (dev/prod, client Supabase injecté). Voir :

- `apps/mobile/src/lib/monitoring/monitoring.ts`
- `apps/admin/src/lib/monitoring/monitoring.ts`

## Limites

- **Logger applicatif** (`apps/mobile/src/lib/logger`) reste spécifique mobile pour l’instant.
- **Sentry** : interface prête ; implémentation SDK à brancher dans `SentryMonitoringProvider`.
