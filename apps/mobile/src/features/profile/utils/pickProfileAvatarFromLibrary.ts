import * as ImagePicker from "expo-image-picker";

export type PickProfileAvatarOutcome =
  | { status: "ok"; uri: string; mimeType: string }
  | { status: "cancelled" }
  | { status: "permission_denied" };

/**
 * Logique galerie + recadrage. Reste dans un module chargé à la demande pour ne pas
 * exiger le natif `ExponentImagePicker` au simple chargement de l’écran Profil.
 */
export async function pickProfileAvatarFromLibrary(): Promise<PickProfileAvatarOutcome> {
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
