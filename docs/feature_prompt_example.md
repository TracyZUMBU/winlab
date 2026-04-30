Nouvelle feature: Contact support depuis Profile. (mobile)
Lance Feature Builder pour implémenter la feature complète.
Lance Test Builder en parallèle pour écrire les tests unitaires et d’intégration.

Objectif
Permettre à un utilisateur connecté d’envoyer un message au support depuis Profil.

Contexte

- Écran d’entrée: ProfileScreen
- Action: bouton "Contacter le support"
- Stack: React Native + TypeScript + TanStack Query + Supabase
- Architecture attendue: service / query-mutation options / hook / UI

Règles métier

1. L’utilisateur doit être authentifié.
2. Champs requis: sujet (min 5 caractères), message (min 20 caractères).
3. Email de l’utilisateur prérempli en lecture seule (si disponible).
4. À l’envoi: créer un ticket support en base + éventuellement déclencher un envoi email backend.
5. Anti-spam: empêcher double submit (bouton désactivé pendant pending).

États UI

- idle: formulaire affiché
- loading: bouton disabled + spinner
- success: toast "Message envoyé", reset formulaire, retour Profil
- error: message explicite + possibilité de réessayer

Gestion d’erreurs

- Validation client (sujet/message)
- Erreur réseau/API
- Erreur auth (session expirée)

Critères d’acceptation

- Depuis Profil, l’utilisateur peut ouvrir le formulaire support.
- Impossible d’envoyer si formulaire invalide.
- Envoi réussi => confirmation visible et ticket persisté.
- En cas d’échec => feedback clair sans perte du message saisi.
- Pas d’appel Supabase direct dans le composant UI.

Scénarios de test prioritaires

1. Happy path: utilisateur connecté, envoi valide.
2. Validation: message trop court => blocage.
3. API error: échec insertion => erreur affichée + retry.
4. Double click submit => un seul envoi.
