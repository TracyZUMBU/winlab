# Mémo - Feature Loterie (admin & orchestration)

**Dernière revue du mémo : 2026-05-03** — plan validé ; **phases A + B + C** : SQL `20260513120000` → `20260513120400` + batch `20260513130000` + cron `20260513130100` ; Edge **`lottery-results-notify-cron`**.

## Règles métiers — `run_lottery`

1. Loterie existante — sinon `LOTTERY_NOT_FOUND`.
2. Statut = **`closed`** uniquement — sinon `LOTTERY_*` (déjà tirée, annulée, brouillon, pas fermée, etc.).
3. Dates : `draw_at <= now()` ; **`ends_at <= now()`** (après migration, **`ends_at` est NOT NULL** partout — plus de branche « si renseigné »).
4. Tickets éligibles au tirage : `lottery_tickets` pour la loterie, `status = 'active'`, absents de `lottery_winners`.
5. Nombre de gagnants : `min(tickets éligibles, number_of_winners)` — peut être 0.
6. Après exécution : statut **`drawn`** ; retour des `ticket_id` gagnants (ou `[]`).

Réf. SQL : `supabase/schemas/functions/run_lottery.sql`.  
Tirage manuel depuis l’admin : Edge `admin-run-lottery` + UI `AdminRunLotterySection` / `runAdminLottery.ts`.

---

## Fermeture des ventes (`active` → `closed`)

- **Schéma** : migration pour **`lotteries.ends_at` NOT NULL** (backfill `ends_at = draw_at` si NULL), nouvelle contrainte `lotteries_dates_are_valid` sans branche `ends_at IS NULL`. `draw_at` **ne sert pas** à passer en `closed`.
- **Trigger `BEFORE INSERT OR UPDATE` sur `lotteries`** (`lotteries_enforce_close_after_ends_at`) : si la ligne est encore **`active`** et **`ends_at <= now()`**, passage à **`closed`** (mise à jour `updated_at`).
- **Trigger `AFTER INSERT` sur `lottery_tickets`** : après un achat, tente la même fermeture si la fenêtre est dépassée (couvre le cas sans autre événement sur la ligne `lotteries`).
- **Fonction batch** : `public.close_lotteries_past_ends_at()` (SECURITY DEFINER, **`service_role` uniquement**) — appelée toutes les **5 minutes** en local / prod via **pg_cron**, job **`close-lotteries-past-ends-at`** (`SELECT public.close_lotteries_past_ends_at();`). Migration : `20260513120300_schedule_close_lotteries_pg_cron.sql`. Pas de cron Edge pour cette transition.
- **Miroirs** : `supabase/schemas/tables/lottery_results_notify_runs.sql`, `supabase/schemas/functions/lottery_auto_close_after_ends_at.sql`, `run_lottery.sql` / `buy_ticket.sql` alignés.

### Phase B — requêtes « résultats push » (SQL)

- **`public.lottery_drawn_ids_pending_results_push(p_max integer default 200)`** : loteries **`drawn`** sans item **`completed`**, et **sans** item **`pending`** rattaché à un run dont **`finished_at` est NULL** (évite double prise en charge pendant un batch Edge). Plafond `p_max`, max serveur 2000. **`service_role` uniquement**.
- **`public.lottery_results_notify_start_batch(p_max integer default 50)`** : en une transaction, crée un **`lottery_results_notify_runs`** et des **`lottery_results_notify_run_items`** en **`pending`** pour jusqu’à `p_max` loteries éligibles (cap serveur **500**). Retourne **`jsonb`** `{ run_id, lottery_ids }` ; si aucune éligible, **`run_id`** null et **`lottery_ids`** `[]`.
- **`public.lottery_results_notify_finalize_run(p_run_id uuid)`** : passe les items **`pending`** du run en **`completed`** et renseigne **`finished_at`** sur le run. **`service_role` uniquement**.
- **`public.lottery_results_notify_distinct_participant_user_ids(p_lottery_ids uuid[])`** : **`DISTINCT user_id`** parmi les tickets **`active`** pour les loteries données (aligné sur le modèle actuel : `run_lottery` ne passe pas les tickets en `cancelled`). **`service_role` uniquement**.
- Miroirs : `supabase/schemas/functions/lottery_results_notify_queries.sql`, `lottery_results_notify_batch.sql`, `lottery_results_notify_invoke_edge_cron.sql`. Migrations : `20260513120400_lottery_results_notify_sql_helpers.sql`, `20260513130000_lottery_results_notify_batch.sql`, `20260513130100_schedule_lottery_results_notify_edge_cron.sql`. Tests : `apps/mobile/tests/integration/lottery-results-notify-queries.integration.test.ts`.

