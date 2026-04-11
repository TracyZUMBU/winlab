/**
 * Résultat typé des appels services (pas d’exception métier : l’UI lit `errorCode`).
 */
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; errorCode: string };
