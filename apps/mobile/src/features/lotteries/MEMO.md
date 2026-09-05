# Mémo — Feature Loteries (mobile)

**Dernière revue du mémo :** 2026-07-20

## Objectif

Permettre à l’utilisateur de parcourir le marketplace de loteries (liste, catalogue, détail), d’acheter des tickets, et d’afficher les métadonnées produit (dont la **catégorie**) de façon lisible et localisée.

## Périmètre

- **Inclus :** écrans liste / catalogue / détail, cartes marketplace, achat de ticket, libellés de catégorie via i18n.
- **Hors périmètre :** tirage, fermeture des ventes, notifications résultats — voir `apps/admin/src/features/lotteries/MEMO.md` et le SQL associé.

## Libellés de catégorie (`utils/lotteryCategoryLabel.ts`)

Les IDs de catégorie persistés (ex. `entertainment`, `mode`) sont des identifiants stables ; l’UI ne les affiche pas tels quels lorsqu’une traduction existe.

| Étape | Comportement |
|--------|----------------|
| Normalisation | `resolveLotteryCategoryLabel` **trim** l’ID ; `null` / vide / blanc → `null` (rien à afficher). |
| Clé i18n | `lotteryCategoryTranslationKey(id)` → `lotteries.categories.<id>`. |
| Traduction connue | Si `t(key) !== key`, retourne le libellé localisé (`fr.json` / `en.json` sous `lotteries.categories.*`). |
| Clé manquante | **Fallback** sur l’ID **déjà trimé** (ex. catégorie legacy / inconnue `gift-card`) — pas de clé `unknown` dédiée. |

**Consommateurs :** `LotteryMarketplaceCard`, `LotteriesScreen`, `LotteriesCatalogScreen`, `LotteryDetailScreenMaquette`.

**Tests :** `utils/lotteryCategoryLabel.unit.test.ts`.

**Alignement admin :** le catalogue autorisé à la création est côté admin (`lotteryCategories.ts`) ; le mobile traduit tout ID reçu et retombe sur la valeur brute si la clé i18n est absente.

## Cartographie code (aperçu)

| Rôle | Fichiers principaux |
|------|---------------------|
| Libellés catégorie | `utils/lotteryCategoryLabel.ts` |
| Liste / catalogue / détail | `screens/LotteriesScreen.tsx`, `LotteriesCatalogScreen.tsx`, `LotteryDetailScreen*.tsx` |
| Cartes UI | `components/LotteryMarketplaceCard.tsx`, … |
| Données | `services/getAvailableLotteriesPage.ts`, `getLotteryById.ts`, hooks / query keys associés |

**Règle d’archi :** pas d’appel Supabase depuis les écrans ; services → hooks → UI.

## i18n

Préfixe catégories : `lotteries.categories.*` dans `apps/mobile/src/i18n/locales/fr.json` et `en.json`.