---

## Tirage (`closed` → `drawn`)

- À des jours/heures prévus, les **admins** ouvrent le **dashboard admin** et lancent **`run_lottery`** via le bouton (pas d’automatisation du tirage).

---

## Notifications « résultats disponibles » (participants)

### Comportement (validé)

- **Périodicité** : job planifié toutes les **X** minutes (ex. **5 min** — ajustable).
- **Option A (retenue)** : **aucun trigger** à l’insertion / passage `drawn` pour alimenter une file. **Tout est fait dans le cron** :
  1. créer une ligne **`lottery_results_notify_runs`** ;
  2. sélectionner les loteries en statut **`drawn`** encore éligibles (pas déjà traitées avec succès selon les tables d’items — voir idempotence) ;
  3. insérer les lignes **`lottery_results_notify_run_items`** (`run_id`, `lottery_id`, statut `pending` → `completed` / `failed`) ;
  4. agréger les **utilisateurs participants** : au moins un ticket **`active` au moment du tirage** sur l’une de ces loteries (détail SQL exact à aligner avec l’état des tickets après `run_lottery` lors de l’implémentation) ;
  5. **dédoublonner par `user_id`** ;
  6. envoyer **une seule push générique** par utilisateur et par run (ex. _« Découvrez si vous avez gagné une loterie — les résultats sont disponibles »_), **pas** une push par loterie.

### Idempotence — **option 2 (v1)**

- Tables **`lottery_results_notify_runs`** et **`lottery_results_notify_run_items`** (**créées en phase A**, RLS activé, accès **`service_role`** uniquement) : tracer chaque vague et chaque loterie ; une loterie ne doit pas être **re-notifiée** une fois un item en **`completed`** (index unique partiel sur `lottery_id` WHERE `status = 'completed'`). Phases **B** (SQL) et **C** (Edge + cron) sont implémentées ; la validation manuelle post-release repose sur la checklist **Tests internes post-release** ci-dessous.

### TODO[FUTURE] — **option 3 (v2-fiabilité-push)**

- Plus tard : **outbox / file d’attente** avec unicité **`(campagne ou run_id, user_id)`**, retries explicites, et réduction du risque de doublons en cas de crash au milieu d’un batch.
- Remplacer ou enrichir l’option 2 quand le volume ou les exigences de fiabilité l’exigeront.

### Phase C — Edge `lottery-results-notify-cron`

