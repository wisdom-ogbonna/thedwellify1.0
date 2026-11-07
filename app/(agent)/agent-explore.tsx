import { LocationPicker } from "@/components/listings/location-picker";
import { formatPrice, purposeLabel } from "@/constants/listings";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { agentApi } from "@/services/agent";
import { listingsApi, type PublicListing } from "@/services/listings";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ALL = "All";
const DEFAULT_FILTERS = {
  purpose: ALL,
  propertyType: ALL,
  state: "",
  lga: "",
  location: "",
  minPrice: "",
  maxPrice: "",
  sort: "Newest",
};

type Filters = typeof DEFAULT_FILTERS;

type SheetTheme = {
  colors: any;
  isDark: boolean;
  surface: string;
};

function formatNairaInput(value: string): string {
  if (!value) return "";
  return Number(value).toLocaleString("en-NG");
}

function FilterChip({
  label,
  selected,
  onPress,
  colors,
  outlined = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
  outlined?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: selected
            ? outlined
              ? colors.primary + "12"
              : colors.primary
            : colors.disabled + "18",
          borderColor: selected ? colors.primary : "transparent",
          borderWidth: selected && outlined ? 1.5 : 0,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.filterChipText,
          {
            color: selected
              ? outlined
                ? colors.primary
                : "#FFFFFF"
              : colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FilterSection({
  title,
  trailing,
  colors,
  children,
}: {
  title: string;
  trailing?: string;
  colors: any;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.filterSection}>
      <View style={styles.filterSectionHeader}>
        <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
          {title}
        </Text>
        {!!trailing && (
          <Text
            style={[
              styles.filterSectionTrailing,
              { color: colors.placeholder },
            ]}
          >
            {trailing}
          </Text>
        )}
      </View>
      <View style={styles.filterChipGroup}>{children}</View>
    </View>
  );
}

function PriceInput({
  label,
  value,
  onChange,
  colors,
  borderColor,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  colors: any;
  borderColor: string;
  error?: boolean;
}) {
  return (
    <View
      style={[
        styles.priceInputWrap,
        {
          borderColor: error ? "#EF4444" : borderColor,
          backgroundColor: colors.disabled + "12",
        },
      ]}
    >
      <Text style={[styles.priceInputLabel, { color: colors.placeholder }]}>
        {label}
      </Text>
      <View style={styles.priceInputLine}>
        <Text style={[styles.nairaSymbol, { color: colors.placeholder }]}>
          ₦
        </Text>
        <TextInput
          value={formatNairaInput(value)}
          onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ""))}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.placeholder}
          style={[styles.priceInput, { color: colors.text }]}
        />
      </View>
    </View>
  );
}

