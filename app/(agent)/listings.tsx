import { useModal } from "@/components/dialogs/popup-modal";
import {
  OptimizedImage,
  listingCoverUrl,
} from "@/components/optimized-image";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  deleteProduct,
  fetchMyProducts,
  formatPropertyPrice,
  periodLabel,
  purposeLabel,
  type Property,
} from "@/services/productApi";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import {
  ArrowUpDown,
  Bath,
  BedDouble,
  Building2,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Ruler,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabKey = "All" | "Sale" | "Rent" | "Inactive";
type SortKey = "newest" | "price_high" | "price_low" | "title";

const PAGE_SIZE = 12;
const { width: SCREEN_W } = Dimensions.get("window");
const CARD_IMAGE_H = Math.min(200, Math.round(SCREEN_W * 0.48));

const softBorder = (colors: typeof Colors.light) => `${colors.placeholder}28`;

const SkeletonCard = ({ colors }: { colors: typeof Colors.light }) => (
  <View
    style={{
      marginBottom: 16,
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: softBorder(colors),
      backgroundColor: colors.card,
    }}
  >
    <View style={{ height: CARD_IMAGE_H, backgroundColor: `${colors.placeholder}22` }} />
    <View style={{ padding: 14, gap: 10 }}>
      <View style={{ height: 16, width: "72%", borderRadius: 8, backgroundColor: `${colors.placeholder}22` }} />
      <View style={{ height: 12, width: "48%", borderRadius: 8, backgroundColor: `${colors.placeholder}18` }} />
      <View style={{ height: 14, width: "40%", borderRadius: 8, backgroundColor: `${colors.placeholder}22` }} />
      <View style={{ height: 36, borderRadius: 12, backgroundColor: `${colors.placeholder}14`, marginTop: 4 }} />
    </View>
  </View>
);

const EmptyState = ({
  colors,
  title,
  subtitle,
  onAdd,
}: {
  colors: typeof Colors.light;
  title: string;
  subtitle: string;
  onAdd: () => void;
}) => (
  <View style={{ alignItems: "center", paddingHorizontal: 28, paddingVertical: 56 }}>
    <View
      style={{
        width: 72,
        height: 72,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        backgroundColor: `${colors.primary}12`,
      }}
    >
      <Building2 size={32} color={colors.primary} />
    </View>
    <Text style={{ fontSize: 18, fontWeight: "800", textAlign: "center", color: colors.text, marginBottom: 6 }}>
      {title}
    </Text>
    <Text style={{ fontSize: 13, textAlign: "center", lineHeight: 20, color: colors.placeholder, marginBottom: 20 }}>
      {subtitle}
    </Text>
    <TouchableOpacity
      onPress={onAdd}
      style={{
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colors.primary,
      }}
    >
      <Plus size={18} color="#FFF" strokeWidth={2.5} />
      <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 14 }}>Add property</Text>
    </TouchableOpacity>
  </View>
);

const ActionChip = ({
  label,
  icon,
  onPress,
  colors,
  tone = "neutral",
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  colors: typeof Colors.light;
  tone?: "neutral" | "primary" | "danger";
  disabled?: boolean;
}) => {
  const bg =
    tone === "primary"
      ? `${colors.primary}12`
      : tone === "danger"
        ? `${colors.error}12`
        : `${colors.placeholder}12`;
  const fg =
    tone === "primary"
      ? colors.primary
      : tone === "danger"
        ? colors.error
        : colors.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        flex: 1,
        minHeight: 40,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: bg,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {icon}
      <Text style={{ fontSize: 12, fontWeight: "700", color: fg }}>{label}</Text>
    </TouchableOpacity>
  );
};

