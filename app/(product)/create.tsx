import { useTheme } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { CloudArrowUp, Image as ImageIcon, X } from "phosphor-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API } from "../../services/api";

const TYPES = ["Apartment", "Hotel", "Shortlet"];

export default function CreateProduct() {
  const router = useRouter();
  const { colors } = useTheme();

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
        mediaTypes: ["images"],
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
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total ?? 1;
          const percent = Math.round((progressEvent.loaded * 100) / total);
          setUploadProgress(percent);
        },
      });

      Alert.alert("Success", "Listing created successfully");
      router.replace("/(agent)/products");
    } catch (err: any) {
      console.log("Error details:", err);
      if (err.response) {
        console.log("Response data:", err.response.data);
      }
      Alert.alert(
        "Error",
        "Failed to create listing: " + (err.message || "Network Error"),
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <ScrollView
        className="flex-1 px-6 py-4"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View className="flex-row justify-between items-center mb-8 mt-4">
          <Text
            className="text-3xl font-black tracking-tight"
            style={{ color: colors.text }}
          >
            Create Listing
          </Text>

          <Pressable
            onPress={() => router.back()}
            className="p-4 rounded-2xl border-2"
            style={{ borderColor: colors.border }}
          >
            <X size={22} color={colors.text} weight="bold" />
          </Pressable>
        </View>

        {/* TITLE */}
        <Text
          className="text-sm font-black uppercase tracking-widest mb-3"
          style={{ color: colors.text, opacity: 0.8 }}
        >
          Listing Title
        </Text>
        <TextInput
          placeholder="Enter listing title"
          placeholderTextColor={colors.border}
          value={title}
          onChangeText={setTitle}
          className="border-[3px] rounded-2xl p-5 mb-6 text-base font-bold"
          style={{ borderColor: colors.border, color: colors.text }}
        />

        {/* LOCATION */}
        <Text
          className="text-sm font-black uppercase tracking-widest mb-3"
          style={{ color: colors.text, opacity: 0.8 }}
        >
          Location
        </Text>
        <TextInput
          placeholder="Enter location"
          placeholderTextColor={colors.border}
          value={location}
          onChangeText={setLocation}
          className="border-[3px] rounded-2xl p-5 mb-6 text-base font-bold"
          style={{ borderColor: colors.border, color: colors.text }}
        />

        {/* PRICE */}
        <Text
          className="text-sm font-black uppercase tracking-widest mb-3"
          style={{ color: colors.text, opacity: 0.8 }}
        >
          Price (₦)
        </Text>
        <TextInput
          placeholder="Enter price"
          placeholderTextColor={colors.border}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          className="border-[3px] rounded-2xl p-5 mb-6 text-base font-bold"
          style={{ borderColor: colors.border, color: colors.text }}
        />

        {/* PROPERTY TYPE */}
        <Text
          className="text-sm font-black uppercase tracking-widest mb-4"
          style={{ color: colors.text, opacity: 0.8 }}
        >
          Property Type
        </Text>

        <View className="flex-row gap-3 mb-8 flex-wrap">
          {TYPES.map((type) => (
            <Pressable
              key={type}
              onPress={() => setPropertyType(type)}
              className="px-6 py-4 rounded-2xl border-[3px]"
              style={{
                backgroundColor:
                  propertyType === type ? colors.text : "transparent",
                borderColor: colors.border,
              }}
            >
              <Text
                className="font-black text-base"
                style={{
                  color:
                    propertyType === type ? colors.background : colors.text,
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
          className="p-8 border-[3px] border-dashed rounded-3xl items-center mb-8"
          style={{ borderColor: colors.border }}
        >
          <ImageIcon
            size={40}
            color={colors.text}
            style={{ marginBottom: 16, opacity: 0.6 }}
          />
          <Text
            className="font-black text-lg text-center mt-2"
            style={{ color: colors.text }}
          >
            Select Listing Images
          </Text>
          <Text
            className="text-sm font-medium opacity-60 text-center mt-2"
            style={{ color: colors.text }}
          >
            Select multiple high-resolution images
          </Text>
        </Pressable>

        {/* IMAGE PREVIEW */}
        {images.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-8"
          >
            {images.map((img, i) => (
              <View key={i} className="mr-4 relative">
                <Image
                  source={{ uri: img.uri }}
                  className="w-28 h-28 rounded-3xl"
                />

                {/* REMOVE BUTTON */}
                <Pressable
                  onPress={() => removeImage(i)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-black/70 items-center justify-center"
                >
                  <X size={14} color="#fff" weight="bold" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        {/* UPLOAD PROGRESS */}
        {loading && (
          <View
            className="mt-4 p-5 rounded-2xl items-center justify-center flex-row border-[3px]"
            style={{ borderColor: colors.border }}
          >
            <ActivityIndicator color={colors.text} size="large" />
            <Text
              className="text-sm font-black ml-4"
              style={{ color: colors.text }}
            >
              Uploading... {uploadProgress}%
            </Text>
          </View>
        )}

        {/* SUBMIT BUTTON */}
        <Pressable
          onPress={handleCreate}
          disabled={loading}
          className="py-6 rounded-2xl items-center mt-8 shadow-sm border-[3px]"
          style={{
            backgroundColor: colors.text,
            borderColor: colors.text,
          }}
        >
          <View className="flex-row items-center justify-center">
            <CloudArrowUp
              size={24}
              color={colors.background}
              style={{ marginRight: 10 }}
            />
            <Text
              className="font-black text-lg tracking-widest uppercase"
              style={{ color: colors.background }}
            >
              {loading ? "Creating..." : "Create Listing"}
            </Text>
          </View>
        </Pressable>

        <View className="h-36" />
      </ScrollView>
    </SafeAreaView>
  );
}
