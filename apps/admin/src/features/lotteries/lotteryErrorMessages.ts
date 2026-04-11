/** Messages utilisateur stables pour les codes d’erreur des services loteries. */
export function lotteryServiceErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "CONFIGURATION":
      return "Supabase non configuré : renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans apps/admin/.env (voir .env.example).";
    case "UNAUTHORIZED":
      return "Accès réservé aux administrateurs.";
    case "INVALID_LOTTERY_ID":
      return "Identifiant de loterie invalide.";
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
