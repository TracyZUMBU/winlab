# Audit — usages potentiels de toasts (apps/mobile)

Inventaire réalisé **avant** l’introduction du système de toasts encapsulé. Chaque ligne indique le fichier, l’action, le feedback actuel et une recommandation.

Légende des catégories : **success** | **error** | **info** | **warning** | **no-toast**

---

## Auth

| Fichier                     | Action                      | Feedback actuel                                     | Recommandation           | Raison                                                                                                                         |
| --------------------------- | --------------------------- | --------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `EmailScreen.tsx`           | Envoi OTP                   | Inline `infoMessage` (email envoyé) puis navigation | **no-toast**             | L’utilisateur voit le message avant la transition ; un toast risquerait le doublon ou d’être invisible (navigation immédiate). |
| `EmailScreen.tsx`           | Erreur serveur / validation | Inline `serverError` + erreurs champ                | **no-toast**             | Erreurs de formulaire / métier déjà inline (règle produit).                                                                    |
| `OTPScreen.tsx`             | Vérification OTP            | Inline `serverError`                                | **no-toast**             | Erreurs OTP restent près du champ.                                                                                             |
| `OTPScreen.tsx`             | Renvoyer le code            | Aucun succès explicite ; erreurs inline             | **info** (succès renvoi) | Feedback éphémère utile sans encombrer l’écran (implémenté en premier périmètre).                                              |
| `OTPScreen.tsx`             | Erreur redirect / générique | Inline                                              | **no-toast**             | Déjà couvert inline.                                                                                                           |
| `CreateProfileScreen.tsx`   | Erreurs session / submit    | Inline `serverError`                                | **no-toast**             | Inline suffisant.                                                                                                              |
| `CreateProfileScreen.tsx`   | Succès création profil (submit) | Navigation `replace` vers `/home` ; pas de message succès | **no-toast**        | La transition d’écran suffit ; un toast risquerait d’être court-circuité ou redondant (même principe que navigation post-action ailleurs en auth). |
| `DevPasswordLoginPanel.tsx` | Login dev                   | Inline `setError`                                   | **no-toast**             | Erreurs inline.                                                                                                                |
| `AppPlaceholderScreen.tsx`  | Déconnexion                 | Pas de feedback erreur (`onError` vide)             | **error**                | Échec d’action utilisateur sans message (implémenté toast erreur).                                                             |

---

## Profil

| Fichier             | Action                             | Feedback actuel                         | Recommandation            | Raison                                                                                                                            |
| ------------------- | ---------------------------------- | --------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `ProfileScreen.tsx` | Mise à jour pseudo (modal)         | Bannière succès inline + erreurs inline | **success** via toast     | Éviter doublon bannière + toast : **toast seul** pour le succès (implémenté), erreurs champ restent inline.                       |
| `ProfileScreen.tsx` | Déconnexion                        | Navigation ; erreur loggée seulement    | **error** (optionnel)     | Toast possible sur échec réseau ; garder discret pour ne pas spammer — **partiel** : placeholder déjà couvert sur autre écran.    |
| `ProfileScreen.tsx` | Suppression compte (confirm Alert) | `Alert` erreur métier                   | **error** ou **no-toast** | Contenu parfois long ; `Alert` reste acceptable pour erreur bloquante. **Laissé en Alert** dans ce ticket (pas de doublon toast). |
| `ProfileScreen.tsx` | Parrainage                         | `Alert` avec code + consignes           | **no-toast**              | Contenu trop long pour un toast ; futur : copier presse-papiers + toast court.                                                    |
| `ProfileScreen.tsx` | Support / Règlement                | `Alert` informatif                      | **no-toast**              | Texte long ; pas adapté au toast.                                                                                                 |

---

## Loteries

| Fichier                   | Action                    | Feedback actuel           | Recommandation | Raison                                                 |
| ------------------------- | ------------------------- | ------------------------- | -------------- | ------------------------------------------------------ |
| `LotteryDetailScreen.tsx` | Achat ticket réussi       | Aucun (refetch seulement) | **success**    | Confirmation forte après action coûteuse (implémenté). |
| `LotteryDetailScreen.tsx` | Erreur achat              | Inline `buyError`         | **no-toast**   | Déjà inline sous le bouton ; doublon évité.            |
| `LotteryDetailScreen.tsx` | Chargement / erreur liste | États écran               | **no-toast**   | Pas d’action ponctuelle ; état global d’écran.         |

---

## Missions

| Fichier                   | Action                | Feedback actuel      | Recommandation                                  | Raison                                                                |
| ------------------------- | --------------------- | -------------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| `MissionDetailScreen.tsx` | Soumission mission OK | Texte succès inline  | **success** (toast **ou** inline, pas les deux) | **Toast seul** pour éviter doublon (implémenté, texte inline retiré). |
| `MissionDetailScreen.tsx` | Erreur soumission     | Inline `submitError` | **no-toast**                                    | Erreur déjà contextualisée sous le scroll.                            |

---

## Wallet

| Fichier            | Action                      | Feedback actuel           | Recommandation   | Raison                                                                                                               |
| ------------------ | --------------------------- | ------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| `WalletScreen.tsx` | Bouton info (aide)          | `Alert` titre + message   | **info** (toast) | Remplacer par toast **si** le texte reste court ; sinon garder modal (implémenté : toast info, texte existant i18n). |
| `WalletScreen.tsx` | Consultation solde / listes | États chargement / erreur | **no-toast**     | Pas d’action utilisateur unique à confirmer.                                                                         |

---

## Home / Résultats / Navigation

| Zone                      | Action                            | Recommandation | Raison                                          |
| ------------------------- | --------------------------------- | -------------- | ----------------------------------------------- |
| Navigation entre onglets  | —                                 | **no-toast**   | Règle UX : pas de toast sur navigation passive. |
| Erreurs requêtes globales | `userFacingQueryLoadHint` + retry | **no-toast**   | État d’écran / inline ; pas de spam toast.      |

---

## Synthèse

- **Fort potentiel toast** : succès après achat ticket, succès mission, renvoi OTP, info wallet, échec logout sans feedback.
- **Rester inline / écran** : erreurs de formulaire auth, erreurs achat/mission déjà affichées sous l’action, contenus longs (support, règlements, parrainage), chargements principaux, **succès création profil** (navigation vers l’accueil uniquement — voir entrée **Succès création profil** pour `CreateProfileScreen.tsx` dans le tableau Auth).

Ce document peut être complété au fil des nouvelles features (copier code parrainage, actions wallet secondaires, etc.).
