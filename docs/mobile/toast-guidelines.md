# Toasts — règles produit et usage technique (mobile)

## Règles produit

### Utiliser un toast pour

- Feedback **éphémère** après une **action utilisateur explicite** (tap, submit).
- **Confirmation non bloquante** de succès (ex. achat effectué, mission soumise).
- **Erreur métier simple** ou **erreur technique courte** quand l’inline n’est pas déjà utilisé pour le même fait.
- **Information rapide** sans nécessiter une modale (texte court).

### Ne pas utiliser un toast pour

- Erreurs **bloquantes** qui doivent rester **dans le formulaire** (validation champ, OTP invalide, etc.).
- Erreurs nécessitant une **action complexe** ou beaucoup de contexte.
- **Contenu long** (CGU, support, texte légal) → garder écran, feuille modale ou `Alert` si déjà le pattern.
- **État vide** ou **chargement principal** d’écran.
- **Navigation simple** (changement d’onglet, retour) sans action métier.

### Priorité d’affichage

- Les **erreurs de formulaire** restent **inline**.
- Les erreurs **globales** ou **après submit** peuvent avoir un **toast** si l’inline ne couvre pas déjà le même message.

### Éviter les doublons

- Ne pas afficher **à la fois** un message inline **et** un toast pour **exactement la même information**, sauf cas exceptionnel documenté.

### Durées et texte

- **Succès** : court.
- **Erreur** : légèrement plus long si besoin de lisibilité.
- Texte **court** ; préférer **i18n** (`t("...")`) et **codes métier stables** pour le mapping d’erreurs.

---

## Couche technique

- **Toute** notification toast passe par `@/src/shared/toast` (`toastService`, helpers).
- **Interdit** d’importer `react-native-toast-message` dans les features / écrans / hooks métier (sauf fichiers listés dans la règle Cursor `winlab-toast`).
- Préférer les messages issus de **i18n** et du helper **`getI18nMessageForCode`** pour les codes stables, plutôt que `error.message.includes(...)`.

### API principale

```ts
import {
  showToast,
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  showWarningToast,
  hideToast,
  showToastForBusinessErrorCode,
} from "@/src/shared/toast";
```

### Exemples de bon usage

```ts
showSuccessToast({ title: t("lottery.detail.purchase.success") });
showInfoToast({ title: t("wallet.info.title"), message: t("wallet.info.message") });
showToastForBusinessErrorCode({
  t,
  i18n,
  baseKey: "lottery.detail.purchase.errors",
  code: result.errorCode,
  fallbackKey: "lottery.detail.purchase.errors.generic",
});
```

### Exemples de mauvais usage

```ts
// ❌ Import direct dans une feature
import Toast from "react-native-toast-message";

// ❌ Toast pour une erreur de champ déjà sous l’input
// ❌ Toast au montage d’un écran sans action utilisateur
```

### Évolutions prévues (types)

- Bouton d’action, icônes custom, tracking analytique : champs optionnels réservés dans `ShowToastInput` / types ; implémentation progressive.
