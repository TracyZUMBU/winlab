/**
 * Erreur portant uniquement un code stable pour l’UI (intégration TanStack Query, etc.).
 * Ne pas afficher `message` : utiliser le mapping par `errorCode`.
 */
export class ServiceFailureError extends Error {
  readonly errorCode: string;

  constructor(errorCode: string) {
    super(errorCode);
    this.name = "ServiceFailureError";
    this.errorCode = errorCode;
  }
}
