import { NotificationBell } from "@/components/notifications/notification-bell";
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
      {
        text: "Cancel",
        style: "cancel",
      },
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
          router.push({
            pathname: "/(agent)/listings/[id]",
            params: {
              id: item.id,
            },
          })
        }
        style={[
          styles.card,
          {
            backgroundColor: colors.disabled + "0D",
            borderColor: "#27272A",
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
                {
                  backgroundColor: colors.disabled + "33",
                },
              ]}
            >
              <Ionicons
                name="image-outline"
                size={30}
                color={colors.placeholder}
              />

              <Text
                style={{
                  color: colors.placeholder,
                }}
              >
                No photo
              </Text>
            </View>
          )}

          <View
            style={[
              styles.purposeBadge,
              {
                backgroundColor: colors.primary,
              },
            ]}
          >
            <Text style={styles.purposeBadgeText}>{label}</Text>
          </View>

          {/* HEART */}

          <View style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={21} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.cardBody}>

          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
              numberOfLines={2}
            >
              {item.title || "Untitled property"}
            </Text>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: "#16A34A18",
                  borderColor: "#16A34A55",
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: "#16A34A",
                  },
                ]}
              />

              <Text
                style={[
                  styles.statusText,
                  {
                    color: "#16A34A",
                  },
                ]}
              >
                Active
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color={colors.placeholder}
            />

            <Text
              style={[
                styles.meta,
                {
                  color: colors.placeholder,
                },
              ]}
              numberOfLines={1}
            >
              {item.location
                ? `${item.propertyType} · ${item.location}`
                : item.propertyType}
            </Text>
          </View>


          <Text
            style={[
              styles.price,
              {
                color: colors.primary,
              },
            ]}
          >
            {item.price ? formatPrice(item.price) : "Price on request"}
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(agent)/listings/edit",
                  params: {
                    id: item.id,
                  },
                })
              }
              style={[
                styles.actionBtn,
                {
                  backgroundColor: colors.primary + "16",
                  borderColor: colors.primary + "70",
                },
              ]}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={colors.primary}
              />

              <Text
                style={[
                  styles.actionText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                Edit
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleDelete(item.id)}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: colors.error + "16",
                  borderColor: colors.error + "70",
                },
              ]}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />

              <Text
                style={[
                  styles.actionText,
                  {
                    color: colors.error,
                  },
                ]}
              >
                Delete
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safe,
        {
          backgroundColor: colors.background,
        },
      ]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text
            style={[
              styles.heading,
              {
                color: colors.text,
              },
            ]}
          >
            Listings
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: colors.placeholder,
              },
            ]}
          >
            Manage your posted properties and connect with other agents.
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <NotificationBell color={colors.text} size={20} />
          <Pressable
            onPress={() => router.push("/(agent)/listings/new")}
            style={[
              styles.addButton,
              {
                backgroundColor: colors.primary,
              },
            ]}
          >
            <Ionicons name="add" size={21} color="#FFFFFF" />

            <Text style={styles.addButtonText}>Add Property</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.disabled + "14",
              borderColor: "#27272A",
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={21}
            color={colors.placeholder}
          />

          <TextInput
            placeholder="Search by title, location..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[
              styles.searchInput,
              {
                color: colors.text,
              },
            ]}
          />
        </View>

        <Pressable
          onPress={() => setShowFilters((current) => !current)}
          style={[
            styles.filterButton,
            {
              backgroundColor: showFilters
                ? colors.primary
                : colors.disabled + "14",
              borderColor: showFilters ? colors.primary : "#27272A",
            },
          ]}
        >
          <Ionicons
            name="options-outline"
            size={21}
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
                      : colors.disabled + "18",
                    borderColor: active ? colors.primary : "#27272A",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: active ? "#FFFFFF" : colors.text,
                    },
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
        <Text
          style={[
            styles.sortLabel,
            {
              color: colors.placeholder,
            },
          ]}
        >
          Sort by
        </Text>

        <View
          style={[
            styles.sortButton,
            {
              backgroundColor: colors.disabled + "18",
              borderColor: "#27272A",
            },
          ]}
        >
          <Text
            style={[
              styles.sortText,
              {
                color: colors.text,
              },
            ]}
          >
            Newest
          </Text>

          <Ionicons name="chevron-down" size={16} color={colors.placeholder} />
        </View>

        <Text
          style={[
            styles.resultCount,
            {
              color: colors.placeholder,
            },
          ]}
        >
          {filteredListings.length}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <View
            style={[
              styles.errorIcon,
              {
                backgroundColor: colors.error + "16",
              },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={28}
              color={colors.error}
            />
          </View>

          <Text
            style={[
              styles.emptyTitle,
              {
                color: colors.text,
              },
            ]}
          >
            {error}
          </Text>

          <Pressable
            onPress={fetchListings}
            style={[
              styles.retry,
              {
                backgroundColor: colors.primary,
              },
            ]}
          >
            <Text style={styles.addButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredListings}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
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
              <View
                style={[
                  styles.emptyIcon,
                  {
                    backgroundColor: colors.primary + "16",
                  },
                ]}
              >
                <Ionicons
                  name="business-outline"
                  size={30}
                  color={colors.primary}
                />
              </View>

              <Text
                style={[
                  styles.emptyTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                No properties yet
              </Text>

              <Text
                style={[
                  styles.emptyCopy,
                  {
                    color: colors.placeholder,
                  },
                ]}
              >
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
  safe: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  heading: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  addButton: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 5,
  },

  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },

  searchContainer: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
  },

  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  filterPanel: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 10,
  },

  filterChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  filterChipText: {
    fontSize: 12,
    fontWeight: "800",
  },

  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },

  sortLabel: {
    fontSize: 14,
    marginRight: 8,
  },

  sortButton: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  sortText: {
    fontSize: 13,
    fontWeight: "600",
  },

  resultCount: {
    marginLeft: "auto",
    fontSize: 11,
  },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  card: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 18,
  },

  imageContainer: {
    width: "100%",
    height: 205,
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },

  purposeBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 17,
  },

  purposeBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  favoriteButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.48)",
    alignItems: "center",
    justifyContent: "center",
  },

  cardBody: {
    padding: 18,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  title: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    paddingRight: 10,
  },

  statusBadge: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  meta: {
    flex: 1,
    fontSize: 14,
    marginLeft: 5,
  },

  price: {
    fontSize: 21,
    fontWeight: "900",
    marginTop: 14,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  actionText: {
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 7,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  errorIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  empty: {
    alignItems: "center",
    paddingTop: 65,
    paddingHorizontal: 24,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyCopy: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 300,
  },

  retry: {
    marginTop: 16,
    paddingHorizontal: 22,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
  },
});