const ListingCard = React.memo(
  ({
    item,
    colors,
    onDelete,
    deletingId,
  }: {
    item: Property;
    colors: typeof Colors.light;
    onDelete: (id: string, title: string) => void;
    deletingId: string | null;
  }) => {
    const tag = purposeLabel(item.purpose, item.propertyType);
    const period = periodLabel(item.purpose, item.propertyType);
    const status = item.status === "Inactive" ? "Inactive" : "Active";
    const beds = item.bedrooms ?? item.beds;
    const baths = item.bathrooms ?? item.baths;
    const isDeleting = deletingId === item.id;
    const cover = listingCoverUrl(item);

    const openView = () =>
      router.push({ pathname: "/(product)/[id]", params: { id: item.id } });
    const openEdit = () =>
      router.push({ pathname: "/(product)/edit", params: { id: item.id } });

    return (
      <View
        style={{
          marginBottom: 16,
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: softBorder(colors),
          backgroundColor: colors.background,
          opacity: isDeleting ? 0.55 : 1,
          shadowColor: "#0F172A",
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        }}
      >
        <Pressable onPress={openView} disabled={isDeleting}>
          <View style={{ height: CARD_IMAGE_H, backgroundColor: colors.card }}>
            {cover ? (
              <OptimizedImage
                uri={cover}
                recyclingKey={`listing-${item.id}`}
                style={{ width: "100%", height: CARD_IMAGE_H }}
                placeholderColor={colors.card}
              />
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Building2 size={36} color={colors.placeholder} />
              </View>
            )}

            <View
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: "rgba(8,136,255,0.92)",
              }}
            >
              <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "800" }}>{tag}</Text>
            </View>

            <View
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor:
                  status === "Active" ? "rgba(34,197,94,0.92)" : "rgba(100,116,139,0.9)",
              }}
            >
              <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "800" }}>{status}</Text>
            </View>

            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                paddingHorizontal: 14,
                paddingVertical: 12,
                backgroundColor: "rgba(10,10,10,0.45)",
              }}
            >
              <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "800" }}>
                {formatPropertyPrice(item.price)}
                {period ? (
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.8)" }}>
                    {period}
                  </Text>
                ) : null}
              </Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 }}>
            <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
              {item.title}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
              <MapPin size={13} color={colors.placeholder} />
              <Text
                numberOfLines={1}
                style={{ flex: 1, marginLeft: 4, fontSize: 12, color: colors.placeholder, fontWeight: "500" }}
              >
                {item.location || "Location not set"}
              </Text>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
              {item.propertyType ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Building2 size={13} color={colors.primary} />
                  <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: "600", color: colors.text }}>
                    {item.propertyType}
                  </Text>
                </View>
              ) : null}
              {beds != null && beds !== "" ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <BedDouble size={13} color={colors.primary} />
                  <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: "600", color: colors.text }}>
                    {beds} bed
                  </Text>
                </View>
              ) : null}
              {baths != null && baths !== "" ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Bath size={13} color={colors.primary} />
                  <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: "600", color: colors.text }}>
                    {baths} bath
                  </Text>
                </View>
              ) : null}
              {item.size != null && item.size !== "" ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ruler size={13} color={colors.primary} />
                  <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: "600", color: colors.text }}>
                    {item.size} sqm
                  </Text>
                </View>
              ) : null}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Eye size={13} color={colors.placeholder} />
                <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: "600", color: colors.placeholder }}>
                  {item.views ?? 0} views
                </Text>
              </View>
            </View>
          </View>
        </Pressable>

        <View
          style={{
            flexDirection: "row",
            gap: 8,
            paddingHorizontal: 14,
            paddingTop: 12,
            paddingBottom: 14,
          }}
        >
          <ActionChip
            label="View"
            icon={<Eye size={14} color={colors.text} />}
            onPress={openView}
            colors={colors}
            disabled={isDeleting}
          />
          <ActionChip
            label="Edit"
            icon={<Pencil size={14} color={colors.primary} />}
            onPress={openEdit}
            colors={colors}
            tone="primary"
            disabled={isDeleting}
          />
          <ActionChip
            label="Manage"
            icon={<Settings2 size={14} color={colors.primary} />}
            onPress={openEdit}
            colors={colors}
            tone="primary"
            disabled={isDeleting}
          />
          <ActionChip
            label="Delete"
            icon={
              isDeleting ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Trash2 size={14} color={colors.error} />
              )
            }
            onPress={() => onDelete(item.id, item.title)}
            colors={colors}
            tone="danger"
            disabled={isDeleting}
          />
        </View>
      </View>
    );
  }
);

ListingCard.displayName = "ListingCard";

