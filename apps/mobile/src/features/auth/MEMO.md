# Mémo — Feature Auth (mobile)

**Dernière revue du mémo :** 2026-07-18 (rate limit OTP client)

## Objectif

Authentifier l’utilisateur (OTP email par défaut) et le rediriger vers l’app ou la création de profil.

## Périmètre

- **Inclus :** écran email, OTP, connexion password pour emails whitelist, sign-out, redirect post-auth.
- **Hors périmètre :** Sign in with Apple, magic link deep link, reset password UI.

## Connexion password (whitelist)

Variable d’environnement (bundle JS / OTA) :

```bash
EXPO_PUBLIC_AUTH_PASSWORD_LOGIN_EMAILS=review@example.com,seed.new.user@booknglow.app
```

- Liste **comma-separated**, match après trim + lowercase.
- Sur `EmailScreen` : si l’email saisi est whitelist → champ mot de passe + CTA « Se connecter » (`signInWithPassword`) ; sinon → OTP.
- **Ne jamais** mettre le mot de passe dans l’env / le code — uniquement emails.
- EAS : Environment variables (production / preview) ; valeur présente au moment du `eas update`.
- Helper : `utils/passwordLoginEmails.ts` (`isPasswordLoginEmail`).

### Compte App Store Review

1. Créer le user Auth + **Set password** dans Supabase Dashboard.
2. Profil app déjà créé (18+, pays FR, etc.).
3. Ajouter l’email dans `EXPO_PUBLIC_AUTH_PASSWORD_LOGIN_EMAILS`.
4. Publier OTA **sans** bump de version si le binaire en review a la même `expo.version` :

```bash
cd apps/mobile
# s’assurer que la var EAS production est définie
npm run update:production -- --message "auth: password login for review whitelist"
```

### Texte Remarques (App Store Connect)

```text
Authentification : email + code OTP pour les utilisateurs standards.

Compte de démo (review) — connexion par mot de passe (pas d’OTP) :
Email : [EMAIL_DEMO]
Mot de passe : [MOT_DE_PASSE]

Parcours :
1. Saisir l’email ci-dessus → le champ Mot de passe apparaît
2. Saisir le mot de passe → Se connecter
3. Tester Accueil, Missions, Loteries, Portefeuille, Profil

Âge : 18+ pour les loteries. Pays de test : France (FR / CH / LU).
```

## Navigation

| Route | Fichier |
|--------|---------|
| Email | `app/(auth)/email.tsx` → `EmailScreen` |
| OTP | `app/(auth)/otp.tsx` → `OTPScreen` |
| Create profile | `app/(auth)/create-profile.tsx` |

## Cartographie

| Rôle | Fichiers |
|------|----------|
| OTP send / verify | `services/sendEmailOtp.ts`, `verifyEmailOtp.ts` |
| Password login | `services/signInWithEmailPassword.ts` |
| Whitelist | `utils/passwordLoginEmails.ts` |
| OTP client cooldown | `utils/emailOtpClientRateLimit.ts` |
| Redirect | `utils/redirectAfterAuthSession.ts` |
| UI email | `screens/EmailScreen.tsx` |

## Rate limit OTP (client)

- Cooldown **60 s** par email après un envoi réussi (`utils/emailOtpClientRateLimit.ts`), appliqué dans `sendEmailOtp` (Continuer + Renvoyer).
- Pendant le cooldown / requête en cours : `EMAIL_SEND_RATE_LIMITED` (pas d’appel Supabase).
- Complète le rate limit serveur Supabase ; ne le remplace pas.

## Vérifs manuelles

1. Email non whitelist → Continuer → OTP (rester sur l’écran code).
2. Email whitelist → password → login → home (si profil existe).
3. Mauvais password → erreur générique.
4. Variable d’env absente → aucun password UI (OTP only).
5. Double Continuer / Renvoyer dans les 60 s → message rate limit, un seul mail.
