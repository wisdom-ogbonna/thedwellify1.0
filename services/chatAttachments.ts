import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import type { UploadableFile } from "./chatApi";

/**
 * Attachment picking for chat.
 *
 * expo-document-picker is a native module added alongside this feature, so an
 * existing dev-client build will not contain it until it is rebuilt. Rather than
 * crashing on import, we probe for it and degrade to images-only — which keeps
 * the app usable on an older binary.
 */

let documentPicker: typeof import("expo-document-picker") | null | undefined;

const getDocumentPicker = () => {
  if (documentPicker !== undefined) return documentPicker;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    documentPicker = require("expo-document-picker");
  } catch {
    documentPicker = null;
    console.log(
      "expo-document-picker unavailable — rebuild the dev client to enable document sharing"
    );
  }

  return documentPicker;
};

export const canPickDocuments = () => getDocumentPicker() !== null;

const MAX_BYTES = 25 * 1024 * 1024;

const guessMime = (uri: string, fallback = "application/octet-stream") => {
  const ext = uri.split("?")[0].split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    case "gif":
      return "image/gif";
    case "pdf":
      return "application/pdf";
    default:
      return fallback;
  }
};

const tooLarge = (size?: number | null) => {
  if (!size || size <= MAX_BYTES) return false;
  Alert.alert(
    "File too large",
    `Attachments must be under ${MAX_BYTES / (1024 * 1024)} MB.`
  );
  return true;
};

/** Pick one or more images from the library. Returns [] if cancelled or denied. */
export const pickImages = async (limit = 5): Promise<UploadableFile[]> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      "Photos permission needed",
      "Allow photo access to share images in chat."
    );
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 0.8,
    exif: false,
  });

  if (result.canceled) return [];

  return result.assets
    .filter((asset) => !tooLarge(asset.fileSize))
    .map((asset, i) => ({
      uri: asset.uri,
      name: asset.fileName || `photo-${Date.now()}-${i}.jpg`,
      mimeType: asset.mimeType || guessMime(asset.uri, "image/jpeg"),
      width: asset.width,
      height: asset.height,
    }));
};

/** Take a photo with the camera. */
export const takePhoto = async (): Promise<UploadableFile[]> => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    Alert.alert("Camera permission needed", "Allow camera access to take a photo.");
    return [];
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    exif: false,
  });

  if (result.canceled) return [];

  const asset = result.assets[0];
  if (!asset || tooLarge(asset.fileSize)) return [];

  return [
    {
      uri: asset.uri,
      name: asset.fileName || `photo-${Date.now()}.jpg`,
      mimeType: asset.mimeType || "image/jpeg",
      width: asset.width,
      height: asset.height,
    },
  ];
};

/** Pick a document. Returns [] when the native module is missing. */
export const pickDocuments = async (): Promise<UploadableFile[]> => {
  const picker = getDocumentPicker();

  if (!picker) {
    Alert.alert(
      "Not available yet",
      "Document sharing needs an app update. You can still send photos."
    );
    return [];
  }

  const result = await picker.getDocumentAsync({
    type: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled) return [];

  return result.assets
    .filter((asset) => !tooLarge(asset.size))
    .map((asset) => ({
      uri: asset.uri,
      name: asset.name || `document-${Date.now()}`,
      mimeType: asset.mimeType || guessMime(asset.uri),
    }));
};

export const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
