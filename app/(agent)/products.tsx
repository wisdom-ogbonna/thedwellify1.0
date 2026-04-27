import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { API } from "../../services/api";
import { useRouter } from "expo-router";

export default function RentalProductsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/products/get-rental-products");
      setProducts(res.data?.products || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert("Delete Listing", "This action cannot be undone.", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await API.delete(`/products/delete-rental-product/${id}`);
          fetchProducts();
        },
      },
    ]);
  };

  if (loading)
    return (
      <View
        className="flex-1 justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: 32,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={fetchProducts}
          tintColor={colors.primary}
        />
      }
      renderItem={({ item }) => (
        <Pressable
          className="mb-8 overflow-hidden border-2 rounded-3xl"
          style={{ borderColor: colors.border }}
          onPress={() => router.push({
            pathname: "./product/[id]",
            params: { id: item.id }
          })}
        >
          <Image
            source={{ uri: item.images?.[0] }}
            className="w-full h-48 bg-gray-200"
          />

          <View className="p-6">
            <View className="flex-row justify-between items-start mb-2">
              <Text
                className="text-xl font-black tracking-tight w-[70%]"
                style={{ color: colors.text }}
              >
                {item.title}
              </Text>
              <Text
                className="text-sm font-bold opacity-40 uppercase"
                style={{ color: colors.text }}
              >
                {item.propertyType}
              </Text>
            </View>

            <Text
              className="text-lg font-bold mb-4"
              style={{ color: colors.primary }}
            >
              ₦{Number(item.price).toLocaleString()}
            </Text>

            <View
              className="flex-row gap-4 border-t-2 pt-4"
              style={{ borderColor: colors.border }}
            >
              <Pressable
                onPress={() => router.push({
                  pathname: "./product/edit/[id]",
                  params: { id: item.id }
                })}
                className="flex-1 py-3 items-center"
              >
                <Text
                  className="font-bold opacity-60"
                  style={{ color: colors.text }}
                >
                  Edit
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleDelete(item.id)}
                className="flex-1 py-3 items-center border-l-2"
                style={{ borderColor: colors.border }}
              >
                <Text className="font-bold text-red-500">Delete</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      )}
    />
  );
}
