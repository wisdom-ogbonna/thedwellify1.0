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
import { API } from "../../services/api";
import { useRouter } from "expo-router";


// 🔥 Skeleton Loader
const SkeletonCard = () => (
  <View className="mb-6 rounded-3xl bg-gray-200 overflow-hidden animate-pulse">
    <View className="h-48 bg-gray-300" />
    <View className="p-4 space-y-2">
      <View className="h-4 bg-gray-300 rounded w-2/3" />
      <View className="h-4 bg-gray-300 rounded w-1/3" />
    </View>
  </View>
);


// 🔥 Empty State
const EmptyState = () => (
  <View className="flex-1 justify-center items-center px-6">
    <Text className="text-lg font-bold mb-2">No listings yet</Text>
    <Text className="text-sm opacity-50 text-center">
      Your rental properties will appear here once created.
    </Text>
  </View>
);


// 🔥 Product Card (Reusable)
const ProductCard = memo(({ item, onDelete, router, colors }: any) => {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/product/[id]",
          params: { id: item.id },
        })
      }
      className="mb-6 rounded-3xl bg-white overflow-hidden"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      {/* IMAGE */}
      <Image
        source={{
          uri: item.images?.[0] || "https://via.placeholder.com/300",
        }}
        className="w-full h-48 bg-gray-200"
      />

      {/* CONTENT */}
      <View className="p-4">
        {/* TITLE + TYPE */}
        <View className="flex-row justify-between items-start mb-1">
          <Text
            numberOfLines={1}
            className="text-lg font-bold w-[70%]"
            style={{ color: colors.text }}
          >
            {item.title}
          </Text>

          <Text
            className="text-xs uppercase opacity-40"
            style={{ color: colors.text }}
          >
            {item.propertyType}
          </Text>
        </View>

        {/* PRICE */}
        <Text
          className="text-lg font-semibold mt-1"
          style={{ color: colors.primary }}
        >
          ₦{Number(item.price).toLocaleString()}
        </Text>

        {/* ACTIONS */}
        <View className="flex-row mt-4">
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/product/edit/[id]",
                params: { id: item.id },
              })
            }
            className="flex-1 py-3 items-center"
          >
            <Text className="font-medium opacity-60">Edit</Text>
          </Pressable>

          <Pressable
            onPress={() => onDelete(item.id)}
            className="flex-1 py-3 items-center"
          >
            <Text className="font-medium text-red-500">Delete</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});


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
  <View style={{ flex: 1 }}>
    
    {/* LIST */}
    <FlatList
      data={loading ? Array(6).fill({}) : products}
      keyExtractor={(_, i) => i.toString()}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 16,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={fetchProducts}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={
        <Text
          className="text-2xl font-bold mb-4"
          style={{ color: colors.text }}
        >
          Your Listings
        </Text>
      }
      ListEmptyComponent={!loading ? <EmptyState /> : null}
      renderItem={({ item }) =>
        loading ? (
          <SkeletonCard />
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
        bottom: insets.bottom + 20,
        right: 20,
      }}
    >
      <Pressable
        onPress={() => router.push("/product/create")}
        style={{
          backgroundColor: colors.primary,
          width: 60,
          height: 60,
          borderRadius: 30,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "bold" }}>
          +
        </Text>
      </Pressable>
    </View>

  </View>
);
}