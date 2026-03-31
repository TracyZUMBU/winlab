# Winlab Admin

Application web interne (backoffice) du monorepo Winlab, en **React + TypeScript + Vite**.

## Structure `src/`

| Dossier | Rôle |
|--------|------|
| `app/` | `App` racine, `AdminLayout` (titre « Winlab Admin », zone contenu). |
| `pages/` | Une composante par écran (placeholder **Lotteries** pour l’instant). |
| `features/lotteries/` | Code métier loteries à faire grossir (sans mélanger avec les pages). |
| `components/ui/` | Primitives UI réutilisables quand le besoin apparaît. |
| `lib/` | Utilitaires / clients légers partagés. |
| `styles/` | Feuilles globales (ex. `global.css`). |
| `types/` | Types TS partagés côté admin. |

Pas de React Router ni TanStack Query pour l’instant : la page affichée est composée directement dans `App.tsx` ; on pourra extraire le routage plus tard.

## Commandes

Depuis ce dossier :

```bash
npm install
npm run dev
```

Depuis la **racine du monorepo** :

```bash
npm run admin:dev
npm run admin:build
npm run admin:preview
```

## Suite possible

Router, auth, Supabase, table de loteries : quand le flux produit le demande.
