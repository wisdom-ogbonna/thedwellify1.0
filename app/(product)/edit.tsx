import { useModal } from "@/components/dialogs/popup-modal";
import { useTheme } from "@/hooks/use-theme";
import {
  deleteProduct,
  fetchOwnedProduct,
  updateProduct,
  type Property,
} from "@/services/productApi";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  CheckCircle2,
  ImagePlus,
  MapPin,
  Ruler,
  Trash2,
  Video as VideoIcon,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ALL_PROPERTY_TYPES = [
  "Apartment",
  "Hotel",
  "Shortlet",
  "House",
  "Land",
] as const;

const MAX_PHOTOS = 20;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime"]);

type MediaAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  remote?: boolean;
};

type FieldErrors = Partial<
  Record<
    | "title"
    | "location"
    | "price"
    | "description"
    | "size"
    | "bedrooms"
    | "bathrooms"
    | "photos",
    string
  >
>;

const guessImageMime = (asset: MediaAsset) => {
  if (asset.mimeType && IMAGE_TYPES.has(asset.mimeType)) return asset.mimeType;
  const name = (asset.fileName || asset.uri || "").toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".heic") || name.endsWith(".heif")) return "image/heic";
  return "image/jpeg";
};

const guessVideoMime = (asset: MediaAsset) => {
  if (asset.mimeType && VIDEO_TYPES.has(asset.mimeType)) return asset.mimeType;
  const name = (asset.fileName || asset.uri || "").toLowerCase();
  if (name.endsWith(".mov")) return "video/quicktime";
  return "video/mp4";
};

