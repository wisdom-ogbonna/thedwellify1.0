import { useTheme } from "@react-navigation/native";
import { ResizeMode, Video } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowsOut,
  House,
  MapPin,
  Record,
  PencilSimple,
} from "phosphor-react-native";
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API } from "../../services/api";

export default function ProductDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();

  const videoRef = useRef<Video>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // FIXED: Explicitly set role to "agent" as a string to avoid type errors
  const userRole = "agent";

  useEffect(() => {
    if (id) {
      API.get(`/products/get-rental-product/${id}`)
        .then((res) => setProduct(res.data))
        .catch((err) => console.error("Fetch error:", err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading)
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );

  if (!product)
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <Text style={{ color: colors.text }}>Not found</Text>
      </View>
    );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          top: Platform.OS === "ios" ? 60 : 40,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 10,
        }}
        className="absolute left-6 w-12 h-12 z-50 rounded-full bg-white/90 items-center justify-center"
      >
        <ArrowLeft size={22} color="#000" weight="bold" />
      </TouchableOpacity>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* 1. HERO SECTION */}
        <View className="relative w-full h-100">
          <Image
            source={{
              uri: product.images?.[0] || "https://via.placeholder.com/600",
            }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        <View
          className="px-6 -mt-12 pt-10 rounded-t-[45px]"
          style={{ backgroundColor: colors.background }}
        >
          {/* 2. TITLE & LOCATION */}
          <Text
            className="text-3xl font-black leading-tight mb-2"
            style={{ color: colors.text }}
          >
            {product.title}
          </Text>

          <View className="flex-row items-center mb-8">
            <View className="bg-blue-500/10 p-1.5 rounded-lg">
              <MapPin size={16} color={colors.text} weight="bold" />
            </View>
            <Text
              className="ml-2 text-sm font-bold opacity-50"
              style={{ color: colors.text }}
            >
              {product.location}
            </Text>
          </View>

          {/* 3. STAT GRID */}
          <View className="flex-row justify-between mb-10">
            {[
              { label: "Type", value: product.propertyType, icon: House },
              {
                label: "Status",
                value: "Available",
                icon: Record,
                iconColor: "#10b981",
              },
              { label: "Size", value: "Spacious", icon: ArrowsOut },
            ].map((stat, i) => (
              <View
                key={i}
                className="bg-gray-50 dark:bg-gray-900 p-4 rounded-[28px] items-center flex-1 mx-1 border border-gray-100 dark:border-gray-800"
              >
                <stat.icon
                  size={20}
                  color={stat.iconColor || colors.text}
                  weight={stat.iconColor ? "fill" : "regular"}
                />
                <Text
                  className="text-[10px] uppercase font-bold mt-2 opacity-30"
                  style={{ color: colors.text }}
                >
                  {stat.label}
                </Text>
                <Text
                  className="text-[11px] font-black mt-0.5"
                  style={{ color: colors.text }}
                >
                  {stat.value}
                </Text>
              </View>
            ))}
          </View>

          {/* 4. VIDEO SECTION - Reverted to System Default */}
          {product.video && (
            <View className="mb-10">
              <Text
                className="font-black text-xs uppercase tracking-[2px] mb-5 opacity-40"
                style={{ color: colors.text }}
              >
                Virtual Tour
              </Text>
              <View
                style={{
                  shadowColor: colors.text,
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.15,
                  shadowRadius: 20,
                  elevation: 10,
                }}
                className="h-60 rounded-[35px] bg-black overflow-hidden"
              >
                <Video
                  ref={videoRef}
                  source={{ uri: product.video }}
                  style={{ flex: 1 }}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  isLooping
                  useNativeControls // REVERTED: Now uses standard system controls
                />
              </View>
            </View>
          )}

          {/* 5. DESCRIPTION */}
          <Text
            className="font-black text-xs uppercase tracking-[2px] mb-4 opacity-40"
            style={{ color: colors.text }}
          >
            About the property
          </Text>
          <Text
            className="text-[15px] leading-7 font-medium opacity-70"
            style={{ color: colors.text }}
          >
            {product.description}
          </Text>
        </View>
      </ScrollView>

      {/* 6. ACTION BAR */}
      <View
        className="absolute bottom-0 left-0 right-0 px-8 pt-5 pb-5 flex-row items-center justify-between border-t border-gray-100 dark:border-gray-800"
        style={{
          backgroundColor:
            Platform.OS === "ios" ? "rgba(255,255,255,0.9)" : colors.background,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        }}
      >
        <View className="flex-1 mr-6">
          <Text
            style={{ color: colors.text }}
            className="text-[10px] font-black uppercase opacity-30 tracking-widest"
          >
            TOTAL PRICE
          </Text>
          <Text
            className="text-2xl font-black tracking-tighter"
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ color: colors.text }}
          >
            ₦{Number(product.price).toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            if (userRole === "agent") {
              router.push(`/edit-product/${id}`);
            } else {
              console.log("Booking agent...");
            }
          }}
          className="bg-black dark:bg-white px-10 h-15 rounded-2xl flex-row items-center justify-center shadow-lg"
          activeOpacity={0.9}
        >
          {userRole === "agent" && (
            <View className="mr-2">
              <PencilSimple size={18} color={colors.background} weight="bold" />
            </View>
          )}
          <Text
            className="font-black text-sm tracking-widest uppercase"
            style={{ color: colors.background }}
          >
            {userRole === "agent" ? "Edit Listing" : "Book Agent"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
