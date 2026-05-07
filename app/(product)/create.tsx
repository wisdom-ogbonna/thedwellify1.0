import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  X,
  Image as ImageIcon,
  VideoCamera,
  CloudArrowUp,
} from "phosphor-react-native";
import { Video, ResizeMode } from "expo-av";
import { API } from "../../services/api";

const TYPES = ["Apartment", "Hotel", "Shortlet"];
const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15MB

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
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages(result.assets);
    }
  };

  /**
   * 🎥 PICK VIDEO (FIXED)
   */
  const pickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos, // ✅ FIXED
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled) return;

    const file = result.assets[0];

    // 🔥 Get file size safely
    const fileSize = (file as any).fileSize || (file as any).size;

    if (!fileSize) {
      Alert.alert("Error", "Cannot read video size");
      return;
    }

    // ❌ Validate size BEFORE upload
    if (fileSize > MAX_VIDEO_SIZE) {
      Alert.alert(
        "Video too large",
        "Video must be 15MB or less. Please compress or choose another video."
      );
      return;
    }

    // ❌ Validate format
    if (!file.uri.endsWith(".mp4")) {
      Alert.alert("Invalid format", "Only MP4 videos are allowed");
      return;
    }

    setVideo(file);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => setVideo(null);

  /**
   * 🚀 SUBMIT
   */
  const handleSubmit = async () => {
    if (!title || !price || !location || !propertyType || !description) {
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
          const percent = Math.round(
            (event.loaded * 100) / (event.total || 1)
          );
          setProgress(percent);
        },
      });

      Alert.alert("Success", "Listing created successfully");
      router.back();
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

          <Pressable onPress={() => router.back()}>
            <X size={22} color={colors.text} />
          </Pressable>
        </View>

        {/* INPUTS */}
        <TextInput placeholder="Title" value={title} onChangeText={setTitle}
          className="border p-4 rounded-xl mb-3"
          style={{ borderColor: colors.border, color: colors.text }}
        />

        <TextInput placeholder="Location" value={location} onChangeText={setLocation}
          className="border p-4 rounded-xl mb-3"
          style={{ borderColor: colors.border, color: colors.text }}
        />

        <TextInput placeholder="Price" value={price} onChangeText={setPrice}
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
            <Pressable
              key={type}
              onPress={() => setPropertyType(type)}
              className="px-4 py-2 rounded-lg border"
              style={{
                backgroundColor:
                  propertyType === type ? colors.text : "transparent",
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: propertyType === type ? colors.background : colors.text }}>
                {type}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* IMAGE PICKER */}
        <Pressable onPress={pickImages} className="p-6 border-dashed border rounded-xl items-center mb-4">
          <ImageIcon size={30} color={colors.text} />
          <Text style={{ color: colors.text }}>Add Images</Text>
        </Pressable>

        {/* VIDEO PICKER (FIXED) */}
        <Pressable onPress={pickVideo} className="p-6 border-dashed border rounded-xl items-center mb-4">
          <VideoCamera size={30} color={colors.text} />
          <Text style={{ color: colors.text }}>
            Add Video (MP4, max 15MB)
          </Text>
        </Pressable>

        {/* IMAGE PREVIEW */}
        <ScrollView horizontal className="mb-4">
          {images.map((img, i) => (
            <View key={i} className="mr-2 relative">
              <Image source={{ uri: img.uri }} className="w-24 h-24 rounded-xl" />
              <Pressable onPress={() => removeImage(i)} className="absolute top-1 right-1 bg-black/70 p-1 rounded-full">
                <X size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
        </ScrollView>

        {/* VIDEO PREVIEW */}
        {video && (
          <View className="mb-4 relative">
            <Video
              source={{ uri: video.uri }}
              style={{ width: "100%", height: 200, borderRadius: 12 }}
              useNativeControls
              resizeMode={ResizeMode.COVER}
            />
            <Pressable onPress={removeVideo} className="absolute top-2 right-2 bg-black/70 p-2 rounded-full">
              <X size={14} color="#fff" />
            </Pressable>
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
        <Pressable
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
        </Pressable>

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}