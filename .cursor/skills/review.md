# /review — Code Review du dernier commit

## Description

Analyse le dernier commit Git et produit une synthèse de code review priorisée.

## Déclencheur

`/review`

## Process

1. Récupère le diff du dernier commit via Git
2. Analyse les changements selon les priorités ci-dessous
3. Produit une synthèse structurée

## Priorités d'analyse (dans l'ordre)

1. **Logique métier & bugs** — erreurs de logique, edge cases non gérés, comportements inattendus, conditions manquantes
2. **Sécurité** — failles RLS Supabase, exposition de données sensibles, auth mal gérée, variables d'environnement exposées
3. **Qualité TypeScript** — types `any` injustifiés, types manquants, assertions non sûres (`as`, `!`), interfaces incomplètes
4. **Performance** — requêtes N+1, appels Supabase non optimisés, re-renders inutiles, opérations coûteuses en boucle
5. **Cohérence projet** — nommage, patterns utilisés ailleurs dans la codebase, structure des fichiers

## Format de sortie

### ✅ Ce qui est bien

Liste courte (max 3 points) de ce qui est bien fait dans ce commit.

### 🚨 Bloquants

Problèmes critiques à corriger avant de merger. Pour chaque problème :

- **Fichier + ligne** concerné
- **Problème** expliqué en une phrase
- **Correction** : extrait de code corrigé

### ⚠️ Suggestions

Améliorations non bloquantes, max 5 points, format court.

### 📊 Score

Note globale /10 avec une phrase de conclusion.

## Règles

- Si le commit ne contient que des changements mineurs (typos, commentaires), le signaler et abréger l'analyse
- Ne jamais inventer des problèmes qui n'existent pas
- Les corrections proposées doivent être compatibles avec le reste de la codebase
- Toujours utiliser le MCP Supabase pour vérifier la cohérence avec le schéma si des requêtes sont modifiées
- Répondre en français
