import {
  PROPERTY_TYPES,
  formatPrice,
  purposeLabel,
} from "@/constants/listings";
import { useTheme } from "@/hooks/use-theme";
import { listingsApi, type PublicListing } from "@/services/listings";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

const TYPES = ["All", ...PROPERTY_TYPES] as const;
const PURPOSES = [
  { id: "All", label: "All" },
  { id: "Rent", label: "For Rent" },
  { id: "Sale", label: "For Sale" },
] as const;
const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "price_asc", label: "Lowest price" },
  { id: "price_desc", label: "Highest price" },
] as const;

export default function RecommendedScreen() {
  const { colors } = useTheme();
  const [propertyType, setPropertyType] = useState("All");
  const [purpose, setPurpose] = useState("All");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("newest");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchListings = useCallback(async () => {
    try {
      setError("");
      const res = await listingsApi.available({
        propertyType: propertyType === "All" ? undefined : propertyType,
        purpose: purpose === "All" ? undefined : purpose,
        sort,
        q: search || undefined,
      });
      setListings(res.products);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not load recommended homes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [propertyType, purpose, sort, search]);

  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, [fetchListings]),
  );

  const header = useMemo(
    () => (
      <View>
        <Text style={[styles.kicker, { color: colors.primary }]}>Discover</Text>
        <Text style={[styles.heading, { color: colors.text }]}>
          Homes listed by agents
        </Text>
        <Text style={[styles.sub, { color: colors.placeholder }]}>
          Sort available land, houses and apartments for rent or sale.
        </Text>

        <View
          style={[
            styles.search,
            { borderColor: colors.border, backgroundColor: colors.disabled + "14" },
          ]}
        >
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search title or location"
            placeholderTextColor={colors.placeholder}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
            onSubmitEditing={() => setSearch(query.trim())}
          />
          <Pressable
            onPress={() => setSearch(query.trim())}
            style={[styles.searchBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.searchBtnText}>Search</Text>
          </Pressable>
        </View>

        <Text style={[styles.filterLabel, { color: colors.text }]}>Property type</Text>
        <View style={styles.chipRow}>
          {TYPES.map((type) => {
            const active = propertyType === type;
            return (
              <Pressable
                key={type}
                onPress={() => setPropertyType(type)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : colors.disabled + "22",
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? "#fff" : colors.text }]}>
                  {type}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.filterLabel, { color: colors.text }]}>Listed for</Text>
        <View style={styles.chipRow}>
          {PURPOSES.map((item) => {
            const active = purpose === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setPurpose(item.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : colors.disabled + "22",
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? "#fff" : colors.text }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.filterLabel, { color: colors.text }]}>Sort</Text>
        <View style={styles.chipRow}>
          {SORTS.map((item) => {
            const active = sort === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setSort(item.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.text : colors.disabled + "22",
                  },
                ]}
              >
                <Text
                  style={[styles.chipText, { color: active ? colors.background : colors.text }]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.count, { color: colors.placeholder }]}>
          {total} available propert{total === 1 ? "y" : "ies"}
        </Text>
      </View>
    ),
    [colors, propertyType, purpose, sort, query, total],
  );

  const renderCard = ({ item }: { item: PublicListing }) => {
    const image = item.images?.[0];
    const label = purposeLabel(item.purpose, item.tag);
    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/(utilities)/property-view",
            params: { propertyId: item.id },
          })
        }
        style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
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
          {!!item.agent?.name && (
            <Text style={[styles.agent, { color: colors.placeholder }]}>
              Listed by {item.agent.name}
              {item.agent.agencyName ? ` · ${item.agent.agencyName}` : ""}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
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
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          ListHeaderComponent={header}
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
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No available properties
              </Text>
              <Text style={[styles.emptyCopy, { color: colors.placeholder }]}>
                Try another type, switch between rent and sale, or clear search.
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
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  kicker: { fontSize: 13, fontWeight: "800", marginTop: 8, letterSpacing: 1, textTransform: "uppercase" },
  heading: { fontSize: 28, fontWeight: "900", marginTop: 4 },
  sub: { fontSize: 14, marginTop: 6, marginBottom: 18, lineHeight: 20 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingLeft: 14,
    paddingRight: 6,
    height: 52,
    marginBottom: 18,
  },
  searchInput: { flex: 1, fontSize: 15 },
  searchBtn: { height: 38, paddingHorizontal: 14, borderRadius: 12, justifyContent: "center" },
  searchBtnText: { color: "#fff", fontWeight: "800" },
  filterLabel: { fontSize: 13, fontWeight: "800", marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, height: 36, borderRadius: 18, justifyContent: "center" },
  chipText: { fontSize: 13, fontWeight: "800" },
  count: { fontSize: 13, marginBottom: 14, fontWeight: "600" },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 16,
  },
  image: { width: "100%", height: 188 },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  cardBody: { padding: 14 },
  title: { fontSize: 18, fontWeight: "800" },
  meta: { fontSize: 13, marginTop: 4 },
  price: { fontSize: 16, fontWeight: "900", marginTop: 8 },
  agent: { fontSize: 12, marginTop: 6, fontWeight: "600" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  empty: { alignItems: "center", paddingTop: 40, paddingHorizontal: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  emptyCopy: { fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },
  retry: { marginTop: 16, paddingHorizontal: 20, height: 44, borderRadius: 12, justifyContent: "center" },
  retryText: { color: "#fff", fontWeight: "800" },
});