- **Fichier** : `supabase/functions/lottery-results-notify-cron/index.ts`. **`supabase/config.toml`** : `[functions.lottery-results-notify-cron]` avec **`verify_jwt = false`** (auth = secret dédié).
- **Appel** : `POST` ou `GET` vers l’URL déployée ; en-tête **`X-Winlab-Cron-Secret`** = variable **`LOTTERY_RESULTS_NOTIFY_CRON_SECRET`** (à définir en prod / sur le projet Edge). Pas de JWT admin.
- **Flux** : `lottery_results_notify_start_batch` → `lottery_results_notify_distinct_participant_user_ids(p_lottery_ids)` (une push générique **par utilisateur** pour la vague) → Expo → `lottery_results_notify_finalize_run`. Si **`start_batch`** ne trouve rien : réponse **`ok: true`, `skipped: true`**.
- **Échec d’orchestration** (RPC participants, finalisation, exception) : **suppression du run** (`DELETE` sur `lottery_results_notify_runs`) pour recascade les items et **réessayer** les loteries au prochain cron. Les pushes Expo déjà envoyées avant l’échec peuvent théoriquement se **répéter** au retry (cf. TODO option 3 outbox).
- **Variables optionnelles** : **`LOTTERY_RESULTS_NOTIFY_BATCH_MAX`** (entier 1–500, défaut 50) ; **`LOTTERY_RESULTS_NOTIFY_PUSH_TITLE`** / **`LOTTERY_RESULTS_NOTIFY_PUSH_BODY`** (sinon textes FR par défaut dans le handler) ; **`EXPO_ACCESS_TOKEN`** comme pour les autres envois Expo.
- **Planification (repo)** : job **`pg_cron`** nommé **`lottery-results-notify-cron`**, expression **`*/5 * * * *`**, commande **`SELECT public.lottery_results_notify_invoke_edge_cron();`** (migration `20260513130100`). La fonction lit le **Vault** : **`supabase_url`**, **`supabase_service_role_key`**, et **`lottery_results_notify_cron_secret`** (même chaîne que le secret Edge **`LOTTERY_RESULTS_NOTIFY_CRON_SECRET`**). Si l’un manque : **aucun HTTP**, `RAISE WARNING` dans les logs Postgres. Créer le secret Vault via **Integrations → Vault → Add new secret** (nom exact `lottery_results_notify_cron_secret`).
- **Alternative** : désactiver ce job (`cron.unschedule`) et appeler l’URL depuis un scheduler externe si tu préfères ne pas dupliquer le secret dans le Vault.
- **Déploiement** : `supabase functions deploy lottery-results-notify-cron` ; secrets Edge listés ci-dessus (dont **`LOTTERY_RESULTS_NOTIFY_CRON_SECRET`**).

### Tests internes post-release (checklist testeurs)

À exécuter sur l’environnement **staging ou prod** une fois migrations, Edge et secrets appliqués. Cocher au fil des runs.

#### Prérequis (bloquants si faux)

- [ ] Migrations à jour jusqu’à **`20260513130100`** (inclus).
- [ ] Edge Function **`lottery-results-notify-cron`** déployée sur le bon projet.
- [ ] Secrets **Edge** : au minimum **`LOTTERY_RESULTS_NOTIFY_CRON_SECRET`** ; **`EXPO_ACCESS_TOKEN`** si la politique Expo du projet l’exige.
- [ ] **Vault** : **`supabase_url`**, **`supabase_service_role_key`**, **`lottery_results_notify_cron_secret`** (valeur **strictement identique** au secret Edge `LOTTERY_RESULTS_NOTIFY_CRON_SECRET`).
- [ ] Job **`pg_cron`** **`lottery-results-notify-cron`** présent (SQL : `SELECT jobname, schedule FROM cron.job WHERE jobname = 'lottery-results-notify-cron';` → schedule **`*/5 * * * *`** attendu).
- [ ] Build **mobile** installé sur **appareil réel** (les push ne sont pas fiables sur simulateur / Expo Go seul selon la config du projet).

#### Parcours nominal — une loterie, un participant avec push

- [ ] Créer ou utiliser une loterie **active** avec **`ends_at`** et **`draw_at`** dans le futur puis les ramener dans le passé (ou attendre) pour permettre **`closed`** puis tirage.
- [ ] Vérifier que la loterie passe bien en **`closed`** (trigger / cron fermeture, ou passage manuel cohérent avec les règles métier).
- [ ] Compte test **participant** : au moins un ticket **`active`**, **`push_token`** renseigné sur **`profiles`** (ouvrir l’app une fois, accepter les notifications).
- [ ] **Admin** : exécuter **`run_lottery`** pour cette loterie ; statut final **`drawn`** ; vérifier le détail admin (gagnants / tickets) si besoin.
- [ ] Attendre **au plus une fenêtre de cron** (5 min) **ou** déclencher manuellement l’URL Edge (équivalent) avec les bons en-têtes.
- [ ] **Mobile** : réception d’**une** notification push au **titre / corps** attendus (FR par défaut, ou valeurs **`LOTTERY_RESULTS_NOTIFY_PUSH_TITLE`** / **`BODY`** si configurées).
- [ ] Au tap / ouverture depuis la notif : comportement acceptable (deep link ou ouverture app selon ce qui est prévu produit — documenter l’écart si rien n’est branché).

