import ShareListingSheet from "@/components/listings/share-listing-sheet";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { formatPrice, purposeLabel } from "@/constants/listings";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { agentApi } from "@/services/agent";
import { chatApi } from "@/services/chat";
import { listingsApi, type PublicListing } from "@/services/listings";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PURPOSES = [
  { id: "All", label: "All" },
  { id: "Sale", label: "For sale" },
  { id: "Rent", label: "For rent" },
] as const;

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "price_asc", label: "Lowest price" },
  { id: "price_desc", label: "Highest price" },
] as const;

const callAgent = (phone?: string) => {
  const number = String(phone || "").trim();
  if (!number) {
    Alert.alert("No phone number", "This agent has not added a phone number yet.");
    return;
  }
  Linking.openURL(`tel:${number}`);
};

export default function ExploreScreen() {
  const { colors, isDark } = useTheme();
  const { isOnline, user } = useAuth();
  const surface = isDark ? "#121212" : "#FFFFFF";
  const chipBg = isDark ? "#1A1A1A" : "#F4F4F5";

  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [purpose, setPurpose] = useState<(typeof PURPOSES)[number]["id"]>("All");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("newest");
  const [shareItem, setShareItem] = useState<PublicListing | null>(null);
  const [chatBusy, setChatBusy] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const { products } = await listingsApi.explore({
        purpose: purpose === "All" ? undefined : purpose,
        sort,
      });
      setListings(products);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Could not load properties.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [purpose, sort]);

  useFocusEffect(
    useCallback(() => {
      load();
      agentApi
        .profile()
        .then(setProfile)
        .catch(() => undefined);
    }, [load]),
  );

  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((item) => {
      const hay = [
        item.title,
        item.location,
        item.propertyType,
        item.agent?.name,
        item.agent?.agencyName,
        item.agent?.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [listings, searchQuery]);

  const openListing = (item: PublicListing) => {
    router.push({
      pathname: "/(utilities)/property-view",
      params: { propertyId: item.id },
    });
  };

  const chatAgent = async (item: PublicListing) => {
    const peerId = item.agent?.id || item.agentId;
    if (!peerId || peerId === user?.uid || item.mine) {
      Alert.alert("That's your listing", "Share it with a contact instead.");
      return;
    }
    try {
      setChatBusy(item.id);
      const started = await chatApi.startPeer(peerId);
      router.push({
        pathname: "/(utilities)/chats",
        params: { id: started.id, peerAgentId: peerId },
      });
    } catch (err: any) {
      Alert.alert(
        "Could not start chat",
        err?.response?.data?.error || "Try again in a moment.",
      );
    } finally {
      setChatBusy("");
    }
  };

  const renderCard = ({ item }: { item: PublicListing }) => {
    const image = item.images?.[0];
    const mine = Boolean(item.mine || (user?.uid && item.agentId === user.uid));
    const phone = item.agent?.phone;
    const locationLine = [item.location, item.agent?.address]
      .filter(Boolean)
      .filter((value, index, all) => all.indexOf(value) === index)
      .join(" · ");

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: surface, borderColor: isDark ? "#2A2A2A" : "#E7E7EA" },
        ]}
      >
        <Pressable onPress={() => openListing(item)}>
          <View style={styles.imageWrap}>
            {image ? (
              <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
            ) : (
              <View
                style={[
                  styles.image,
                  styles.imageFallback,
                  { backgroundColor: colors.disabled + "33" },
                ]}
              >
                <Ionicons name="image-outline" size={28} color={colors.placeholder} />
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
              <Text style={styles.badgeText}>
                {purposeLabel(item.purpose, item.tag)}
              </Text>
            </View>
            {mine ? (
              <View style={styles.mineChip}>
                <Text style={styles.mineText}>Yours</Text>
              </View>
            ) : null}
          </View>
        </Pressable>

        <View style={styles.body}>
          <Text style={[styles.price, { color: colors.primary }]}>
            {item.price ? formatPrice(item.price) : "Price on request"}
          </Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {item.title || item.propertyType || "Untitled property"}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text
              style={[styles.meta, { color: colors.placeholder }]}
              numberOfLines={2}
            >
              {locationLine || "Location not added"}
            </Text>
          </View>

          <View style={styles.pills}>
            {item.bedrooms != null ? (
              <View style={[styles.pill, { backgroundColor: chipBg }]}>
                <Ionicons name="bed-outline" size={14} color={colors.placeholder} />
                <Text style={[styles.pillText, { color: colors.placeholder }]}>
                  {item.bedrooms} beds
                </Text>
              </View>
            ) : null}
            {item.bathrooms != null ? (
              <View style={[styles.pill, { backgroundColor: chipBg }]}>
                <Ionicons name="water-outline" size={14} color={colors.placeholder} />
                <Text style={[styles.pillText, { color: colors.placeholder }]}>
                  {item.bathrooms} baths
                </Text>
              </View>
            ) : null}
            {item.size ? (
              <View style={[styles.pill, { backgroundColor: chipBg }]}>
                <Ionicons name="resize-outline" size={14} color={colors.placeholder} />
                <Text style={[styles.pillText, { color: colors.placeholder }]}>
                  {item.size}
                </Text>
              </View>
            ) : null}
            {item.propertyType ? (
              <View style={[styles.pill, { backgroundColor: chipBg }]}>
                <Text style={[styles.pillText, { color: colors.placeholder }]}>
                  {item.propertyType}
                </Text>
              </View>
            ) : null}
          </View>

          <View
            style={[
              styles.agentRow,
              { borderTopColor: isDark ? "#2A2A2A" : "#ECECEE" },
            ]}
          >
            {item.agent?.avatar ? (
              <Image source={{ uri: item.agent.avatar }} style={styles.agentAvatar} />
            ) : (
              <View style={[styles.agentAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.letter}>
                  {(item.agent?.name || "A").slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.agentCopy}>
              <Text style={[styles.agentName, { color: colors.text }]} numberOfLines={1}>
                {item.agent?.name || "Listing agent"}
              </Text>
              <Text
                style={[styles.agentMeta, { color: colors.placeholder }]}
                numberOfLines={1}
              >
                {item.agent?.agencyName || "Independent agent"}
              </Text>
              {phone ? (
                <Text
                  style={[styles.phone, { color: colors.success }]}
                  numberOfLines={1}
                >
                  {phone}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => callAgent(phone)}
              style={[styles.actionBtn, { backgroundColor: chipBg }]}
            >
              <Ionicons name="call-outline" size={18} color={colors.success} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>Call</Text>
            </Pressable>
            <Pressable
              onPress={() => chatAgent(item)}
              disabled={mine || chatBusy === item.id}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: mine ? chipBg : colors.primary,
                  opacity: mine ? 0.45 : 1,
                },
              ]}
            >
              {chatBusy === item.id ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={18}
                    color={mine ? colors.placeholder : "#fff"}
                  />
                  <Text
                    style={[
                      styles.actionLabel,
                      { color: mine ? colors.placeholder : "#fff" },
                    ]}
                  >
                    Chat
                  </Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={() => setShareItem(item)}
              style={[styles.actionBtn, { backgroundColor: chipBg }]}
            >
              <Ionicons name="share-outline" size={18} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>Share</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const sortLabel = SORTS.find((item) => item.id === sort)?.label || "Newest";

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
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={() => router.push("/(utilities)/agent-profile")}>
            <Image
              source={{
                uri:
                  profile?.avatar ||
                  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300",
              }}
              style={[styles.headerAvatar, { borderColor: colors.success }]}
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
          </Pressable>
          <NotificationBell
            color={colors.text}
            size={20}
            style={[
              styles.bell,
              {
                backgroundColor: surface,
                borderColor: isDark ? "#2A2A2A" : "#E7E7EA",
              },
            ]}
          />
        </View>
      </View>
      <Text style={[styles.screenSub, { color: colors.placeholder, paddingHorizontal: 20, paddingBottom: 12 }]}>
            Every agent listing — call, chat, or share to your contacts.
          </Text>

      <View
        style={[
          styles.search,
          {
            backgroundColor: surface,
            borderColor: isDark ? "#2A2A2A" : "#E7E7EA",
          },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={colors.placeholder} />
        <TextInput
          placeholder="Search title, location or agent"
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <View style={styles.filters}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {PURPOSES.map((item) => {
            const active = purpose === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setPurpose(item.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : surface,
                    borderColor: active
                      ? colors.primary
                      : isDark
                        ? "#2A2A2A"
                        : "#E7E7EA",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? "#fff" : colors.text },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => {
              const index = SORTS.findIndex((item) => item.id === sort);
              setSort(SORTS[(index + 1) % SORTS.length].id);
            }}
            style={[
              styles.chip,
              {
                backgroundColor: surface,
                borderColor: isDark ? "#2A2A2A" : "#E7E7EA",
              },
            ]}
          >
            <Ionicons name="swap-vertical" size={14} color={colors.primary} />
            <Text style={[styles.chipText, { color: colors.text }]}>
              {sortLabel}
            </Text>
          </Pressable>
        </ScrollView>
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
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
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

      <ShareListingSheet
        visible={Boolean(shareItem)}
        productId={shareItem?.id || ""}
        productTitle={shareItem?.title}
        onClose={() => setShareItem(null)}
        onShared={(id) =>
          router.push({ pathname: "/(utilities)/chats", params: { id } })
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  headerCopy: { flex: 1, paddingRight: 12 },
  screenTitle: { fontSize: 32, fontWeight: "800" },
  screenSub: { fontSize: 14, marginTop: 6, lineHeight: 20 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2 },
  headerDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    marginHorizontal: 20,
    height: 48,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  filters: { marginBottom: 8 },
  filterRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  chip: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipText: { fontSize: 14, fontWeight: "700" },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 16,
  },
  imageWrap: { height: 210 },
  image: { width: "100%", height: "100%" },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  mineChip: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mineText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  body: { padding: 16 },
  price: { fontSize: 24, fontWeight: "800" },
  title: { fontSize: 18, fontWeight: "800", marginTop: 6 },
  metaRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 8 },
  meta: { flex: 1, fontSize: 14, lineHeight: 20 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pillText: { fontSize: 13, fontWeight: "600" },
  agentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  agentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  letter: { color: "#fff", fontWeight: "800", fontSize: 16 },
  agentCopy: { flex: 1 },
  agentName: { fontSize: 16, fontWeight: "800" },
  agentMeta: { fontSize: 13, marginTop: 1 },
  phone: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  actions: { flexDirection: "row", gap: 8, marginTop: 14 },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionLabel: { fontSize: 14, fontWeight: "800" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  emptyCopy: { fontSize: 14, textAlign: "center", marginTop: 8 },
  retry: {
    marginTop: 16,
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: { color: "#fff", fontWeight: "800" },
});
