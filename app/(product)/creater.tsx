import { useTheme } from "@/hooks/use-theme";
import { PropertyVideo } from "@/components/property-video";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  CloudArrowUp,
  Image as ImageIcon,
  VideoCamera,
  X,
} from "phosphor-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API } from "../../services/api";

const TYPES = ["Apartment", "Hotel", "Shortlet"];
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export default function CreateProduct() {
  const router = useRouter();
  const { colors } = useTheme();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [propertyType, setPropertyType] = useState("");

  const [images, setImages] = useState<any[]>([]);
  const [video, setVideo] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * 📸 PICK IMAGES
   */
  const pickImages = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission required");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.4,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });

      if (!result.canceled) {
        setImages(result.assets);
      }
    } catch (err) {
      console.log("pickImages error:", err);
      Alert.alert(
        "Couldn't open photos",
        "If the photo is iCloud-only, download it in Photos first, then try again."
      );
    }
  };

  /**
   * 🎥 PICK VIDEO
   */
  const pickVideo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission required");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: false,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
        videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const fileSize = (file as any).fileSize || (file as any).size;

      if (fileSize != null && fileSize > MAX_VIDEO_SIZE) {
        Alert.alert(
          "Video too large",
          "Video must be 50MB or less. Please compress or choose another video."
        );
        return;
      }

      const name = (file.fileName || file.uri || "").toLowerCase();
      const mime = file.mimeType || "";
      if (
        !name.endsWith(".mp4") &&
        !name.endsWith(".mov") &&
        mime !== "video/mp4" &&
        mime !== "video/quicktime" &&
        !mime.startsWith("video/")
      ) {
        Alert.alert("Invalid format", "Only MP4 and MOV videos are allowed");
        return;
      }

      setVideo(file);
    } catch (err: any) {
      console.log("pickVideo error:", err);
      Alert.alert(
        "Couldn't load video",
        "This video may be iCloud-only. Download it in Photos, then pick it again."
      );
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => setVideo(null);

  /**
   * 🚀 SUBMIT
   */
  const handleSubmit = async () => {
    if (
      !title ||
      !price ||
      !location ||
      !propertyType ||
      !description ||
      images.length === 0 ||
      !video
    ) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (images.length === 0) {
      Alert.alert("Error", "Please add at least one image");
      return;
    }

    try {
      setLoading(true);
      setProgress(0);

      const formData = new FormData();

      formData.append("title", title);
      formData.append("price", price);
      formData.append("location", location);
      formData.append("propertyType", propertyType);
      formData.append("description", description);

      // IMAGES
      images.forEach((img, index) => {
        formData.append("images", {
          uri: img.uri,
          name: `image_${index}.jpg`,
          type: "image/jpeg",
        } as any);
      });

      // VIDEO
      if (video) {
        formData.append("video", {
          uri: video.uri,
          name: "video.mp4",
          type: "video/mp4",
        } as any);
      }

      await API.post("/products/add-rental-product", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded * 100) / (event.total || 1));
          setProgress(percent);
        },
      });

      Alert.alert("Success", "Listing created successfully");
      router.push("/(product)/products");
    } catch (err: any) {
      console.log(err?.response?.data || err.message);
      Alert.alert("Error", "Failed to create listing");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView className="px-6 py-4">
        {/* HEADER */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-3xl font-black" style={{ color: colors.text }}>
            Create Listing
          </Text>

          <TouchableOpacity onPress={() => router.back()}>
            <X size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* INPUTS */}
        <TextInput
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
          className="border p-4 rounded-xl mb-3"
          style={{ borderColor: colors.border, color: colors.text }}
        />

        <TextInput
          placeholder="Location"
          value={location}
          onChangeText={setLocation}
          className="border p-4 rounded-xl mb-3"
          style={{ borderColor: colors.border, color: colors.text }}
        />

        <TextInput
          placeholder="Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          className="border p-4 rounded-xl mb-3"
          style={{ borderColor: colors.border, color: colors.text }}
        />

        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          className="border p-4 rounded-xl mb-4"
          style={{ borderColor: colors.border, color: colors.text }}
        />

        {/* PROPERTY TYPE */}
        <View className="flex-row gap-2 mb-4">
          {TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setPropertyType(type)}
              className="px-4 py-2 rounded-lg border"
              style={{
                backgroundColor:
                  propertyType === type ? colors.text : "transparent",
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  color:
                    propertyType === type ? colors.background : colors.text,
                }}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* IMAGE PICKER */}
        <TouchableOpacity
          onPress={pickImages}
          className="p-6 border-dashed border rounded-xl items-center mb-4"
        >
          <ImageIcon size={30} color={colors.text} />
          <Text style={{ color: colors.text }}>Add Images</Text>
        </TouchableOpacity>

        {/* VIDEO PICKER (FIXED) */}
        <TouchableOpacity
          onPress={pickVideo}
          className="p-6 border-dashed border rounded-xl items-center mb-4"
        >
          <VideoCamera size={30} color={colors.text} />
          <Text style={{ color: colors.text }}>Add Video (MP4/MOV, max 50MB)</Text>
        </TouchableOpacity>

        {/* IMAGE PREVIEW */}
        <ScrollView horizontal className="mb-4">
          {images.map((img, i) => (
            <View key={i} className="mr-2 relative">
              <Image
                source={{ uri: img.uri }}
                className="w-24 h-24 rounded-xl"
              />
              <TouchableOpacity
                onPress={() => removeImage(i)}
                className="absolute top-1 right-1 bg-black/70 p-1 rounded-full"
              >
                <X size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* VIDEO PREVIEW */}
        {video && (
          <View className="mb-4 relative">
            <PropertyVideo
              uri={video.uri}
              style={{ width: "100%", height: 200, borderRadius: 12 }}
              contentFit="cover"
            />
            <TouchableOpacity
              onPress={removeVideo}
              className="absolute top-2 right-2 bg-black/70 p-2 rounded-full"
            >
              <X size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* PROGRESS */}
        {loading && (
          <View className="flex-row items-center mb-4">
            <ActivityIndicator color={colors.text} />
            <Text style={{ marginLeft: 10, color: colors.text }}>
              Uploading... {progress}%
            </Text>
          </View>
        )}

        {/* SUBMIT */}
        <TouchableOpacity
          onPress={handleSubmit}
          className="p-5 rounded-xl items-center"
          style={{ backgroundColor: colors.text }}
        >
          <View className="flex-row items-center">
            <CloudArrowUp size={20} color={colors.background} />
            <Text style={{ color: colors.background, marginLeft: 8 }}>
              Create Listing
            </Text>
          </View>
        </TouchableOpacity>

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
