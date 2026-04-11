# Admin hardening roadmap

## Objectif

Lister les améliorations techniques à faire sur le backoffice admin une fois les features principales stabilisées.

Ce document sert de **rappel des dettes techniques non bloquantes** identifiées lors de la mise en place de :

- monitoring partagé mobile / admin
- service layer front
- RPC admin sécurisées

---

## Légende

- [ ] À faire
- [x] Terminé

---

## Phase 1 — Monitoring mobile (cleanup)

### Objectif

Éviter les doublons d’événements monitoring et améliorer la qualité des signaux envoyés (Slack / futur Sentry).

### Tâches

- [ ] corriger le double envoi potentiel dans `sendEmailOtp.ts`
  - aujourd’hui : `captureException` + `captureMessage` possibles pour un même flow
  - attendu : un seul événement par erreur logique

- [ ] vérifier les autres flows similaires (auth, profile, missions)
  - éviter les duplications silencieuses

- [ ] définir une règle claire :
  - 1 erreur technique = 1 événement monitoring

---

## Phase 2 — Query error handling (mutualisation)

### Objectif

Éviter la duplication progressive de `queryCacheOnError` entre mobile et admin.

### Tâches

- [ ] analyser les différences entre :
  - `apps/mobile/src/lib/query/queryCacheOnError.ts`
  - `apps/admin/src/lib/query/queryCacheOnError.ts`

- [ ] décider si une version partagée est pertinente

- [ ] si oui :
  - [ ] extraire dans un module commun (ex: `packages/query-monitoring`)
  - [ ] rendre configurable :
    - mapping des `feature`
    - filtres (cancelled, network, etc.)

- [ ] sinon :
  - [ ] documenter explicitement pourquoi les deux implémentations divergent

---

## Phase 3 — Logger unifié (optionnel)

### Objectif

Évaluer si le `logger` doit être mutualisé entre mobile et admin.

### Contexte

Aujourd’hui :

- mobile → `logger` custom avec transport console
- admin → pas de logger structuré équivalent
- monitoring partagé déjà en place

### Tâches

- [ ] évaluer les besoins réels côté admin :
  - logs debug ?
  - logs métier ?
  - besoin de format structuré ?

- [ ] décider si mutualisation utile ou non

- [ ] si oui :
  - [ ] extraire un `@winlab/logger`
  - [ ] rendre compatible web + mobile (pas de dépendance RN)

- [ ] sinon :
  - [ ] documenter la décision (monitoring seul suffisant)

---

## Notes

- ces sujets ne sont **pas bloquants** pour le développement fonctionnel
- ils doivent être traités **avant montée en production complète**
- ne pas les traiter tant que les features principales de l’admin ne sont pas stabilisées

---

## Journal

- 2026-04 — création du document suite à mise en place du monitoring partagé
