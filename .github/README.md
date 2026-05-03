# CI & Testing Guide

## Objectif

Ce projet utilise une stratégie de validation en **3 niveaux** pour garantir la qualité du code :

1. **Pre-push local** (lint + typecheck uniquement)
2. **CI standard GitHub** (qualité applicative sur chaque PR)
3. **CI Supabase** (intégration sur chaque PR vers `main`, sur push `main`, et manuel)

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

- tests (unitaires ou intégration)
- Supabase / Docker
- build production

Les tests d’intégration Supabase passent sur **GitHub Actions** (voir section 3) ; en local tu peux lancer `npm run supabase:test:integration` avant d’ouvrir une PR si tu touches au schéma ou aux RPC.

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

- **`pull_request`** ciblant `main` (chaque **nouveau commit** poussé sur la branche de la PR relance le workflow)
- `push` sur `main` (après merge)
- manuel (`workflow_dispatch`)

### Bloquer le merge si les tests échouent

Dans GitHub : **Settings** → **Branches** → règle sur `main` (ou **Rulesets**), active **Require status checks to pass before merging**, puis ajoute le check correspondant au job, en général :

`Supabase integration tests / Integration tests (Jest + local Supabase)`

(le libellé exact apparaît dans l’onglet **Checks** d’une PR après au moins un run du workflow).

Tant que ce check est rouge, le bouton **Merge** reste désactivé ; un **nouveau push** sur la branche `X` met à jour la PR et relance la CI jusqu’à ce que les tests passent.

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
npm run supabase:test:integration
```

(équivalent à `supabase:test:prepare` + génération des `.env.test.local` + `test:integration` admin et mobile.)

---

### Sur GitHub

- PR vers `main` → **CI standard** + **tests d’intégration Supabase** (voir règle de branche ci-dessus pour imposer le vert avant merge)

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
