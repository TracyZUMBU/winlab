# Mémo — Feature Splash (mobile)

**Dernière revue du mémo :** 2026-09-05

## Objectif

Afficher un écran de démarrage **Wintix** (logo, nom, barre de progression) pendant le bootstrap, au lieu de laisser le splash **natif Expo** recouvrir tout le chargement.

## Périmètre

- **Inclus :** splash React (`/`), masquage du splash natif dès que cet écran est peint, durée minimale visible, redirection après bootstrap.
- **Hors scope :** supprimer complètement le splash natif (imposé par iOS/Android tant que le JS n’est pas chargé).

## Flux

1. Le binaire affiche le splash **natif** (image + fond dans `app.config.js`) pendant le chargement du bundle JS.
2. `preventAutoHideAsync()` empêche Expo de le cacher trop tôt (évite un flash blanc).
3. Dès que `SplashScreen` est peint (`onLayout`), `hideAsync()` révèle le splash React.
4. On reste sur `/` jusqu’à `status === "ready"` **et** `SPLASH_MIN_VISIBLE_MS` (1,8 s).
5. `_layout` redirige via `redirectTo` (onboarding / auth / app).

Le splash natif ne peut pas afficher texte ni barre de progression. Il est configuré pour **ressembler** au splash React (même fond `#F4F7FC`, même `icon.png`) afin que le court instant natif ne montre plus le logo Expo.

## Cartographie

| Rôle | Fichier |
|------|---------|
| Route `/` | `apps/mobile/app/index.tsx` |
| UI React | `screens/SplashScreen.tsx` |
| Durée min. | `constants.ts` (`SPLASH_MIN_VISIBLE_MS`) |
| Condition de sortie | `utils/shouldLeaveSplashRoute.ts` |
| Redirect + bootstrap | `apps/mobile/app/_layout.tsx` |
| Splash natif | plugin `expo-splash-screen` dans `app.config.js` |

## Déploiement

Changer l’image / les couleurs du splash **natif** exige un **rebuild natif** (`eas build`). Le timing JS (masquage + durée min.) s’applique sans rebuild.

## Tests

- `utils/shouldLeaveSplashRoute.unit.test.ts`
