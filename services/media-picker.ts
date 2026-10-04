import * as ImagePicker from "expo-image-picker";

const currentRepresentation =
  ImagePicker.UIImagePickerPreferredAssetRepresentationMode?.Current ?? "current";

const guessMime = (name = "", kind?: string | null) => {
  const lower = name.toLowerCase();
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (kind === "video") return "video/mp4";
  return "image/jpeg";
};

export type PickedMedia = {
  uri: string;
  name: string;
  type: string;
  fileSize?: number;
};

export const toPickedMedia = (
  asset: ImagePicker.ImagePickerAsset,
  fallbackName: string,
): PickedMedia => {
  const name = asset.fileName || asset.uri.split("/").pop() || fallbackName;
  return {
    uri: asset.uri,
    name,
    type: asset.mimeType || guessMime(name, asset.type),
    fileSize: (asset as { fileSize?: number }).fileSize,
  };
};

const launchLibrary = async (
  options: ImagePicker.ImagePickerOptions,
): Promise<ImagePicker.ImagePickerResult> => {
  try {
    return await ImagePicker.launchImageLibraryAsync(options);
  } catch {
    return ImagePicker.launchImageLibraryAsync({
      ...options,
      quality: undefined,
      allowsMultipleSelection: false,
      selectionLimit: 1,
      preferredAssetRepresentationMode: currentRepresentation,
    });
  }
};

export const pickLibraryImages = async (selectionLimit = 10) => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { ok: false as const, reason: "permission" as const };
  }

  const result = await launchLibrary({
    mediaTypes: ["images"],
    allowsMultipleSelection: selectionLimit > 1,
    allowsEditing: false,
    exif: false,
    selectionLimit,
    preferredAssetRepresentationMode: currentRepresentation,
  });

  if (result.canceled) return { ok: false as const, reason: "canceled" as const };
  return {
    ok: true as const,
    assets: result.assets.map((asset, index) =>
      toPickedMedia(asset, `image_${index}.jpg`),
    ),
  };
};

export const pickLibraryVideo = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { ok: false as const, reason: "permission" as const };
  }

  const result = await launchLibrary({
    mediaTypes: ["videos"],
    allowsMultipleSelection: false,
    allowsEditing: false,
    preferredAssetRepresentationMode: currentRepresentation,
  });

  if (result.canceled) return { ok: false as const, reason: "canceled" as const };
  return {
    ok: true as const,
    asset: toPickedMedia(result.assets[0], "video.mp4"),
  };
};
