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

const TYPES = [
  "All Types",
  "Apartment",
  "House",
  "Land",
  "Duplex",
  "Hotel",
] as const;

const SORT_OPTIONS = [
  "Default",
  "Price: Low to High",
  "Price: High to Low",
] as const;

const ALL_LOCATIONS = "All Locations";

// ─── Shared bottom-sheet pieces ─────────────────────────────────────────────

type SheetTheme = {
  colors: any;
  isDark: boolean;
  surface: string;
};

function OptionSheet({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  colors,
  isDark,
  surface,
}: SheetTheme & {
  visible: boolean;
  title: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: surface,
              borderColor: isDark ? "#2A2A2A" : "#EBEBEF",
            },
          ]}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.placeholder} />
            </Pressable>
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => item}
            style={{ maxHeight: 360 }}
            renderItem={({ item }) => {
              const active = item === selectedValue;

              return (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  style={[
                    styles.sheetRow,
                    { borderBottomColor: isDark ? "#242424" : "#F0F0F3" },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.sheetRowText,
                      { color: active ? colors.primary : colors.text },
                      active && { fontWeight: "800" },
                    ]}
                  >
                    {item}
                  </Text>
                  {active && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

function PriceSheet({
  visible,
  minValue,
  maxValue,
  onApply,
  onClear,
  onClose,
  colors,
  isDark,
  surface,
}: SheetTheme & {
  visible: boolean;
  minValue: string;
  maxValue: string;
  onApply: (min: string, max: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [min, setMin] = useState(minValue);
  const [max, setMax] = useState(maxValue);

  // Re-sync the draft fields whenever the sheet is (re)opened, so it always
  // reflects whatever was last applied rather than stale typing.
  useEffect(() => {
    if (visible) {
      setMin(minValue);
      setMax(maxValue);
    }
  }, [visible, minValue, maxValue]);

  const borderColor = isDark ? "#2A2A2A" : "#EBEBEF";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: surface, borderColor }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              Price range
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.placeholder} />
            </Pressable>
          </View>

          <View style={styles.priceInputsRow}>
            <View style={[styles.priceInputWrap, { borderColor }]}>
              <Text
                style={[styles.priceInputLabel, { color: colors.placeholder }]}
              >
                Min (₦)
              </Text>
              <TextInput
                value={min}
                onChangeText={setMin}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.placeholder}
                style={[styles.priceInput, { color: colors.text }]}
              />
            </View>

            <View style={[styles.priceInputWrap, { borderColor }]}>
              <Text
                style={[styles.priceInputLabel, { color: colors.placeholder }]}
              >
                Max (₦)
              </Text>
              <TextInput
                value={max}
                onChangeText={setMax}
                keyboardType="numeric"
                placeholder="Any"
                placeholderTextColor={colors.placeholder}
                style={[styles.priceInput, { color: colors.text }]}
              />
            </View>
          </View>

          <View style={styles.sheetActions}>
            <Pressable
              onPress={() => {
                onClear();
                onClose();
              }}
              style={[styles.sheetSecondaryBtn, { borderColor }]}
            >
              <Text
                style={[styles.sheetSecondaryBtnText, { color: colors.text }]}
              >
                Clear
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onApply(min, max);
                onClose();
              }}
              style={[
                styles.sheetPrimaryBtn,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.sheetPrimaryBtnText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const { colors, isDark } = useTheme();
  const { isOnline } = useAuth();
  const surface = isDark ? "#121212" : "#FFFFFF";

  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedType, setSelectedType] = useState<string>("All Types");
  const [locationFilter, setLocationFilter] = useState<string>(ALL_LOCATIONS);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortOption, setSortOption] = useState<string>("Default");

  const [typeSheetVisible, setTypeSheetVisible] = useState(false);
  const [locationSheetVisible, setLocationSheetVisible] = useState(false);
  const [priceSheetVisible, setPriceSheetVisible] = useState(false);
  const [sortSheetVisible, setSortSheetVisible] = useState(false);

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

  // Location options are derived from whatever is actually in the current
  // listings, so the filter never goes stale against a hard-coded list.
  const locationOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        listings
          .map((item) => item.location)
          .filter((loc): loc is string => !!loc),
      ),
    );

    return [ALL_LOCATIONS, ...unique];
  }, [listings]);

  const visibleListings = useMemo(() => {
    let result = listings;

    if (selectedType !== "All Types") {
      result = result.filter(
        (item) =>
          item.propertyType?.toLowerCase() === selectedType.toLowerCase(),
      );
    }

    if (locationFilter !== ALL_LOCATIONS) {
      result = result.filter((item) => item.location === locationFilter);
    }

    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;

    if (min !== null && !Number.isNaN(min)) {
      result = result.filter((item) => (item.price ?? 0) >= min);
    }

    if (max !== null && !Number.isNaN(max)) {
      result = result.filter((item) => (item.price ?? 0) <= max);
    }

    if (sortOption === "Price: Low to High") {
      result = [...result].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (sortOption === "Price: High to Low") {
      result = [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    }

    return result;
  }, [listings, selectedType, locationFilter, minPrice, maxPrice, sortOption]);

  const isLocationActive = locationFilter !== ALL_LOCATIONS;
  const isPriceActive = !!minPrice || !!maxPrice;
  const isSortActive = sortOption !== "Default";

  const priceLabel = useMemo(() => {
    const format = (value: string) => {
      const n = Number(value);
      return value && !Number.isNaN(n) ? n.toLocaleString("en-NG") : null;
    };

    const minLabel = format(minPrice);
    const maxLabel = format(maxPrice);

    if (!minLabel && !maxLabel) return "Price";
    return `${minLabel ?? "0"} - ${maxLabel ?? "Any"}`;
  }, [minPrice, maxPrice]);

  const openListing = (item: PublicListing) => {
    router.navigate({
      pathname: "/(utilities)/property-details",
      params: { propertyId: item.id },
    });
  };

  const getTypeIcon = (type?: string) => {
    const t = type?.toLowerCase() || "";
    if (t.includes("apartment")) return "business-outline";
    if (t.includes("hotel")) return "bed-outline";
    if (t.includes("house")) return "home-outline";
    if (t.includes("land")) return "grid-outline";
    if (t.includes("duplex")) return "home-outline";
    return "home-outline";
  };

  const renderCard = ({ item }: { item: PublicListing }) => {
    const image = item.images?.[0];
    const typeLabel = (item.propertyType || "PROPERTY").toUpperCase();
    const tagLabel = purposeLabel(item.purpose, item.tag).toUpperCase();

    // Determine rate suffix if applicable
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
        style={[
          styles.card,
          {
            backgroundColor: surface,
            borderColor: isDark ? "#2A2A2A" : "#F0F0F3",
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

          {/* Type Badge (Top Left) */}
          <View style={[styles.typeBadge, { backgroundColor: colors.primary }]}>
            <Ionicons
              name={getTypeIcon(item.propertyType)}
              size={11}
              color="#FFF"
              style={{ marginRight: 3 }}
            />
            <Text style={styles.typeBadgeText}>{typeLabel}</Text>
          </View>

          {/* Purpose Badge (Top Right) */}
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
      {/* Header */}
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

      {/* Filter Row */}
      <View style={styles.filters}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {/* Type Pill */}
          <Pressable
            onPress={() => setTypeSheetVisible(true)}
            style={[
              styles.chip,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: "#FFF" }]}>
              {selectedType}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#FFF" />
          </Pressable>

          {/* Location Pill */}
          <Pressable
            onPress={() => setLocationSheetVisible(true)}
            style={[
              styles.chip,
              {
                backgroundColor: surface,
                borderColor: isLocationActive
                  ? colors.primary
                  : isDark
                    ? "#2A2A2A"
                    : "#EBEBEF",
              },
            ]}
          >
            <Ionicons
              name="location-outline"
              size={14}
              color={colors.primary}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.chipText,
                { color: isLocationActive ? colors.primary : colors.text },
              ]}
            >
              {isLocationActive ? locationFilter : "Location"}
            </Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={isLocationActive ? colors.primary : colors.placeholder}
            />
          </Pressable>

          {/* Price Pill */}
          <Pressable
            onPress={() => setPriceSheetVisible(true)}
            style={[
              styles.chip,
              {
                backgroundColor: surface,
                borderColor: isPriceActive
                  ? colors.primary
                  : isDark
                    ? "#2A2A2A"
                    : "#EBEBEF",
              },
            ]}
          >
            <Text style={styles.nairaSymbol}>₦</Text>
            <Text
              numberOfLines={1}
              style={[
                styles.chipText,
                { color: isPriceActive ? colors.primary : colors.text },
              ]}
            >
              {priceLabel}
            </Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={isPriceActive ? colors.primary : colors.placeholder}
            />
          </Pressable>

          {/* Sort Button */}
          <Pressable
            onPress={() => setSortSheetVisible(true)}
            style={[
              styles.iconChip,
              {
                backgroundColor: surface,
                borderColor: isSortActive
                  ? colors.primary
                  : isDark
                    ? "#2A2A2A"
                    : "#EBEBEF",
              },
            ]}
          >
            <Ionicons name="swap-vertical" size={16} color={colors.primary} />
          </Pressable>
        </ScrollView>
      </View>

      {/* Main Grid Content */}
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
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No properties found
              </Text>
              <Text style={[styles.emptyCopy, { color: colors.placeholder }]}>
                Try a different search or filter.
              </Text>
            </View>
          }
        />
      )}

      <OptionSheet
        visible={typeSheetVisible}
        title="Property type"
        options={[...TYPES]}
        selectedValue={selectedType}
        onSelect={setSelectedType}
        onClose={() => setTypeSheetVisible(false)}
        colors={colors}
        isDark={isDark}
        surface={surface}
      />

      <OptionSheet
        visible={locationSheetVisible}
        title="Location"
        options={locationOptions}
        selectedValue={locationFilter}
        onSelect={setLocationFilter}
        onClose={() => setLocationSheetVisible(false)}
        colors={colors}
        isDark={isDark}
        surface={surface}
      />

      <OptionSheet
        visible={sortSheetVisible}
        title="Sort by"
        options={[...SORT_OPTIONS]}
        selectedValue={sortOption}
        onSelect={setSortOption}
        onClose={() => setSortSheetVisible(false)}
        colors={colors}
        isDark={isDark}
        surface={surface}
      />

      <PriceSheet
        visible={priceSheetVisible}
        minValue={minPrice}
        maxValue={maxPrice}
        onApply={(min, max) => {
          setMinPrice(min);
          setMaxPrice(max);
        }}
        onClear={() => {
          setMinPrice("");
          setMaxPrice("");
        }}
        onClose={() => setPriceSheetVisible(false)}
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
    paddingBottom: 12,
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
  filters: { marginBottom: 12 },
  filterRow: { paddingHorizontal: 20, gap: 8 },
  chip: {
    height: 38,
    maxWidth: 170,
    paddingHorizontal: 14,
    borderRadius: 19,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontSize: 13, fontWeight: "700", flexShrink: 1 },
  nairaSymbol: { fontSize: 13, fontWeight: "800", color: "#0284C7" },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 14,
  },
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
    color: "#FFF",
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
  emptyTitle: { fontSize: 16, fontWeight: "800", textAlign: "center" },
  emptyCopy: { fontSize: 12, textAlign: "center", marginTop: 6 },
  retry: {
    marginTop: 14,
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: { color: "#FFF", fontWeight: "800", fontSize: 12 },

  // ─── Filter sheets ────────────────────────────────────────────────────────
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sheetTitle: { fontSize: 16, fontWeight: "800" },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetRowText: { fontSize: 14, fontWeight: "600", flex: 1, paddingRight: 12 },
  priceInputsRow: { flexDirection: "row", gap: 12, marginTop: 10 },
  priceInputWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  priceInputLabel: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  priceInput: { fontSize: 16, fontWeight: "700", padding: 0 },
  sheetActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  sheetPrimaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetPrimaryBtnText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  sheetSecondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetSecondaryBtnText: { fontWeight: "800", fontSize: 14 },
});
