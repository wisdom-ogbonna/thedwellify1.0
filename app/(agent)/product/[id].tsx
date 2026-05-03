import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { API } from "../../../services/api"; // 👈 adjust path

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProduct = async () => {
    try {
      const res = await API.get(`/products/get-rental-product/${id}`);
      setProduct(res.data);
    } catch (err) {
      console.log("Fetch error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  // 🔄 Loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // ❌ Empty state
  if (!product) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>No product found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      {/* IMAGE */}
      <Image
        source={{
          uri: product.images?.[0] || "https://via.placeholder.com/300",
        }}
        className="w-full h-72 bg-gray-200"
      />

      {/* DETAILS */}
      <View className="p-6">
        <Text
          className="text-2xl font-black"
          style={{ color: colors.text }}
        >
          {product.title}
        </Text>

        <Text
          className="text-sm opacity-50 mt-1"
          style={{ color: colors.text }}
        >
          {product.propertyType}
        </Text>

        <Text
          className="text-2xl font-bold mt-4"
          style={{ color: colors.primary }}
        >
          ₦{Number(product.price).toLocaleString()}
        </Text>

        <Text className="mt-4" style={{ color: colors.text }}>
          {product.description || "No description"}
        </Text>
      </View>
    </ScrollView>
  );
}