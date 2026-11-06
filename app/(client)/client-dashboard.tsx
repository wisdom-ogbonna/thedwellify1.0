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
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const ALL = "All";

const SORT_OPTIONS = [
  "Newest",
  "Price: Low to High",
  "Price: High to Low",
] as const;

type SortOption = (typeof SORT_OPTIONS)[number];

const DEFAULT_FILTERS = {
  purpose: ALL,
  propertyType: ALL,
  location: "",
  minPrice: "",
  maxPrice: "",
  sort: "Newest" as SortOption,
};

type Filters = typeof DEFAULT_FILTERS;

const PROPERTY_TYPE_BADGES: Record<string, string> = {
  apartment: "APT",
  duplex: "DUPLEX",
  house: "HOUSE",
  land: "LAND",
  hotel: "HOTEL",
};

function getPropertyTypeBadge(type?: string | null): string {
  const key = type?.trim().toLowerCase() ?? "";
  if (PROPERTY_TYPE_BADGES[key]) return PROPERTY_TYPE_BADGES[key];
  return type ? type.trim().toUpperCase() : "PROPERTY";
}

function getPurposeBadge(purpose?: string | null, tag?: string | null): string {
  const purposeValue = purpose?.trim().toLowerCase() ?? "";
  const tagValue = tag?.trim().toLowerCase() ?? "";
  if (tagValue.includes("shortlet")) return "SHORTLET";
  if (purposeValue === "rent") return "RENT";
  if (purposeValue === "sale") return "SALE";
  return purposeLabel(purpose ?? undefined, tag ?? undefined).toUpperCase();
}

function formatNairaInput(value: string): string {
  if (!value) return "";
  return Number(value).toLocaleString("en-NG");
}

function normalizePriceValue(
  value: string | number | null | undefined,
): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function matchesFilters(item: PublicListing, filters: Filters): boolean {
  if (
    filters.purpose !== ALL &&
    item.purpose?.toLowerCase() !== filters.purpose.toLowerCase()
  ) {
    return false;
  }

  if (
    filters.propertyType !== ALL &&
    item.propertyType?.toLowerCase() !== filters.propertyType.toLowerCase()
  ) {
    return false;
  }

  const locationQuery = filters.location.trim().toLowerCase();
  if (locationQuery) {
    if (!item.location?.toLowerCase().includes(locationQuery)) return false;
  }

  const min = filters.minPrice ? Number(filters.minPrice) : null;
  if (min !== null && Number.isFinite(min)) {
    const itemPrice = normalizePriceValue(item.price);
    if (itemPrice == null || itemPrice < min) return false;
  }

  const max = filters.maxPrice ? Number(filters.maxPrice) : null;
  if (max !== null && Number.isFinite(max)) {
    const itemPrice = normalizePriceValue(item.price);
    if (itemPrice == null || itemPrice > max) return false;
  }

  return true;
}

function sortListings(
  items: PublicListing[],
  sort: SortOption,
): PublicListing[] {
  if (sort === "Price: Low to High") {
    return [...items].sort((a, b) => {
      const aPrice = normalizePriceValue(a.price) ?? Number.MAX_SAFE_INTEGER;
      const bPrice = normalizePriceValue(b.price) ?? Number.MAX_SAFE_INTEGER;
      return aPrice - bPrice;
    });
  }
  if (sort === "Price: High to Low") {
    return [...items].sort((a, b) => {
      const aPrice = normalizePriceValue(a.price) ?? -1;
      const bPrice = normalizePriceValue(b.price) ?? -1;
      return bPrice - aPrice;
    });
  }
  return items;
}

