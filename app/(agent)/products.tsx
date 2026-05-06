import React, { useEffect, useState, useCallback, memo } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Plus, PencilSimple, Trash } from "phosphor-react-native";
import { API } from "../../services/api";

// Skeleton Loader
const SkeletonCard = ({ colors }: any) => (
  <View
    className="mb-6 rounded-3xl overflow-hidden border animate-pulse"
    style={{ borderColor: colors.border, backgroundColor: colors.card }}
  >
    <View className="h-48 bg-gray-200 dark:bg-gray-800 w-full" />
    <View className="p-5">
      <View className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mb-3" />
      <View className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
    </View>
  </View>
);

// Empty State
const EmptyState = ({ colors }: any) => (
  <View className="flex-1 justify-center items-center px-6 py-20">
    <Text
      className="text-xl font-black tracking-tight mb-2"
      style={{ color: colors.text }}
    >
      No listings yet
    </Text>
    <Text
      className="text-sm opacity-40 text-center leading-5"
      style={{ color: colors.text }}
    >
      Your rental properties will appear here once created.
    </Text>
  </View>
);

// Product Card (Reusable)
const ProductCard = memo(({ item, onDelete, router, colors }: any) => {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/(product)/[id]",
          params: { id: item.id },
        })
      }
      className="mb-6 rounded-3xl overflow-hidden border"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
    >
      {/* IMAGE */}
      <Image
        source={{
          uri: item.images?.[0] || "https://via.placeholder.com/300",
        }}
        className="w-full h-48 bg-gray-200 dark:bg-gray-800"
      />

      {/* CONTENT */}
      <View className="p-5">
        {/* TITLE + TYPE */}
        <View className="flex-row justify-between items-start mb-2">
          <Text
            numberOfLines={1}
            className="text-lg font-black tracking-tight w-[70%]"
            style={{ color: colors.text }}
          >
            {item.title}
          </Text>

          <Text
            className="text-2xs font-bold tracking-widest uppercase opacity-40"
            style={{ color: colors.text }}
          >
            {item.propertyType}
          </Text>
        </View>

        {/* PRICE */}
        <Text
          className="text-lg font-black tracking-tight mt-1"
          style={{ color: colors.text }}
        >
          ₦{Number(item.price).toLocaleString()}
        </Text>

        {/* ACTIONS */}
        <View
          className="flex-row mt-6 border-t pt-4"
          style={{ borderColor: colors.border }}
        >
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(product)/[id]",
                params: { id: item.id },
              })
            }
            className="flex-1 flex-row items-center justify-center py-2 border-r"
            style={{ borderColor: colors.border }}
          >
            <PencilSimple size={16} color={colors.text} weight="bold" />
            <Text
              className="font-bold text-sm ml-2 opacity-60"
              style={{ color: colors.text }}
            >
              Edit
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onDelete(item.id)}
            className="flex-1 flex-row items-center justify-center py-2"
          >
            <Trash size={16} color="#ef4444" weight="bold" />
            <Text className="font-bold text-sm ml-2 text-red-500">Delete</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});

ProductCard.displayName = "ProductCard";

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

  const handleDelete = useCallback((id: string) => {
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
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* LIST */}
      <FlatList
        data={loading ? Array(6).fill({}) : products}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchProducts}
            tintColor={colors.text}
          />
        }
        ListHeaderComponent={
          <Text
            className="text-2xl font-black tracking-tight mb-8 mt-2"
            style={{ color: colors.text }}
          >
            Your Listings
          </Text>
        }
        ListEmptyComponent={!loading ? <EmptyState colors={colors} /> : null}
        renderItem={({ item }) =>
          loading ? (
            <SkeletonCard colors={colors} />
          ) : (
            <ProductCard
              item={item}
              onDelete={handleDelete}
              router={router}
              colors={colors}
            />
          )
        }
      />

      {/* 🔥 FLOATING BUTTON (FAB) */}
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 24,
          right: 24,
        }}
      >
        <Pressable
          onPress={() => router.push("/(product)/create")}
          className="shadow-xl justify-center items-center rounded-3xl"
          style={{
            backgroundColor: colors.text,
            width: 64,
            height: 64,
          }}
        >
          <Plus size={28} color={colors.background} weight="bold" />
        </Pressable>
      </View>
    </View>
  );
}