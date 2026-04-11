# CI & Testing Guide

## Objectif

Ce projet utilise une stratégie de validation en **3 niveaux** pour garantir la qualité du code :

1. **Pre-push local** (rapide)
2. **CI standard GitHub** (qualité applicative)
3. **CI Supabase** (tests d’intégration avec DB réelle)

---

## Architecture globale

```text
Local
 └── pre-push (lint + typecheck)

GitHub Actions
 ├── ci.yml (lint + typecheck + unit tests + build)
 └── supabase-integration.yml (tests d’intégration avec Supabase)
```

---

## 1. Pre-push (local)

### Rôle

Empêcher d’envoyer du code cassé.

### Déclenchement

Automatique lors d’un :

```bash
git push
```

### Vérifications

- lint
- typecheck

Les workspaces concernés incluent notamment `admin`, `mobile`, `@winlab/monitoring` et `@winlab/supabase-test-utils` (lorsque les scripts existent).

### Ne fait pas

- tests
- Supabase
- build

---

## 2. CI standard (`ci.yml`)

### Rôle

Valider la qualité du code applicatif.

### Déclenchement

- `pull_request`
- `push` sur `main`

### Étapes

- installation (`npm ci`)
- lint
- typecheck
- tests unitaires
- build

### Ne fait pas

- tests Supabase
- migrations
- infra DB

---

## 3. CI Supabase (`supabase-integration.yml`)

### Rôle

Tester les **intégrations réelles** avec Supabase.

### Déclenchement

- manuel (`workflow_dispatch`)
- `push` sur `main`

### Étapes

- install deps
- install Supabase CLI
- start Supabase local
- reset DB (migrations)
- lancer tests d’intégration

---

## Types de tests

### Tests unitaires

#### Rôle

Tester une logique isolée.

#### Exemple

- fonctions utilitaires
- logique métier pure
- services mockés

#### Ne doivent PAS utiliser

- Supabase
- DB
- RPC

#### Commandes

Dans chaque app, `test` et `test:unit` sont équivalents (Jest, projet `unit`) :

```bash
npm run test -w admin
npm run test -w mobile
# ou explicitement
npm run test:unit -w admin
npm run test:unit -w mobile
```

---

### Tests d’intégration

#### Rôle

Tester le système avec Supabase réel.

#### Exemple

- RPC
- accès DB
- RLS
- Edge Functions

#### Nécessite Supabase local

---

## Commandes utiles

### Préparer Supabase local

```bash
npm run supabase:test:prepare
```

Lance :

- `supabase start`
- `supabase db reset`

---

### Tests unitaires

```bash
npm run test -w admin
npm run test -w mobile
```

---

### Tests d’intégration

```bash
npm run supabase:test:prepare

npm run test:integration -w admin
npm run test:integration -w mobile
```

---

## Workflow GitHub Supabase

### Lancer manuellement

1. Aller dans **Actions**
2. Cliquer sur **Supabase integration tests**
3. Cliquer sur **Run workflow**
4. Choisir la branche
5. Lancer

---

## Quand utiliser quoi ?

### Pendant le dev

```bash
git push
```

Le pre-push s’exécute automatiquement.

---

### Avant PR

```bash
npm run test -w admin
npm run test -w mobile
```

---

### Si tu modifies Supabase

```bash
npm run supabase:test:prepare
npm run test:integration -w admin
npm run test:integration -w mobile
```

---

### Sur GitHub

- PR → CI standard
- tests Supabase → manuel ou `main`

---

## Debug

### Push bloqué

→ lint / typecheck

### CI échoue

→ voir l’étape en erreur dans **Actions**

### Supabase échoue

→ vérifier :

- Docker
- migrations
- `.env.test.local`
- tests d’intégration

---

## Philosophie

On sépare :

| Niveau      | Objectif        | Vitesse       |
| ----------- | --------------- | ------------- |
| Pre-push    | Feedback rapide | Très rapide   |
| CI standard | Qualité app     | Rapide        |
| CI Supabase | Réalisme DB     | Plus lent     |

---

## Résumé

- `git push` → vérification locale
- PR → validation app
- Supabase → validation complète (manuelle ou sur `main`)