function FiltersSheet({
  visible,
  onClose,
  onApply,
  filters,
  propertyTypes,
  purposes,
  colors,
  isDark,
  surface,
}: SheetTheme & {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
  filters: Filters;
  propertyTypes: string[];
  purposes: string[];
}) {
  const [draft, setDraft] = useState<Filters>(filters);
  const borderColor = isDark ? "#292D36" : "#E8ECF2";

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const update = (key: keyof Filters, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    setDraft(DEFAULT_FILTERS);
  };

  const priceError = useMemo(() => {
    if (!draft.minPrice || !draft.maxPrice) return false;
    return Number(draft.minPrice) > Number(draft.maxPrice);
  }, [draft.minPrice, draft.maxPrice]);

  const apply = () => {
    if (priceError) return;
    onApply(draft);
    onClose();
  };

  const sortOptions = ["Newest", "Price: Low to High", "Price: High to Low"];

  const selectedCount = [
    draft.purpose !== ALL,
    draft.propertyType !== ALL,
    !!draft.state.trim() || !!draft.lga.trim() || !!draft.location.trim(),
    !!draft.minPrice || !!draft.maxPrice,
    draft.sort !== "Newest",
  ].filter(Boolean).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View
          style={[
            styles.filterSheet,
            {
              backgroundColor: surface,
              borderColor,
            },
          ]}
        >
          <View style={styles.sheetHandle} />

          <View
            style={[styles.sheetHeader, { borderBottomColor: borderColor }]}
          >
            <Pressable
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: colors.disabled + "22" },
              ]}
              hitSlop={8}
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>

            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              Filters
            </Text>

            <Pressable onPress={reset} hitSlop={8}>
              <Text style={[styles.resetText, { color: colors.primary }]}>
                Reset
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <FilterSection title="LISTING PURPOSE" colors={colors}>
              {purposes.map((purpose) => (
                <FilterChip
                  key={purpose}
                  label={
                    purpose === ALL ? "All" : purposeLabel(purpose, undefined)
                  }
                  selected={draft.purpose === purpose}
                  onPress={() => update("purpose", purpose)}
                  colors={colors}
                />
              ))}
            </FilterSection>

            <FilterSection title="PROPERTY TYPE" colors={colors}>
              {[ALL, ...propertyTypes].map((type) => (
                <FilterChip
                  key={type}
                  label={type}
                  selected={draft.propertyType === type}
                  onPress={() => update("propertyType", type)}
                  colors={colors}
                />
              ))}
            </FilterSection>

            <FilterSection
              title="PRICE RANGE"
              trailing="Nigerian Naira"
              colors={colors}
            >
              <View style={styles.priceInputsRow}>
                <PriceInput
                  label="Minimum"
                  value={draft.minPrice}
                  onChange={(value) => update("minPrice", value)}
                  colors={colors}
                  borderColor={borderColor}
                  error={priceError}
                />
                <View style={styles.priceDivider}>
                  <Text
                    style={[
                      styles.priceDividerDash,
                      { color: colors.placeholder },
                    ]}
                  >
                    –
                  </Text>
                </View>
                <PriceInput
                  label="Maximum"
                  value={draft.maxPrice}
                  onChange={(value) => update("maxPrice", value)}
                  colors={colors}
                  borderColor={borderColor}
                  error={priceError}
                />
              </View>
              {priceError && (
                <Text style={styles.priceErrorText}>
                  Minimum price cannot exceed maximum price.
                </Text>
              )}
            </FilterSection>

            <FilterSection title="LOCATION" colors={colors}>
              <LocationPicker
                compact
                value={{
                  state: draft.state,
                  lga: draft.lga,
                  landmark: draft.location,
                }}
                onChange={(next) =>
                  setDraft((current) => ({
                    ...current,
                    state: next.state,
                    lga: next.lga,
                    location: next.landmark,
                  }))
                }
              />
            </FilterSection>

            <FilterSection title="SORT BY" colors={colors}>
              {sortOptions.map((sort) => (
                <FilterChip
                  key={sort}
                  label={sort}
                  selected={draft.sort === sort}
                  onPress={() => update("sort", sort)}
                  colors={colors}
                />
              ))}
            </FilterSection>
          </ScrollView>

          <View style={[styles.sheetFooter, { borderTopColor: borderColor }]}>
            <View style={styles.matchingWrap}>
              <Text
                style={[styles.matchingLabel, { color: colors.placeholder }]}
              >
                Filters
              </Text>
              <Text style={[styles.matchingValue, { color: colors.text }]}>
                {selectedCount} selected
              </Text>
            </View>

            <Pressable
              onPress={apply}
              disabled={priceError}
              style={({ pressed }) => [
                styles.applyButton,
                {
                  backgroundColor: colors.primary,
                  opacity: priceError ? 0.5 : pressed ? 0.88 : 1,
                },
              ]}
            >
              <Text style={styles.applyButtonText}>APPLY FILTERS</Text>
              <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ExploreScreen() {
  const { colors, isDark } = useTheme();
  const { isOnline } = useAuth();
  const surface = isDark ? "#121212" : "#FFFFFF";

  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const load = useCallback(async () => {
    try {
      setError("");
      const { products } = await listingsApi.explore({});
      setListings(products);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Could not load properties.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      agentApi
        .profile()
        .then(setProfile)
        .catch(() => undefined);
    }, [load]),
  );

  const propertyTypes = useMemo(
    () =>
      Array.from(
        new Set(
          listings
            .map((item) => item.propertyType?.trim())
            .filter((value): value is string => !!value),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [listings],
  );

  const purposes = useMemo(
    () => [
      ALL,
      ...Array.from(
        new Set(
          listings
            .map((item) => item.purpose)
            .filter((value): value is string => !!value),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    ],
    [listings],
  );

  const visibleListings = useMemo(() => {
    let result = [...listings];

    const normalizedSearch = search.trim().toLowerCase();

    if (normalizedSearch) {
      result = result.filter((item) =>
        [
          item.title,
          item.location,
          item.state,
          item.lga,
          item.landmark,
          item.propertyType,
          item.tag,
          item.purpose,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch),
          ),
      );
    }

    if (filters.purpose !== ALL) {
      result = result.filter(
        (item) => item.purpose?.toLowerCase() === filters.purpose.toLowerCase(),
      );
    }

    if (filters.propertyType !== ALL) {
      result = result.filter(
        (item) =>
          item.propertyType?.toLowerCase() ===
          filters.propertyType.toLowerCase(),
      );
    }

    const blob = (item: PublicListing) =>
      `${item.state || ""} ${item.lga || ""} ${item.landmark || ""} ${item.location || ""}`.toLowerCase();
    if (filters.state.trim()) {
      result = result.filter((item) =>
        blob(item).includes(filters.state.trim().toLowerCase()),
      );
    }
    if (filters.lga.trim()) {
      result = result.filter((item) =>
        blob(item).includes(filters.lga.trim().toLowerCase()),
      );
    }
    const locationQuery = filters.location.trim().toLowerCase();
    if (locationQuery) {
      result = result.filter((item) => blob(item).includes(locationQuery));
    }

    const min = filters.minPrice ? Number(filters.minPrice) : null;
    const max = filters.maxPrice ? Number(filters.maxPrice) : null;

    if (min !== null && Number.isFinite(min)) {
      result = result.filter((item) => item.price != null && item.price >= min);
    }

    if (max !== null && Number.isFinite(max)) {
      result = result.filter((item) => item.price != null && item.price <= max);
    }

    if (filters.sort === "Price: Low to High") {
      result.sort(
        (a, b) =>
          (a.price ?? Number.MAX_SAFE_INTEGER) -
          (b.price ?? Number.MAX_SAFE_INTEGER),
      );
    } else if (filters.sort === "Price: High to Low") {
      result.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    }

    return result;
  }, [listings, search, filters]);

  const activeFilterCount = [
    filters.purpose !== ALL,
    filters.propertyType !== ALL,
    !!filters.state.trim() || !!filters.lga.trim() || !!filters.location.trim(),
    !!filters.minPrice || !!filters.maxPrice,
    filters.sort !== "Newest",
  ].filter(Boolean).length;

  const openListing = (item: PublicListing) => {
    router.navigate({
      pathname: "/(utilities)/property-details",
      params: { propertyId: item.id },
    });
  };

  const getTypeIcon = (type?: string): keyof typeof Ionicons.glyphMap => {
    const value = type?.toLowerCase() || "";
    if (value.includes("apartment")) return "business-outline";
    if (value.includes("hotel")) return "bed-outline";
    if (value.includes("house") || value.includes("duplex"))
      return "home-outline";
    if (value.includes("land")) return "grid-outline";
    return "home-outline";
  };

  const renderCard = ({ item }: { item: PublicListing }) => {
    const image = item.images?.[0];
    const typeLabel = (item.propertyType || "PROPERTY").toUpperCase();
    const tagLabel = purposeLabel(item.purpose, item.tag).toUpperCase();

    const isNightly =
      item.tag?.toLowerCase().includes("shortlet") ||
      item.propertyType?.toLowerCase().includes("hotel");
    const rateSuffix = isNightly
      ? " / night"
      : item.purpose === "Rent"
        ? " / year"
        : "";

    return (
      <Pressable
        onPress={() => openListing(item)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: surface,
            borderColor: isDark ? "#2A2A2A" : "#F0F0F3",
            opacity: pressed ? 0.9 : 1,
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
                size={26}
                color={colors.placeholder}
              />
            </View>
          )}

          <View style={[styles.typeBadge, { backgroundColor: colors.primary }]}>
            <Ionicons
              name={getTypeIcon(item.propertyType)}
              size={11}
              color="#FFFFFF"
              style={{ marginRight: 3 }}
            />
            <Text style={styles.typeBadgeText}>
              {typeLabel === "APARTMENT" ? "APT" : typeLabel}
            </Text>
          </View>

          <View style={styles.purposeBadge}>
            <Text style={styles.purposeBadgeText}>{tagLabel}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text
            style={[styles.priceRow, { color: colors.primary }]}
            numberOfLines={1}
          >
            {item.price ? formatPrice(item.price) : "Price on request"}
            {rateSuffix ? (
              <Text style={styles.rateSuffix}>{rateSuffix}</Text>
            ) : null}
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
              {item.location || "Port Harcourt, Nigeria"}
            </Text>
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
        <View style={styles.headerCopy}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>
            Explore
          </Text>
          <Text style={[styles.screenSub, { color: colors.placeholder }]}>
            Find the perfect property for your needs.
          </Text>
        </View>

        <Pressable
          onPress={() => router.navigate("/(utilities)/agent-profile")}
        >
          <View style={{ position: "relative" }}>
            <Image
              source={{
                uri:
                  profile?.avatar ||
                  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300",
              }}
              style={styles.headerAvatar}
            />
            <View
              style={[
                styles.headerDot,
                {
                  backgroundColor: isOnline
                    ? colors.success
                    : colors.placeholder,
                  borderColor: colors.background,
                },
              ]}
            />
          </View>
        </Pressable>
      </View>

      <View style={styles.searchFilterRow}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: surface,
              borderColor: isDark ? "#2A2A2A" : "#E8ECF2",
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={19}
            color={colors.placeholder}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search properties"
            placeholderTextColor={colors.placeholder}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.placeholder}
              />
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={() => setFilterSheetVisible(true)}
          style={[
            styles.filterButton,
            {
              backgroundColor: activeFilterCount ? colors.primary : surface,
              borderColor: activeFilterCount
                ? colors.primary
                : isDark
                  ? "#2A2A2A"
                  : "#E8ECF2",
            },
          ]}
        >
          <Ionicons
            name="options-outline"
            size={21}
            color={activeFilterCount ? "#FFFFFF" : colors.text}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: colors.text }]}>
          {loading
            ? "Loading properties..."
            : `${visibleListings.length} ${visibleListings.length === 1 ? "property" : "properties"} found`}
        </Text>
        {(activeFilterCount > 0 || !!search) && (
          <Pressable
            onPress={() => {
              setFilters(DEFAULT_FILTERS);
              setSearch("");
            }}
            hitSlop={8}
          >
            <Text style={[styles.clearFiltersText, { color: colors.primary }]}>
              Clear all
            </Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {error}
          </Text>
          <Pressable
            onPress={load}
            style={[styles.retry, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={visibleListings}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons
                name="home-outline"
                size={32}
                color={colors.placeholder}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No properties found
              </Text>
              <Text style={[styles.emptyCopy, { color: colors.placeholder }]}>
                Try another search or adjust your filters.
              </Text>
            </View>
          }
        />
      )}

      <FiltersSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        onApply={setFilters}
        filters={filters}
        propertyTypes={propertyTypes}
        purposes={purposes}
        colors={colors}
        isDark={isDark}
        surface={surface}
      />
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
    paddingBottom: 14,
  },
  headerCopy: { flex: 1, paddingRight: 12 },
  screenTitle: { fontSize: 30, fontWeight: "900", letterSpacing: -0.6 },
  screenSub: { fontSize: 13, marginTop: 2, fontWeight: "400" },
  headerAvatar: { width: 42, height: 42, borderRadius: 21 },
  headerDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },
  searchFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 14,
  },
  searchBox: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  searchInput: { flex: 1, minWidth: 0, fontSize: 13, paddingVertical: 0 },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterCountBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  filterCountText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  resultsCount: { fontSize: 13, fontWeight: "800" },
  clearFiltersText: { fontSize: 12, fontWeight: "800" },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  columnWrapper: { justifyContent: "space-between", marginBottom: 14 },
  card: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  imageWrap: { height: 125, position: "relative" },
  image: { width: "100%", height: "100%" },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  typeBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  typeBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  purposeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  purposeBadgeText: {
    color: "#334155",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  body: { padding: 10 },
  priceRow: { fontSize: 15, fontWeight: "900" },
  rateSuffix: { fontSize: 11, fontWeight: "500", color: "#64748B" },
  title: { fontSize: 12, fontWeight: "700", marginTop: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  meta: { flex: 1, fontSize: 11 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 8,
  },
  emptyCopy: { fontSize: 12, textAlign: "center", marginTop: 6 },
  retry: {
    marginTop: 14,
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  filterSheet: {
    height: "88%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 72,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C7D0DC",
    marginTop: 12,
    marginBottom: 12,
  },
  sheetHeader: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: { flex: 1, fontSize: 21, fontWeight: "900" },
  resetText: { fontSize: 15, fontWeight: "800" },
  sheetScroll: { flex: 1 },
  sheetContent: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 24 },
  filterSection: { marginTop: 26 },
  filterSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  filterSectionTrailing: { fontSize: 11, fontWeight: "600" },
  filterChipGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipText: { fontSize: 13, fontWeight: "700" },
  priceInputsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  priceInputWrap: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 66,
  },
  priceInputLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  priceInputLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  nairaSymbol: { fontSize: 15, fontWeight: "800" },
  priceInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: "800",
    padding: 0,
  },
  priceDivider: {
    width: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 18,
  },
  priceDividerDash: { fontSize: 17, fontWeight: "800" },
  priceErrorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 9,
  },
  locationField: { width: "100%" },
  locationInputWrap: {
    minHeight: 50,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  locationInput: { flex: 1, minWidth: 0, fontSize: 13, paddingVertical: 10 },
  suggestionList: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionText: { flex: 1, minWidth: 0, fontSize: 13, fontWeight: "600" },
  sheetFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 26,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  matchingWrap: { minWidth: 88 },
  matchingLabel: { fontSize: 11, fontWeight: "600" },
  matchingValue: { fontSize: 15, fontWeight: "900", marginTop: 2 },
  applyButton: {
    flex: 1,
    height: 56,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});
