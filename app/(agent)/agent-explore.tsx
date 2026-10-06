import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { agentApi } from "@/services/agent";
import { router } from "expo-router";
import {
  ArrowUpDown,
  Bath,
  Bed,
  Bell,
  ChevronDown,
  Heart,
  ImageIcon,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  Search,
  SlidersHorizontal,
  Star,
  Waves,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

/* ------------------------------------------------------------------ */
/* TYPES + DATA LAYER                                                  */
/* ------------------------------------------------------------------ */

type ExploreListing = {
  id: string;
  purpose: "Sale" | "Rent";
  image?: string;
  price: number;
  commission?: string; // e.g. "50/50 Comm Sharing (₦4.25M Each)"
  title: string;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  sqm?: number;
  amenities?: string[];
  agent: {
    id: string;
    name: string;
    agency: string;
    avatar?: string;
    rating?: number;
    reviews?: number;
    online?: boolean;
    phone?: string;
  };
};

/**
 * TODO: replace with your real endpoint, e.g. `listingsApi.explore()`.
 * The mock below mirrors the screenshot so the screen renders immediately.
 */
const fetchExploreListings = async (): Promise<ExploreListing[]> => {
  const base: ExploreListing = {
    id: "1",
    purpose: "Sale",
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1000",
    price: 85000000,
    commission: "50/50 Comm Sharing (₦4.25M Each)",
    title: "Exquisite 4 Bedroom Fully Detached Duplex with BQ",
    location: "Lekki Phase 1, Lagos (Near Admiralty Way)",
    bedrooms: 4,
    bathrooms: 5,
    sqm: 450,
    amenities: ["24/7 Power", "Pool"],
    agent: {
      id: "a1",
      name: "Davi",
      agency: "Prime Nest Realty",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300",
      rating: 4.9,
      reviews: 34,
      online: true,
      phone: "+2348000000002",
    },
  };
  return [base, { ...base, id: "2" }];
};

const TYPE_OPTIONS = ["All Types", "For Sale", "For Rent"] as const;
const SORT_OPTIONS = ["Newest", "Price: Low", "Price: High"] as const;

const formatNaira = (n: number) =>
  `₦${Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

const amenityIcon = (name: string, color: string) => {
  const key = name.toLowerCase();
  if (key.includes("power")) return <Zap size={16} color="#F5B301" />;
  if (key.includes("pool")) return <Waves size={16} color={color} />;
  return null;
};

/* ------------------------------------------------------------------ */
/* SCREEN                                                              */
/* ------------------------------------------------------------------ */

export default function ExploreScreen() {
  const { colors, isDark } = useTheme();
  const { isOnline } = useAuth();

  const surface = isDark ? "#0F1A2B" : "#FFFFFF";
  const iconBg = isDark ? "#162235" : "#F1F5F9";

  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<ExploreListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [typeIndex, setTypeIndex] = useState(0);
  const [sortIndex, setSortIndex] = useState(0);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [unreadCount] = useState(3); // TODO: wire to your notifications source

  const typeFilter = TYPE_OPTIONS[typeIndex];
  const sortLabel = SORT_OPTIONS[sortIndex];

  const load = useCallback(async () => {
    try {
      setError("");
      setListings(await fetchExploreListings());
    } catch (e: any) {
      setError(e?.response?.data?.error || "Could not load properties.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    agentApi
      .profile()
      .then(setProfile)
      .catch(() => {});
  }, [load]);

  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = listings.filter((item) => {
      const matchesType =
        typeFilter === "All Types" ||
        (typeFilter === "For Sale" && item.purpose === "Sale") ||
        (typeFilter === "For Rent" && item.purpose === "Rent");

      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.agent.name.toLowerCase().includes(q);

      return matchesType && matchesSearch;
    });

    if (sortLabel === "Price: Low")
      return [...filtered].sort((a, b) => a.price - b.price);
    if (sortLabel === "Price: High")
      return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [listings, searchQuery, typeFilter, sortLabel]);

  /* ---------------- reusable pieces ---------------- */

  const Chip = ({
    label,
    icon,
    active,
    onPress,
    showChevron = true,
  }: {
    label: string;
    icon?: React.ReactNode;
    active?: boolean;
    onPress?: () => void;
    showChevron?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: active ? colors.primary : surface,
        borderColor: active ? colors.primary : "#27272A",
      }}
      className="h-12 px-5 rounded-full border flex-row items-center gap-2"
    >
      {icon}
      <Text
        style={{ color: active ? "#FFFFFF" : colors.text }}
        className="text-base font-semibold font-['Inter']"
      >
        {label}
      </Text>
      {showChevron && (
        <ChevronDown
          size={16}
          color={active ? "#FFFFFF" : colors.placeholder}
        />
      )}
    </Pressable>
  );

  const FeaturePill = ({ children }: { children: React.ReactNode }) => (
    <View
      style={{ backgroundColor: iconBg, borderColor: "#27272A" }}
      className="flex-row items-center gap-2 border rounded-xl px-3 py-2.5"
    >
      {children}
    </View>
  );

  /* ---------------- card ---------------- */

  const renderCard = ({ item }: { item: ExploreListing }) => {
    const fav = !!favorites[item.id];

    return (
      <Pressable
        style={{ backgroundColor: surface, borderColor: "#27272A" }}
        className="rounded-3xl border overflow-hidden mb-5"
      >
        {/* IMAGE */}
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[styles.image, { backgroundColor: iconBg }]}
              className="items-center justify-center"
            >
              <ImageIcon size={30} color={colors.placeholder} />
            </View>
          )}

          {/* bottom fade for legibility */}
          <View style={styles.fade} pointerEvents="none" />

          <View
            style={{ backgroundColor: colors.primary }}
            className="absolute top-4 left-4 px-4 py-1.5 rounded-lg"
          >
            <Text className="text-white text-sm font-bold font-['Inter'] uppercase tracking-wider">
              {item.purpose === "Sale" ? "For Sale" : "For Rent"}
            </Text>
          </View>

          <Pressable
            onPress={() =>
              setFavorites((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
            }
            style={{ backgroundColor: "rgba(40,48,60,0.78)" }}
            className="absolute top-4 right-4 w-12 h-12 rounded-full items-center justify-center"
          >
            <Heart
              size={22}
              color={fav ? colors.error : "#FFFFFF"}
              fill={fav ? colors.error : "transparent"}
            />
          </Pressable>

          <View
            style={{
              backgroundColor: "rgba(0,0,0,0.6)",
              borderColor: "#27272A",
            }}
            className="absolute bottom-4 left-4 h-10 w-12 rounded-xl border items-center justify-center"
          >
            <ImageIcon size={18} color="#FFFFFF" />
          </View>
        </View>

        {/* BODY */}
        <View className="p-5">
          {/* price + commission */}
          <View className="flex-row items-center flex-wrap gap-3">
            <Text
              style={{ color: colors.primary }}
              className="text-3xl font-bold font-['Poppins']"
            >
              {formatNaira(item.price)}
            </Text>
            {!!item.commission && (
              <View
                style={{
                  backgroundColor: `${colors.success}15`,
                  borderColor: `${colors.success}60`,
                }}
                className="border rounded-full px-3.5 py-1.5"
              >
                <Text
                  style={{ color: colors.success }}
                  className="text-sm font-bold font-['Inter']"
                >
                  {item.commission}
                </Text>
              </View>
            )}
          </View>

          <Text
            style={{ color: colors.text }}
            className="text-xl font-bold font-['Poppins'] mt-3"
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <View className="flex-row items-center gap-2 mt-3">
            <MapPin size={18} color={colors.primary} />
            <Text
              style={{ color: colors.placeholder }}
              className="flex-1 text-base font-['Inter']"
              numberOfLines={1}
            >
              {item.location}
            </Text>
          </View>

          {/* features */}
          <View className="flex-row flex-wrap gap-2.5 mt-4">
            {item.bedrooms != null && (
              <FeaturePill>
                <Bed size={16} color={colors.placeholder} />
                <Text
                  style={{ color: colors.placeholder }}
                  className="text-base font-['Inter']"
                >
                  {item.bedrooms} Bedrooms
                </Text>
              </FeaturePill>
            )}
            {item.bathrooms != null && (
              <FeaturePill>
                <Bath size={16} color={colors.placeholder} />
                <Text
                  style={{ color: colors.placeholder }}
                  className="text-base font-['Inter']"
                >
                  {item.bathrooms} Bathrooms
                </Text>
              </FeaturePill>
            )}
            {item.sqm != null && (
              <FeaturePill>
                <Ruler size={16} color={colors.placeholder} />
                <Text
                  style={{ color: colors.placeholder }}
                  className="text-base font-['Inter']"
                >
                  {item.sqm} sqm
                </Text>
              </FeaturePill>
            )}
            {item.amenities?.map((a) => (
              <FeaturePill key={a}>
                {amenityIcon(a, colors.primary)}
                <Text
                  style={{ color: colors.placeholder }}
                  className="text-base font-['Inter']"
                >
                  {a}
                </Text>
              </FeaturePill>
            ))}
          </View>

          {/* agent row */}
          <View
            style={{ borderTopColor: "#27272A" }}
            className="flex-row items-center justify-center mt-5 pt-5 border-t"
          >
            <View style={styles.agentAvatarWrap}>
              {item.agent.avatar ? (
                <Image
                  source={{ uri: item.agent.avatar }}
                  style={[styles.agentAvatar, { borderColor: colors.primary }]}
                />
              ) : (
                <View
                  style={[
                    styles.agentAvatar,
                    { borderColor: colors.primary, backgroundColor: iconBg },
                  ]}
                />
              )}
              {item.agent.online && (
                <View
                  style={[
                    styles.onlineDot,
                    {
                      backgroundColor: colors.success,
                      borderColor: surface,
                    },
                  ]}
                />
              )}
            </View>

            <View className="ml-3 flex-1">
              <View className="flex-row items-center gap-2">
                <Text
                  style={{ color: colors.text }}
                  className="text-lg font-bold font-['Inter']"
                  numberOfLines={1}
                >
                  {item.agent.name}
                </Text>
                {item.agent.rating != null && (
                  <View
                    style={{
                      backgroundColor: `${colors.primary}15`,
                      borderColor: `${colors.primary}60`,
                    }}
                    className="flex-row items-center gap-1 border rounded-md px-2 py-0.5"
                  >
                    <Text
                      style={{ color: colors.primary }}
                      className="text-xs font-bold font-['Inter']"
                    >
                      {item.agent.rating}
                    </Text>
                    <Star
                      size={11}
                      color={colors.primary}
                      fill={colors.primary}
                    />
                    <Text
                      style={{ color: colors.primary }}
                      className="text-xs font-bold font-['Inter']"
                    >
                      ({item.agent.reviews ?? 0})
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={{ color: colors.placeholder }}
                className="text-sm font-['Inter'] mt-0.5"
                numberOfLines={1}
              >
                {item.agent.agency}
              </Text>
            </View>

            <Pressable
              onPress={() =>
                item.agent.phone && Linking.openURL(`tel:${item.agent.phone}`)
              }
              style={{ backgroundColor: iconBg, borderColor: "#27272A" }}
              className="w-12 h-12 rounded-2xl border items-center justify-center mx-2"
            >
              <Phone size={20} color={colors.success} />
            </Pressable>

            <Pressable
              style={[
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
                styles.messageBtn,
              ]}
              className="h-12 px-4 rounded-2xl flex-row items-center justify-center gap-2"
            >
              <MessageCircle size={18} color="#FFFFFF" />
              {/* <Text className="text-white text-base font-bold font-['Inter']">
                Message Agent
              </Text> */}
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  /* ---------------- screen ---------------- */

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
      style={{ backgroundColor: colors.background, flex: 1 }}
    >
      {/* HEADER */}
      <View className="flex-row items-start justify-between px-6 pt-3 pb-4">
        <View className="flex-1 pr-4">
          <Text
            style={{ color: colors.text }}
            className="text-4xl font-bold font-['Poppins']"
          >
            Explore
          </Text>
          <Text
            style={{ color: colors.placeholder }}
            className="text-base font-['Inter'] mt-2"
          >
            Discover properties from other agents and connect with them.
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
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

          <Pressable
            style={{ backgroundColor: surface, borderColor: "#27272A" }}
            className="w-12 h-12 rounded-full border items-center justify-center"
          >
            <Bell size={20} color={colors.text} />
            {unreadCount > 0 && (
              <View
                style={{ backgroundColor: colors.error }}
                className="absolute -top-1 -right-1 min-w-5.5 h-5.5 px-1 rounded-full items-center justify-center"
              >
                <Text className="text-white text-xs font-bold font-['Inter']">
                  {unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* SEARCH + FILTER BUTTON */}
      <View className="flex-row gap-3 px-6 mb-4">
        <View
          style={{ backgroundColor: surface, borderColor: "#27272A" }}
          className="flex-1 h-14 border rounded-2xl px-4 flex-row items-center gap-3"
        >
          <Search size={20} color={colors.placeholder} />
          <TextInput
            placeholder="Search by title, location or agent..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ color: colors.text }}
            className="flex-1 text-base font-['Inter']"
          />
        </View>
        <Pressable
          style={{ backgroundColor: surface, borderColor: "#27272A" }}
          className="w-14 h-14 rounded-2xl border items-center justify-center"
        >
          <SlidersHorizontal size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* FILTER CHIPS */}
      <View className="mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
        >
          <Chip
            label={typeFilter}
            active
            onPress={() => setTypeIndex((i) => (i + 1) % TYPE_OPTIONS.length)}
          />
          <Chip
            label="Location"
            icon={<MapPin size={16} color={colors.placeholder} />}
          />
          <Chip
            label="Price"
            icon={
              <Text
                style={{ color: colors.placeholder }}
                className="text-base font-bold"
              >
                ₦
              </Text>
            }
          />
          <Chip
            label={sortIndex === 0 ? "Sort" : sortLabel}
            icon={<ArrowUpDown size={16} color={colors.placeholder} />}
            showChevron={false}
            onPress={() => setSortIndex((i) => (i + 1) % SORT_OPTIONS.length)}
          />
        </ScrollView>
      </View>

      {/* CONTENT */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text
            style={{ color: colors.text }}
            className="text-lg font-bold font-['Poppins'] text-center"
          >
            {error}
          </Text>
          <Pressable
            onPress={load}
            style={{ backgroundColor: colors.primary }}
            className="mt-5 h-12 px-8 rounded-2xl items-center justify-center"
          >
            <Text className="text-white text-base font-bold font-['Inter']">
              Retry
            </Text>
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
            <View className="items-center pt-16 px-6">
              <Text
                style={{ color: colors.text }}
                className="text-lg font-bold font-['Poppins'] text-center"
              >
                No properties found
              </Text>
              <Text
                style={{ color: colors.placeholder }}
                className="text-base font-['Inter'] text-center mt-2"
              >
                Try a different search or filter.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  imageContainer: {
    width: "100%",
    height: 250,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 30,
    borderWidth: 3,
  },
  headerDot: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  agentAvatarWrap: {
    width: 36,
    height: 36,
  },
  agentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 28,
    borderWidth: 2,
  },
  onlineDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  messageBtn: {
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
