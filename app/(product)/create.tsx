import { API } from "@/services/api";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Share2,
  Sliders,
  Video,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import Animated, { FadeIn, FadeInRight } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

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

const DEFAULT_REGION: Region = {
  latitude: 6.5244,
  longitude: 3.3792,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

type MediaAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
};

type CreatedListing = {
  id: string;
  title: string;
  location: string;
  price: number | string;
  status?: string;
  images?: string[];
  image?: string | null;
};

const formatNaira = (price: number | string | null | undefined) => {
  const n =
    typeof price === "number"
      ? price
      : Number(String(price ?? "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n)) return "₦0";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
};

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

const StepBars = ({ current }: { current: number }) => (
  <View className="flex-row justify-between items-center mb-6">
    <View className="flex-row space-x-1 items-center flex-1 mr-4 gap-1">
      {[1, 2, 3, 4].map((n) => (
        <View
          key={n}
          className={`h-1 rounded-full flex-1 ${
            n <= current ? "bg-[#0A65FF]" : "bg-slate-100"
          }`}
        />
      ))}
    </View>
    <Text className="text-md font-semibold text-slate-400 font-['Inter']">
      Step {current} of 4
    </Text>
  </View>
);

export default function CreateListingMultiStep() {
  const [step, setStep] = useState(1);

  // Step 1
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState<string>("Apartment");
  const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);
  const [purpose, setPurpose] = useState<"Sale" | "Rent">("Sale");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);
  const mapRef = useRef<MapView | null>(null);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 2
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [size, setSize] = useState("");
  const [description, setDescription] = useState("");

  // Step 3
  const [photos, setPhotos] = useState<MediaAsset[]>([]);
  const [video, setVideo] = useState<MediaAsset | null>(null);

  // Submit / success
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [createdListing, setCreatedListing] = useState<CreatedListing | null>(
    null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isLand = propertyType === "Land";

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const next = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
        setCoords(next);
        setMapRegion({
          ...next,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });

        const places = await Location.reverseGeocodeAsync(next);
        if (places?.[0] && !address.trim()) {
          const p = places[0];
          const label = [p.name, p.street, p.city || p.subregion, p.region]
            .filter(Boolean)
            .join(", ");
          if (label) setAddress(label);
        }
      } catch (err) {
        console.log("location bootstrap error:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getFilteredPropertyTypes = () => {
    if (purpose === "Rent") {
      return ALL_PROPERTY_TYPES.filter((type) => type !== "Land");
    }
    return [...ALL_PROPERTY_TYPES];
  };

  const handlePurposeChange = (selectedPurpose: "Sale" | "Rent") => {
    setPurpose(selectedPurpose);
    if (selectedPurpose === "Rent" && propertyType === "Land") {
      setPropertyType("Apartment");
    }
  };

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    try {
      const places = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (!places?.[0]) return;
      const p = places[0];
      const label = [p.name, p.street, p.city || p.subregion, p.region]
        .filter(Boolean)
        .join(", ");
      if (label) setAddress(label);
    } catch (err) {
      console.log("reverse geocode error:", err);
    }
  }, []);

  const onMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setCoords({ latitude, longitude });
    reverseGeocode(latitude, longitude);
  };

  const onMarkerDragEnd = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setCoords({ latitude, longitude });
    reverseGeocode(latitude, longitude);
  };

  const onAddressChange = (text: string) => {
    setAddress(text);
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      if (text.trim().length < 5) return;
      try {
        const results = await Location.geocodeAsync(text.trim());
        if (!results?.[0]) return;
        const next = {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        };
        setCoords(next);
        const region = {
          ...next,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };
        setMapRegion(region);
        mapRef.current?.animateToRegion(region, 400);
      } catch (err) {
        console.log("forward geocode error:", err);
      }
    }, 700);
  };

  const isStep1Valid =
    title.trim().length > 3 &&
    price.trim().length > 0 &&
    Number(String(price).replace(/,/g, "")) > 0 &&
    address.trim().length > 3 &&
    Boolean(coords);

  const isStep2Valid = useMemo(() => {
    if (description.trim().length < 10) return false;
    if (!size.trim() || Number(size) <= 0) return false;
    if (isLand) return true;
    return (
      bedrooms.trim().length > 0 &&
      Number(bedrooms) >= 0 &&
      bathrooms.trim().length > 0 &&
      Number(bathrooms) >= 0
    );
  }, [description, size, bedrooms, bathrooms, isLand]);

  const isStep3Valid = photos.length > 0;

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const pickPhotos = async () => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      Alert.alert("Limit reached", `You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Allow photo library access to continue. If you chose Limited Access, include the photos you want to upload."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.7,
        exif: false,
        // Avoid iOS PHPhotosError 3164 (iCloud / current-representation fast path).
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });

      if (result.canceled) return;

      const accepted: MediaAsset[] = [];
      for (const asset of result.assets) {
        const mime = asset.mimeType || "image/jpeg";
        if (asset.mimeType && !IMAGE_TYPES.has(asset.mimeType)) {
          Alert.alert("Unsupported image", "Use JPEG, PNG, WEBP, or HEIC images.");
          continue;
        }
        const sizeBytes = asset.fileSize ?? null;
        if (sizeBytes != null && sizeBytes > MAX_IMAGE_BYTES) {
          Alert.alert("Image too large", "Each image must be 10MB or less.");
          continue;
        }
        accepted.push({
          uri: asset.uri,
          mimeType: mime,
          fileName: asset.fileName,
          fileSize: sizeBytes,
        });
      }

      if (accepted.length) {
        setPhotos((prev) => [...prev, ...accepted].slice(0, MAX_PHOTOS));
      }
    } catch (err: any) {
      console.log("pickPhotos error:", err);
      Alert.alert(
        "Couldn't open photos",
        "iOS couldn't load that photo (often iCloud-only). Open Photos, download it, then try again — or pick a different image."
      );
    }
  };

  const pickVideo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Allow media library access to continue. If you chose Limited Access, include the video you want to upload."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: false,
        // Compatible + MediumQuality forces an export path that can pull iCloud videos
        // instead of the passthrough fast-path that throws PHPhotosErrorDomain 3164.
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
        Alert.alert("Invalid format", "Only MP4 and MOV videos are allowed.");
        return;
      }

      const sizeBytes = asset.fileSize ?? (asset as any).filesize ?? null;
      if (sizeBytes != null && sizeBytes > MAX_VIDEO_BYTES) {
        Alert.alert(
          "Video too large",
          `Video must be ${MAX_VIDEO_BYTES / (1024 * 1024)}MB or less.`
        );
        return;
      }

      setVideo({
        uri: asset.uri,
        mimeType: VIDEO_TYPES.has(mime) ? mime : "video/mp4",
        fileName: asset.fileName || "video.mp4",
        fileSize: sizeBytes,
      });
    } catch (err: any) {
      console.log("pickVideo error:", err);
      const message = String(err?.message || err || "");
      const isPhotos3164 =
        message.includes("3164") || message.includes("PHPhotosError");
      Alert.alert(
        "Couldn't load video",
        isPhotos3164
          ? "This video looks iCloud-only or not fully downloaded. Open the Photos app, download it to this device, then pick it again."
          : "Please try another video (MP4/MOV, up to 50MB)."
      );
    }
  };

  const publishListing = async () => {
    if (submitting || !isStep3Valid || !coords) return;

    setSubmitting(true);
    setSubmitError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("location", address.trim());
      formData.append("price", String(price).replace(/,/g, "").trim());
      formData.append("propertyType", propertyType);
      formData.append("purpose", purpose);
      formData.append("description", description.trim());
      formData.append("size", String(size).trim());
      formData.append("latitude", String(coords.latitude));
      formData.append("longitude", String(coords.longitude));

      if (!isLand) {
        formData.append("bedrooms", String(bedrooms).trim());
        formData.append("bathrooms", String(bathrooms).trim());
      }

      photos.forEach((img, index) => {
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

      if (video) {
        const mime = guessVideoMime(video);
        formData.append("video", {
          uri: video.uri,
          name: video.fileName || (mime.includes("quicktime") ? "video.mov" : "video.mp4"),
          type: mime,
        } as any);
      }

      const { data } = await API.post("/products/add-rental-product", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          const percent = Math.round(
            (event.loaded * 100) / (event.total || 1)
          );
          setUploadProgress(percent);
        },
      });

      const listing: CreatedListing = {
        id: data.id,
        title: data.data?.title || title.trim(),
        location: data.data?.location || address.trim(),
        price: data.data?.price ?? price,
        status: data.data?.status || "Active",
        images: data.data?.images || [],
        image: data.data?.images?.[0] || photos[0]?.uri || null,
      };

      setCreatedListing(listing);
      setStep(4);
    } catch (err: any) {
      console.log(err?.response?.data || err?.message);
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.details ||
        (err?.code === "ECONNABORTED"
          ? "Upload timed out. Try fewer/smaller photos or a shorter video."
          : null) ||
        (err?.message?.includes("Network")
          ? "Network error while uploading. Check your connection and try again."
          : null) ||
        "Failed to create listing. Please try again.";
      setSubmitError(message);
      Alert.alert("Couldn't publish", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["top", "bottom"]}
      style={{ backgroundColor: "white", flex: 1 }}
    >
      {step < 4 && (
        <View className="flex-row items-center justify-between px-6 py-3 border-b border-slate-100">
          <Pressable
            disabled={submitting}
            onPress={() => (step > 1 ? setStep(step - 1) : router.back())}
          >
            {step === 1 ? (
              <X size={22} color="#1E293B" />
            ) : (
              <ArrowLeft size={22} color="#1E293B" />
            )}
          </Pressable>
          <Text className="text-base font-semibold text-slate-800 font-['Inter']">
            Add New Listing
          </Text>
          <View className="w-16 items-end">
            {submitting ? (
              <Text className="text-[#0A65FF] font-medium text-md font-['Inter']">
                {uploadProgress}%
              </Text>
            ) : (
              <Text className="text-slate-400 font-medium text-md font-['Inter']">
                Draft
              </Text>
            )}
          </View>
        </View>
      )}

      {/* --- STEP 1: BASIC DETAILS --- */}
      {step === 1 && (
        <Animated.View entering={FadeIn} className="flex-1">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            className="px-6 py-4"
            keyboardShouldPersistTaps="handled"
          >
            <StepBars current={1} />

            <Text className="text-2xl font-bold text-slate-900 font-['Poppins'] mb-2">
              List your sanctuary.
            </Text>
            <Text className="text-slate-500 font-['Inter'] text-md leading-5 mb-6">
              Provide the fundamental details of your exclusive property to
              begin the curation process.
            </Text>

            <View className="space-y-5 gap-5">
              <View>
                <Text className="text-slate-700 font-semibold mb-2 text-md font-['Inter']">
                  Property Title
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., The Azure Heights Penthouse"
                  placeholderTextColor="#94A3B8"
                  className="w-full border border-slate-200 rounded-2xl bg-slate-50/50 px-6 h-14 text-slate-800 py-1 text-base font-['Inter']"
                />
              </View>

              <View className="flex-row space-x-4 gap-2">
                <View className="flex-1">
                  <Text className="text-slate-700 font-semibold mb-2 text-md font-['Inter']">
                    Type
                  </Text>
                  <Pressable
                    onPress={() => setIsTypeModalVisible(true)}
                    className="w-full border border-slate-200 rounded-2xl bg-slate-50/50 px-6 h-14 flex-row items-center justify-between active:bg-slate-100"
                  >
                    <Text className="text-slate-800 text-base font-['Inter']">
                      {propertyType}
                    </Text>
                    <ChevronDown size={18} color="#64748B" />
                  </Pressable>
                </View>

                <View className="flex-1">
                  <Text className="text-slate-700 font-semibold mb-2 text-md font-['Inter']">
                    Purpose
                  </Text>
                  <View className="flex-row bg-slate-100 p-1 rounded-2xl h-14 items-center">
                    <Pressable
                      onPress={() => handlePurposeChange("Sale")}
                      className={`flex-1 h-full rounded-xl justify-center items-center ${
                        purpose === "Sale"
                          ? "bg-white shadow-sm"
                          : "bg-transparent shadow-none"
                      }`}
                    >
                      <Text
                        className={`font-semibold text-md ${
                          purpose === "Sale"
                            ? "text-[#0A65FF]"
                            : "text-slate-500"
                        }`}
                      >
                        Sale
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handlePurposeChange("Rent")}
                      className={`flex-1 h-full rounded-xl justify-center items-center ${
                        purpose === "Rent"
                          ? "bg-white shadow-sm"
                          : "bg-transparent shadow-none"
                      }`}
                    >
                      <Text
                        className={`font-semibold text-md ${
                          purpose === "Rent"
                            ? "text-[#0A65FF]"
                            : "text-slate-500"
                        }`}
                      >
                        Rent
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <View>
                <Text className="text-slate-700 font-semibold mb-2 text-md font-['Inter']">
                  Target Price (NGN)
                </Text>
                <View className="w-full border border-slate-200 rounded-2xl bg-slate-50/50 px-4 h-14 flex-row items-center">
                  <Text className="text-slate-400 font-['Inter'] text-base mr-1">
                    ₦
                  </Text>
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    className="flex-1 text-slate-800 text-base font-['Inter'] h-full"
                  />
                </View>
              </View>

              <View>
                <Text className="text-slate-700 font-semibold mb-2 text-md font-['Inter']">
                  Location
                </Text>
                <View className="relative w-full h-44 rounded-3xl overflow-hidden border border-slate-200 bg-slate-100">
                  <MapView
                    ref={mapRef}
                    style={{ width: "100%", height: "100%" }}
                    provider={PROVIDER_GOOGLE}
                    region={mapRegion}
                    onRegionChangeComplete={setMapRegion}
                    onPress={onMapPress}
                  >
                    {coords ? (
                      <Marker
                        coordinate={coords}
                        draggable
                        onDragEnd={onMarkerDragEnd}
                      />
                    ) : null}
                  </MapView>
                  <View className="absolute top-3 left-3 right-3 bg-white/95 rounded-2xl border border-slate-100 h-12 px-4 flex-row items-center shadow-sm">
                    <Search size={18} color="#94A3B8" />
                    <TextInput
                      value={address}
                      onChangeText={onAddressChange}
                      placeholder="Search address..."
                      placeholderTextColor="#94A3B8"
                      className="flex-1 text-slate-800 text-md font-['Inter'] h-full ml-2"
                    />
                  </View>
                </View>
                <Text className="text-md text-slate-400 font-['Inter'] mt-2 text-center">
                  Tap or drag the pin to set the exact location
                </Text>
                {!coords ? (
                  <Text className="text-md text-amber-600 font-['Inter'] mt-1 text-center">
                    Set a map pin before continuing
                  </Text>
                ) : null}
              </View>
            </View>
          </ScrollView>

          <View className="border-t border-slate-100 px-6 py-4 flex-row items-center justify-between bg-white">
            <Pressable onPress={() => router.back()}>
              <Text className="text-slate-800 font-semibold font-['Inter'] text-md">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              disabled={!isStep1Valid}
              onPress={() => setStep(2)}
              className={`bg-[#0A65FF] px-6 h-12 rounded-2xl flex-row items-center justify-center shadow-sm ${
                !isStep1Valid ? "opacity-40" : ""
              }`}
            >
              <Text className="text-white font-semibold font-['Inter'] text-md mr-1">
                Next Step
              </Text>
              <ChevronRight color="white" size={18} />
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* --- STEP 2: SPECS + DESCRIPTION --- */}
      {step === 2 && (
        <Animated.View entering={FadeInRight} className="flex-1">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            className="px-6 py-4"
            keyboardShouldPersistTaps="handled"
          >
            <StepBars current={2} />

            <Text className="text-2xl font-bold text-slate-900 font-['Poppins'] mb-2">
              Property details
            </Text>
            <Text className="text-slate-500 font-['Inter'] text-md leading-5 mb-6">
              Add the specs clients care about — bedrooms, bathrooms, size and
              a clear description.
            </Text>

            <View className="gap-5">
              {!isLand && (
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-slate-700 font-semibold mb-2 text-md font-['Inter']">
                      Bedrooms
                    </Text>
                    <TextInput
                      value={bedrooms}
                      onChangeText={setBedrooms}
                      placeholder="e.g. 3"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      className="w-full border border-slate-200 rounded-2xl bg-slate-50/50 px-6 h-14 text-slate-800 text-base font-['Inter']"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-700 font-semibold mb-2 text-md font-['Inter']">
                      Bathrooms
                    </Text>
                    <TextInput
                      value={bathrooms}
                      onChangeText={setBathrooms}
                      placeholder="e.g. 2"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      className="w-full border border-slate-200 rounded-2xl bg-slate-50/50 px-6 h-14 text-slate-800 text-base font-['Inter']"
                    />
                  </View>
                </View>
              )}

              <View>
                <Text className="text-slate-700 font-semibold mb-2 text-md font-['Inter']">
                  Property Size (sqm)
                </Text>
                <TextInput
                  value={size}
                  onChangeText={setSize}
                  placeholder="e.g. 180"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  className="w-full border border-slate-200 rounded-2xl bg-slate-50/50 px-6 h-14 text-slate-800 text-base font-['Inter']"
                />
              </View>

              <View>
                <Text className="text-slate-700 font-semibold mb-2 text-md font-['Inter']">
                  Description
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe the property, amenities, and neighbourhood…"
                  placeholderTextColor="#94A3B8"
                  multiline
                  textAlignVertical="top"
                  className="w-full border border-slate-200 rounded-2xl bg-slate-50/50 px-5 py-4 min-h-[140px] text-slate-800 text-base font-['Inter']"
                />
              </View>
            </View>
          </ScrollView>

          <View className="border-t border-slate-100 px-6 py-4 flex-row space-x-3 bg-white gap-3">
            <Pressable
              onPress={() => setStep(1)}
              className="flex-1 bg-slate-100 h-14 rounded-2xl items-center justify-center"
            >
              <Text className="text-slate-700 font-semibold font-['Inter'] text-base">
                Back
              </Text>
            </Pressable>
            <Pressable
              disabled={!isStep2Valid}
              onPress={() => setStep(3)}
              className={`flex-[1.4] bg-[#0A65FF] h-14 rounded-2xl items-center justify-center shadow-md ${
                !isStep2Valid ? "opacity-40" : ""
              }`}
            >
              <Text className="text-white font-semibold font-['Inter'] text-base">
                Next: Media
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* --- STEP 3: MEDIA --- */}
      {step === 3 && (
        <Animated.View entering={FadeInRight} className="flex-1">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            className="px-6 py-4"
          >
            <StepBars current={3} />

            <View className="mb-2">
              <Text className="text-xl font-bold text-slate-900 font-['Poppins']">
                Add Photos
              </Text>
              <Text className="text-md text-slate-400 font-['Inter']">
                Add up to {MAX_PHOTOS} photos · JPEG, PNG, WEBP · 10MB each
              </Text>
            </View>

            <View className="flex-row flex-wrap -mx-1 mb-6">
              {photos.map((asset, index) => (
                <View
                  key={`${asset.uri}-${index}`}
                  style={{ width: (width - 48) / 3 }}
                  className="p-1 aspect-square relative"
                >
                  <Image
                    source={{ uri: asset.uri }}
                    className="w-full h-full rounded-2xl bg-slate-100"
                  />
                  <Pressable
                    disabled={submitting}
                    onPress={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-black/40 w-5 h-5 rounded-full items-center justify-center"
                  >
                    <X size={12} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}

              {photos.length < MAX_PHOTOS && (
                <View
                  style={{ width: (width - 48) / 3 }}
                  className="p-1 aspect-square"
                >
                  <Pressable
                    disabled={submitting}
                    onPress={pickPhotos}
                    className="w-full h-full border-2 border-dashed border-blue-200 bg-blue-50/20 rounded-2xl items-center justify-center"
                  >
                    <Plus size={20} color="#0A65FF" />
                    <Text className="text-md font-semibold text-[#0A65FF] font-['Inter'] mt-1">
                      Add More
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            <View className="mb-4">
              <Text className="text-base font-bold text-slate-900 font-['Poppins'] mb-2">
                Add Video{" "}
                <Text className="text-slate-400 font-normal">(Optional)</Text>
              </Text>
              {video ? (
                <View className="w-full border border-slate-200 rounded-2xl bg-white p-5 flex-row items-center">
                  <View className="w-12 h-12 bg-blue-50 rounded-xl items-center justify-center mr-4">
                    <Video size={22} color="#0A65FF" />
                  </View>
                  <View className="flex-1 mr-2">
                    <Text
                      className="text-md font-semibold text-slate-800 font-['Inter']"
                      numberOfLines={1}
                    >
                      {video.fileName || "Selected video"}
                    </Text>
                    <Text className="text-md text-slate-400 font-['Inter'] mt-0.5">
                      Ready to upload
                    </Text>
                  </View>
                  <Pressable
                    disabled={submitting}
                    onPress={() => setVideo(null)}
                    className="bg-slate-100 p-2 rounded-full"
                  >
                    <X size={16} color="#475569" />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  disabled={submitting}
                  onPress={pickVideo}
                  className="w-full border border-slate-200 rounded-2xl bg-white p-5 flex-row items-center border-dashed"
                >
                  <View className="w-12 h-12 bg-blue-50 rounded-xl items-center justify-center mr-4">
                    <Video size={22} color="#0A65FF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-md font-semibold text-slate-800 font-['Inter']">
                      Upload Video
                    </Text>
                    <Text className="text-md text-slate-400 font-['Inter'] mt-0.5">
                      MP4, MOV up to 50MB
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>

            {submitting && (
              <View className="mb-4">
                <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-[#0A65FF] rounded-full"
                    style={{ width: `${Math.max(uploadProgress, 4)}%` }}
                  />
                </View>
                <Text className="text-center text-slate-500 mt-2 font-['Inter']">
                  Uploading… {uploadProgress}%
                </Text>
              </View>
            )}

            {submitError ? (
              <Text className="text-red-500 text-center mb-3 font-['Inter']">
                {submitError}
              </Text>
            ) : null}
          </ScrollView>

          <View className="border-t border-slate-100 px-6 py-4 flex-row space-x-3 bg-white gap-3">
            <Pressable
              disabled={submitting}
              onPress={() => setStep(2)}
              className="flex-1 bg-slate-100 h-14 rounded-2xl items-center justify-center"
            >
              <Text className="text-slate-700 font-semibold font-['Inter'] text-base">
                Back
              </Text>
            </Pressable>
            <Pressable
              disabled={!isStep3Valid || submitting}
              onPress={publishListing}
              className={`flex-[1.4] bg-[#0A65FF] h-14 rounded-2xl items-center justify-center shadow-md ${
                !isStep3Valid || submitting ? "opacity-40" : ""
              }`}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold font-['Inter'] text-base">
                  Publish Listing
                </Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* --- STEP 4: SUCCESS --- */}
      {step === 4 && createdListing && (
        <Animated.View
          entering={FadeIn}
          className="flex-1 bg-slate-50/50 justify-between"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 2 }}
            className="px-6 mb-5"
          >
            <View className="items-center mt-6 mb-6">
              <View className="w-24 h-24 bg-emerald-50 rounded-full justify-center items-center border border-emerald-100">
                <View className="w-16 h-16 bg-emerald-500 rounded-full justify-center items-center shadow-sm">
                  <CheckCircle2 size={36} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </View>
            </View>

            <Text className="text-2xl font-bold text-center text-slate-900 font-['Poppins'] px-4 mb-2">
              Listing Published Successfully!
            </Text>
            <Text className="text-slate-400 text-center font-['Inter'] text-[14px] leading-5 px-6 mb-8">
              Your property has been listed successfully and is now live on the
              platform.
            </Text>

            <View className="bg-white rounded-3xl p-4 border border-slate-100 flex-row items-center shadow-sm shadow-slate-100 mb-8">
              <Image
                source={{
                  uri:
                    createdListing.image ||
                    createdListing.images?.[0] ||
                    photos[0]?.uri,
                }}
                className="w-24 h-24 rounded-2xl bg-slate-100 mr-4"
              />
              <View className="flex-1 justify-center">
                <View className="flex-row items-center justify-between mb-1">
                  <Text
                    className="text-base font-bold text-slate-800 font-['Poppins'] truncate flex-1 mr-2"
                    numberOfLines={1}
                  >
                    {createdListing.title}
                  </Text>
                  <View className="bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] font-bold text-emerald-600 font-['Inter'] uppercase">
                      {createdListing.status || "Active"}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center mb-2">
                  <MapPin size={12} color="#94A3B8" />
                  <Text
                    className="text-md text-slate-400 font-['Inter'] ml-1 flex-1"
                    numberOfLines={1}
                  >
                    {createdListing.location}
                  </Text>
                </View>
                <Text className="text-lg font-bold text-[#0A65FF] font-['Poppins']">
                  {formatNaira(createdListing.price)}
                </Text>
              </View>
            </View>

            <View className="px-1">
              <Text className="text-md font-bold text-slate-400 tracking-wider font-['Inter'] uppercase mb-4">
                What&apos;s Next?
              </Text>

              <View className="space-y-4">
                <View className="flex-row items-start mb-4">
                  <View className="w-10 h-10 rounded-xl bg-slate-100/80 items-center justify-center mr-4">
                    <Share2 size={16} color="#64748B" />
                  </View>
                  <View className="flex-1 pt-0.5">
                    <Text className="text-md font-semibold text-slate-700 font-['Inter']">
                      Share your listing
                    </Text>
                    <Text className="text-md text-slate-400 font-['Inter'] mt-0.5">
                      Share your listing to get more visibility
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start mb-4">
                  <View className="w-10 h-10 rounded-xl bg-slate-100/80 items-center justify-center mr-4">
                    <MessageSquare size={16} color="#64748B" />
                  </View>
                  <View className="flex-1 pt-0.5">
                    <Text className="text-md font-semibold text-slate-700 font-['Inter']">
                      Respond to enquiries
                    </Text>
                    <Text className="text-md text-slate-400 font-['Inter'] mt-0.5">
                      Respond to enquiries from interested buyers
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start">
                  <View className="w-10 h-10 rounded-xl bg-slate-100/80 items-center justify-center mr-4">
                    <Sliders size={16} color="#64748B" />
                  </View>
                  <View className="flex-1 pt-0.5">
                    <Text className="text-md font-semibold text-slate-700 font-['Inter']">
                      Manage your listing
                    </Text>
                    <Text className="text-md text-slate-400 font-['Inter'] mt-0.5">
                      Manage your listing anytime from My Listings
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          <View className="px-6 py-4 space-y-3 bg-white border-t border-slate-100">
            <Pressable
              className="w-full bg-[#0A65FF] h-14 rounded-2xl items-center justify-center shadow-md mb-2"
              onPress={() => {
                router.replace({
                  pathname: "/(product)/[id]",
                  params: { id: createdListing.id },
                });
              }}
            >
              <Text className="text-white font-semibold font-['Inter'] text-base">
                View My Listing
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                router.replace("/(agent)/agent-dashboard");
              }}
              className="w-full h-12 items-center justify-center"
            >
              <Text className="text-[#0A65FF] font-semibold font-['Inter'] text-md">
                Back to Dashboard
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      <Modal
        visible={isTypeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsTypeModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable
            className="flex-1"
            onPress={() => setIsTypeModalVisible(false)}
          />
          <View className="bg-white rounded-t-4xl px-6 pt-6 pb-10 shadow-xl max-h-[70%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-900 font-['Poppins']">
                Select Property Type
              </Text>
              <Pressable
                onPress={() => setIsTypeModalVisible(false)}
                className="bg-slate-100 p-2 rounded-full"
              >
                <X size={18} color="#475569" />
              </Pressable>
            </View>

            <FlatList
              data={getFilteredPropertyTypes()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = propertyType === item;
                return (
                  <Pressable
                    onPress={() => {
                      setPropertyType(item);
                      setIsTypeModalVisible(false);
                    }}
                    className={`flex-row items-center justify-between py-4 border-b border-slate-100 px-2 ${
                      isSelected ? "bg-blue-50/40 rounded-xl" : ""
                    }`}
                  >
                    <Text
                      className={`text-base font-['Inter'] ${
                        isSelected
                          ? "text-[#0A65FF] font-semibold"
                          : "text-slate-700"
                      }`}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Check size={20} color="#0A65FF" strokeWidth={2.5} />
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
