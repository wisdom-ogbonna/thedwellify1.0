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
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { API } from "../../../services/api";

const TYPES = ["Apartment", "Hotel", "Shortlet"];

export default function CreateProduct() {
  const { colors } = useTheme();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * 📸 Pick Images
   */
  const pickImages = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission required", "Allow access to gallery");
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
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * 🗑 Remove Image
   */
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * 🚀 Submit
   */
  const handleCreate = async () => {
    if (!title || !price || !location || !propertyType) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (images.length === 0) {
      Alert.alert("Error", "Please add at least one image");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("title", title);
      formData.append("price", price);
      formData.append("location", location);
      formData.append("propertyType", propertyType);

      images.forEach((img, index) => {
        formData.append("images", {
          uri: img.uri,
          name: `image_${index}.jpg`,
          type: "image/jpeg",
        } as any);
      });

      await API.post("/products/add-rental-product", formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) /
              (progressEvent.total || 1)
          );
          setUploadProgress(percent);
        },
      });

      Alert.alert("Success", "Listing created successfully");

      router.back();
    } catch (err: any) {
      console.log(err.response?.data || err.message);
      Alert.alert("Error", "Failed to create listing");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <ScrollView
      className="flex-1 px-5 pt-6"
      style={{ backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <Text
        className="text-2xl font-bold mb-6"
        style={{ color: colors.text }}
      >
        Create Listing
      </Text>

      {/* TITLE */}
      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        className="border rounded-2xl p-4 mb-4"
      />

      {/* LOCATION */}
      <TextInput
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
        className="border rounded-2xl p-4 mb-4"
      />

      {/* PRICE */}
      <TextInput
        placeholder="Price (₦)"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        className="border rounded-2xl p-4 mb-4"
      />

      {/* PROPERTY TYPE */}
      <Text
        className="mb-2 font-semibold"
        style={{ color: colors.text }}
      >
        Property Type
      </Text>

      <View className="flex-row gap-2 mb-4 flex-wrap">
        {TYPES.map((type) => (
          <Pressable
            key={type}
            onPress={() => setPropertyType(type)}
            className="px-4 py-2 rounded-full"
            style={{
              backgroundColor:
                propertyType === type
                  ? colors.primary
                  : "#eee",
            }}
          >
            <Text
              style={{
                color:
                  propertyType === type ? "#fff" : "#000",
              }}
            >
              {type}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* IMAGE PICKER */}
      <Pressable
        onPress={pickImages}
        className="p-4 rounded-2xl items-center mb-4"
        style={{ backgroundColor: "#eee" }}
      >
        <Text>Select Images</Text>
      </Pressable>

      {/* IMAGE PREVIEW */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {images.map((img, i) => (
          <View key={i} className="mr-3 relative">
            <Image
              source={{ uri: img.uri }}
              className="w-24 h-24 rounded-xl"
            />

            {/* REMOVE BUTTON */}
            <Pressable
              onPress={() => removeImage(i)}
              className="absolute top-1 right-1 bg-black/60 rounded-full px-2"
            >
              <Text className="text-white text-xs">X</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* UPLOAD PROGRESS */}
      {loading && (
        <View className="mt-4">
          <ActivityIndicator color={colors.primary} />
          <Text className="text-center mt-2">
            Uploading... {uploadProgress}%
          </Text>
        </View>
      )}

      {/* SUBMIT BUTTON */}
      <Pressable
        onPress={handleCreate}
        disabled={loading}
        className="py-4 rounded-2xl items-center mt-6"
        style={{
          backgroundColor: loading
            ? "#999"
            : colors.primary,
        }}
      >
        <Text className="text-white font-bold">
          {loading ? "Creating..." : "Create Listing"}
        </Text>
      </Pressable>

      <View className="h-20" />
    </ScrollView>
  );
}