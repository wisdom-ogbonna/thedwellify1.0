import { LocationPicker } from "@/components/listings/location-picker";
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
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
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

type SortId = (typeof SORTS)[number]["id"];
type ThemeColors = ReturnType<typeof useTheme>["colors"];
type FallbackNotice = "relaxed" | "random" | null;

const EMPTY_PLACE = { state: "", lga: "", landmark: "" };
const DEFAULT_PRICE: PriceRange = { min: null, max: null };
const SCREEN_PAD = 16;
const CARD_GAP = 12;
const SEARCH_DEBOUNCE_MS = 400;

const hitFeedback = () => Haptics.selectionAsync().catch(() => {});
const hitImpact = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

// Fisher–Yates shuffle, used only for the last-resort "nothing matched,
// here's something else" tier so those results don't read as a ranked list.
function shuffle<T>(items: T[]): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function RecommendedScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const columns = width >= 700 ? 3 : 2;

  const cardWidth = useMemo(
    () => (width - SCREEN_PAD * 2 - CARD_GAP * (columns - 1)) / columns,
    [width, columns],
  );

  const [propertyType, setPropertyType] = useState("All");
  const [purpose, setPurpose] = useState("All");
  const [place, setPlace] = useState(EMPTY_PLACE);
  const [priceRange, setPriceRange] = useState<PriceRange>(DEFAULT_PRICE);
  const [sort, setSort] = useState<SortId>("newest");

  const [draftPropertyType, setDraftPropertyType] = useState("All");
  const [draftPurpose, setDraftPurpose] = useState("All");
  const [draftPriceRange, setDraftPriceRange] =
    useState<PriceRange>(DEFAULT_PRICE);
  const [draftSort, setDraftSort] = useState<SortId>("newest");

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [total, setTotal] = useState(0);
  const [fallbackNotice, setFallbackNotice] = useState<FallbackNotice>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const requestId = useRef(0);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounce.current) {
      clearTimeout(searchDebounce.current);
    }

    searchDebounce.current = setTimeout(() => {
      setSearch(query.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounce.current) {
        clearTimeout(searchDebounce.current);
      }
    };
  }, [query]);

  const fetchListings = useCallback(async () => {
    const id = ++requestId.current;

    setFetching(true);

    try {
      setError("");

      const baseParams = {
        propertyType: propertyType === "All" ? undefined : propertyType,
        purpose: purpose === "All" ? undefined : purpose,
        sort,
        q: search || undefined,
        state: place.state || undefined,
        lga: place.lga || undefined,
        landmark: place.landmark || undefined,
        minPrice: priceRange.min ?? undefined,
        maxPrice: priceRange.max ?? undefined,
      };

      // Each tier drops one more filter than the last, ordered from least
      // to most central to what the user actually asked for. The first
      // tier that returns results wins. The final tier has nothing left
      // to drop — it's a plain unfiltered browse, used as a last resort.
      const relaxationTiers: Array<Partial<typeof baseParams>> = [
        {},
        { landmark: undefined },
        { landmark: undefined, minPrice: undefined, maxPrice: undefined },
        {
          landmark: undefined,
          minPrice: undefined,
          maxPrice: undefined,
          q: undefined,
        },
        {
          landmark: undefined,
          minPrice: undefined,
          maxPrice: undefined,
          q: undefined,
          propertyType: undefined,
        },
        {
          landmark: undefined,
          minPrice: undefined,
          maxPrice: undefined,
          q: undefined,
          propertyType: undefined,
          purpose: undefined,
        },
        {
          landmark: undefined,
          minPrice: undefined,
          maxPrice: undefined,
          q: undefined,
          propertyType: undefined,
          purpose: undefined,
          lga: undefined,
        },
        {
          landmark: undefined,
          minPrice: undefined,
          maxPrice: undefined,
          q: undefined,
          propertyType: undefined,
          purpose: undefined,
          lga: undefined,
          state: undefined,
        },
      ];

      let products: PublicListing[] = [];
      let matchedTier = -1;
      let lastParamsKey: string | null = null;

      for (let tier = 0; tier < relaxationTiers.length; tier++) {
        if (id !== requestId.current) return;

        const params = { ...baseParams, ...relaxationTiers[tier] };
        const paramsKey = JSON.stringify(params);

        // A tier whose params are identical to the one we just tried (e.g.
        // dropping a filter that was already unset) can't produce a new
        // result — skip the redundant request.
        if (paramsKey === lastParamsKey) continue;
        lastParamsKey = paramsKey;

        const res = await listingsApi.available(params);

        if (id !== requestId.current) return;

        products = res.products ?? [];
        if (products.length > 0) {
          matchedTier = tier;
          break;
        }
      }

      let notice: FallbackNotice = null;
      if (products.length > 0) {
        if (matchedTier === relaxationTiers.length - 1) {
          // Only the fully unfiltered browse found anything — these
          // results have no real relationship to the search, so shuffle
          // them instead of presenting them as a ranked match.
          products = shuffle(products);
          notice = "random";
        } else if (matchedTier > 0) {
          notice = "relaxed";
        }
      }

      setListings(products);
      setTotal(products.length);
      setFallbackNotice(notice);
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
  }, [
    propertyType,
    purpose,
    place.state,
    place.lga,
    place.landmark,
    priceRange.min,
    priceRange.max,
    sort,
    search,
  ]);

  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, [fetchListings]),
  );

  const activeFilterCount =
    (propertyType !== "All" ? 1 : 0) +
    (purpose !== "All" ? 1 : 0) +
    (place.state || place.lga || place.landmark ? 1 : 0) +
    (sort !== "newest" ? 1 : 0) +
    (priceRange.min != null || priceRange.max != null ? 1 : 0);

  // Note: location (state/LGA) is picked directly on this screen via
  // LocationPicker and applies immediately — it isn't part of the
  // Apply/Reset draft flow below, which only covers the filters that live
  // inside the filter sheet (property type, purpose, price, sort).
  const openFilters = useCallback(() => {
    setDraftPropertyType(propertyType);
    setDraftPurpose(purpose);
    setDraftPriceRange(priceRange);
    setDraftSort(sort);
    setFilterSheetOpen(true);
  }, [propertyType, purpose, priceRange, sort]);

  const applyFilters = useCallback(() => {
    hitImpact();
    setPropertyType(draftPropertyType);
    setPurpose(draftPurpose);
    setPriceRange(draftPriceRange);
    setSort(draftSort);
    setFilterSheetOpen(false);
  }, [draftPropertyType, draftPurpose, draftPriceRange, draftSort]);

  const resetDraftFilters = useCallback(() => {
    hitImpact();
    setDraftPropertyType("All");
    setDraftPurpose("All");
    setDraftPriceRange(DEFAULT_PRICE);
    setDraftSort("newest");
  }, []);

  const resetAllFilters = useCallback(() => {
    hitImpact();
    setPropertyType("All");
    setPurpose("All");
    setPlace(EMPTY_PLACE);
    setPriceRange(DEFAULT_PRICE);
    setSort("newest");
    setDraftPropertyType("All");
    setDraftPurpose("All");
    setDraftPriceRange(DEFAULT_PRICE);
    setDraftSort("newest");
  }, []);

  const submitSearch = useCallback(() => {
    if (searchDebounce.current) {
      clearTimeout(searchDebounce.current);
    }
    setSearch(query.trim());
  }, [query]);

  const clearSearch = useCallback(() => {
    if (searchDebounce.current) {
      clearTimeout(searchDebounce.current);
    }
    setQuery("");
    setSearch("");
  }, []);

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
          Find available land, houses and apartments for rent or sale.
        </Text>

        <View style={styles.searchRow}>
          {/* <View
            style={[
              styles.search,
              styles.searchField,
              {
                borderColor: colors.border,
                backgroundColor: fieldBg,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={19}
              color={colors.placeholder}
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
                  size={19}
                  color={colors.placeholder}
                />
              </Pressable>
            )}
          </View> */}

          <LocationPicker value={place} onChange={setPlace} compact />

          <Pressable
            onPress={openFilters}
            accessibilityRole="button"
            accessibilityLabel="Open property filters"
            style={[
              styles.filterIconButton,
              { backgroundColor: colors.primary },
            ]}
          >
            <Ionicons name="options-outline" size={22} color="#fff" />

            {activeFilterCount > 0 && (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.resultsRow}>
          <View style={styles.countWrap}>
            <Text style={[styles.count, { color: colors.text }]}>
              {loading
                ? "Loading properties..."
                : fallbackNotice === "random"
                  ? `${total} other ${
                      total === 1 ? "property" : "properties"
                    } to explore`
                  : fallbackNotice === "relaxed"
                    ? `${total} closest ${total === 1 ? "match" : "matches"}`
                    : `${total} available ${
                        total === 1 ? "property" : "properties"
                      }`}
            </Text>

            {fetching && !loading && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>
        </View>

        {!loading && !error && listings.length > 0 && fallbackNotice && (
          <View
            style={[
              styles.infoBanner,
              {
                borderColor: colors.border,
                backgroundColor: colors.primary + "12",
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={[styles.infoBannerText, { color: colors.text }]}>
              {fallbackNotice === "random"
                ? "Nothing matched your filters — here are some other available properties."
                : "No exact matches — showing the closest listings to your filters."}
            </Text>
          </View>
        )}

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
      fieldBg,
      query,
      submitSearch,
      clearSearch,
      openFilters,
      activeFilterCount,
      loading,
      total,
      fallbackNotice,
      fetching,
      error,
      listings.length,
      fetchListings,
      place,
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
        We even checked beyond your filters and couldn't find anything available
        right now. Please check back soon.
      </Text>
      {activeFilterCount > 0 && (
        <Pressable
          onPress={resetAllFilters}
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

      <ListingFilterSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        onApply={applyFilters}
        onReset={resetDraftFilters}
        propertyType={draftPropertyType}
        setPropertyType={setDraftPropertyType}
        purpose={draftPurpose}
        setPurpose={setDraftPurpose}
        priceRange={draftPriceRange}
        setPriceRange={setDraftPriceRange}
        sort={draftSort}
        setSort={setDraftSort}
        colors={colors}
        total={total}
      />
    </SafeAreaView>
  );
}

function ListingFilterSheet({
  visible,
  onClose,
  onApply,
  onReset,
  propertyType,
  setPropertyType,
  purpose,
  setPurpose,
  priceRange,
  setPriceRange,
  sort,
  setSort,
  colors,
  total,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  propertyType: string;
  setPropertyType: (value: string) => void;
  purpose: string;
  setPurpose: (value: string) => void;
  priceRange: PriceRange;
  setPriceRange: (value: PriceRange) => void;
  sort: SortId;
  setSort: (value: SortId) => void;
  colors: ThemeColors;
  total: number;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.filterModalRoot}>
        <Pressable style={styles.filterBackdrop} onPress={onClose} />

        <View
          style={[styles.filterSheet, { backgroundColor: colors.background }]}
        >
          <View style={styles.filterHandle} />

          <View
            style={[styles.filterHeader, { borderBottomColor: colors.border }]}
          >
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
              style={[
                styles.filterClose,
                { backgroundColor: colors.disabled + "20" },
              ]}
            >
              <Ionicons name="close" size={23} color={colors.text} />
            </Pressable>

            <Text style={[styles.filterTitle, { color: colors.text }]}>
              Filters
            </Text>

            <Pressable onPress={onReset} hitSlop={10}>
              <Text style={[styles.filterReset, { color: colors.primary }]}>
                Reset
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <FilterSection title="LISTING PURPOSE" colors={colors}>
              <View style={styles.filterOptions}>
                {PURPOSES.map((item) => (
                  <FilterChip
                    key={item.id}
                    label={item.label}
                    selected={purpose === item.id}
                    colors={colors}
                    onPress={() => {
                      hitFeedback();
                      setPurpose(item.id);
                    }}
                  />
                ))}
              </View>
            </FilterSection>

            <FilterSection title="PROPERTY TYPE" colors={colors}>
              <View style={styles.filterOptions}>
                {TYPES.map((item) => (
                  <FilterChip
                    key={item}
                    label={item}
                    selected={propertyType === item}
                    colors={colors}
                    onPress={() => {
                      hitFeedback();
                      setPropertyType(item);
                    }}
                  />
                ))}
              </View>
            </FilterSection>

            <FilterSection title="PRICE RANGE" colors={colors}>
              <PriceFilter
                purpose={purpose}
                value={priceRange}
                onChange={setPriceRange}
              />
            </FilterSection>

            <FilterSection title="SORT BY" colors={colors}>
              <View style={styles.filterOptions}>
                {SORTS.map((item) => (
                  <FilterChip
                    key={item.id}
                    label={item.label}
                    selected={sort === item.id}
                    colors={colors}
                    onPress={() => {
                      hitFeedback();
                      setSort(item.id);
                    }}
                  />
                ))}
              </View>
            </FilterSection>
          </ScrollView>

          <View
            style={[styles.filterFooter, { borderTopColor: colors.border }]}
          >
            <View style={styles.filterFooterInfo}>
              <Text
                style={[styles.matchingLabel, { color: colors.placeholder }]}
              >
                Current results
              </Text>

              <Text style={[styles.matchingCount, { color: colors.text }]}>
                {total} {total === 1 ? "Property" : "Properties"}
              </Text>
            </View>

            <Pressable
              onPress={onApply}
              style={({ pressed }) => [
                styles.applyButton,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={styles.applyButtonText}>APPLY FILTERS</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FilterSection({
  title,
  colors,
  children,
}: {
  title: string;
  colors: ThemeColors;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.filterSection}>
      <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function FilterChip({
  label,
  selected,
  colors,
  onPress,
}: {
  label: string;
  selected: boolean;
  colors: ThemeColors;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          // Selection is communicated with a thin colored border instead
          // of a filled background, so the chip's background stays the
          // same whether it's selected or not.
          backgroundColor: colors.disabled + "18",
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 1.5 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          { color: selected ? colors.primary : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SkeletonCard({ colors }: { colors: ThemeColors }) {
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View
      style={[
        styles.card,
        {
          borderColor: colors.border,
          backgroundColor: colors.disabled + "10",
        },
        animatedStyle,
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
  return (
    <View>
      {Array.from({ length: 3 }).map((_, row) => (
        <View
          key={row}
          style={{
            flexDirection: "row",
            gap: CARD_GAP,
            marginBottom: CARD_GAP,
          }}
        >
          {Array.from({ length: columns }).map((__, column) => (
            <View key={column} style={{ flex: 1 }}>
              <SkeletonCard colors={colors} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

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
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
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
  safe: {
    flex: 1,
  },
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
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginTop: 2,
  },
  sub: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 14,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  searchField: {
    flex: 1,
    marginTop: 0,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterIconButton: {
    width: 48,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  filterCountBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  filterCountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
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
  count: {
    fontSize: 14,
    fontWeight: "800",
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
  },
  bannerAction: {
    fontSize: 12,
    fontWeight: "800",
  },
  filterModalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  filterBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  filterSheet: {
    height: "88%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  filterHandle: {
    width: 48,
    height: 5,
    borderRadius: 5,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  filterHeader: {
    height: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterClose: {
    width: 42,
    height: 42,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  filterTitle: {
    flex: 1,
    fontSize: 21,
    fontWeight: "900",
  },
  filterReset: {
    fontSize: 14,
    fontWeight: "800",
  },
  filterScroll: {
    flex: 1,
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  filterSection: {
    marginBottom: 28,
    gap: 14,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  filterChip: {
    minHeight: 43,
    paddingHorizontal: 17,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  filterFooter: {
    minHeight: 94,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  filterFooterInfo: {
    flex: 1,
  },
  matchingLabel: {
    fontSize: 12,
  },
  matchingCount: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: 3,
  },
  applyButton: {
    flex: 1.5,
    minHeight: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  imageWrap: {
    aspectRatio: 4 / 3,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 6,
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  cardBody: {
    padding: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: "900",
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  meta: {
    flex: 1,
    fontSize: 11,
  },
  empty: {
    alignItems: "center",
    paddingTop: 30,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyCopy: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  retry: {
    marginTop: 6,
    paddingHorizontal: 20,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
  },
  retryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
});
