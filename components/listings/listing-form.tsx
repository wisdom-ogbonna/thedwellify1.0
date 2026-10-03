import {
  PROPERTY_TYPES,
  isLand,
  needsListingDetails,
  needsRooms,
  type Listing,
} from "@/constants/listings";
import { useTheme } from "@/hooks/use-theme";
import { listingsApi, type ListingPayload } from "@/services/listings";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router, useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const TOTAL_STEPS = 4;

type LocalMedia = { uri: string; remote?: boolean };
type PurposeChoice = "Sale" | "Rent" | "";

export default function ListingForm({ listingId }: { listingId?: string }) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const isEdit = Boolean(listingId);

  const [step, setStep] = useState(1);
  const [loadingListing, setLoadingListing] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const [propertyType, setPropertyType] = useState("");
  const [purpose, setPurpose] = useState<PurposeChoice>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [plots, setPlots] = useState("");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [size, setSize] = useState("");
  const [photos, setPhotos] = useState<LocalMedia[]>([]);
  const [video, setVideo] = useState<LocalMedia | null>(null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: "none" } });
    return () => {
      parent?.setOptions({
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === "ios" ? 85 : 78,
          paddingBottom: Platform.OS === "ios" ? 30 : 10,
          paddingTop: 10,
        },
      });
    };
  }, [navigation, colors.background]);

  useEffect(() => {
    if (!listingId) return;
    let cancelled = false;
    (async () => {
      try {
        const listing: Listing = await listingsApi.get(listingId);
        if (cancelled) return;
        setPropertyType(listing.propertyType || "");
        setPurpose(listing.purpose === "Sale" ? "Sale" : "Rent");
        setTitle(listing.title || "");
        setDescription(listing.description || "");
        setPlots(listing.plots != null ? String(listing.plots) : "");
        setPrice(String(listing.price || "").replace(/[^\d.]/g, ""));
        setAddress(listing.location || "");
        setBedrooms(listing.bedrooms != null ? String(listing.bedrooms) : "");
        setBathrooms(listing.bathrooms != null ? String(listing.bathrooms) : "");
        setSize(listing.size || "");
        setPhotos((listing.images || []).map((uri) => ({ uri, remote: true })));
        setVideo(listing.video ? { uri: listing.video, remote: true } : null);
        setLatitude(listing.latitude ?? null);
        setLongitude(listing.longitude ?? null);
      } catch {
        Alert.alert("Error", "Could not load this property.");
        router.back();
      } finally {
        if (!cancelled) setLoadingListing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  const landSelected = isLand(propertyType);
  const detailsSelected = needsListingDetails(propertyType);
  const plotsValue = Number(plots);
  const canContinue = [
    Boolean(propertyType),
    purpose === "Sale" || purpose === "Rent",
    photos.length > 0,
    price.trim().length > 0 &&
      address.trim().length > 2 &&
      (landSelected
        ? Number.isInteger(plotsValue) && plotsValue > 0
        : title.trim().length > 2 && description.trim().length > 5),
  ];

  const useMyLocation = async () => {
    try {
      setLocating(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Location needed", "Allow location access to pin this property.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
      const results = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const first = results[0];
      if (first) {
        setAddress(
          [first.name, first.street, first.city, first.region, first.country]
            .filter(Boolean)
            .join(", "),
        );
      }
    } catch {
      Alert.alert("Location error", "Could not read your current position.");
    } finally {
      setLocating(false);
    }
  };

  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow photo access to upload images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.6,
      selectionLimit: Math.max(1, 10 - photos.length),
    });
    if (result.canceled) return;
    setPhotos((prev) =>
      [...prev, ...result.assets.map((asset) => ({ uri: asset.uri }))].slice(0, 10),
    );
  };

  const pickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow video access to upload a tour.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 1,
    });
    if (result.canceled) return;
    const file = result.assets[0];
    const fileSize = (file as any).fileSize ?? (file as any).filesize;
    if (fileSize && fileSize > MAX_VIDEO_SIZE) {
      Alert.alert("Video too large", "Please choose an MP4 video of 50MB or less.");
      return;
    }
    setRemoveVideo(false);
    setVideo({ uri: file.uri, remote: false });
  };

  const buildPayload = (): ListingPayload => ({
    title: detailsSelected ? title.trim() : title.trim(),
    location: address.trim(),
    price: price.trim(),
    propertyType,
    purpose,
    description: detailsSelected ? description.trim() : description.trim(),
    plots: landSelected ? plots.trim() : undefined,
    bedrooms: needsRooms(propertyType) ? bedrooms : "",
    bathrooms: needsRooms(propertyType) ? bathrooms : "",
    size: size.trim(),
    features: [],
    latitude,
    longitude,
    images: photos
      .filter((p) => !p.remote)
      .map((p, index) => ({
        uri: p.uri,
        name: `image_${index}.jpg`,
        type: "image/jpeg",
      })),
    keepImages: photos.filter((p) => p.remote).map((p) => p.uri),
    video:
      video && !video.remote
        ? { uri: video.uri, name: "video.mp4", type: "video/mp4" }
        : null,
    removeVideo,
  });

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const payload = buildPayload();
      if (listingId) {
        await listingsApi.update(listingId, payload);
      } else {
        await listingsApi.create(payload);
      }
      Alert.alert(
        listingId ? "Updated" : "Published",
        listingId ? "Your property has been updated." : "Your property is now live.",
        [{ text: "OK", onPress: () => router.replace("/(agent)/listings") }],
      );
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.error ||
          err?.response?.data?.details ||
          "Could not save this property.",
      );
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [
    styles.input,
    { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
  ];

  if (loadingListing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => (step > 1 ? setStep(step - 1) : router.back())}
            style={[styles.roundBtn, { backgroundColor: colors.disabled + "22" }]}
          >
            <Text style={[styles.roundBtnText, { color: colors.text }]}>
              {step > 1 ? "‹" : "✕"}
            </Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {isEdit ? "Edit property" : "Add property"}
            </Text>
            <Text style={[styles.headerSub, { color: colors.placeholder }]}>
              Step {step} of {TOTAL_STEPS}
            </Text>
          </View>
          <View style={styles.roundBtn} />
        </View>

        <View style={styles.progressRow}>
          {[1, 2, 3, 4].map((item) => (
            <View
              key={item}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    item <= step ? colors.primary : colors.disabled + "44",
                },
              ]}
            />
          ))}
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && (
            <>
              <Text style={[styles.heading, { color: colors.text }]}>
                What property type do you want to list?
              </Text>
              <Text style={[styles.subheading, { color: colors.placeholder }]}>
                Choose one. This decides the details we ask for next.
              </Text>
              {PROPERTY_TYPES.map((type) => {
                const active = propertyType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setPropertyType(type)}
                    style={[
                      styles.choice,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary + "14" : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceTitle,
                        { color: active ? colors.primary : colors.text },
                      ]}
                    >
                      {type}
                    </Text>
                    <Text style={[styles.choiceHint, { color: colors.placeholder }]}>
                      {type === "Land" ? "Number of plots" : "Title & description"}
                    </Text>
                  </Pressable>
                );
              })}
            </>
          )}

          {step === 2 && (
            <>
              <Text style={[styles.heading, { color: colors.text }]}>
                Is this for sale or rent?
              </Text>
              <Text style={[styles.subheading, { color: colors.placeholder }]}>
                {(propertyType || "This property") + " will be tagged from your choice."}
              </Text>
              {(["Rent", "Sale"] as const).map((item) => {
                const active = purpose === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setPurpose(item)}
                    style={[
                      styles.choice,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary + "14" : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceTitle,
                        { color: active ? colors.primary : colors.text },
                      ]}
                    >
                      For {item}
                    </Text>
                  </Pressable>
                );
              })}
            </>
          )}

          {step === 3 && (
            <>
              <Text style={[styles.heading, { color: colors.text }]}>Photos & video</Text>
              <Text style={[styles.subheading, { color: colors.placeholder }]}>
                Add at least one photo. Video is optional and must be MP4, 50MB or less.
              </Text>
              <View style={styles.photoGrid}>
                {photos.map((photo, index) => (
                  <View key={`${photo.uri}-${index}`} style={styles.photoWrap}>
                    <Image source={{ uri: photo.uri }} style={styles.photo} />
                    <Pressable
                      onPress={() =>
                        setPhotos((prev) => prev.filter((_, i) => i !== index))
                      }
                      style={styles.photoRemove}
                    >
                      <Text style={styles.photoRemoveText}>✕</Text>
                    </Pressable>
                  </View>
                ))}
                {photos.length < 10 && (
                  <Pressable
                    onPress={pickPhotos}
                    style={[styles.addTile, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.addTilePlus, { color: colors.primary }]}>+</Text>
                    <Text style={[styles.addTileLabel, { color: colors.placeholder }]}>
                      Add photos
                    </Text>
                  </Pressable>
                )}
              </View>
              {video ? (
                <View style={[styles.videoRow, { borderColor: colors.border }]}>
                  <Text style={[styles.videoLabel, { color: colors.text }]} numberOfLines={1}>
                    Video selected
                  </Text>
                  <Pressable
                    onPress={() => {
                      if (video.remote) setRemoveVideo(true);
                      setVideo(null);
                    }}
                  >
                    <Text style={{ color: colors.error, fontWeight: "800" }}>Remove</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={pickVideo}
                  style={[styles.addVideo, { borderColor: colors.border }]}
                >
                  <Text style={[styles.choiceTitle, { color: colors.text }]}>
                    Add property video
                  </Text>
                  <Text style={[styles.choiceHint, { color: colors.placeholder }]}>
                    Optional MP4 tour
                  </Text>
                </Pressable>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <Text style={[styles.heading, { color: colors.text }]}>
                {landSelected ? "Land details" : "Listing details"}
              </Text>
              <Text style={[styles.subheading, { color: colors.placeholder }]}>
                {landSelected
                  ? "Land needs the number of plots, price and location."
                  : "Add a title, description, price and location."}
              </Text>

              {landSelected ? (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>Number of plots</Text>
                  <TextInput
                    value={plots}
                    onChangeText={setPlots}
                    keyboardType="number-pad"
                    placeholder="e.g. 4"
                    placeholderTextColor={colors.placeholder}
                    style={inputStyle}
                  />
                </>
              ) : (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>Title</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. 3 bedroom terrace in Lekki"
                    placeholderTextColor={colors.placeholder}
                    style={inputStyle}
                  />
                  <Text style={[styles.label, { color: colors.text }]}>Description</Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe the property"
                    placeholderTextColor={colors.placeholder}
                    multiline
                    textAlignVertical="top"
                    style={[inputStyle, styles.textarea]}
                  />
                </>
              )}

              <Text style={[styles.label, { color: colors.text }]}>Price (NGN)</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.placeholder}
                style={inputStyle}
              />

              {needsRooms(propertyType) && (
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text style={[styles.label, { color: colors.text }]}>Bedrooms</Text>
                    <TextInput
                      value={bedrooms}
                      onChangeText={setBedrooms}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.placeholder}
                      style={inputStyle}
                    />
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.label, { color: colors.text }]}>Bathrooms</Text>
                    <TextInput
                      value={bathrooms}
                      onChangeText={setBathrooms}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.placeholder}
                      style={inputStyle}
                    />
                  </View>
                </View>
              )}

              <Text style={[styles.label, { color: colors.text }]}>Size</Text>
              <TextInput
                value={size}
                onChangeText={setSize}
                placeholder="e.g. 450 sqm"
                placeholderTextColor={colors.placeholder}
                style={inputStyle}
              />

              <View style={styles.locationHeader}>
                <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>
                  Location
                </Text>
                <Pressable onPress={useMyLocation} disabled={locating}>
                  <Text style={{ color: colors.primary, fontWeight: "800" }}>
                    {locating ? "Getting location..." : "Use my location"}
                  </Text>
                </Pressable>
              </View>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Area, street or landmark"
                placeholderTextColor={colors.placeholder}
                style={inputStyle}
              />
              {latitude != null && longitude != null && (
                <Text style={[styles.coords, { color: colors.placeholder }]}>
                  Pin saved: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </Text>
              )}
            </>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {step < TOTAL_STEPS ? (
            <Pressable
              disabled={!canContinue[step - 1]}
              onPress={() => setStep(step + 1)}
              style={[
                styles.cta,
                {
                  backgroundColor: colors.primary,
                  opacity: canContinue[step - 1] ? 1 : 0.4,
                },
              ]}
            >
              <Text style={styles.ctaText}>
                {step === 1 ? "Next: sale or rent" : step === 2 ? "Next: photos" : "Next: details"}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              disabled={saving || !canContinue[3]}
              onPress={handleSubmit}
              style={[
                styles.cta,
                {
                  backgroundColor: colors.primary,
                  opacity: saving || !canContinue[3] ? 0.5 : 1,
                },
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaText}>
                  {isEdit ? "Save changes" : "Publish property"}
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCopy: { alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800" },
  headerSub: { fontSize: 11, marginTop: 2 },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  roundBtnText: { fontSize: 22, fontWeight: "600" },
  progressRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  progressDot: { flex: 1, height: 4, borderRadius: 99 },
  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 },
  heading: { fontSize: 24, fontWeight: "900", marginBottom: 8 },
  subheading: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  choice: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 18,
    justifyContent: "center",
    marginBottom: 12,
  },
  choiceTitle: { fontSize: 16, fontWeight: "800" },
  choiceHint: { fontSize: 12, marginTop: 4, fontWeight: "600" },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  photoWrap: { width: "30%", aspectRatio: 1, position: "relative" },
  photo: { width: "100%", height: "100%", borderRadius: 16 },
  photoRemove: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoRemoveText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  addTile: {
    width: "30%",
    aspectRatio: 1,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addTilePlus: { fontSize: 28, fontWeight: "300" },
  addTileLabel: { fontSize: 10, fontWeight: "700", marginTop: 4 },
  addVideo: {
    minHeight: 88,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  videoRow: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  videoLabel: { flex: 1, fontWeight: "700", marginRight: 12 },
  label: { fontSize: 14, fontWeight: "800", marginBottom: 8 },
  input: {
    height: 54,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  textarea: { height: 120, paddingTop: 14 },
  row: { flexDirection: "row", gap: 12 },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  coords: { fontSize: 12, marginTop: -8, marginBottom: 16 },
  footer: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth },
  cta: { height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
