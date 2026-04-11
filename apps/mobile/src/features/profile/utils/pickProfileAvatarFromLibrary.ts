export type PickProfileAvatarOutcome =
  | { status: "ok"; uri: string; mimeType: string }
  | { status: "cancelled" }
  | { status: "permission_denied" };

/**
 * Logique galerie + recadrage. `expo-image-picker` est importé dynamiquement ici
 * (pas en tête de fichier) pour que le chunk utilitaire se charge sans lier le natif
 * tant que l’utilisateur n’a pas choisi « Changer la photo ».
 */
export async function pickProfileAvatarFromLibrary(): Promise<PickProfileAvatarOutcome> {
  const ImagePicker = await import("expo-image-picker");
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    return { status: "permission_denied" };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]?.uri) {
    return { status: "cancelled" };
  }

  const asset = result.assets[0];
  return {
    status: "ok",
    uri: asset.uri,
    mimeType: asset.mimeType ?? "image/jpeg",
  };
}

export default pickProfileAvatarFromLibrary;