function isFiltersActive(filters: Filters): boolean {
  return (
    filters.purpose !== ALL ||
    filters.propertyType !== ALL ||
    !!filters.location.trim() ||
    !!filters.minPrice ||
    !!filters.maxPrice ||
    filters.sort !== DEFAULT_FILTERS.sort
  );
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

function LocationField({
  value,
  onChange,
  suggestions,
  colors,
  borderColor,
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  colors: any;
  borderColor: string;
}) {
  const [focused, setFocused] = useState(false);

  const filteredSuggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return suggestions.slice(0, 8);
    return suggestions
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, 8);
  }, [value, suggestions]);

  const showSuggestions = focused && filteredSuggestions.length > 0;

  return (
    <View>
      <View
        style={[
          styles.locationInputWrap,
          { borderColor, backgroundColor: colors.disabled + "12" },
        ]}
      >
        <Ionicons name="search-outline" size={17} color={colors.placeholder} />
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search location or area..."
          placeholderTextColor={colors.placeholder}
          style={[styles.locationInput, { color: colors.text }]}
          autoCorrect={false}
          autoCapitalize="words"
        />
        {!!value && (
          <Pressable onPress={() => onChange("")} hitSlop={8}>
            <Ionicons
              name="close-circle"
              size={17}
              color={colors.placeholder}
            />
          </Pressable>
        )}
      </View>

      {showSuggestions && (
        <View
          style={[
            styles.suggestionList,
            { borderColor, backgroundColor: colors.disabled + "08" },
          ]}
        >
          {filteredSuggestions.map((item) => {
            const selected = item.toLowerCase() === value.trim().toLowerCase();
            return (
              <Pressable
                key={item}
                onPress={() => {
                  onChange(item);
                  setFocused(false);
                }}
                style={[
                  styles.suggestionItem,
                  selected && { backgroundColor: colors.primary + "14" },
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={15}
                  color={selected ? colors.primary : colors.placeholder}
                />
                <Text
                  style={[
                    styles.suggestionText,
                    { color: selected ? colors.primary : colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {item}
                </Text>
                {selected && (
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function FiltersSheet({
  visible,
  onClose,
  onApply,
  filters,
  allListings,
  propertyTypes,
  locations,
  purposes,
  colors,
  isDark,
  surface,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
  filters: Filters;
  allListings: PublicListing[];
  propertyTypes: string[];
  locations: string[];
  purposes: string[];
  colors: any;
  isDark: boolean;
  surface: string;
}) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<Filters>(filters);
  const borderColor = isDark ? "#292D36" : "#E8ECF2";

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    setDraft(DEFAULT_FILTERS);
  };

  const priceError = useMemo(() => {
    if (!draft.minPrice || !draft.maxPrice) return "";
    const min = Number(draft.minPrice);
    const max = Number(draft.maxPrice);
    if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
      return "Minimum price cannot exceed maximum price.";
    }
    return "";
  }, [draft.minPrice, draft.maxPrice]);

  const matchingCount = useMemo(() => {
    if (priceError) return 0;
    return allListings.filter((item) => matchesFilters(item, draft)).length;
  }, [allListings, draft, priceError]);

  const apply = () => {
    if (priceError) return;
    onApply(draft);
    onClose();
  };

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

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoider}
        >
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
              <FilterSection title="Listing purpose" colors={colors}>
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

              <FilterSection title="Property type" colors={colors}>
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
                title="Price range"
                trailing="Nigerian naira"
                colors={colors}
              >
                <View style={styles.priceInputsRow}>
                  <View
                    style={[
                      styles.priceInputWrap,
                      {
                        borderColor: priceError ? "#EF4444" : borderColor,
                        backgroundColor: colors.disabled + "12",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priceInputLabel,
                        { color: colors.placeholder },
                      ]}
                    >
                      Minimum price
                    </Text>
                    <View style={styles.priceInputLine}>
                      <Text
                        style={[
                          styles.nairaSymbol,
                          { color: colors.placeholder },
                        ]}
                      >
                        ₦
                      </Text>
                      <TextInput
                        value={formatNairaInput(draft.minPrice)}
                        onChangeText={(value) =>
                          update("minPrice", value.replace(/[^0-9]/g, ""))
                        }
                        keyboardType="numeric"
                        placeholder="Any"
                        placeholderTextColor={colors.placeholder}
                        style={[styles.priceInput, { color: colors.text }]}
                      />
                    </View>
                  </View>

                  <View
                    style={[
                      styles.priceInputWrap,
                      {
                        borderColor: priceError ? "#EF4444" : borderColor,
                        backgroundColor: colors.disabled + "12",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priceInputLabel,
                        { color: colors.placeholder },
                      ]}
                    >
                      Maximum price
                    </Text>
                    <View style={styles.priceInputLine}>
                      <Text
                        style={[
                          styles.nairaSymbol,
                          { color: colors.placeholder },
                        ]}
                      >
                        ₦
                      </Text>
                      <TextInput
                        value={formatNairaInput(draft.maxPrice)}
                        onChangeText={(value) =>
                          update("maxPrice", value.replace(/[^0-9]/g, ""))
                        }
                        keyboardType="numeric"
                        placeholder="Any"
                        placeholderTextColor={colors.placeholder}
                        style={[styles.priceInput, { color: colors.text }]}
                      />
                    </View>
                  </View>
                </View>
                {!!priceError && (
                  <Text style={styles.priceErrorText}>{priceError}</Text>
                )}
              </FilterSection>

              <FilterSection title="Location / area" colors={colors}>
                <LocationField
                  value={draft.location}
                  onChange={(value) => update("location", value)}
                  suggestions={locations}
                  colors={colors}
                  borderColor={borderColor}
                />
              </FilterSection>

              <FilterSection title="Sort by" colors={colors}>
                {SORT_OPTIONS.map((sort) => (
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

            <View
              style={[
                styles.sheetFooter,
                {
                  borderTopColor: borderColor,
                  paddingBottom: Math.max(insets.bottom, 18),
                },
              ]}
            >
              <View style={styles.matchingWrap}>
                <Text
                  style={[styles.matchingLabel, { color: colors.placeholder }]}
                >
                  Matching
                </Text>
                <Text style={[styles.matchingValue, { color: colors.text }]}>
                  {matchingCount}{" "}
                  {matchingCount === 1 ? "property" : "properties"}
                </Text>
              </View>

              <Pressable
                onPress={apply}
                disabled={!!priceError}
                style={({ pressed }) => [
                  styles.applyButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: priceError ? 0.5 : pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Text style={styles.applyButtonText}>Apply filters</Text>
                <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
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

  const locations = useMemo(
    () =>
      Array.from(
        new Set(
          listings
            .map((item) => item.location?.trim())
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
    const normalizedSearch = search.trim().toLowerCase();
    let result = listings.filter((item) => matchesFilters(item, filters));

    if (normalizedSearch) {
      result = result.filter((item) =>
        [item.title, item.location, item.propertyType, item.tag, item.purpose]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch),
          ),
      );
    }

    return sortListings(result, filters.sort);
  }, [listings, search, filters]);

  const activeFilterCount = [
    filters.purpose !== ALL,
    filters.propertyType !== ALL,
    !!filters.location.trim(),
    !!filters.minPrice || !!filters.maxPrice,
    filters.sort !== DEFAULT_FILTERS.sort,
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
    const typeLabel = getPropertyTypeBadge(item.propertyType);
    const purposeBadgeLabel = getPurposeBadge(item.purpose, item.tag);

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
            <Text style={styles.typeBadgeText}>{typeLabel}</Text>
          </View>

          <View style={styles.purposeBadge}>
            <Text style={styles.purposeBadgeText}>{purposeBadgeLabel}</Text>
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
            placeholder="Search properties or locations..."
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
        {(isFiltersActive(filters) || !!search) && (
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
        allListings={listings}
        propertyTypes={propertyTypes}
        locations={locations}
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
  keyboardAvoider: { justifyContent: "flex-end" },
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
  filterSection: { marginTop: 24 },
  filterSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  filterSectionTrailing: { fontSize: 11, fontWeight: "600" },
  filterChipGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipText: { fontSize: 13, fontWeight: "700" },
  priceInputsRow: { flexDirection: "row", gap: 10 },
  priceInputWrap: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 13,
    padding: 11,
  },
  priceInputLabel: { fontSize: 11, fontWeight: "700", marginBottom: 7 },
  priceInputLine: { flexDirection: "row", alignItems: "center", gap: 5 },
  nairaSymbol: { fontSize: 15, fontWeight: "800" },
  priceInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: "700",
    padding: 0,
  },
  priceErrorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
  locationInputWrap: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  locationInput: { flex: 1, minWidth: 0, fontSize: 13, paddingVertical: 10 },
  suggestionList: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 13,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  suggestionText: { flex: 1, minWidth: 0, fontSize: 13, fontWeight: "600" },
  sheetFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 14,
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
