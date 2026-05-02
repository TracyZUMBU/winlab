# Mémo — Notifications push (mobile + Supabase)

**Dernière revue du mémo :** 2026-05-02

## Objectif

Enregistrer un **token Expo Push** par utilisateur (`profiles.push_token`), recevoir les notifications (foreground + tap), et laisser le **backend** déclencher des envois via une **Edge Function** générique (`send-push-notification`) appelée depuis Postgres (`pg_net`) — la logique métier des messages reste côté SQL (triggers / futures fonctions).

## Périmètre

- **Inclus :** permission + channel Android + persistance token après login, listeners reçu / réponse, texte **i18n** pour types connus affichés côté client (`getLocalizedNotificationOverlay`), branchement bootstrap.
- **Hors périmètre :** choix produit des écrans qui consomment `notification` (aucun écran dédié imposé ici), campagnes marketing batch, analytics push.
- **Backend envoi :** Edge Function + triggers SQL ; pas d’appel direct Expo depuis l’app mobile hors enregistrement token.

## Cartographie code (`src/features/notifications`)

| Rôle                                 | Fichiers                                                                                                                                                                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hook public**                      | `hooks/usePushNotifications.ts` — `useSyncExternalStore` + ref-count coordinateur                                                                                                                                                                                                                 |
| **Coordination / token / listeners** | `services/notificationService.ts` — `acquirePushCoordinator`, `startCoordinator` (sync coalescé : `subscribeToAuthChanges` + `getCurrentSession` → une seule `syncPushForUser` par utilisateur tant qu’elle est en cours), `registerForPushNotificationsAsync`, `getLocalizedNotificationOverlay` |
| **Bootstrap**                        | `src/lib/bootstrap/useAppBootstrap.ts` — `usePushNotifications(enabled)` (ne bloque pas le bootstrap si permission refusée / simulateur)                                                                                                                                                          |

**Dépendances Expo :** `expo-notifications`, `expo-device`, `expo-constants` (projectId EAS pour `getExpoPushTokenAsync`).

**i18n :** clés sous `notifications.*` dans `src/i18n/locales/fr.json` et `en.json` (ex. `notifications.referral_reward.*` pour le foreground).

## Config native (`apps/mobile`)

- **`app.config.js`** : plugin `expo-notifications` (icône `assets/images/notification-icon.png` — asset à créer si absent), `ios.googleServicesFile` / `android.googleServicesFile` par `APP_ENV`, commentaires rebuild EAS + étapes manuelles (Vault, déploiement function, etc.).
- **`eas.json`** : `APP_ENV` par profil de build.
- **Types DB client** : `profiles.push_token` dans `src/lib/supabase.types.ts`.

## Backend Supabase

| Élément                                           | Emplacement                                                                                                                                                                   |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Colonne**                                       | `profiles.push_token` — migration `supabase/migrations/20260511100000_profiles_push_token_referral_notify.sql`                                                                |
| **Extension HTTP**                                | `pg_net` (même migration)                                                                                                                                                     |
| **Trigger parrainage**                            | `public.notify_referral_reward` + trigger `on_referral_qualified` sur `referrals` (passage **`pending` → `qualified`**, aligné avec `handle_referral_after_first_mission`)    |
| **Schéma source SQL**                             | `supabase/schemas/functions/notify_referral_reward.sql`                                                                                                                       |
| **Upgrade Vault** (bases déjà migrées sans Vault) | `supabase/migrations/20260512140000_notify_referral_reward_vault_upgrade.sql`                                                                                                 |
| **Script SQL manuel (dashboard)**                 | `supabase/sql_requetes/redeploy_notify_referral_reward.sql`                                                                                                                   |
| **Edge Function**                                 | `supabase/functions/send-push-notification/index.ts` — body `{ user_id, title, body, data? }`, auth **Bearer = service role**, Expo `DeviceNotRegistered` → `push_token` null |
| **Config functions**                              | `supabase/config.toml` — `[functions.send-push-notification] verify_jwt = false` (appel serveur depuis Postgres, pas de JWT utilisateur)                                      |

### Secrets Vault (prod / staging)

Noms attendus par le trigger :

- `supabase_url` — ex. `https://<project-ref>.supabase.co`
- `supabase_service_role_key` — clé service role

Dashboard → **Vault** → créer / maintenir ces secrets. Le trigger fait `GRANT SELECT ON vault.decrypted_secrets TO postgres` (voir migrations). Ne jamais committer les valeurs.

### Pattern pour un nouvel événement métier

1. Nouvelle fonction SQL (+ trigger) qui lit les **mêmes** secrets Vault et appelle `…/functions/v1/send-push-notification` avec `title` / `body` / `data` adaptés.
2. L’Edge Function **ne change pas** (transport uniquement).

## Déploiement / vérifs manuelles

1. Secrets Vault renseignés.
2. `supabase functions deploy send-push-notification`
3. Migrations appliquées (ou exécution de `sql_requetes/redeploy_notify_referral_reward.sql` si besoin ponctuel sur un projet).
4. **Development build** EAS avec profil adapté (`APP_ENV`) — les push ne sont pas représentatifs sur Expo Go seul.
5. Fichiers Firebase par `APP_ENV` (`google-services*.json`, `GoogleService-Info*.plist`) : pour iOS, remplacer les plist **dev** / **preview** par ceux téléchargés depuis Firebase si les apps iOS diffèrent (sinon copies du plist prod = build OK, config push à valider).

## Tests

- Pas de suite Jest dédiée notifications pour l’instant ; régressions possibles sur permission / token → vérifier sur **device réel** après changement de config native.

## Références croisées

- Parrainage SQL : `supabase/schemas/functions/handle_referral_after_first_mission.sql` (ordre `qualified` puis `rewarded`).
- Profil / parrainage UX : `src/features/profile/MEMO.md` si besoin de lier produit filleul / wallet.
