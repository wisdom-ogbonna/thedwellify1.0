import {
  PROPERTY_TYPES,
  formatPrice,
  purposeLabel,
} from "@/constants/listings";
import { useTheme } from "@/hooks/use-theme";
import { listingsApi, type PublicListing } from "@/services/listings";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TYPES = ["All", ...PROPERTY_TYPES] as const;
const PURPOSES = [
  { id: "All", label: "All" },
  { id: "Rent", label: "For rent" },
  { id: "Sale", label: "For sale" },
] as const;
const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "price_asc", label: "Lowest price" },
  { id: "price_desc", label: "Highest price" },
] as const;

const SCREEN_PAD = 20;
const CARD_GAP = 16;

type ThemeColors = ReturnType<typeof useTheme>["colors"];

export default function RecommendedScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  // Two columns on tablets / landscape, one on phones.
  const columns = width >= 700 ? 2 : 1;

  const [propertyType, setPropertyType] = useState("All");
  const [purpose, setPurpose] = useState("All");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("newest");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true); // first load only
  const [fetching, setFetching] = useState(false); // any (re)fetch
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Ignore responses from outdated requests when filters change quickly.
  const requestId = useRef(0);

  const fetchListings = useCallback(async () => {
    const id = ++requestId.current;
    setFetching(true);
    try {
      setError("");
      const res = await listingsApi.available({
        propertyType: propertyType === "All" ? undefined : propertyType,
        purpose: purpose === "All" ? undefined : purpose,
        sort,
        q: search || undefined,
      });
      if (id !== requestId.current) return;
      setListings(res.products);
      setTotal(res.total);
    } catch (err: any) {
      if (id !== requestId.current) return;
      setError(
        err?.response?.data?.error || "Could not load recommended homes.",
      );
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
        setFetching(false);
      }
    }
  }, [propertyType, purpose, sort, search]);

  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, [fetchListings]),
  );

  const submitSearch = () => setSearch(query.trim());

  const clearSearch = () => {
    setQuery("");
    setSearch("");
  };

  const cycleSort = () => {
    const i = SORTS.findIndex((s) => s.id === sort);
    setSort(SORTS[(i + 1) % SORTS.length].id);
  };

  const sortLabel = SORTS.find((s) => s.id === sort)?.label ?? "Newest";
  const segmentBg = colors.disabled + "1A";
  const fieldBg = colors.disabled + "14";

  /* Header stays an element (not an inline component) so the input keeps focus. */
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

        {/* Search */}
        <View
          style={[
            styles.search,
            { borderColor: "#222226", backgroundColor: fieldBg },
          ]}
        >
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search title or location"
            placeholderTextColor={colors.placeholder}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
            onSubmitEditing={submitSearch}
          />
          {query.length > 0 && (
            <Pressable
              onPress={clearSearch}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.placeholder}
              />
            </Pressable>
          )}
          <Pressable
            onPress={submitSearch}
            accessibilityRole="button"
            style={[styles.searchBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={"#fff"}
            />
          </Pressable>
        </View>

        {/* Listed for: segmented control */}
        <View
          style={[
            styles.segment,
            { backgroundColor: segmentBg, borderColor: "#222226" },
          ]}
        >
          {PURPOSES.map((item) => {
            const active = purpose === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setPurpose(item.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[
                  styles.segmentItem,
                  active && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: active ? "#fff" : colors.placeholder },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Property type: one scrollable row instead of wrapping onto several lines */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.chipScroll}
          contentContainerStyle={styles.chipRow}
        >
          {TYPES.map((type) => {
            const active = propertyType === type;
            return (
              <Pressable
                key={type}
                onPress={() => setPropertyType(type)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active
                      ? colors.primary + "22"
                      : colors.disabled + "14",
                    borderColor: active ? colors.primary : "#222226",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? colors.primary : colors.placeholder },
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Results row: count on the left, sort on the right */}
        <View style={styles.resultsRow}>
          <View style={styles.countWrap}>
            <Text style={[styles.count, { color: colors.text }]}>
              {loading
                ? "Loading properties"
                : `${total} ${total === 1 ? "property" : "properties"}`}
            </Text>
            {fetching && !loading && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>

          <Pressable
            onPress={cycleSort}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Sort by ${sortLabel}. Tap to change.`}
            style={styles.sortBtn}
          >
            <Ionicons name="swap-vertical" size={16} color={colors.primary} />
            <Text style={[styles.sortText, { color: colors.primary }]}>
              {sortLabel}
            </Text>
          </Pressable>
        </View>

        {/* Refresh failed but we still have results to show */}
        {!!error && listings.length > 0 && (
          <Pressable
            onPress={fetchListings}
            style={[styles.banner, { borderColor: "#222226" }]}
          >
            <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
            <Text style={[styles.bannerText, { color: colors.text }]}>
              {error}
            </Text>
            <Text style={[styles.bannerAction, { color: colors.primary }]}>
              Retry
            </Text>
          </Pressable>
        )}
      </View>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      colors,
      propertyType,
      purpose,
      sort,
      query,
      total,
      loading,
      fetching,
      error,
      listings.length,
      fetchListings,
    ],
  );

  /* Loading / error / empty all live inside the list so filters stay usable. */
  const emptyState = loading ? (
    <View style={styles.empty}>
      <ActivityIndicator color={colors.primary} />
    </View>
  ) : error ? (
    <View style={styles.empty}>
      <Ionicons
        name="cloud-offline-outline"
        size={32}
        color={colors.placeholder}
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{error}</Text>
      <Pressable
        onPress={fetchListings}
        style={[styles.retry, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  ) : (
    <View style={styles.empty}>
      <Ionicons name="home-outline" size={32} color={colors.placeholder} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No available properties
      </Text>
      <Text style={[styles.emptyCopy, { color: colors.placeholder }]}>
        Try another type, switch between rent and sale, or clear search.
      </Text>
    </View>
  );

  const renderCard = ({ item }: { item: PublicListing }) => (
    <View style={{ flex: 1, maxWidth: columns > 1 ? "50%" : "100%" }}>
      <ListingCard
        item={item}
        colors={colors}
        onOpen={() =>
          router.push({
            pathname: "/(utilities)/property-view",
            params: { propertyId: item.id },
          })
        }
        onMessage={() =>
          router.push({
            pathname: "/(utilities)/chats",
            params: { productId: item.id },
          })
        }
      />
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <FlatList
        key={columns} // numColumns can't change on a mounted list
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? { gap: CARD_GAP } : undefined}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyState}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
      />
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* LISTING CARD                                                               */
/* -------------------------------------------------------------------------- */

function ListingCard({
  item,
  colors,
  onOpen,
  onMessage,
}: {
  item: PublicListing;
  colors: ThemeColors;
  onOpen: () => void;
  onMessage: () => void;
}) {
  const image = item.images?.[0];
  const label = purposeLabel(item.purpose, item.tag);
  const agentName = item.agent?.name;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.background, borderColor: "#222226" },
      ]}
    >
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`View ${item.title || "property"}`}
      >
        {/* Image keeps a fixed ratio so cards scale with screen width */}
        <View style={styles.imageWrap}>
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
                size={28}
                color={colors.placeholder}
              />
              <Text style={[styles.noPhoto, { color: colors.placeholder }]}>
                No photo
              </Text>
            </View>
          )}

          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  item.purpose === "Sale" ? "#16A34A" : colors.primary,
              },
            ]}
          >
            <Text style={styles.badgeText}>{label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.title || "Untitled property"}
          </Text>

          {!!item.location && (
            <View style={styles.metaRow}>
              <Ionicons
                name="location-outline"
                size={15}
                color={colors.placeholder}
              />
              <Text
                style={[styles.meta, { color: colors.placeholder }]}
                numberOfLines={1}
              >
                {item.location}
              </Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text
              style={[styles.price, { color: colors.primary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {item.price ? formatPrice(item.price) : "Price on request"}
            </Text>
            <View
              style={[
                styles.typePill,
                { backgroundColor: colors.disabled + "22" },
              ]}
            >
              <Text
                style={[styles.typePillText, { color: colors.placeholder }]}
              >
                {item.propertyType}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>

      {/* Footer: agent on the left, action on the right */}
      <View style={[styles.footer, { borderTopColor: "#222226" }]}>
        {agentName ? (
          <View style={styles.agentWrap}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.primary + "22" },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {agentName.trim().charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.agentText}>
              <Text
                style={[styles.agentName, { color: colors.text }]}
                numberOfLines={1}
              >
                {agentName}
              </Text>
              {!!item.agent?.agencyName && (
                <Text
                  style={[styles.agency, { color: colors.placeholder }]}
                  numberOfLines={1}
                >
                  {item.agent.agencyName}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <Pressable
          onPress={onMessage}
          accessibilityRole="button"
          accessibilityLabel="Message agent"
          style={[styles.chatBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
          <Text style={styles.chatBtnText}>Message</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Separator() {
  return <View style={{ height: CARD_GAP }} />;
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: {
    paddingHorizontal: SCREEN_PAD,
    paddingTop: 12,
    paddingBottom: 120,
  },

  // Header
  kicker: { fontSize: 13, fontWeight: "800" },
  heading: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginTop: 4,
  },
  sub: { fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: 20 },

  // Search
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingLeft: 14,
    paddingRight: 6,
  },
  searchInput: { flex: 1, minWidth: 0, fontSize: 15, paddingVertical: 0 },
  searchBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
  },
  searchBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  // Segmented control
  segment: {
    flexDirection: "row",
    height: 44,
    padding: 4,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 14,
  },
  segmentItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  segmentText: { fontSize: 14, fontWeight: "700" },

  // Type chips (bleed to the screen edges)
  chipScroll: { marginTop: 12, marginHorizontal: -SCREEN_PAD },
  chipRow: { paddingHorizontal: SCREEN_PAD, gap: 8 },
  chip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontSize: 14, fontWeight: "700" },

  // Results row
  resultsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 20,
    marginBottom: 12,
  },
  countWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  count: { fontSize: 15, fontWeight: "700" },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4, height: 32 },
  sortText: { fontSize: 14, fontWeight: "700" },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  bannerText: { flex: 1, fontSize: 13 },
  bannerAction: { fontSize: 13, fontWeight: "800" },

  // Card
  card: { borderWidth: 1, borderRadius: 20, overflow: "hidden" },
  imageWrap: { aspectRatio: 16 / 10 },
  image: { width: "100%", height: "100%" },
  imageFallback: { alignItems: "center", justifyContent: "center", gap: 6 },
  noPhoto: { fontSize: 13, fontWeight: "700" },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  cardBody: { padding: 16 },
  title: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  meta: { flex: 1, fontSize: 13 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 12,
  },
  price: { flexShrink: 1, fontSize: 20, fontWeight: "900" },
  typePill: {
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 8,
    justifyContent: "center",
  },
  typePillText: { fontSize: 12, fontWeight: "700" },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  agentWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "800" },
  agentText: { flex: 1, minWidth: 0 },
  agentName: { fontSize: 13, fontWeight: "700" },
  agency: { fontSize: 12, marginTop: 1 },
  chatBtn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  chatBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  // States
  empty: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 16,
    gap: 10,
  },
  emptyTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  emptyCopy: { fontSize: 14, lineHeight: 21, textAlign: "center" },
  retry: {
    marginTop: 6,
    paddingHorizontal: 24,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
  },
  retryText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});
