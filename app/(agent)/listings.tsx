// app/(tabs)/listings.tsx
import { Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { router } from "expo-router";
import {
  Bell,
  Building2,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API } from "../../services/api";

interface ListingItem {
  id: string;
  title: string;
  location: string;
  price: string;
  period?: string;
  tag: "For Sale" | "For Rent" | "Shortlet";
  views: number;
  inquiries: number;
  status: "Active" | "Inactive";
  images?: string[];
  propertyType?: string;
}

// Skeleton Card for loading state
const SkeletonCard = ({ colors }: { colors: typeof Colors.light }) => (
  <View
    className="rounded-3xl border p-3 flex-row animate-pulse shadow-sm"
    style={{ borderColor: colors.border, backgroundColor: colors.background }}
  >
    <View className="w-24 h-24 rounded-2xl bg-gray-200 dark:bg-gray-800" />
    <View className="flex-1 ml-3 justify-between">
      <View>
        <View className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mb-2" />
        <View className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
      </View>
      <View className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-2" />
      <View className="flex-row justify-between">
        <View className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        <View className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/5" />
      </View>
    </View>
  </View>
);

// Empty State Component
const EmptyState = ({ colors }: { colors: typeof Colors.light }) => (
  <View className="flex-1 justify-center items-center px-6 py-20">
    <Building2 size={48} color={colors.text} style={{ opacity: 0.2 }} />
    <Text
      className="text-xl font-black tracking-tight mb-2"
      style={{ color: colors.text }}
    >
      No listings yet
    </Text>
    <Text
      className="text-sm text-center leading-5"
      style={{ color: colors.text, opacity: 0.4 }}
    >
      Your properties will appear here once created.
    </Text>
  </View>
);

// Listing Card Component
const ListingCard = React.memo(
  ({
    item,
    onDelete,
    colors,
  }: {
    item: ListingItem;
    onDelete: (id: string) => void;
    colors: typeof Colors.light;
  }) => {
    const getTagBg = (tag: string) => {
      switch (tag) {
        case "For Sale":
          return "#2563EB";
        case "For Rent":
          return "#1E40AF";
        case "Shortlet":
          return "#0284C7";
        default:
          return "#475569";
      }
    };

    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/(product)/[id]",
            params: { id: item.id },
          })
        }
        className="rounded-3xl border p-3 flex-row relative mb-4 shadow-sm"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.border,
        }}
      >
        {/* Image / Placeholder */}
        <View
          className="w-24 h-24 rounded-2xl justify-center items-center relative overflow-hidden"
          style={{ backgroundColor: colors.disabled }}
        >
          {item.images?.[0] ? (
            <Image
              source={{ uri: item.images[0] }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Building2 size={32} color={colors.text} style={{ opacity: 0.2 }} />
          )}

          {/* Tag Badge */}
          <View
            className="absolute top-2 left-2 px-2 py-1 rounded-lg"
            style={{ backgroundColor: getTagBg(item.tag) }}
          >
            <Text className="text-white text-[9px] font-extrabold">
              {item.tag}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 ml-3 justify-between">
          {/* Title & Menu */}
          <View>
            <View className="flex-row justify-between items-start">
              <Text
                numberOfLines={1}
                className="text-[15px] font-extrabold flex-1 pr-2"
                style={{ color: colors.text }}
              >
                {item.title}
              </Text>
              <View className="flex-row items-center gap-1 relative">
                <TouchableOpacity
                  onPress={() => onDelete(item.id)}
                  className="p-1 rounded-full absolute right-2 top-1"
                  style={{ backgroundColor: colors.error + "15" }}
                >
                  <Trash2 size={14} color={colors.error} />
                </TouchableOpacity>
                <TouchableOpacity className="p-1">
                  <MoreHorizontal
                    size={18}
                    color={colors.text}
                    style={{ opacity: 0.4 }}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Location */}
            <View className="flex-row items-center mt-1">
              <MapPin
                size={12}
                color={colors.text}
                style={{ opacity: 0.8, marginRight: 4 }}
              />
              <Text
                numberOfLines={1}
                className="text-xs"
                style={{ color: colors.text, opacity: 0.6 }}
              >
                {item.location}
              </Text>
            </View>
          </View>

          {/* Price */}
          <View className="mt-1">
            <Text
              className="text-base font-extrabold"
              style={{ color: colors.primary }}
            >
              {item.price}
              {item.period && (
                <Text
                  className="text-[11px] font-medium"
                  style={{ color: colors.text, opacity: 0.6 }}
                >
                  {" "}
                  / {item.period}
                </Text>
              )}
            </Text>
          </View>

          {/* Stats Footer */}
          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-row gap-3">
              <View className="flex-row items-center">
                <Text
                  className="text-[11px]"
                  style={{ color: colors.text, opacity: 0.6 }}
                >
                  Views:{" "}
                </Text>
                <Text
                  className="text-[11px] font-bold"
                  style={{ color: colors.text }}
                >
                  {item.views}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text
                  className="text-[11px]"
                  style={{ color: colors.text, opacity: 0.6 }}
                >
                  Inquiries:{" "}
                </Text>
                <Text
                  className="text-[11px] font-bold"
                  style={{ color: colors.text }}
                >
                  {item.inquiries}
                </Text>
              </View>
            </View>

            {/* Status Badge */}
            <View
              className="px-2 py-0.5 rounded-md"
              style={{
                backgroundColor:
                  item.status === "Active"
                    ? colors.success + "20"
                    : colors.disabled,
              }}
            >
              <Text
                className="text-[10px] font-extrabold"
                style={{
                  color:
                    item.status === "Active"
                      ? colors.success
                      : colors.placeholder,
                }}
              >
                {item.status}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

