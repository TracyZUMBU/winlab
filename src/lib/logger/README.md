# Logger centralisé (MVP)

Pourquoi un logger centralisé ?

- Pour éviter de multiplier les `console.*` partout dans l'application.
- Pour imposer une règle dev/prod cohérente (surtout pour `logger.error`).
- Pour garder une base simple et évolutive : demain, on pourra ajouter d’autres “transports” (Slack, Sentry, etc.) sans refactor l’ensemble de l’app.

## Règles dev / prod

- `logger.log`, `logger.info`, `logger.warn` sont actifs en développement comme en production.
- `logger.error(...)` est **réservé au développement** :
  - en production, `logger.error(...)` ne loggue rien (retour immédiat).

## Interface (API)

- `logger.log(message, metadata?)`
- `logger.info(message, metadata?)`
- `logger.warn(message, metadata?)`
- `logger.error(message, error?, metadata?)`

`metadata` est optionnel.
`error` accepte `unknown` et est normalisé au minimum côté logger (si c’est une instance de `Error`).

## Important : données sensibles

Le logger n’empêche pas automatiquement de logger des données sensibles.
Restez responsable : n’envoyez pas dans `message` ou `metadata` des secrets, tokens, mots de passe, ou données personnelles.

## Bon et mauvais usages

✅ Bon

```ts
import { logger } from "@/src/lib/logger";

logger.info("Onboarding - state persisté", { slideId });
logger.error("Logout failed", error);
```

❌ Mauvais

```ts
console.log("Debug"); // interdit
console.warn("Something"); // interdit
```

## Evolution future

Aujourd’hui, le logger utilise un transport console.
Demain, vous pourrez :

- router certains niveaux de logs vers un transport spécifique,
- enrichir la structure des événements,
  sans changer l’API `logger.*` utilisée partout dans le code.
