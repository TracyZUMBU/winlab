import { useMutation } from "@tanstack/react-query";

import { createProfile } from "../services/profileService";
import type { CreateProfilePayload } from "../types";

/**
 * Mutation pour créer le profil utilisateur.
 * Le screen appelle mutateAsync et gère succès / erreur (pas d'appel Supabase dans le screen).
 */
export function useCreateProfileMutation() {
  return useMutation({
    mutationFn: (payload: CreateProfilePayload) => createProfile(payload),
  });
}
