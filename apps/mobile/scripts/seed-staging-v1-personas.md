# Seed staging v1 — matrice personas

Documentation de référence pour la **matrice métier** des comptes générés par [`seed-staging-v1.ts`](./seed-staging-v1.ts).

Exécution : `npm run seed:staging:v1` (depuis `apps/mobile`), avec `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans l’environnement.

Les volumes indiqués sont la **cible persona** (scénarios de test). Si le script évolue, mettre à jour ce fichier en parallèle.

## Comptes de test

| Clé seed   | Email                             | Mot de passe   |
| ---------- | --------------------------------- | -------------- |
| `new_user` | `seed.new.user@booknglow.app`     | `SeedUser123!` |
| `active_user` | `seed.active.user@booknglow.app` | `SeedUser123!` |
| `power_user` | `seed.power.user@booknglow.app`  | `SeedUser123!` |
| `winner_user` | `seed.winner.user@booknglow.app` | `SeedUser123!` |
| `referrer_user` | `seed.referrer.user@booknglow.app` | `SeedUser123!` |
| `referred_user` | `seed.referred.user@booknglow.app` | `SeedUser123!` |

### Connexion dans l’app (dev)

En build **développement** (`__DEV__`), l’écran email affiche un bloc **Mode développement** : saisir le même email que dans le tableau et le mot de passe `SeedUser123!` pour appeler `signInWithPassword` (sans OTP). Les builds release n’affichent pas ce bloc.

Pour le flux OTP classique en local, les mails Auth sont visibles dans **Inbucket** (souvent `http://127.0.0.1:54324` après `supabase start`).

## Matrice par persona

| Persona         | Missions complétées | Tickets | Victoires (loterie) | Parrainages | Transactions wallet |
| --------------- | ------------------- | ------- | ------------------- | ----------- | --------------------- |
| **new_user**    | 0                   | 0       | 0                   | 0           | 0 à 1                 |
| **active_user** | 3                   | 3       | 0                   | 0           | 6 à 8                 |
| **power_user**  | 5 à 6               | 10      | 1 possible          | 0           | 12 à 18               |
| **winner_user** | 1 à 2               | 5       | 1                   | 0           | 5 à 7                 |
| **referrer_user** | 1                 | 2       | 0 ou 1              | 2           | 4 à 6                 |
| **referred_user** | 0 à 1             | 0 à 1   | 0                   | 1 entrant   | 1 à 3                 |

### Détail des colonnes

- **Missions complétées** : lignes `mission_completions` (tous statuts confondus, sauf précision produit).
- **Tickets** : tickets de loterie actifs liés à l’utilisateur.
- **Victoires** : entrées `lottery_winners`.
- **Parrainages** : lignes `referrals` (sortants pour le parrain, entrant pour le filleul).
- **Transactions wallet** : lignes `wallet_transactions` (crédits + débits).
