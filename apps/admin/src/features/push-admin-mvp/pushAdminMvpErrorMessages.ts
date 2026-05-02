/** Messages utilisateur stables pour l’envoi push MVP (admin). */
export function pushAdminMvpErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "CONFIGURATION":
      return "Supabase non configuré : renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans apps/admin/.env (voir .env.example).";
    case "UNAUTHORIZED":
      return "Session invalide ou expirée. Reconnectez-vous.";
    case "INVALID_USER_ID":
      return "Identifiant utilisateur (UUID) invalide.";
    case "VALIDATION_ERROR":
      return "Titre et message sont obligatoires.";
    case "PROFILE_FETCH_FAILED":
    case "CLEAR_TOKEN_FAILED":
    case "SERVER_MISCONFIGURED":
      return "Une erreur serveur est survenue. Réessayez plus tard.";
    case "PUSH_DELIVERY_FAILED":
      return "Le fournisseur de push a refusé ou n’a pas confirmé l’envoi.";
    case "NETWORK":
      return "Impossible de joindre le serveur. Vérifiez votre connexion.";
    case "METHOD_NOT_ALLOWED":
    case "INVALID_JSON":
    case "EDGE_UNKNOWN":
    case "RPC_ERROR":
      return "Une erreur technique est survenue lors de l’appel au serveur.";
    case "UNKNOWN":
      return "Une erreur inattendue est survenue.";
    default:
      return "Une erreur inattendue est survenue.";
  }
}
