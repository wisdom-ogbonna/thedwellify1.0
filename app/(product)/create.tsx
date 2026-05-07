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
import * as Haptics from "expo-haptics";
import {
  ImageIcon,
  VideoCamera,
  CaretLeft,
  Trash,
  X,
} from "phosphor-react-native";
import { Video, ResizeMode } from "expo-av";
import { API } from "../../services/api";

const TYPES = ["Apartment", "Hotel", "Shortlet"];

export default function CreateProduct() {
  const router = useRouter();
  const { colors } = useTheme();

  const [form, setForm] = useState({
    title: "",
    price: "",
    location: "",
    description: "",
    propertyType: "Apartment",
  });

  const [images, setImages] = useState<any[]>([]);
  const [video, setVideo] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const pickImages = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) setImages(result.assets);
  };

  const pickVideo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
    });
    if (!result.canceled) setVideo(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => formData.append(key, val));
    images.forEach((img, i) => {
      formData.append("images", {
        uri: img.uri,
        name: `p_${i}.jpg`,
        type: "image/jpeg",
      } as any);
    });
    if (video)
      formData.append("video", {
        uri: video.uri,
        name: "v.mp4",
        type: "video/mp4",
      } as any);

    try {
      await API.post("/products/add-rental-product", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (p) =>
          setProgress(Math.round((p.loaded * 100) / (p.total || 1))),
      });
      router.back();
    } catch (e) {
      Alert.alert("Error", "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* HEADER */}
      <View
        className="px-8 py-6 flex-row items-center justify-between border-b-[0.5px]"
        style={{ borderBottomColor: colors.text }}
      >
        <Pressable onPress={() => router.back()}>
          <CaretLeft size={24} color={colors.text} />
        </Pressable>
        <Text
          className="text-lg tracking-[2px]"
          style={{ color: colors.text, fontWeight: "600" }}
        >
          CREATE LISTING
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="px-8">
        <View className="mt-10">
          <Text
            className="text-xs tracking-[2px] mb-4 opacity-50"
            style={{ color: colors.text, fontWeight: "500" }}
          >
            CORE DATA
          </Text>

          <TextInput
            placeholder="PROPERTY TITLE"
            placeholderTextColor={colors.border} // Sharper placeholder
            className="text-[20px] py-6 border-b-[0.5px]"
            style={{
              color: colors.text,
              borderBottomColor: colors.text,
              fontWeight: "500",
            }}
            onChangeText={(v) => updateField("title", v)}
          />

          <TextInput
            placeholder="LOCATION / AREA"
            placeholderTextColor={colors.border}
            className="text-[20px] py-6 border-b-[0.5px]"
            style={{
              color: colors.text,
              borderBottomColor: colors.text,
              fontWeight: "500",
            }}
            onChangeText={(v) => updateField("location", v)}
          />

          <TextInput
            placeholder="PRICE (NGN)"
            keyboardType="numeric"
            placeholderTextColor={colors.border}
            className="text-[20px] py-6 border-b-[0.5px]"
            style={{
              color: colors.text,
              borderBottomColor: colors.text,
              fontWeight: "500",
            }}
            onChangeText={(v) => updateField("price", v)}
          />
        </View>

        {/* SELECTOR */}
        <View className="mt-12">
          <View className="flex-row gap-4">
            {TYPES.map((type) => (
              <Pressable
                key={type}
                onPress={() => updateField("propertyType", type)}
                className="flex-1 py-4 border-[0.5px] rounded-sm items-center"
                style={{
                  borderColor: colors.text,
                  backgroundColor:
                    form.propertyType === type ? colors.text : "transparent",
                }}
              >
                <Text
                  className="text-md tracking-widest"
                  style={{
                    fontWeight: "600",
                    color:
                      form.propertyType === type
                        ? colors.background
                        : colors.text,
                  }}
                >
                  {type.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* MEDIA BUTTONS */}
        <View className="flex-row gap-6 mt-12 mb-8">
          <Pressable
            onPress={pickImages}
            className="flex-1 items-center justify-center py-12 border-[0.5px] rounded-sm"
            style={{ borderColor: colors.text }}
          >
            <ImageIcon size={32} weight="thin" color={colors.text} />
            <Text
              className="text-sm mt-4 tracking-[1px]"
              style={{ color: colors.text, fontWeight: "500" }}
            >
              ADD IMAGES
            </Text>
          </Pressable>

          <Pressable
            onPress={pickVideo}
            className="flex-1 items-center justify-center py-12 border-[0.5px] rounded-sm"
            style={{ borderColor: colors.text }}
          >
            <VideoCamera size={32} weight="thin" color={colors.text} />
            <Text
              className="text-sm mt-4 tracking-[1px]"
              style={{ color: colors.text, fontWeight: "500" }}
            >
              ADD VIDEO
            </Text>
          </Pressable>
        </View>

        {/* PREVIEW CARDS */}
        {(images.length > 0 || video) && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-10"
          >
            {video && (
              <View
                className="mr-4 w-44 h-60 border-[0.5px] rounded-sm overflow-hidden bg-black"
                style={{ borderColor: colors.text }}
              >
                <Video
                  source={{ uri: video.uri }}
                  style={{ flex: 1 }}
                  resizeMode={ResizeMode.COVER}
                  isMuted
                  shouldPlay
                  isLooping
                />
              </View>
            )}
            {images.map((img, i) => (
              <View
                key={i}
                className="mr-4 w-44 h-60 border-[0.5px] rounded-sm overflow-hidden"
                style={{ borderColor: colors.text }}
              >
                <Image source={{ uri: img.uri }} className="w-full h-full" />
              </View>
            ))}
          </ScrollView>
        )}

        <TextInput
          placeholder="NARRATIVE / DESCRIPTION"
          multiline
          placeholderTextColor={colors.border}
          className="text-[18px] py-6 border-b-[0.5px] min-h-[120px] mb-12"
          style={{
            color: colors.text,
            borderBottomColor: colors.text,
            textAlignVertical: "top",
            fontWeight: "500",
          }}
          onChangeText={(v) => updateField("description", v)}
        />

        {/* SUBMIT BUTTON WITH INLINE PROGRESS */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className="h-20 items-center justify-center rounded-sm mb-16"
          style={{ backgroundColor: colors.text, opacity: loading ? 0.8 : 1 }}
        >
          {loading ? (
            <View className="flex-row items-center">
              <ActivityIndicator color={colors.background} className="mr-3" />
              <Text
                className="text-lg tracking-[4px]"
                style={{ color: colors.background, fontWeight: "600" }}
              >
                UPLOADING {progress}%
              </Text>
            </View>
          ) : (
            <Text
              className="text-lg tracking-[6px]"
              style={{ color: colors.background, fontWeight: "600" }}
            >
              LIST PROPERTY
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