ListingCard.displayName = "ListingCard";

export default function MyListingsScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState("All Listings");
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const tabs = ["All Listings", "For Sale", "For Rent", "Sold"];

  const fetchListings = async () => {
    try {
      const res = await API.get("/products/get-rental-products");
      const transformedData = (res.data?.products || []).map(
        (product: any) => ({
          id: product.id,
          title: product.title,
          location: product.location || "Location not specified",
          price: `₦${Number(product.price).toLocaleString()}`,
          period: product.period || undefined,
          tag: product.tag || product.propertyType || "For Sale",
          views: product.views || 0,
          inquiries: product.inquiries || 0,
          status: product.status || "Active",
          images: product.images,
          propertyType: product.propertyType,
        }),
      );
      setListings(transformedData);
    } catch (err) {
      console.log("Error fetching listings:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleDelete = useCallback((id: string) => {
    Alert.alert("Delete Listing", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await API.delete(`/products/delete-rental-product/${id}`);
            setListings((prev) => prev.filter((item) => item.id !== id));
          } catch (err) {
            console.log("Error deleting listing:", err);
            Alert.alert("Error", "Failed to delete listing. Please try again.");
          }
        },
      },
    ]);
  }, []);

  const filteredListings = listings.filter((item) => {
    const matchesTab = activeTab === "All Listings" || item.tag === activeTab;
    const matchesSearch =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.background }}
      className="flex-1 relative"
      edges={["top"]}
    >

      {/* Header */}
      <View
        className="flex-row justify-between items-center px-4 py-3"
        style={{
          backgroundColor: colors.background,
        }}
      >
        <Text className="text-lg font-extrabold" style={{ color: colors.text }}>
          My Listings
        </Text>

        <TouchableOpacity
          className="w-10 h-10 rounded-full justify-center items-center"
          style={{ backgroundColor: colors.lighterPrimary + "20" }}
        >
          <Bell size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View
        className="border-b"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.border,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            height: 48,
            alignItems: "center",
            gap: 24,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className="h-full justify-center px-1"
                style={{
                  borderBottomWidth: isActive ? 3 : 0,
                  borderBottomColor: colors.primary,
                }}
              >
                <Text
                  className="text-sm"
                  style={{
                    fontWeight: isActive ? "800" : "500",
                    color: isActive ? colors.primary : colors.text,
                    opacity: isActive ? 1 : 0.6,
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search & Filter */}
      <View className="flex-row px-4 py-3.5 items-center gap-3">
        <View
          className="flex-1 flex-row items-center rounded-2xl px-3.5 h-12 border"
          style={{
            backgroundColor: colors.disabled + "15",
            borderColor: colors.border,
          }}
        >
          <Search size={18} color={colors.placeholder} />
          <TextInput
            placeholder="Search your listings..."
            placeholderTextColor={colors.placeholder}
            className="flex-1 ml-2 text-sm font-medium"
            style={{ color: colors.text }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          className="w-12 h-12 rounded-2xl justify-center items-center border"
          style={{
            backgroundColor: colors.lighterPrimary + "15",
            borderColor: colors.border,
          }}
        >
          <SlidersHorizontal size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Listings */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 110,
          paddingTop: 4,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchListings();
            }}
            tintColor={colors.text}
          />
        }
      >
        {loading ? (
          <View className="gap-4">
            {Array(6)
              .fill({})
              .map((_, i) => (
                <SkeletonCard key={i} colors={colors} />
              ))}
          </View>
        ) : filteredListings.length === 0 ? (
          <EmptyState colors={colors} />
        ) : (
          <View className="gap-4">
            {filteredListings.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
                colors={colors}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB - Add New Listing */}
      <View className="fixed z-10 bottom-0 mx-5 left-0">
        <TouchableOpacity
          onPress={() => router.push("/(product)/create")}
          activeOpacity={0.9}
          className="h-14 rounded-2xl flex-row justify-center items-center gap-2"
          style={{
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text className="text-white text-[15px] font-extrabold">
            Add New Listing
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