export default function EditPropertyScreen() {
  const router = useRouter();       
  const { colors } = useTheme();
  const { showModal } = useModal();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [propertyTitle, setPropertyTitle] = useState("");

  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState<string>("Apartment");
  const [purpose, setPurpose] = useState<"Sale" | "Rent">("Sale");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [size, setSize] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [photos, setPhotos] = useState<MediaAsset[]>([]);
  const [video, setVideo] = useState<MediaAsset | null>(null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const originalVideoUrl = useRef<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const submitLock = useRef(false);
  const deleteLock = useRef(false);

  const isLand = propertyType === "Land";

  const hydrate = useCallback((p: Property) => {
    setPropertyTitle(p.title || "Property");
    setTitle(p.title || "");
    setPropertyType(p.propertyType || "Apartment");
    setPurpose(p.purpose === "Rent" ? "Rent" : "Sale");
    setPrice(p.price != null ? String(p.price) : "");
    setLocation(p.location || "");
    setBedrooms(
      p.bedrooms != null || p.beds != null ? String(p.bedrooms ?? p.beds) : ""
    );
    setBathrooms(
      p.bathrooms != null || p.baths != null
        ? String(p.bathrooms ?? p.baths)
        : ""
    );
    setSize(p.size != null ? String(p.size) : "");
    setDescription(p.description || "");
    setStatus(p.status === "Inactive" ? "Inactive" : "Active");
    setLatitude(
      typeof p.latitude === "number"
        ? p.latitude
        : p.latitude != null
          ? Number(p.latitude)
          : null
    );
    setLongitude(
      typeof p.longitude === "number"
        ? p.longitude
        : p.longitude != null
          ? Number(p.longitude)
          : null
    );
    setPhotos(
      (p.images || []).map((uri) => ({
        uri,
        remote: true,
        mimeType: "image/jpeg",
      }))
    );
    if (p.video) {
      originalVideoUrl.current = p.video;
      setVideo({ uri: p.video, remote: true, mimeType: "video/mp4" });
    } else {
      originalVideoUrl.current = null;
      setVideo(null);
    }
    setRemoveVideo(false);
    setShowErrors(false);
    setFormError(null);
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setLoadError("Missing property id");
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const product = await fetchOwnedProduct(String(id));
        if (!cancelled) hydrate(product);
      } catch (err: any) {
        if (!cancelled) {
          setLoadError(
            err?.response?.data?.error ||
              "Couldn't load this property. You may not own it."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, hydrate]);

  const typeOptions = useMemo(() => {
    if (purpose === "Rent") {
      return ALL_PROPERTY_TYPES.filter((t) => t !== "Land");
    }
    return [...ALL_PROPERTY_TYPES];
  }, [purpose]);

  const fieldErrors = useMemo((): FieldErrors => {
    const errors: FieldErrors = {};
    if (title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters";
    }
    if (location.trim().length < 3) {
      errors.location = "Location must be at least 3 characters";
    }
    if (!price.trim() || Number(String(price).replace(/,/g, "")) <= 0) {
      errors.price = "Enter a valid price greater than 0";
    }
    if (description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters";
    }
    if (!size.trim() || Number(size) <= 0) {
      errors.size = "Size must be a positive number (sqm)";
    }
    if (photos.length === 0) {
      errors.photos = "Add at least one photo";
    }
    if (!isLand) {
      if (bedrooms.trim() === "" || Number.isNaN(Number(bedrooms)) || Number(bedrooms) < 0) {
        errors.bedrooms = "Enter bedrooms (0 or more)";
      }
      if (
        bathrooms.trim() === "" ||
        Number.isNaN(Number(bathrooms)) ||
        Number(bathrooms) < 0
      ) {
        errors.bathrooms = "Enter bathrooms (0 or more)";
      }
    }
    return errors;
  }, [
    title,
    location,
    price,
    description,
    size,
    photos.length,
    bedrooms,
    bathrooms,
    isLand,
  ]);

  const isValid = Object.keys(fieldErrors).length === 0;

  const pickPhotos = async (replaceIndex?: number) => {
    const remaining =
      replaceIndex != null ? 1 : MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      showModal({
        type: "error",
        title: "Limit reached",
        text: `You can keep up to ${MAX_PHOTOS} photos.`,
        ctaText1: "Okay",
      });
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showModal({
          type: "error",
          title: "Permission required",
          text: "Allow photo library access to continue.",
          ctaText1: "Okay",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: replaceIndex == null,
        selectionLimit: remaining,
        quality: 0.7,
        exif: false,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });

      if (result.canceled) return;

      const accepted: MediaAsset[] = [];
      for (const asset of result.assets) {
        if (asset.mimeType && !IMAGE_TYPES.has(asset.mimeType)) {
          showModal({
            type: "error",
            title: "Unsupported image",
            text: "Use JPEG, PNG, WEBP, or HEIC.",
            ctaText1: "Okay",
          });
          continue;
        }
        if (asset.fileSize != null && asset.fileSize > MAX_IMAGE_BYTES) {
          showModal({
            type: "error",
            title: "Image too large",
            text: "Each image must be 10MB or less.",
            ctaText1: "Okay",
          });
          continue;
        }
        accepted.push({
          uri: asset.uri,
          mimeType: asset.mimeType || "image/jpeg",
          fileName: asset.fileName,
          fileSize: asset.fileSize,
          remote: false,
        });
      }

      if (!accepted.length) return;

      if (replaceIndex != null) {
        setPhotos((prev) =>
          prev.map((item, i) => (i === replaceIndex ? accepted[0] : item))
        );
      } else {
        setPhotos((prev) => [...prev, ...accepted].slice(0, MAX_PHOTOS));
      }
    } catch (err) {
      console.log("pickPhotos error:", err);
      showModal({
        type: "error",
        title: "Couldn't open photos",
        text: "Try another image.",
        ctaText1: "Okay",
      });
    }
  };

  const pickVideo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showModal({
          type: "error",
          title: "Permission required",
          text: "Allow media library access to continue.",
          ctaText1: "Okay",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
        videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
      });

      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const mime = asset.mimeType || "video/mp4";
      if (
        asset.mimeType &&
        !VIDEO_TYPES.has(asset.mimeType) &&
        !String(asset.mimeType).startsWith("video/")
      ) {
        showModal({
          type: "error",
          title: "Invalid format",
          text: "Only MP4 and MOV videos are allowed.",
          ctaText1: "Okay",
        });
        return;
      }
      if (asset.fileSize != null && asset.fileSize > MAX_VIDEO_BYTES) {
        showModal({
          type: "error",
          title: "Video too large",
          text: "Video must be 50MB or less.",
          ctaText1: "Okay",
        });
        return;
      }

      setRemoveVideo(false);
      setVideo({
        uri: asset.uri,
        mimeType: VIDEO_TYPES.has(mime) ? mime : "video/mp4",
        fileName: asset.fileName || "video.mp4",
        fileSize: asset.fileSize,
        remote: false,
      });
    } catch (err) {
      console.log("pickVideo error:", err);
      showModal({
        type: "error",
        title: "Couldn't load video",
        text: "Try another MP4/MOV under 50MB.",
        ctaText1: "Okay",
      });
    }
  };

  const clearVideo = () => {
    setVideo(null);
    if (originalVideoUrl.current) setRemoveVideo(true);
  };

  const save = async () => {
    setShowErrors(true);
    setFormError(null);
    if (!id || submitting || submitLock.current || !isValid) {
      if (!isValid) {
        setFormError("Please fix the highlighted fields before saving.");
      }
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("location", location.trim());
      formData.append("price", String(price).replace(/,/g, "").trim());
      formData.append("propertyType", propertyType);
      formData.append("purpose", purpose);
      formData.append("description", description.trim());
      formData.append("size", String(size).trim());
      formData.append("status", status);

      if (latitude != null && Number.isFinite(latitude)) {
        formData.append("latitude", String(latitude));
      }
      if (longitude != null && Number.isFinite(longitude)) {
        formData.append("longitude", String(longitude));
      }

      if (!isLand) {
        formData.append("bedrooms", String(bedrooms).trim());
        formData.append("bathrooms", String(bathrooms).trim());
      } else {
        formData.append("bedrooms", "");
        formData.append("bathrooms", "");
      }

      const keepImages = photos.filter((p) => p.remote).map((p) => p.uri);
      formData.append("keepImages", JSON.stringify(keepImages));

      photos
        .filter((p) => !p.remote)
        .forEach((img, index) => {
          const mime = guessImageMime(img);
          const ext = mime.includes("png")
            ? "png"
            : mime.includes("webp")
              ? "webp"
              : mime.includes("heic") || mime.includes("heif")
                ? "heic"
                : "jpg";
          formData.append("images", {
            uri: img.uri,
            name: img.fileName || `image_${index}.${ext}`,
            type: mime,
          } as any);
        });

      if (removeVideo) {
        formData.append("removeVideo", "true");
      }

      if (video && !video.remote) {
        const mime = guessVideoMime(video);
        formData.append("video", {
          uri: video.uri,
          name:
            video.fileName ||
            (mime.includes("quicktime") ? "video.mov" : "video.mp4"),
          type: mime,
        } as any);
      }

      const { data: response } = await updateProduct(
        String(id),
        formData,
        setUploadProgress
      );
      const updated = response?.data;
      if (updated) {
        hydrate({
          ...updated,
          id: updated.id || String(id),
        });
      } else {
        // Ensure subsequent saves use server media URLs, not local file URIs.
        const fresh = await fetchOwnedProduct(String(id));
        hydrate(fresh);
      }

      showModal({
        type: "success",
        title: "Changes saved",
        text: "Your property listing has been updated successfully.",
        ctaText1: "View listing",
        ctaText2: "Keep editing",
        onCta1: () => router.replace(`/(product)/${id}`),
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.details ||
        (err?.code === "ECONNABORTED"
          ? "Upload timed out. Try fewer or smaller media files."
          : null) ||
        (err?.message?.includes("Network")
          ? "Network error while uploading. Check your connection."
          : null) ||
        "Failed to update property.";
      setFormError(message);
      showModal({
        type: "error",
        title: "Couldn't save",
        text: message,
        ctaText1: "Okay",
      });
    } finally {
      setSubmitting(false);
      submitLock.current = false;
    }
  };

  const confirmDelete = () => {
    if (!id || deleting || deleteLock.current) return;
    showModal({
      type: "delete",
      title: "Delete property?",
      text: `"${title.trim() || propertyTitle}" and all of its photos/video will be permanently removed.`,
      ctaText1: "Delete",
      ctaText2: "Cancel",
      onCta1: () => {
        void (async () => {
          if (deleteLock.current) return;
          deleteLock.current = true;
          setDeleting(true);
          try {
            await deleteProduct(String(id));
            showModal({
              type: "success",
              title: "Property deleted",
              text: "The listing has been removed from Dwellify.",
              ctaText1: "Back to listings",
              onCta1: () => router.replace("/(agent)/listings"),
            });
          } catch (err: any) {
            showModal({
              type: "error",
              title: "Couldn't delete",
              text:
                err?.response?.data?.error ||
                "Please try again in a moment.",
              ctaText1: "Okay",
            });
          } finally {
            setDeleting(false);
            deleteLock.current = false;
          }
        })();
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-3 text-sm font-medium" style={{ color: colors.placeholder }}>
          Loading property…
        </Text>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: colors.background }}
      >
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: `${colors.error}15` }}
        >
          <Building2 size={28} color={colors.error} />
        </View>
        <Text className="text-lg font-bold text-center mb-2" style={{ color: colors.text }}>
          Unable to edit
        </Text>
        <Text className="text-sm text-center mb-5 leading-5" style={{ color: colors.placeholder }}>
          {loadError}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-5 py-3.5 rounded-2xl"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-bold">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const softBorder = `${colors.placeholder}35`;
  const fieldBg = colors.card;

  const inputStyle = (hasError?: boolean) => ({
    color: colors.text,
    borderColor: hasError ? colors.error : softBorder,
    backgroundColor: fieldBg,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: softBorder,
            backgroundColor: colors.background,
          }}
        >
          <Pressable
            disabled={submitting || deleting}
            onPress={() => router.back()}
            hitSlop={10}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: fieldBg,
            }}
          >
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                textAlign: "center",
                color: colors.text,
              }}
            >
              Edit Property
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                textAlign: "center",
                marginTop: 2,
                color: colors.placeholder,
              }}
            >
              {propertyTitle}
            </Text>
          </View>
          <TouchableOpacity
            disabled={submitting || deleting}
            onPress={confirmDelete}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${colors.error}14`,
            }}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Trash2 size={18} color={colors.error} />
            )}
          </TouchableOpacity>
        </View>

        {/* Form body — must sit in a flex:1 sibling so it isn't crushed by the footer */}
        <View style={{ flex: 1, minHeight: 0 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {formError && showErrors ? (
              <View
                style={{
                  marginBottom: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  backgroundColor: `${colors.error}10`,
                  borderColor: `${colors.error}30`,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.error }}>
                  {formError}
                </Text>
              </View>
            ) : null}


          <SectionCard
            colors={colors}
            softBorder={softBorder}
            title="Basics"
            icon={<Building2 size={16} color={colors.primary} />}
          >
            <FieldLabel label="Property title" colors={colors} />
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Lekki Waterfront Apartment"
              placeholderTextColor={colors.placeholder}
              style={[
                {
                  height: 52,
                  borderRadius: 16,
                  borderWidth: 1,
                  paddingHorizontal: 16,
                  fontSize: 15,
                  marginBottom: 4,
                },
                inputStyle(showErrors && !!fieldErrors.title),
              ]}
              editable={!submitting}
            />
            <FieldError show={showErrors} message={fieldErrors.title} color={colors.error} />

            <FieldLabel label="Purpose" colors={colors} />
            <View
              style={{
                flexDirection: "row",
                padding: 4,
                borderRadius: 16,
                marginBottom: 14,
                backgroundColor: `${colors.placeholder}18`,
              }}
            >
              {(["Sale", "Rent"] as const).map((p) => {
                const active = purpose === p;
                return (
                  <TouchableOpacity
                    key={p}
                    disabled={submitting}
                    onPress={() => {
                      setPurpose(p);
                      if (p === "Rent" && propertyType === "Land") {
                        setPropertyType("Apartment");
                      }
                    }}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: active ? colors.background : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "700",
                        fontSize: 13,
                        color: active ? colors.primary : colors.placeholder,
                      }}
                    >
                      For {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <FieldLabel label="Property type" colors={colors} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled
              style={{ marginBottom: 14, maxHeight: 44 }}
              contentContainerStyle={{ flexDirection: "row", gap: 8, alignItems: "center" }}
            >
              {typeOptions.map((t) => {
                const active = propertyType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    disabled={submitting}
                    onPress={() => setPropertyType(t)}
                    style={{
                      paddingHorizontal: 16,
                      height: 40,
                      borderRadius: 999,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      backgroundColor: active ? `${colors.primary}14` : colors.background,
                      borderColor: active ? colors.primary : softBorder,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: active ? colors.primary : colors.text,
                      }}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <FieldLabel label="Price (NGN)" colors={colors} />
            <View
              style={[
                {
                  height: 52,
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: 16,
                  borderWidth: 1,
                  paddingHorizontal: 16,
                  marginBottom: 4,
                },
                inputStyle(showErrors && !!fieldErrors.price),
              ]}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", marginRight: 4, color: colors.placeholder }}>
                ₦
              </Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.placeholder}
                style={{ flex: 1, height: "100%", fontSize: 15, color: colors.text }}
                editable={!submitting}
              />
            </View>
            <FieldError show={showErrors} message={fieldErrors.price} color={colors.error} />

            <FieldLabel label="Location" colors={colors} />
            <View
              style={[
                {
                  height: 52,
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: 16,
                  borderWidth: 1,
                  paddingHorizontal: 16,
                  marginBottom: 4,
                },
                inputStyle(showErrors && !!fieldErrors.location),
              ]}
            >
              <MapPin size={16} color={colors.placeholder} />
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Address / area"
                placeholderTextColor={colors.placeholder}
                style={{ flex: 1, marginLeft: 8, height: "100%", fontSize: 15, color: colors.text }}
                editable={!submitting}
              />
            </View>
            <FieldError show={showErrors} message={fieldErrors.location} color={colors.error} />

            <FieldLabel label="Listing status" colors={colors} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["Active", "Inactive"] as const).map((s) => {
                const active = status === s;
                const accent = s === "Active" ? colors.success : colors.placeholder;
                return (
                  <TouchableOpacity
                    key={s}
                    disabled={submitting}
                    onPress={() => setStatus(s)}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 6,
                      borderWidth: 1,
                      backgroundColor: active ? `${accent}14` : colors.background,
                      borderColor: active ? accent : softBorder,
                    }}
                  >
                    {active ? <CheckCircle2 size={14} color={accent} /> : null}
                    <Text style={{ fontWeight: "700", fontSize: 13, color: active ? accent : colors.text }}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>

          <SectionCard
            colors={colors}
            softBorder={softBorder}
            title="Details"
            icon={<Ruler size={16} color={colors.primary} />}
          >
            {!isLand ? (
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 4 }}>
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Bedrooms" colors={colors} />
                  <View
                    style={[
                      {
                        height: 52,
                        flexDirection: "row",
                        alignItems: "center",
                        borderRadius: 16,
                        borderWidth: 1,
                        paddingHorizontal: 12,
                      },
                      inputStyle(showErrors && !!fieldErrors.bedrooms),
                    ]}
                  >
                    <BedDouble size={16} color={colors.placeholder} />
                    <TextInput
                      value={bedrooms}
                      onChangeText={setBedrooms}
                      keyboardType="numeric"
                      style={{ flex: 1, marginLeft: 8, height: "100%", fontSize: 15, color: colors.text }}
                      editable={!submitting}
                    />
                  </View>
                  <FieldError show={showErrors} message={fieldErrors.bedrooms} color={colors.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Bathrooms" colors={colors} />
                  <View
                    style={[
                      {
                        height: 52,
                        flexDirection: "row",
                        alignItems: "center",
                        borderRadius: 16,
                        borderWidth: 1,
                        paddingHorizontal: 12,
                      },
                      inputStyle(showErrors && !!fieldErrors.bathrooms),
                    ]}
                  >
                    <Bath size={16} color={colors.placeholder} />
                    <TextInput
                      value={bathrooms}
                      onChangeText={setBathrooms}
                      keyboardType="numeric"
                      style={{ flex: 1, marginLeft: 8, height: "100%", fontSize: 15, color: colors.text }}
                      editable={!submitting}
                    />
                  </View>
                  <FieldError show={showErrors} message={fieldErrors.bathrooms} color={colors.error} />
                </View>
              </View>
            ) : null}

            <FieldLabel label="Size (sqm)" colors={colors} />
            <View
              style={[
                {
                  height: 52,
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: 16,
                  borderWidth: 1,
                  paddingHorizontal: 16,
                  marginBottom: 4,
                },
                inputStyle(showErrors && !!fieldErrors.size),
              ]}
            >
              <Ruler size={16} color={colors.placeholder} />
              <TextInput
                value={size}
                onChangeText={setSize}
                keyboardType="numeric"
                placeholder="e.g. 120"
                placeholderTextColor={colors.placeholder}
                style={{ flex: 1, marginLeft: 8, height: "100%", fontSize: 15, color: colors.text }}
                editable={!submitting}
              />
            </View>
            <FieldError show={showErrors} message={fieldErrors.size} color={colors.error} />

            <FieldLabel label="Description" colors={colors} />
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              placeholder="Describe the property, amenities, and neighbourhood…"
              placeholderTextColor={colors.placeholder}
              style={[
                {
                  minHeight: 120,
                  borderRadius: 16,
                  borderWidth: 1,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                },
                inputStyle(showErrors && !!fieldErrors.description),
              ]}
              editable={!submitting}
            />
            <FieldError show={showErrors} message={fieldErrors.description} color={colors.error} />
          </SectionCard>

          <SectionCard
            colors={colors}
            softBorder={softBorder}
            title={`Photos (${photos.length}/${MAX_PHOTOS})`}
            icon={<ImagePlus size={16} color={colors.primary} />}
          >
            <Text style={{ fontSize: 12, lineHeight: 16, marginBottom: 12, color: colors.placeholder }}>
              Tap a photo to replace it, or use + to add more. At least one photo is required.
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled
              style={{ height: 124 }}
              contentContainerStyle={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 4,
                paddingRight: 8,
              }}
            >
              <TouchableOpacity
                disabled={submitting || photos.length >= MAX_PHOTOS}
                onPress={() => pickPhotos()}
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  alignItems: "center",
                  justifyContent: "center",
                  borderColor: colors.primary,
                  backgroundColor: `${colors.primary}0A`,
                  opacity: photos.length >= MAX_PHOTOS ? 0.5 : 1,
                }}
              >
                <ImagePlus size={22} color={colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: "700", marginTop: 6, color: colors.primary }}>
                  Add photo
                </Text>
              </TouchableOpacity>

              {photos.map((photo, index) => (
                <View key={`${photo.uri}-${index}`} style={{ position: "relative", width: 112, height: 112 }}>
                  <TouchableOpacity
                    disabled={submitting}
                    activeOpacity={0.85}
                    onPress={() => pickPhotos(index)}
                    style={{ width: 112, height: 112, borderRadius: 16, overflow: "hidden" }}
                  >
                    <Image
                      source={{ uri: photo.uri }}
                      style={{ width: 112, height: 112 }}
                      resizeMode="cover"
                    />
                    <View
                      style={{
                        position: "absolute",
                        bottom: 8,
                        left: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                        backgroundColor: "rgba(0,0,0,0.55)",
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>
                        {photo.remote ? "Replace" : "New"}
                      </Text>
                    </View>
                    {index === 0 ? (
                      <View
                        style={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: colors.primary,
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>Cover</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={submitting}
                    onPress={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.error,
                      zIndex: 2,
                    }}
                  >
                    <X size={13} color="#FFF" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <FieldError show={showErrors} message={fieldErrors.photos} color={colors.error} />
          </SectionCard>

          <SectionCard
            colors={colors}
            softBorder={softBorder}
            title="Video tour"
            icon={<VideoIcon size={16} color={colors.primary} />}
          >
            <Text style={{ fontSize: 12, lineHeight: 16, marginBottom: 12, color: colors.placeholder }}>
              Optional. MP4 or MOV, up to 50MB.
            </Text>

            {video ? (
              <View
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: softBorder,
                  backgroundColor: fieldBg,
                }}
              >
                {/* Avoid embedding VideoView in the form — it breaks ScrollView layout on both platforms. */}
                <View
                  style={{
                    height: 160,
                    backgroundColor: "#0F172A",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <VideoIcon size={36} color="#FFFFFF" />
                  <Text style={{ color: "#FFFFFF", marginTop: 8, fontSize: 13, fontWeight: "600" }}>
                    {video.remote ? "Video attached" : "New video selected"}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4, fontSize: 11 }}>
                    Preview plays on the property page
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 8,
                    padding: 12,
                  }}
                >
                  <TouchableOpacity
                    disabled={submitting}
                    onPress={pickVideo}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      backgroundColor: `${colors.primary}14`,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>Replace</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={submitting}
                    onPress={clearVideo}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      backgroundColor: `${colors.error}12`,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.error }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                disabled={submitting}
                onPress={pickVideo}
                style={{
                  height: 112,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  alignItems: "center",
                  justifyContent: "center",
                  borderColor: colors.primary,
                  backgroundColor: `${colors.primary}0A`,
                }}
              >
                <VideoIcon size={22} color={colors.primary} />
                <Text style={{ fontWeight: "700", fontSize: 14, marginTop: 8, color: colors.primary }}>
                  Add video
                </Text>
              </TouchableOpacity>
            )}
          </SectionCard>

          <View
            style={{
              borderRadius: 20,
              borderWidth: 1,
              padding: 16,
              marginBottom: 8,
              borderColor: `${colors.error}25`,
              backgroundColor: `${colors.error}08`,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", marginBottom: 4, color: colors.error }}>
              Delete property
            </Text>
            <Text style={{ fontSize: 12, lineHeight: 16, marginBottom: 12, color: colors.placeholder }}>
              Permanently remove this listing and its media. This cannot be undone.
            </Text>
            <TouchableOpacity
              disabled={submitting || deleting}
              onPress={confirmDelete}
              style={{
                height: 48,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                borderWidth: 1,
                borderColor: `${colors.error}40`,
                backgroundColor: colors.background,
                opacity: deleting ? 0.7 : 1,
              }}
            >
              {deleting ? (
                <ActivityIndicator color={colors.error} />
              ) : (
                <>
                  <Trash2 size={16} color={colors.error} />
                  <Text style={{ fontWeight: "700", fontSize: 14, color: colors.error }}>
                    Delete property
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          </ScrollView>
        </View>
      </SafeAreaView>

      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: colors.background }}>
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 8,
            borderTopWidth: 1,
            borderTopColor: softBorder,
            backgroundColor: colors.background,
          }}
        >
          {submitting ? (
            <View
              style={{
                height: 6,
                borderRadius: 999,
                overflow: "hidden",
                marginBottom: 10,
                backgroundColor: `${colors.placeholder}30`,
              }}
            >
              <View
                style={{
                  height: "100%",
                  borderRadius: 999,
                  width: `${Math.max(4, uploadProgress)}%`,
                  backgroundColor: colors.primary,
                }}
              />
            </View>
          ) : null}

          <TouchableOpacity
            disabled={submitting || deleting}
            onPress={save}
            style={{
              height: 54,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              backgroundColor: submitting || deleting ? colors.disabled : colors.primary,
              opacity: submitting ? 0.9 : 1,
            }}
          >
            {submitting ? (
              <>
                <ActivityIndicator color="#FFF" />
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 15 }}>
                  Saving… {uploadProgress}%
                </Text>
              </>
            ) : (
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 15 }}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

function SectionCard({
  title,
  icon,
  children,
  colors,
  softBorder,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>["colors"];
  softBorder: string;
}) {
  return (
    <View
      style={{
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        marginBottom: 14,
        backgroundColor: colors.card,
        borderColor: softBorder,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${colors.primary}14`,
          }}
        >
          {icon}
        </View>
        <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function FieldLabel({
  label,
  colors,
}: {
  label: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 6,
        marginTop: 4,
        color: colors.placeholder,
      }}
    >
      {label}
    </Text>
  );
}

function FieldError({
  show,
  message,
  color,
}: {
  show: boolean;
  message?: string;
  color: string;
}) {
  if (!show || !message) {
    return <View style={{ marginBottom: 10 }} />;
  }
  return (
    <Text style={{ fontSize: 11, fontWeight: "500", marginBottom: 10, marginTop: 4, color }}>
      {message}
    </Text>
  );
}
