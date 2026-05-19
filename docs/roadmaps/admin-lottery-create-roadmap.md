# Admin — Création de loterie (roadmap)

## Objectif

Permettre à un **admin non technique** de créer une loterie depuis le backoffice (`/lotteries`), avec formulaire guidé, valeurs par défaut, erreurs en langage clair, et persistance sécurisée via RPC.

**Doc liée (comportement loterie existant)** : [apps/admin/src/features/lotteries/MEMO.md](../../apps/admin/src/features/lotteries/MEMO.md)

**Hors scope MVP** : édition, duplication, annulation (flux dédié), upload image, audit `created_by`, changements app mobile, limite mise en avant.

---

## Légende

- [ ] À faire
- [x] Terminé

---

## Décisions produit (validées)

### Parcours

- Un seul admin fait tout (création → publication via statut → tirage depuis le détail).
- Clic **Créer une loterie** → panneau slide à droite → **Enregistrer** = loterie créée avec le statut choisi → redirection **détail** (`?detail=`).
- Pas d’étape « enregistrer brouillon » vs « publier » séparée.
- **Jamais modifier** une loterie après le **premier achat** (règle produit ; pas d’UI édition en MVP).

### Libellés (langage courant)

| Colonne DB   | Libellé UI   |
|-------------|--------------|
| `starts_at` | Ouverture    |
| `ends_at`   | Fin          |
| `draw_at`   | Tirage       |

### Valeurs par défaut (à l’ouverture du panneau)

| Champ | Défaut |
|-------|--------|
| Marque | Winlab : `VITE_ADMIN_DEFAULT_LOTTERY_BRAND_ID` si défini, sinon marque `slug = winlab` |
| Ouverture | Maintenant (date + heure, affichage Europe/Paris, stockage UTC) |
| Fin | Ouverture + 21 jours calendaires, **23:59** Paris |
| Tirage | Jour civil **suivant** la date de fin, **12:00** Paris |
| Prix ticket | 50 jetons (min. 1) |
| Nombre de gagnants | 1 (min. 1) |
| Statut | `draft` |
| Mise en avant | `false` |
| Slug | Auto depuis titre, **jamais affiché**, **figé** à la première création |

### Statuts à la création

- Liste : `draft`, `active`, `closed`, `drawn`.
- **`cancelled` masqué** (pas de flux annulation MVP).

### Slug

- Généré à partir du titre.
- Collision : **warning** UI (non bloquant) ; serveur ajoute suffixe `-2`, `-3`, …
- Le slug ne change plus si le titre change (hors MVP édition).

### Champs formulaire

**Obligatoires (DB + produit)** : marque, titre, ouverture, fin, tirage, prix ticket, nombre de gagnants, statut.

**Optionnels** : résumé court (aide : message court pour la carte), description (texte simple), image (URL ; upload plus tard), catégorie (select **uniquement** valeurs `DISTINCT` déjà en DB).

### Fuseau

- Saisie perçue : **Europe/Paris**.
- Stockage : **UTC**.

### Validation

- Toutes les règles pertinentes sont **bloquantes** à l’enregistrement.
- Messages **humains** (jamais noms de contraintes SQL).
- Pas d’alerte si tirage « proche » de la fin.

### Règles métier (rappel — tooltips si utile)

- Ordre dates : ouverture < fin ; ouverture < tirage ; fin ≤ tirage.
- `draft` : non visible app.
- `active` : achat possible dans la fenêtre (voir `buy_ticket`).
- Fin des ventes : passage auto `active` → `closed` (cron / trigger) — pas besoin de détailler côté opérateur.
- Tirage : manuel depuis détail admin quand `closed` + date de tirage passée.

### Technique

- Création via RPC **`admin_create_lottery`** (`SECURITY DEFINER` + `is_admin`), pas d’`INSERT` client direct.
- Tous environnements (local, staging, prod).

---

## Phases d’implémentation

Chaque phase se termine par **validation produit** avant la suivante.

### Phase 0 — Documentation

- [x] Créer ce fichier
- [x] Mettre à jour [README.md](./README.md) (index)

### Phase 1 — Backend RPC

- [x] Migration `admin_create_lottery`
- [x] Miroir `supabase/schemas/functions/admin_create_lottery.sql`
- [x] Test intégration `admin-create-lottery.integration.test.ts`

### Phase 2 — Admin couche données

- [x] Types + `createAdminLottery` service
- [x] Mutation + invalidation liste
- [x] `getLotteryCategoryOptions` (distinct DB via RPC `admin_get_lottery_categories`)
- [x] Marque par défaut (env id / slug `winlab`)
- [x] Messages d’erreur FR

### Phase 3 — Utilitaires formulaire

- [x] Defaults calendrier Paris → UTC
- [x] Validation client (miroir règles)
- [x] Warning doublon titre / slug

### Phase 4 — UI panneau

- [x] `CreateLotteryPanel` (slide droite)
- [x] Tooltips / aides courtes

### Phase 5 — Intégration liste

- [x] Bouton sur `LotteriesPage`
- [x] Redirect détail après création

---

## Backlog post-MVP

- [ ] Édition loterie (uniquement si `tickets_count = 0`)
- [ ] Flux annulation + statut `cancelled` en UI
- [ ] Upload image (Storage) en plus de l’URL
- [ ] Description Markdown / règlement loterie
- [ ] Duplication « à partir de »
- [ ] Audit `created_by` / rôles opérateurs
- [ ] Règles mise en avant (quota, validation)
- [ ] Catégories : table de référence + admin dédié
- [ ] RPC `admin_update_lottery` avec garde « pas de ticket vendu »

---

## Journal

| Date | Événement |
|------|-----------|
| 2026-05-19 | Spec produit validée (création admin, MVP) |
| 2026-05-19 | Phase 0 — roadmap créée |
| 2026-05-19 | Phase 1 — RPC `admin_create_lottery` + tests intégration |
| 2026-05-19 | Phase 2 — services admin, mutation, RPC catégories, messages FR |
| 2026-05-19 | Phase 3 — utils formulaire (Paris/UTC, validation, warning slug) |
| 2026-05-19 | Phase 4 — `CreateLotteryPanel` + aides opérateur |
| 2026-05-19 | Phase 5 — bouton liste + redirect détail (`?detail=`) |
