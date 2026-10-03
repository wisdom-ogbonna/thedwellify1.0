import {
  formatPrice,
  purposeLabel,
  type Listing,
} from "@/constants/listings";
import { useTheme } from "@/hooks/use-theme";
import { listingsApi } from "@/services/listings";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TABS = ["All", "For Sale", "For Rent"] as const;

export default function MyListingsScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchListings = useCallback(async () => {
    try {
      setError("");
      const products = await listingsApi.list();
      setListings(products);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.details ||
          "Could not load your properties.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, [fetchListings]),
  );

  const handleDelete = (id: string) => {
    Alert.alert("Delete property", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await listingsApi.remove(id);
            setListings((prev) => prev.filter((item) => item.id !== id));
          } catch {
            Alert.alert("Error", "Failed to delete this property.");
          }
        },
      },
    ]);
  };

  const filteredListings = listings.filter((item) => {
    const label = purposeLabel(item.purpose, item.tag);
    const matchesTab =
      activeTab === "All" ||
      (activeTab === "For Sale" && (label === "For Sale" || item.purpose === "Sale")) ||
      (activeTab === "For Rent" &&
        (label === "For Rent" || label === "Shortlet" || item.purpose === "Rent"));
    const q = searchQuery.trim().toLowerCase();
    const title = String(item.title || "").toLowerCase();
    const location = String(item.location || "").toLowerCase();
    const type = String(item.propertyType || "").toLowerCase();
    const matchesSearch = !q || title.includes(q) || location.includes(q) || type.includes(q);
    return matchesTab && matchesSearch;
  });

  const renderCard = ({ item }: { item: Listing }) => {
    const image = item.images?.[0];
    const label = purposeLabel(item.purpose, item.tag);
    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/(agent)/listings/[id]",
            params: { id: item.id },
          })
        }
        style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imageFallback, { backgroundColor: colors.disabled + "33" }]}>
            <Text style={{ color: colors.placeholder, fontWeight: "700" }}>No photo</Text>
          </View>
        )}
        <View
          style={[
            styles.badge,
            { backgroundColor: item.purpose === "Sale" ? "#16A34A" : colors.primary },
          ]}
        >
          <Text style={styles.badgeText}>{label}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {item.title || "Untitled property"}
          </Text>
          <Text style={[styles.meta, { color: colors.placeholder }]} numberOfLines={1}>
            {item.propertyType}
            {item.location ? ` · ${item.location}` : ""}
          </Text>
          <Text style={[styles.price, { color: colors.primary }]}>
            {item.price ? formatPrice(item.price) : "Price on request"}
          </Text>
          <View style={styles.actions}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(agent)/listings/edit",
                  params: { id: item.id },
                })
              }
              style={[styles.actionBtn, { backgroundColor: colors.primary + "16" }]}
            >
              <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
            </Pressable>
            <Pressable
              onPress={() => handleDelete(item.id)}
              style={[styles.actionBtn, { backgroundColor: colors.error + "16" }]}
            >
              <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.heading, { color: colors.text }]}>Listings</Text>
          <Text style={[styles.count, { color: colors.placeholder }]}>
            {listings.length} propert{listings.length === 1 ? "y" : "ies"}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/(agent)/listings/new")}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tab,
                { backgroundColor: active ? colors.primary : colors.disabled + "22" },
              ]}
            >
              <Text style={[styles.tabText, { color: active ? "#fff" : colors.text }]}>{tab}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.disabled + "14" }]}>
        <TextInput
          placeholder="Search title or location"
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{error}</Text>
          <Pressable
            onPress={fetchListings}
            style={[styles.retry, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.addBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredListings}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchListings();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No properties yet</Text>
              <Text style={[styles.emptyCopy, { color: colors.placeholder }]}>
                Add a property and it will show here with photo, title, and sale or rent.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  heading: { fontSize: 28, fontWeight: "900" },
  count: { fontSize: 12, marginTop: 4 },
  addBtn: { paddingHorizontal: 16, height: 40, borderRadius: 12, justifyContent: "center" },
  addBtnText: { color: "#fff", fontWeight: "800" },
  tabs: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  tab: { paddingHorizontal: 14, height: 36, borderRadius: 18, justifyContent: "center" },
  tabText: { fontSize: 12, fontWeight: "800" },
  search: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: "center",
  },
  searchInput: { fontSize: 15 },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
  },
  image: { width: "100%", height: 180 },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  cardBody: { padding: 14 },
  title: { fontSize: 18, fontWeight: "800" },
  meta: { fontSize: 13, marginTop: 4 },
  price: { fontSize: 16, fontWeight: "900", marginTop: 8 },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { fontWeight: "800" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  emptyCopy: { fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },
  retry: { marginTop: 16, paddingHorizontal: 20, height: 44, borderRadius: 12, justifyContent: "center" },
});
