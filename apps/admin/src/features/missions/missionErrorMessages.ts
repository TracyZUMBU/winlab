/** Messages utilisateur stables pour les codes d’erreur des services missions. */
export function missionServiceErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "CONFIGURATION":
      return "Supabase non configuré : renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans apps/admin/.env (voir .env.example).";
    case "UNAUTHORIZED":
      return "Accès réservé aux administrateurs.";
    case "FORBIDDEN":
      return "Action non autorisée pour ce compte.";
    case "INVALID_MISSION_ID":
      return "Identifiant de mission invalide.";
    case "INVALID_PAYLOAD":
      return "Données invalides : vérifiez les champs obligatoires.";
    case "NETWORK":
      return "Impossible de joindre le serveur. Vérifiez votre connexion.";
    case "RPC_ERROR":
      return "Une erreur technique est survenue lors de l’appel au serveur.";
    case "UNKNOWN":
      return "Une erreur inattendue est survenue.";
    default:
      return "Une erreur inattendue est survenue.";
  }
}
