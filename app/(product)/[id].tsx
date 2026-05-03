import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { ArrowLeft, MapPin, Sparkle } from "phosphor-react-native";
import { API } from "../../services/api";

const { width } = Dimensions.get("window");

export default function ProductDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProduct = async () => {
    try {
      const res = await API.get(`/products/get-rental-product/${id}`);
      setProduct(res.data);
    } catch (err: any) {
      console.log("Fetch error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator color={colors.text} size="small" />
      </View>
    );
  }

  if (!product) {
    return (
      <View
        className="flex-1 justify-center items-center p-6"
        style={{ backgroundColor: colors.background }}
      >
        <Text className="font-bold text-lg" style={{ color: colors.text }}>
          No listing found
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      {/* HERO IMAGE CONTAINER */}
      <View
        className="relative w-full h-[380px] border-b"
        style={{ borderColor: colors.border }}
      >
        <Image
          source={{
            uri: product.images?.[0] || "https://via.placeholder.com/600",
          }}
          className="w-full h-full bg-gray-100 dark:bg-gray-900"
          resizeMode="cover"
        />

        {/* GRADIENT OVERLAY FOR TEXT READABILITY */}
        <View className="absolute inset-0 bg-black/10" />

        {/* FLOATING HEADER BUTTONS */}
        <View className="absolute top-14 left-6 right-6 flex-row justify-between items-center">
          <TouchableOpacity
            className="p-3.5 rounded-3xl shadow-2xl items-center justify-center border"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
            }}
            onPress={() => router.back()}
          >
            <ArrowLeft size={18} color={colors.text} weight="bold" />
          </TouchableOpacity>

          <View
            className="flex-row items-center px-4 py-2 rounded-full border bg-opacity-80"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
            }}
          >
            <Sparkle size={14} color={colors.text} weight="bold" />
            <Text
              className="text-2xs font-bold uppercase tracking-widest ml-1.5"
              style={{ color: colors.text }}
            >
              {product.propertyType || "Listing"}
            </Text>
          </View>
        </View>
      </View>

      {/* CONTENT PANEL */}
      <View
        className="px-6 py-8 -mt-6 rounded-t-[32px]"
        style={{ backgroundColor: colors.background }}
      >
        {/* TITLE AND PRICE */}
        <View className="flex-row justify-between items-start mb-4">
          <Text
            className="text-[28px] font-black tracking-tight leading-8 w-[72%]"
            style={{ color: colors.text }}
          >
            {product.title}
          </Text>

          <View className="items-end">
            <Text
              className="text-2xs font-bold tracking-widest uppercase opacity-40 mb-1"
              style={{ color: colors.text }}
            >
              Price
            </Text>
            <Text
              className="text-[22px] font-black tracking-tight"
              style={{ color: colors.text }}
            >
              ₦{Number(product.price).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* LOCATION BADGE */}
        {product.location && (
          <View
            className="flex-row items-center self-start px-4 py-2.5 rounded-2xl border mb-8"
            style={{ borderColor: colors.border }}
          >
            <MapPin size={16} color={colors.text} weight="bold" />
            <Text
              className="text-xs font-bold tracking-tight ml-2 opacity-75"
              style={{ color: colors.text }}
            >
              {product.location}
            </Text>
          </View>
        )}

        {/* INFORMATIVE SEPARATOR */}
        <View
          className="h-[1px] w-full mb-8 opacity-20"
          style={{ backgroundColor: colors.border }}
        />

        {/* DESCRIPTION SECTION */}
        <View className="space-y-3">
          <Text
            className="text-2xs font-bold tracking-widest uppercase opacity-40"
            style={{ color: colors.text }}
          >
            Description
          </Text>
          <Text
            className="text-[15px] leading-7 tracking-normal opacity-90 font-medium"
            style={{ color: colors.text }}
          >
            {product.description || "No description provided for this listing."}
          </Text>
        </View>

        <View className="h-36" />
      </View>
    </ScrollView>
  );
}
