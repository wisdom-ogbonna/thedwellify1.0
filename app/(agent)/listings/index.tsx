import { formatPrice, purposeLabel, type Listing } from "@/constants/listings";
import { useTheme } from "@/hooks/use-theme";
import { listingsApi } from "@/services/listings";
import { Ionicons } from "@expo/vector-icons";
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
  const [showFilters, setShowFilters] = useState(false);

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
      (activeTab === "For Sale" &&
        (label === "For Sale" || item.purpose === "Sale")) ||
      (activeTab === "For Rent" &&
        (label === "For Rent" ||
          label === "Shortlet" ||
          item.purpose === "Rent"));

    const q = searchQuery.trim().toLowerCase();
    const title = String(item.title || "").toLowerCase();
    const location = String(item.location || "").toLowerCase();
    const type = String(item.propertyType || "").toLowerCase();

    const matchesSearch =
      !q || title.includes(q) || location.includes(q) || type.includes(q);

    return matchesTab && matchesSearch;
  });

  const renderCard = ({ item }: { item: Listing }) => {
    const image = item.images?.[0];
    const label = purposeLabel(item.purpose, item.tag);

    return (
      <Pressable
        onPress={() =>
          router.navigate({
            pathname: "/(agent)/listings/[id]",
            params: { id: item.id },
          })
        }
        style={[
          styles.card,
          {
            backgroundColor: colors.background || "#FFFFFF",
            borderColor: colors.border + "50",
          },
        ]}
      >
        <View style={styles.imageContainer}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.image,
                styles.imageFallback,
                { backgroundColor: colors.disabled + "33" },
              ]}
            >
              <Ionicons
                name="image-outline"
                size={26}
                color={colors.placeholder}
              />
              <Text style={{ color: colors.placeholder, fontSize: 11 }}>
                No photo
              </Text>
            </View>
          )}

          <View
            style={[styles.purposeBadge, { backgroundColor: colors.primary }]}
          >
            <Ionicons
              name="home"
              size={10}
              color="#FFFFFF"
              style={{ marginRight: 3 }}
            />
            <Text style={styles.purposeBadgeText}>{label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: "#16A34A18",
                  borderColor: "#16A34A30",
                },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: "#16A34A" }]}
              />
              <Text style={[styles.statusText, { color: "#16A34A" }]}>
                Active
              </Text>
            </View>
          </View>

          <Text
            style={[styles.price, { color: colors.primary }]}
            numberOfLines={1}
          >
            {item.price ? formatPrice(item.price) : "Price on request"}
          </Text>

          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.title || item.propertyType || "Untitled property"}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="location-sharp" size={13} color={colors.primary} />
            <Text
              style={[styles.meta, { color: colors.placeholder }]}
              numberOfLines={1}
            >
              {item.location || item.propertyType}
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() =>
                router.navigate({
                  pathname: "/(agent)/listings/edit",
                  params: { id: item.id },
                })
              }
              style={[
                styles.actionBtn,
                {
                  backgroundColor: colors.primary + "12",
                },
              ]}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={colors.primary}
              />
            </Pressable>

            <Pressable
              onPress={() => handleDelete(item.id)}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: "#EF444412",
                },
              ]}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={[styles.heading, { color: colors.text }]}>Listings</Text>

        <Pressable
          onPress={() => router.navigate("/(agent)/listings/new")}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Property</Text>
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.disabled + "10",
              borderColor: colors.border + "60",
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.placeholder}
          />
          <TextInput
            placeholder="Search by title, location..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <Pressable
          onPress={() => setShowFilters((current) => !current)}
          style={[
            styles.filterButton,
            {
              backgroundColor: showFilters
                ? colors.primary
                : colors.disabled + "10",
              borderColor: showFilters ? colors.primary : colors.border + "60",
            },
          ]}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={showFilters ? "#FFFFFF" : colors.text}
          />
        </Pressable>
      </View>

      {showFilters && (
        <View style={styles.filterPanel}>
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active
                      ? colors.primary
                      : colors.disabled + "14",
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: active ? "#FFFFFF" : colors.text },
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.sortRow}>
        <View
          style={[
            styles.sortButton,
            {
              backgroundColor: colors.disabled + "10",
              borderColor: colors.border + "60",
            },
          ]}
        >
          <Text style={[styles.sortText, { color: colors.text }]}>Newest</Text>
          <Ionicons name="chevron-down" size={14} color={colors.placeholder} />
        </View>

        <Text style={[styles.resultCount, { color: colors.placeholder }]}>
          {filteredListings.length} listings
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons
            name="alert-circle-outline"
            size={32}
            color={colors.error}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {error}
          </Text>
          <Pressable
            onPress={fetchListings}
            style={[styles.retry, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.addButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredListings}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
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
              <Ionicons
                name="business-outline"
                size={36}
                color={colors.primary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No properties yet
              </Text>
              <Text style={[styles.emptyCopy, { color: colors.placeholder }]}>
                Add a property and it will show here with photo, title, and sale
                or rent.
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
    paddingTop: 10,
    paddingBottom: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  addButton: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 10,
  },
  searchContainer: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPanel: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 6,
    marginBottom: 8,
  },
  filterChip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipText: { fontSize: 11, fontWeight: "700" },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sortButton: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sortText: { fontSize: 12, fontWeight: "600" },
  resultCount: { marginLeft: "auto", fontSize: 12, fontWeight: "500" },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 14,
  },
  card: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  imageContainer: {
    width: "100%",
    height: 125,
    position: "relative",
  },
  image: { width: "100%", height: "100%" },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  purposeBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  purposeBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  cardBody: {
    padding: 10,
  },
  statusRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: { fontSize: 10, fontWeight: "700" },
  price: {
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  meta: {
    flex: 1,
    fontSize: 11,
    marginLeft: 3,
  },
  actions: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  empty: { alignItems: "center", paddingTop: 50, paddingHorizontal: 24 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 10,
  },
  emptyCopy: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  retry: {
    marginTop: 14,
    paddingHorizontal: 18,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
  },
});