export default function MyPropertiesScreen() {
  const { colors } = useTheme();
  const { showModal } = useModal();
  const [activeTab, setActiveTab] = useState<TabKey>("All");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const tabs: TabKey[] = ["All", "Sale", "Rent", "Inactive"];

  const loadListings = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const products = await fetchMyProducts();
      setListings(products);
      setVisibleCount(PAGE_SIZE);
    } catch (err: any) {
      console.log("Error fetching listings:", err?.response?.data || err?.message);
      setError(
        err?.response?.data?.error ||
          "Couldn't load your properties. Pull to refresh."
      );
      if (mode === "initial") setListings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadListings("initial");
    }, [loadListings])
  );

  const confirmDelete = useCallback(
    (id: string, title: string) => {
      showModal({
        type: "delete",
        title: "Delete property?",
        text: `"${title}" will be permanently removed, including photos and video. This cannot be undone.`,
        ctaText1: "Delete",
        ctaText2: "Cancel",
        onCta1: () => {
          void (async () => {
            setDeletingId(id);
            try {
              await deleteProduct(id);
              setListings((prev) => prev.filter((item) => item.id !== id));
            } catch (err: any) {
              showModal({
                type: "error",
                title: "Couldn't delete",
                text:
                  err?.response?.data?.error ||
                  "Please try again in a moment.",
                ctaText1: "Okay",
              });
            } finally {
              setDeletingId(null);
            }
          })();
        },
      });
    },
    [showModal]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let next = listings.filter((item) => {
      const purpose = String(item.purpose || "");
      const status = item.status === "Inactive" ? "Inactive" : "Active";

      let matchesTab = true;
      if (activeTab === "Sale") matchesTab = purpose === "Sale";
      else if (activeTab === "Rent") matchesTab = purpose === "Rent";
      else if (activeTab === "Inactive") matchesTab = status === "Inactive";

      const matchesSearch =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        item.propertyType?.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });

    next = [...next].sort((a, b) => {
      if (sortKey === "title") {
        return String(a.title || "").localeCompare(String(b.title || ""));
      }
      const pa = Number(a.price) || 0;
      const pb = Number(b.price) || 0;
      if (sortKey === "price_high") return pb - pa;
      if (sortKey === "price_low") return pa - pb;
      const ta =
        (a as any).created_at?.toMillis?.() ??
        (new Date((a as any).created_at || 0).getTime() || 0);
      const tb =
        (b as any).created_at?.toMillis?.() ??
        (new Date((b as any).created_at || 0).getTime() || 0);
      return tb - ta;
    });

    return next;
  }, [listings, activeTab, searchQuery, sortKey]);

  const paged = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  const cycleSort = () => {
    const order: SortKey[] = ["newest", "price_high", "price_low", "title"];
    const idx = order.indexOf(sortKey);
    setSortKey(order[(idx + 1) % order.length]);
  };

  const sortLabel =
    sortKey === "newest"
      ? "Newest"
      : sortKey === "price_high"
        ? "Price ↓"
        : sortKey === "price_low"
          ? "Price ↑"
          : "A–Z";

  const listHeader = (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingHorizontal: 4,
          marginBottom: 14,
        }}
      >
        <View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>
            My Properties
          </Text>
          {!loading && !error ? (
            <Text style={{ fontSize: 12, fontWeight: "500", marginTop: 3, color: colors.placeholder }}>
              {filtered.length} of {listings.length} listing
              {listings.length === 1 ? "" : "s"}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 16,
          paddingHorizontal: 12,
          height: 48,
          borderWidth: 1,
          marginBottom: 12,
          backgroundColor: colors.card,
          borderColor: softBorder(colors),
        }}
      >
        <Search size={18} color={colors.placeholder} />
        <TextInput
          placeholder="Search title, location, type…"
          placeholderTextColor={colors.placeholder}
          style={{ flex: 1, marginLeft: 8, fontSize: 14, fontWeight: "500", color: colors.text }}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setVisibleCount(PAGE_SIZE);
          }}
          returnKeyType="search"
        />
        {searchQuery ? (
          <Pressable
            onPress={() => {
              setSearchQuery("");
              setVisibleCount(PAGE_SIZE);
            }}
            hitSlop={8}
          >
            <X size={16} color={colors.placeholder} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 8 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 1, flexShrink: 1 }}
          contentContainerStyle={{ gap: 8, alignItems: "center" }}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => {
                  setActiveTab(tab);
                  setVisibleCount(PAGE_SIZE);
                }}
                style={{
                  paddingHorizontal: 14,
                  height: 36,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : softBorder(colors),
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: active ? "#FFF" : colors.text,
                  }}
                >
                  {tab === "All" ? "All" : tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          onPress={cycleSort}
          style={{
            height: 36,
            paddingHorizontal: 12,
            borderRadius: 999,
            borderWidth: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: colors.card,
            borderColor: softBorder(colors),
          }}
        >
          <ArrowUpDown size={14} color={colors.primary} />
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>{sortLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      {loading ? (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
          {listHeader}
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} colors={colors} />
          ))}
        </View>
      ) : (
        <FlatList
          data={error ? [] : paged}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListingCard
              item={item}
              colors={colors}
              onDelete={confirmDelete}
              deletingId={deletingId}
            />
          )}
          ListHeaderComponent={listHeader}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 110,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          // Virtualization — only mount near-viewport rows / images
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews
          updateCellsBatchingPeriod={50}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (visibleCount < filtered.length) {
              setVisibleCount((n) => Math.min(n + PAGE_SIZE, filtered.length));
            }
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadListings("refresh")}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            error ? (
              <View style={{ alignItems: "center", paddingHorizontal: 24, paddingVertical: 48 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 6 }}>
                  Something went wrong
                </Text>
                <Text style={{ fontSize: 13, textAlign: "center", color: colors.placeholder, marginBottom: 16 }}>
                  {error}
                </Text>
                <TouchableOpacity
                  onPress={() => loadListings("initial")}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: colors.primary,
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <EmptyState
                colors={colors}
                title={listings.length === 0 ? "No properties yet" : "No matches"}
                subtitle={
                  listings.length === 0
                    ? "Create your first listing to start attracting clients."
                    : "Try another filter or clear your search."
                }
                onAdd={() => router.push("/(product)/create")}
              />
            )
          }
          ListFooterComponent={
            !error && visibleCount < filtered.length ? (
              <View style={{ paddingVertical: 12, alignItems: "center" }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <View style={{ height: 8 }} />
            )
          }
        />
      )}

      <View style={{ position: "absolute", left: 16, right: 16, bottom: 20 }}>
        <TouchableOpacity
          onPress={() => router.push("/(product)/create")}
          activeOpacity={0.9}
          style={{
            height: 54,
            borderRadius: 16,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.28,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "800" }}>Add New Listing</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
