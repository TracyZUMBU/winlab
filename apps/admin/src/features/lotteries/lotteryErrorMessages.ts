/** Messages utilisateur stables pour les codes d’erreur des services loteries. */
export function lotteryServiceErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "CONFIGURATION":
      return "Supabase non configuré : renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans apps/admin/.env (voir .env.example).";
    case "UNAUTHORIZED":
      return "Session invalide ou expirée. Reconnectez-vous.";
    case "FORBIDDEN":
      return "Ce compte n’a pas les droits administrateur requis pour cette action.";
    case "PROFILE_CHECK_FAILED":
      return "Impossible de vérifier les droits administrateur. Réessayez plus tard.";
    case "LOTTERY_NOT_FOUND":
      return "Loterie introuvable.";
    case "LOTTERY_ALREADY_DRAWN":
      return "Cette loterie a déjà été tirée.";
    case "LOTTERY_CANCELLED":
      return "Cette loterie est annulée : tirage impossible.";
    case "LOTTERY_DRAFT":
      return "Les loteries brouillon ne peuvent pas être tirées.";
    case "LOTTERY_NOT_CLOSED":
      return "La loterie doit être au statut « closed » avant le tirage.";
    case "LOTTERY_DRAW_NOT_READY":
      return "La date de tirage n’est pas encore atteinte.";
    case "LOTTERY_NOT_ENDED":
      return "La période de la loterie n’est pas encore terminée (`ends_at`).";
    case "RUN_LOTTERY_RPC_FAILED":
      return "Le serveur n’a pas pu exécuter le tirage. Réessayez ou vérifiez les journaux.";
    case "INVALID_LOTTERY_ID":
      return "Identifiant de loterie invalide.";
    case "NETWORK":
      return "Impossible de joindre le serveur. Vérifiez votre connexion.";
    case "RPC_ERROR":
      return "Une erreur technique est survenue lors de l’appel au serveur.";
    case "METHOD_NOT_ALLOWED":
    case "INVALID_JSON":
    case "SERVER_MISCONFIGURED":
    case "EDGE_UNKNOWN":
      return "Une erreur technique est survenue lors de l’appel au serveur.";
    case "UNKNOWN":
      return "Une erreur inattendue est survenue.";
    default:
      return "Une erreur inattendue est survenue.";
  }
}
