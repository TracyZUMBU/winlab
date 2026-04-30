---
name: review
description: Review the latest git commit and produce a prioritized French code review report focused on business logic, security, TypeScript quality, performance, and project consistency. Use when the user asks for /review, asks for a code review, or wants feedback on the latest commit.
---

# /review - Code Review du dernier commit

## Objectif

Analyser le dernier commit Git et produire une synthese de review priorisee, exploitable rapidement avant merge.

## Quand utiliser ce skill

- La demande contient `/review`
- L'utilisateur demande une review du dernier commit
- L'utilisateur veut un retour qualite/risque avant merge

## Workflow

1. Recuperer le diff du dernier commit.
2. Identifier les fichiers modifies et le contexte fonctionnel.
3. Evaluer les changements selon les priorites ci-dessous (dans l'ordre).
4. Si des requetes Supabase sont modifiees, verifier la coherence avec le schema via MCP Supabase.
5. Produire la synthese en francais avec le format de sortie impose.

## Priorites d'analyse (ordre strict)

1. **Logique metier & bugs**  
   Erreurs de logique, edge cases non geres, comportements inattendus, conditions manquantes.
2. **Securite**  
   Failles RLS Supabase, exposition de donnees sensibles, auth mal geree, variables d'environnement exposees.
3. **Qualite TypeScript**  
   Types `any` injustifies, types manquants, assertions non sures (`as`, `!`), interfaces incompletes.
4. **Performance**  
   Requetes N+1, appels Supabase non optimises, re-renders inutiles, operations couteuses en boucle.
5. **Coherence projet**  
   Nommage, patterns deja utilises dans la codebase, structure des fichiers.

## Format de sortie (obligatoire)

### ✅ Ce qui est bien

Liste courte (max 3 points) de ce qui est bien fait dans le commit.

### 🚨 Bloquants

Problemes critiques a corriger avant merge. Pour chaque point :

- **Fichier + ligne** concerne
- **Probleme** explique en une phrase
- **Correction** sous forme d'extrait de code corrige

### ⚠️ Suggestions

Ameliorations non bloquantes, max 5 points, format court.

### 📊 Score

Note globale /10 avec une phrase de conclusion.

## Regles

- Si le commit ne contient que des changements mineurs (typos, commentaires), le signaler et abreger l'analyse.
- Ne jamais inventer des problemes qui n'existent pas.
- Les corrections proposees doivent etre compatibles avec le reste de la codebase.
- Toujours utiliser le MCP Supabase pour verifier la coherence avec le schema si des requetes sont modifiees.
- Toujours repondre en francais.