#### Idempotence — pas de spam « résultats »

- [ ] Après la première vague réussie pour cette loterie : attendre **2 à 3 cycles cron** supplémentaires.
- [ ] **Aucune** nouvelle push « résultats loterie » pour **la même** loterie (une fois traitée, item **`completed`** bloque la re-notif).
- [ ] Vérifier en base (lecture **`service_role`** ou outil interne) : **`lottery_results_notify_run_items`** avec **`status = 'completed'`** pour ce **`lottery_id`** ; **`lottery_results_notify_runs.finished_at`** non NULL pour le run concerné.

#### Agrégation multi-loteries / multi-tickets

- [ ] Scénario **deux loteries** tirées (**`drawn`**) dans la même fenêtre, même participant avec ticket actif sur **les deux** : après un run cron, **une seule** push générique pour ce user (pas deux pushes distinctes pour deux loteries dans la même vague).
- [ ] Scénario **deux tickets actifs** même user, **même** loterie : **une** push (dédoublonnage **`DISTINCT user_id`**).

#### Cas limites

- [ ] Loterie **`drawn`** mais **aucun** ticket **`active`** (ou uniquement des tickets annulés / inéligibles) : le cron doit **finaliser** le run sans erreur bloquante ; **aucune** push côté utilisateurs sans token (comportement attendu).
- [ ] Participant avec ticket actif mais **sans** **`push_token`** : pas de crash Edge ; pas de push ; la loterie est tout de même marquée **notifiée** (**`completed`**) après finalisation — vérifier que l’utilisateur ne reçoit rien et que la loterie ne reste pas bloquée en pending.
- [ ] **Aucune** loterie **`drawn`** éligible : logs Edge **`skipped: true`** ou équivalent ; pas d’erreur 500 répétée.

#### Fermeture des ventes (régression)

- [ ] Loterie **`active`** dont **`ends_at`** est passé : passage automatique en **`closed`** dans les **5 min** (job **`close-lotteries-past-ends-at`**) — ne pas régresser en validant le flux « résultats ».

#### Observabilité / incident

- [ ] En cas de doute : **logs Edge** (dashboard Supabase → Edge Functions → invocations) pour **`lottery-results-notify-cron`**.
- [ ] Logs Postgres : absence de **`WARNING`** répétés du type *secrets Vault manquants* sur **`lottery_results_notify_invoke_edge_cron`**.
- [ ] Si **`FINALIZE_FAILED`** ou run supprimé après erreur : au cron suivant, **nouvelle tentative** sur les mêmes loteries (documenté comme acceptable v1 ; noter toute **double push** utilisateur pour suivi option 3).

#### Accessibilité / i18n (mobile)

- [ ] Texte de la notif **lisible** et cohérent avec la langue attendue du build testé (FR / EN selon configuration).

---

## Maintenance — comment ce fichier reste utile

Ce mémo **ne se met pas à jour tout seul**. Il est **volontairement court** : il doit refléter la réalité du code au fil du temps.

### Quand le mettre à jour

1. **PR qui touche la feature loteries** (admin, mobile, SQL : `run_lottery`, trigger fermeture, tables `notify_run*`, RPC admin, Edge cron) : ajuster les sections concernées (routes, services, migrations, tests).
2. **Nouveau comportement produit** : documenter le flux ou pointer vers le fichier source plutôt que dupliquer tout le code.
3. **Régression ou piège** découvert en prod / review : ajouter une ligne dans une sous-section « Pièges » (à créer si besoin) ou dans la section existante.

### Comment le mettre à jour

- **Même PR que le changement fonctionnel** de préférence (évite la dérive).
- Mettre à jour la date **Dernière revue du mémo** en haut du fichier.
- Si une section devient fausse, la corriger ou la supprimer — un mémo faux est pire que pas de mémo.
