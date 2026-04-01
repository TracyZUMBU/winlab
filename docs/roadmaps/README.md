# Roadmaps et travail en discontinu

Ce dossier regroupe les **plans multi‑phases**, **backlogs** et **checklists** qui ne tiennent pas dans une seule PR : chantiers étalés dans le temps, validations intermédiaires, sujets repris « entre deux » sprints.

## Quand y ajouter un document

Créer un nouveau fichier ici lorsque :

- le travail est **transversal** ou **long** (plusieurs modules, plusieurs merges) ;
- tu veux un **document vivant** à cocher (`[ ]` / `[x]`) plutôt qu’une seule issue ;
- le sujet peut être **mis en pause** puis **repris** sans perdre le fil.

## Convention de nommage

- **`<sujet>-roadmap.md`** — phases, objectifs, critères de done ;
- **`<sujet>-backlog.md`** — liste de tâches sans structure en phases (optionnel).

Utiliser le **kebab-case** pour le nom de fichier.

## À la création d’un nouveau fichier

1. Titre et **objectif** en tête ;
2. lien vers la **doc normative** du sujet (si elle existe), avec chemin relatif correct (`../…`) ;
3. **Légende** des cases à cocher ;
4. sections **par phase** ou **par thème** ;
5. section **Journal** (optionnelle) pour noter dates / PRs ;
6. ajouter une ligne dans la table **Index** ci‑dessous.

## Index

| Document | Sujet |
|----------|--------|
| [error-handling-stabilization-roadmap.md](./error-handling-stabilization-roadmap.md) | Stabilisation gestion d’erreurs (mobile, conventions, monitoring queries) |
