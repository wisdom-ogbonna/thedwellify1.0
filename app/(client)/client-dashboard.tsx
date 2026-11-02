// NOTE on dependencies:
// - Uses `react-native-reanimated` for entrance/press/indicator animations.
//   (Already in your stack per the incident-report and payment-screen work.)
// - Uses `expo-haptics` for light tactile feedback on filter taps.
//   If it isn't installed yet: `npx expo install expo-haptics`
//   (or delete the three `Haptics.*` calls — everything else works without it).

import PriceFilter, {
  type PriceRange,
} from "@/components/listings/price-filter";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  formatPrice,
  PROPERTY_TYPES,
  purposeLabel,
} from "@/constants/listings";
import { useTheme } from "@/hooks/use-theme";
import { listingsApi, type PublicListing } from "@/services/listings";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
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

type SortId = (typeof SORTS)[number]["id"];

const DEFAULT_PRICE: PriceRange = { min: null, max: null };
const SCREEN_PAD = 16;
const CARD_GAP = 12;
const SEARCH_DEBOUNCE_MS = 400;

type ThemeColors = ReturnType<typeof useTheme>["colors"];

const hitFeedback = () => Haptics.selectionAsync().catch(() => {});
const hitImpact = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

export default function RecommendedScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  // 2 columns on phones, 3 on tablets — was a dead `width >= 700 ? 2 : 2`.
  const columns = width >= 700 ? 3 : 2;
  const cardWidth = useMemo(
    () => (width - SCREEN_PAD * 2 - CARD_GAP * (columns - 1)) / columns,
    [width, columns],
  );

  const [propertyType, setPropertyType] = useState("All");
  const [purpose, setPurpose] = useState("All");
  const [priceRange, setPriceRange] = useState<PriceRange>(DEFAULT_PRICE);
  const [sort, setSort] = useState<SortId>("newest");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const requestId = useRef(0);
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>();

  // Search-as-you-type, debounced — submit/enter still fires immediately.
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearch(query.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [query]);

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
        minPrice: priceRange.min ?? undefined,
        maxPrice: priceRange.max ?? undefined,
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
  }, [propertyType, purpose, priceRange.min, priceRange.max, sort, search]);

  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, [fetchListings]),
  );

  const activeFilterCount =
    (propertyType !== "All" ? 1 : 0) +
    (purpose !== "All" ? 1 : 0) +
    (sort !== "newest" ? 1 : 0) +
    (priceRange.min != null || priceRange.max != null ? 1 : 0);

  const resetFilters = useCallback(() => {
    hitImpact();
    setPropertyType("All");
    setPurpose("All");
    setPriceRange(DEFAULT_PRICE);
    setSort("newest");
    setQuery("");
    setSearch("");
  }, []);

  const selectType = useCallback((t: string) => {
    hitFeedback();
    setPropertyType(t);
  }, []);

  const selectPurpose = useCallback((p: string) => {
    hitFeedback();
    setPurpose(p);
  }, []);

  const selectSort = useCallback((s: SortId) => {
    hitFeedback();
    setSort(s);
    setSortSheetOpen(false);
  }, []);

  const submitSearch = () => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    setSearch(query.trim());
  };

  const clearSearch = () => {
    setQuery("");
    setSearch("");
  };

  const sortLabel = SORTS.find((s) => s.id === sort)?.label ?? "Newest";
  const fieldBg = colors.disabled + "14";

  const header = useMemo(
    () => (
      <View>
        <View style={styles.topRow}>
          <Text style={[styles.kicker, { color: colors.primary }]}>
            DISCOVER
          </Text>
          <NotificationBell color={colors.text} size={20} />
        </View>
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
            { borderColor: colors.border, backgroundColor: fieldBg },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.placeholder}
            style={styles.searchIcon}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search title or location..."
            placeholderTextColor={colors.placeholder}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
            onSubmitEditing={submitSearch}
          />
          {query.length > 0 && (
            <Pressable onPress={clearSearch} hitSlop={10}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.placeholder}
              />
            </Pressable>
          )}
        </View>

        {/* Purpose — direct-tap segmented control, no more cycling */}
        <PurposeSegment
          value={purpose}
          onChange={selectPurpose}
          colors={colors}
        />

        {/* Type — direct-tap chips, no more cycling */}
        <TypeChips value={propertyType} onChange={selectType} colors={colors} />

        {/* Price + Sort + Reset */}
        <View style={styles.filterBar}>
          <PriceFilter
            purpose={purpose}
            value={priceRange}
            onChange={setPriceRange}
          />

          <Pressable
            onPress={() => setSortSheetOpen(true)}
            style={[
              styles.filterDropdownPill,
              { backgroundColor: fieldBg, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="swap-vertical-outline"
              size={14}
              color={colors.text}
            />
            <Text style={[styles.filterPillLabel, { color: colors.text }]}>
              {sortLabel}
            </Text>
          </Pressable>

          {activeFilterCount > 0 && (
            <Pressable
              onPress={resetFilters}
              style={[styles.resetPill, { borderColor: colors.primary }]}
            >
              <Ionicons
                name="refresh-outline"
                size={14}
                color={colors.primary}
              />
              <Text style={[styles.resetPillLabel, { color: colors.primary }]}>
                Reset{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </Text>
            </Pressable>
          )}
        </View>

        <ActiveFilters
          propertyType={propertyType}
          purpose={purpose}
          priceRange={priceRange}
          sort={sort}
          colors={colors}
          onClearType={() => selectType("All")}
          onClearPurpose={() => selectPurpose("All")}
          onClearPrice={() => setPriceRange(DEFAULT_PRICE)}
          onClearSort={() => selectSort("newest")}
          onClearAll={resetFilters}
        />

        {/* Results Info Row */}
        <View style={styles.resultsRow}>
          <View style={styles.countWrap}>
            <Text style={[styles.count, { color: colors.text }]}>
              {loading
                ? "Loading properties..."
                : `${total} available ${total === 1 ? "property" : "properties"}`}
            </Text>
            {fetching && !loading && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>
          <Text style={[styles.locationLabel, { color: colors.placeholder }]}>
            Lagos, Nigeria
          </Text>
        </View>

        {!!error && listings.length > 0 && (
          <Pressable
            onPress={fetchListings}
            style={[styles.banner, { borderColor: colors.border }]}
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
    [
      colors,
      propertyType,
      purpose,
      priceRange,
      sort,
      query,
      total,
      loading,
      fetching,
      error,
      listings.length,
      fetchListings,
      fieldBg,
      activeFilterCount,
      resetFilters,
      selectType,
      selectPurpose,
      selectSort,
      sortLabel,
    ],
  );

  const listEmpty = loading ? (
    <SkeletonGrid columns={columns} colors={colors} />
  ) : error && listings.length === 0 ? (
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
        Try another type, switch rent or sale, or change the price filter.
      </Text>
      {activeFilterCount > 0 && (
        <Pressable
          onPress={resetFilters}
          style={[styles.retry, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.retryText}>Clear filters</Text>
        </Pressable>
      )}
    </View>
  );

  const renderCard = useCallback(
    ({ item, index }: { item: PublicListing; index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index, 8) * 40)
          .springify()
          .damping(18)}
        style={{ width: cardWidth }}
      >
        <ListingCard
          item={item}
          colors={colors}
          onOpen={() =>
            router.navigate({
              pathname: "/(utilities)/property-details",
              params: { propertyId: item.id },
            })
          }
        />
      </Animated.View>
    ),
    [cardWidth, colors],
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <FlatList
        key={columns}
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        numColumns={columns}
        columnWrapperStyle={{ gap: CARD_GAP }}
        ItemSeparatorComponent={() => <View style={{ height: CARD_GAP }} />}
        ListHeaderComponent={header}
        ListEmptyComponent={listEmpty}
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

      <SortSheet
        visible={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        sort={sort}
        onSelect={selectSort}
        colors={colors}
      />
    </SafeAreaView>
  );
}

/* ----------------------------- Purpose segment ---------------------------- */

function PurposeSegment({
  value,
  onChange,
  colors,
}: {
  value: string;
  onChange: (id: string) => void;
  colors: ThemeColors;
}) {
  const [segWidth, setSegWidth] = useState(0);
  const indicatorX = useSharedValue(0);
  const idx = Math.max(
    0,
    PURPOSES.findIndex((p) => p.id === value),
  );

  useEffect(() => {
    if (segWidth) {
      indicatorX.value = withSpring((segWidth / PURPOSES.length) * idx, {
        damping: 18,
        stiffness: 180,
      });
    }
  }, [idx, segWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: segWidth ? segWidth / PURPOSES.length : 0,
  }));

  return (
    <View
      style={[
        styles.segment,
        { backgroundColor: colors.disabled + "14", borderColor: colors.border },
      ]}
      onLayout={(e) => setSegWidth(e.nativeEvent.layout.width)}
    >
      {segWidth > 0 && (
        <Animated.View
          style={[
            styles.segmentIndicator,
            { backgroundColor: colors.primary },
            indicatorStyle,
          ]}
        />
      )}
      {PURPOSES.map((p) => (
        <Pressable
          key={p.id}
          style={styles.segmentItem}
          onPress={() => onChange(p.id)}
        >
          <Text
            style={[
              styles.segmentLabel,
              { color: p.id === value ? "#fff" : colors.text },
            ]}
          >
            {p.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/* -------------------------------- Type chips ------------------------------- */

function TypeChips({
  value,
  onChange,
  colors,
}: {
  value: string;
  onChange: (t: string) => void;
  colors: ThemeColors;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
      keyboardShouldPersistTaps="handled"
    >
      {TYPES.map((t) => {
        const selected = t === value;
        return (
          <Pressable
            key={t}
            onPress={() => onChange(t)}
            style={[
              styles.chip,
              {
                backgroundColor: selected
                  ? colors.primary
                  : colors.disabled + "14",
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipLabel,
                { color: selected ? "#fff" : colors.text },
              ]}
            >
              {t}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* ------------------------------ Active filters ----------------------------- */

function ActiveFilters({
  propertyType,
  purpose,
  priceRange,
  sort,
  colors,
  onClearType,
  onClearPurpose,
  onClearPrice,
  onClearSort,
  onClearAll,
}: {
  propertyType: string;
  purpose: string;
  priceRange: PriceRange;
  sort: SortId;
  colors: ThemeColors;
  onClearType: () => void;
  onClearPurpose: () => void;
  onClearPrice: () => void;
  onClearSort: () => void;
  onClearAll: () => void;
}) {
  const chips: { key: string; label: string; onClear: () => void }[] = [];

  if (propertyType !== "All") {
    chips.push({ key: "type", label: propertyType, onClear: onClearType });
  }
  if (purpose !== "All") {
    chips.push({
      key: "purpose",
      label: PURPOSES.find((p) => p.id === purpose)?.label ?? purpose,
      onClear: onClearPurpose,
    });
  }
  if (priceRange.min != null || priceRange.max != null) {
    chips.push({
      key: "price",
      label: `${priceRange.min != null ? formatPrice(priceRange.min) : "Any"} – ${
        priceRange.max != null ? formatPrice(priceRange.max) : "Any"
      }`,
      onClear: onClearPrice,
    });
  }
  if (sort !== "newest") {
    chips.push({
      key: "sort",
      label: SORTS.find((s) => s.id === sort)?.label ?? sort,
      onClear: onClearSort,
    });
  }

  if (!chips.length) return null;

  return (
    <Animated.View entering={FadeIn.duration(150)} style={styles.activeRow}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6, alignItems: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        {chips.map((c) => (
          <Pressable
            key={c.key}
            onPress={c.onClear}
            style={[styles.activeChip, { borderColor: colors.primary }]}
          >
            <Text
              style={[styles.activeChipLabel, { color: colors.primary }]}
              numberOfLines={1}
            >
              {c.label}
            </Text>
            <Ionicons name="close" size={12} color={colors.primary} />
          </Pressable>
        ))}
        <Pressable onPress={onClearAll} hitSlop={8}>
          <Text style={[styles.clearAll, { color: colors.placeholder }]}>
            Clear all
          </Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}

/* --------------------------------- Sort sheet -------------------------------- */

function SortSheet({
  visible,
  onClose,
  sort,
  onSelect,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  sort: SortId;
  onSelect: (s: SortId) => void;
  colors: ThemeColors;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <Animated.View
        entering={FadeInDown.springify().damping(18)}
        style={[
          styles.sheet,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <View style={styles.sheetHandle} />
        <Text style={[styles.sheetTitle, { color: colors.text }]}>Sort by</Text>
        {SORTS.map((s) => {
          const selected = s.id === sort;
          return (
            <Pressable
              key={s.id}
              style={styles.sheetRow}
              onPress={() => onSelect(s.id)}
            >
              <Text
                style={[
                  styles.sheetRowLabel,
                  { color: colors.text, fontWeight: selected ? "800" : "500" },
                ]}
              >
                {s.label}
              </Text>
              {selected && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.primary}
                />
              )}
            </Pressable>
          );
        })}
      </Animated.View>
    </Modal>
  );
}

/* -------------------------------- Skeleton grid ------------------------------- */

function SkeletonCard({ colors }: { colors: ThemeColors }) {
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        styles.card,
        { borderColor: colors.border, backgroundColor: colors.disabled + "10" },
        style,
      ]}
    >
      <View
        style={[styles.image, { backgroundColor: colors.disabled + "30" }]}
      />
      <View style={{ padding: 10, gap: 6 }}>
        <View
          style={{
            height: 14,
            width: "50%",
            borderRadius: 4,
            backgroundColor: colors.disabled + "30",
          }}
        />
        <View
          style={{
            height: 12,
            width: "80%",
            borderRadius: 4,
            backgroundColor: colors.disabled + "30",
          }}
        />
        <View
          style={{
            height: 10,
            width: "60%",
            borderRadius: 4,
            backgroundColor: colors.disabled + "30",
          }}
        />
      </View>
    </Animated.View>
  );
}

function SkeletonGrid({
  columns,
  colors,
}: {
  columns: number;
  colors: ThemeColors;
}) {
  const rowCount = 3;
  const rows = Array.from({ length: rowCount });

  return (
    <View>
      {rows.map((_, r) => (
        <View
          key={r}
          style={{
            flexDirection: "row",
            gap: CARD_GAP,
            marginBottom: CARD_GAP,
          }}
        >
          {Array.from({ length: columns }).map((__, c) => (
            <View key={c} style={{ flex: 1 }}>
              <SkeletonCard colors={colors} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/* -------------------------------- Listing card -------------------------------- */

function ListingCard({
  item,
  colors,
  onOpen,
}: {
  item: PublicListing;
  colors: ThemeColors;
  onOpen: () => void;
}) {
  const image = item.images?.[0];
  const label = purposeLabel(item.purpose, item.tag);

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.background, borderColor: colors.border },
        {
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
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
              size={24}
              color={colors.placeholder}
            />
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
          style={[styles.price, { color: colors.primary }]}
          numberOfLines={1}
        >
          {item.price ? formatPrice(item.price) : "Price on request"}
        </Text>

        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {item.title || "Untitled property"}
        </Text>

        {!!item.location && (
          <View style={styles.metaRow}>
            <Ionicons
              name="location-outline"
              size={13}
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
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: {
    paddingHorizontal: SCREEN_PAD,
    paddingTop: 8,
    paddingBottom: 100,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  heading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginTop: 2,
  },
  sub: { fontSize: 13, lineHeight: 18, marginTop: 4, marginBottom: 14 },

  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 2 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 14, paddingVertical: 0 },

  segment: {
    flexDirection: "row",
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    overflow: "hidden",
    position: "relative",
  },
  segmentIndicator: {
    position: "absolute",
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: 9,
  },
  segmentItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  segmentLabel: { fontSize: 13, fontWeight: "700" },

  chipRow: { gap: 8, paddingVertical: 10 },
  chip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: { fontSize: 12, fontWeight: "700" },

  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 4,
    gap: 8,
  },
  filterDropdownPill: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  filterPillLabel: { fontSize: 13, fontWeight: "600" },

  resetPill: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  resetPillLabel: { fontSize: 12, fontWeight: "800" },

  activeRow: { marginTop: 10 },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  activeChipLabel: { fontSize: 11, fontWeight: "700", maxWidth: 120 },
  clearAll: {
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
    marginLeft: 4,
  },

  resultsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 10,
  },
  countWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  count: { fontSize: 14, fontWeight: "800" },
  locationLabel: { fontSize: 13, fontWeight: "500" },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
  bannerText: { flex: 1, fontSize: 12 },
  bannerAction: { fontSize: 12, fontWeight: "800" },

  card: { borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  imageWrap: { aspectRatio: 4 / 3 },
  image: { width: "100%", height: "100%" },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 6,
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  cardBody: { padding: 10 },
  price: { fontSize: 16, fontWeight: "900" },
  title: { fontSize: 13, lineHeight: 18, fontWeight: "700", marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  meta: { flex: 1, fontSize: 11 },

  empty: {
    alignItems: "center",
    paddingTop: 30,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: "800", textAlign: "center" },
  emptyCopy: { fontSize: 13, lineHeight: 18, textAlign: "center" },
  retry: {
    marginTop: 6,
    paddingHorizontal: 20,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
  },
  retryText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  sheetBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#88888844",
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 16, fontWeight: "900", marginBottom: 10 },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#88888822",
  },
  sheetRowLabel: { fontSize: 14 },
});
