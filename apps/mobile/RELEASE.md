# Release mobile (Android, iOS) et OTA (preview)

Ce document décrit **EAS Build** (APK / IPA) et **EAS Update** (OTA) pour l’app Winlab, avec **`runtimeVersion` dérivée de `expo.version`** (`policy: "appVersion"` dans `app.json`).

## Prérequis

- Compte Expo / projet lié (`extra.eas.projectId` dans `app.json`).
- **Android** : compte développeur Google si Play Store plus tard.
- **iOS** : compte **Apple Developer**, `bundleIdentifier` (`com.winlab.app`), credentials configurés avec EAS (`eas credentials` au besoin).
- CLI : `eas-cli` en `devDependency` ; depuis `apps/mobile`, `eas` est disponible via `npm run`.
- Répertoire de travail : `cd apps/mobile`.

## Fichiers et commandes

| Élément | Rôle |
|--------|------|
| `app.json` | `expo.version`, `expo.android.versionCode`, `expo.ios.buildNumber`, `runtimeVersion.policy: "appVersion"` |
| `eas.json` | Profils `preview` / `production` ; `appVersionSource: "local"` |
| `npm run bump:release -- <patch\|minor\|major>` | Incrémente `expo.version`, `android.versionCode`, **`ios.buildNumber`**, aligne `package.json` |
| `npm run build:apk` | `eas build --platform android --profile preview` |
| `npm run build:ios-preview` | `eas build --platform ios --profile preview` (IPA interne / testeurs) |
| `npm run build:ios-production` | `eas build --platform ios --profile production` (piste App Store / TestFlight) |
| `npm run submit:ios` | `eas submit --platform ios --profile production` |
| `npm run update:preview` | `eas update --channel preview` (OTA Android **et** iOS pour les binaires branchés sur `preview`) |

## Comportement de `runtimeVersion` (appVersion)

La runtime suit **`expo.version`** au moment du `eas build` ou du `eas update`.

- **OTA** : une install (APK ou IPA **preview**) ne reçoit une update que si **`expo.version` du bundle publié** = **celle embarquée dans le binaire**.  
  **Ne pas** lancer `bump:release` avant une release **uniquement OTA** : gardez la même `expo.version` que le dernier binaire **preview** distribué, puis `npm run update:preview`.
- **Nouveau binaire** : après un bump, la runtime change ; les appareils restés sur l’ancienne version **ne** reçoivent **pas** le bundle publié pour la nouvelle version tant qu’ils n’ont pas installé le nouvel APK / IPA.

En résumé : **natif ou nouvelle semver produit** → bump + build natif. **JS / assets bundle uniquement** → pas de bump, `update:preview`.

## Versions

| Champ | Plateforme | Rôle |
|-------|------------|------|
| **`expo.version`** (+ `package.json`) | Les deux | Version **semver** affichée (CFBundleShortVersionString / versionName). Incrémentée par `bump:release` quand vous préparez un **nouveau binaire**. |
| **`android.versionCode`** | Android | Entier **strictement croissant** pour les mises à jour par-dessus un APK. Géré par le script de bump. |
| **`ios.buildNumber`** | iOS | **CFBundleVersion** : doit **augmenter** à chaque upload App Store / TestFlight. Chaîne numérique (`"1"`, `"2"`, …), incrémentée par le même script. |
| **`runtimeVersion`** | Les deux | Dérivée de **`expo.version`** (policy `appVersion`), pas de valeur manuelle. |

Si des builds ont déjà été distribués **sans** ces champs dans le dépôt, positionnez `versionCode` / `buildNumber` **plus haut** que tout build déjà envoyé à Apple ou installé côté Android.

### Profil `production` et `autoIncrement`

Le profil **`production`** dans `eas.json` a **`autoIncrement: true`** : EAS peut encore ajuster les numéros de build côté serveur. Avec **`appVersionSource: "local"`**, la base reste `app.json`. En cas de doute avant une soumission iOS, vérifiez **`ios.buildNumber`** après le build dans les logs / sur App Store Connect.

## Quand rebuild natif vs OTA

### Rebuild (APK / IPA)

À privilégier si le **natif** change : SDK Expo, modules natifs, plugins `app.json`, permissions, icônes / splash, ou vous publiez une **nouvelle** `expo.version`.

### OTA (`npm run update:preview`)

JS/TS et assets du bundle **uniquement**, **sans** changer `expo.version` par rapport au dernier binaire **preview** en circulation.

Message optionnel :

```bash
npx eas update --channel preview --message "correctif écran login"
```

## iOS : aperçu des flux

| Objectif | Commande |
|----------|----------|
| IPA **preview** (interne, même channel OTA `preview` que l’APK) | `npm run build:ios-preview` |
| Build **production** (TestFlight / App Store) | `npm run build:ios-production` |
| Envoi à Apple après un build production | `npm run submit:ios` |

Les testeurs **preview** doivent avoir l’IPA **preview** installé pour recevoir les OTA du channel `preview`.

## Patch, minor, major

| Niveau | Exemple | Usage typique |
|--------|---------|----------------|
| **patch** | `1.2.3` → `1.2.4` | correctifs |
| **minor** | `1.2.3` → `1.3.0` | nouvelles fonctionnalités |
| **major** | `1.2.3` → `2.0.0` | rupture majeure |

## Checklist : release **native** (nouveau binaire)

1. Natif prêt (SDK, plugins, permissions, etc.).
2. `npm run bump:release -- patch` (ou `minor` / `major`).
3. Vérifier `app.json` : `expo.version`, `android.versionCode`, **`ios.buildNumber`**.
4. (Recommandé) Commit des fichiers de version.
5. Secrets / env sur [expo.dev](https://expo.dev).
6. Build : `npm run build:apk` et/ou `npm run build:ios-preview` ou `build:ios-production`.
7. iOS production : `npm run submit:ios` si besoin.
8. Tester sur appareil, diffuser.

## Checklist : **OTA** uniquement (`preview`)

1. Pas de changement natif ; **`expo.version` inchangée** (pas de `bump:release`).
2. `npm run update:preview`.
3. Ouvrir l’app sur un build **preview** (Android ou iOS) ; vérifier la récupération de l’update.

## Raccourci

- **Natif ou nouvelle semver ?** → `bump:release` + build(s) natif(s).
- **JS uniquement, même semver que le binaire en circulation ?** → `update:preview`.
