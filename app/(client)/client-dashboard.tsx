import { useTheme } from "@/hooks/use-theme";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import {
  Bathtub,
  Bed,
  Bell,
  CaretDown,
  ChatCircle,
  Faders,
  Heart,
  MagnifyingGlass,
  MapPin,
  SquaresFour,
  Triangle,
} from "phosphor-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatAvatar } from "@/components/chat/chat-avatar";
import { useAuth } from "@/context/AuthContext";
import { startConversation } from "@/services/chatApi";
import {
  DiscoverProperty,
  fetchDiscoverFeed,
  formatDiscoverPrice,
  periodForPropertyType,
} from "@/services/discoverApi";

const { width } = Dimensions.get("window");
const SAVED_CARD_WIDTH = width * 0.72;
const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=600";

const matchesCategory = (item: DiscoverProperty, category: string) => {
  if (category === "All") return true;

  const type = String(item.propertyType || "").toLowerCase();

  if (category === "Apartment") return type === "apartment";
  if (category === "Rent") return type === "hotel" || type === "shortlet";
  if (category === "Land") return type.includes("land");

  return true;
};

const formatSize = (size: DiscoverProperty["size"]) => {
  if (size === null || size === undefined || size === "") return null;
  const raw = String(size);
  return /sqm|sq\.?\s*m|m²/i.test(raw) ? raw : `${raw} sqm`;
};

export default function DiscoverMarketplaceScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", "Apartment", "Rent", "Land"];

  const [items, setItems] = useState<DiscoverProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null);

  const loadFeed = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      // Fresh random sample every load/refresh — agent + presence come from the server.
      const feed = await fetchDiscoverFeed(12);
      setItems(feed);
    } catch (err: any) {
      console.error("Discover feed error:", err?.response?.data || err?.message);
      setError(
        err?.response?.data?.error ||
          "Couldn't load properties. Pull to refresh and try again."
      );
      if (mode === "initial") setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeed("initial");
    }, [loadFeed])
  );

  const filtered = useMemo(
    () => items.filter((item) => matchesCategory(item, activeCategory)),
    [items, activeCategory]
  );

  // Carousel + list from the same random feed (no mocks).
  const featured = filtered.slice(0, Math.min(3, filtered.length));
  const recommended =
    filtered.length > featured.length
      ? filtered.slice(featured.length)
      : filtered;

  const openChat = async (product: DiscoverProperty) => {
    if (!product?.id || chatLoadingId) return;

    setChatLoadingId(product.id);
    try {
      // Server resolves agentId from the product — never send a client-chosen agent.
      const { conversationId } = await startConversation(product.id);
      router.push(`/(utilities)/chats/?id=${conversationId}`);
    } catch (err: any) {
      Alert.alert(
        "Couldn't open chat",
        err?.response?.data?.error || "Please try again."
      );
    } finally {
      setChatLoadingId(null);
    }
  };

  const openProperty = (productId: string) => {
    router.push({
      pathname: "/(utilities)/property-view",
      params: { propertyId: productId },
    });
  };

  const renderMeta = (
    item: DiscoverProperty,
    opts?: { compact?: boolean }
  ) => {
    const icon = opts?.compact ? 14 : 15;
    const text = opts?.compact ? "text-[12px]" : "text-[13px]";
    const sizeLabel = formatSize(item.size);

    return (
      <View className="flex-row items-center gap-4">
        {item.beds != null && item.beds !== "" && (
          <View className="flex-row items-center">
            <Bed size={icon} color={colors.placeholder} weight="regular" />
            <Text
              className={`${text} ml-1.5 font-medium`}
              style={{ color: colors.placeholder }}
            >
              {item.beds}
            </Text>
          </View>
        )}
        {item.baths != null && item.baths !== "" && (
          <View className="flex-row items-center">
            <Bathtub size={icon} color={colors.placeholder} weight="regular" />
            <Text
              className={`${text} ml-1.5 font-medium`}
              style={{ color: colors.placeholder }}
            >
              {item.baths}
            </Text>
          </View>
        )}
        {sizeLabel && (
          <View className="flex-row items-center">
            <Triangle size={icon} color={colors.placeholder} weight="regular" />
            <Text
              className={`${text} ml-1.5 font-medium`}
              style={{ color: colors.placeholder }}
            >
              {sizeLabel}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderAgentRow = (item: DiscoverProperty) => {
    const online = Boolean(item.agent?.isOnline);

    return (
      <View className="flex-row items-center justify-between mt-3">
        <View className="flex-row items-center flex-1 mr-3">
          <ChatAvatar
            name={item.agent?.name}
            userId={item.agent?.id || item.agentId}
            uri={item.agent?.avatar}
            size={32}
            isOnline={online}
            showPresence
          />
          <View className="ml-2.5 flex-1">
            <Text
              className="text-[13px] font-semibold"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {item.agent?.name || "Agent"}
            </Text>
            <Text
              className="text-[11px] font-medium mt-0.5"
              style={{ color: online ? colors.success || "#16A34A" : colors.placeholder }}
            >
              {online ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => openChat(item)}
          disabled={chatLoadingId === item.id}
          className="flex-row items-center px-3 py-2 rounded-full"
          style={{
            backgroundColor: `${colors.primary}18`,
            opacity: chatLoadingId === item.id ? 0.7 : 1,
          }}
        >
          {chatLoadingId === item.id ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <ChatCircle size={16} color={colors.primary} weight="fill" />
              <Text
                className="text-[12px] font-semibold ml-1.5"
                style={{ color: colors.primary }}
              >
                Chat Agent
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      {/* 1. App Bar Header */}
      <View
        className="flex-row items-center justify-between px-5 py-4"
        style={{ backgroundColor: colors.background }}
      >
        <View className="flex-row items-center gap-1.5">
          <MapPin weight="fill" size={20} color={colors.primary} />
          <Text
            className="text-[15px] font-semibold"
            style={{ color: colors.text }}
          >
            Lagos, Nigeria
          </Text>
          <CaretDown color={colors.text} weight="bold" size={13} />
        </View>
        <View className="flex-row gap-3 items-center">
          <TouchableOpacity
            className="w-10 h-10 rounded-full border items-center justify-center"
            style={{ borderColor: `${colors.border}80` }}
          >
            <Bell color={colors.text} size={20} weight="regular" />
          </TouchableOpacity>
          <ChatAvatar
            name={user?.phone || "You"}
            userId={user?.uid}
            size={40}
          />
        </View>
      </View>

      {/* Main Scrollable Canvas */}
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFeed("refresh")}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* 2. Search Input Bar */}
        <View className="px-5 mt-2 mb-6">
          <View
            className="flex-row items-center border rounded-full px-4 py-2.5 shadow-sm shadow-black/5"
            style={{
              backgroundColor: colors.background,
              borderColor: `${colors.border}80`,
            }}
          >
            <MagnifyingGlass
              size={20}
              color={colors.placeholder}
              weight="regular"
            />
            <TextInput
              placeholder="Search location, property..."
              placeholderTextColor={colors.placeholder}
              className="flex-1 text-[15px] font-normal ml-3 p-0"
              style={{ color: colors.text }}
            />
            <TouchableOpacity
              className="pl-3 border-l"
              style={{ borderColor: `${colors.border}80` }}
            >
              <Faders size={20} color={colors.primary} weight="regular" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Category Pill Selector Row */}
        <View className="mb-7">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
            className="flex-row"
          >
            {categories.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  className={`flex-row items-center px-6 py-3.5 rounded-full mr-3 ${
                    isSelected ? "shadow-md shadow-blue-500/30" : ""
                  }`}
                  style={{
                    backgroundColor: isSelected
                      ? colors.primary
                      : colors.disabled,
                  }}
                >
                  {cat === "All" && (
                    <SquaresFour
                      size={18}
                      color={"#FFFFFF"}
                      weight={isSelected ? "fill" : "regular"}
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <Text className="text-[15px] font-semibold text-white">
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View className="py-24 items-center justify-center px-5">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              className="mt-4 text-[14px]"
              style={{ color: colors.placeholder }}
            >
              Loading properties…
            </Text>
          </View>
        ) : error && items.length === 0 ? (
          <View className="py-20 items-center justify-center px-8">
            <Text
              className="text-[16px] font-semibold text-center mb-2"
              style={{ color: colors.text }}
            >
              Something went wrong
            </Text>
            <Text
              className="text-[13px] text-center mb-5"
              style={{ color: colors.placeholder }}
            >
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => loadFeed("initial")}
              className="px-5 py-3 rounded-full"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-semibold text-[14px]">
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View className="py-20 items-center justify-center px-8">
            <Text
              className="text-[16px] font-semibold text-center mb-2"
              style={{ color: colors.text }}
            >
              No properties yet
            </Text>
            <Text
              className="text-[13px] text-center mb-5"
              style={{ color: colors.placeholder }}
            >
              {activeCategory === "All"
                ? "Pull to refresh once agents list new homes."
                : `Nothing matched “${activeCategory}”. Try another category.`}
            </Text>
            <TouchableOpacity
              onPress={() => loadFeed("refresh")}
              className="px-5 py-3 rounded-full"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-semibold text-[14px]">
                Refresh
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* 4. Saved Large Carousel Cards Section */}
            {featured.length > 0 && (
              <View className="mb-8">
                <View className="flex-row justify-between items-center px-5 mb-4">
                  <Text
                    className="text-[18px] font-bold tracking-tight"
                    style={{ color: colors.text }}
                  >
                    Saved
                  </Text>
                  <TouchableOpacity onPress={() => loadFeed("refresh")}>
                    <Text
                      className="text-[13px] font-semibold"
                      style={{ color: colors.primary }}
                    >
                      Refresh
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={SAVED_CARD_WIDTH + 16}
                  decelerationRate="fast"
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                >
                  {featured.map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.92}
                      onPress={() => openProperty(item.id)}
                      style={{
                        width: SAVED_CARD_WIDTH,
                        marginRight: 16,
                        backgroundColor: colors.background,
                        borderColor: `${colors.border}80`,
                      }}
                      className="border rounded-3xl overflow-hidden shadow-sm shadow-black/5"
                    >
                      {/* Showcase Media */}
                      <View className="relative h-48 w-full">
                        <Image
                          source={{ uri: item.image || PLACEHOLDER_IMAGE }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                        {index === 0 && (
                          <View
                            className="absolute top-4 left-4 px-3 py-1 rounded-full"
                            style={{ backgroundColor: colors.primary }}
                          >
                            <Text
                              className="text-[10px] font-bold uppercase tracking-wider"
                              style={{ color: colors.background }}
                            >
                              Featured
                            </Text>
                          </View>
                        )}
                        <TouchableOpacity className="absolute top-4 right-4 w-9 h-9 bg-black/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30">
                          <Heart size={18} color="#FFFFFF" weight="regular" />
                        </TouchableOpacity>
                      </View>

                      {/* Info Segment */}
                      <View className="p-4">
                        <Text
                          className="text-[16px] font-semibold mb-1"
                          style={{ color: colors.text }}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <View className="flex-row items-center mb-2.5">
                          <MapPin
                            size={14}
                            color={colors.placeholder}
                            weight="regular"
                          />
                          <Text
                            className="text-[13px] ml-1"
                            style={{ color: colors.placeholder }}
                            numberOfLines={1}
                          >
                            {item.location || "Location TBA"}
                          </Text>
                        </View>

                        <View className="flex-row items-baseline mb-3.5">
                          <Text
                            className="text-[16px] font-bold"
                            style={{ color: colors.primary }}
                          >
                            {formatDiscoverPrice(item.price)}
                          </Text>
                          <Text
                            className="text-[13px] font-medium"
                            style={{ color: colors.primary }}
                          >
                            {periodForPropertyType(item.propertyType)}
                          </Text>
                        </View>

                        {/* Horizontal Meta */}
                        <View
                          className="pt-2 border-t"
                          style={{ borderColor: `${colors.border}40` }}
                        >
                          {renderMeta(item)}
                        </View>

                        {renderAgentRow(item)}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 5. Vertical Recommended Listings Section */}
            <View className="px-5 mb-10">
              <View className="flex-row justify-between items-center mb-4">
                <Text
                  className="text-[18px] font-bold tracking-tight"
                  style={{ color: colors.text }}
                >
                  Recommended for you
                </Text>
                <TouchableOpacity onPress={() => loadFeed("refresh")}>
                  <Text
                    className="text-[13px] font-semibold"
                    style={{ color: colors.primary }}
                  >
                    See all
                  </Text>
                </TouchableOpacity>
              </View>

              {(recommended.length > 0 ? recommended : filtered).map((list) => (
                <View
                  key={list.id}
                  className="border rounded-3xl p-3 mb-4 shadow-sm shadow-black/5"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: `${colors.border}80`,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => openProperty(list.id)}
                    className="flex-row items-center"
                  >
                    <Image
                      source={{ uri: list.image || PLACEHOLDER_IMAGE }}
                      className="w-24 h-24 rounded-2xl"
                    />

                    <View className="flex-1 ml-3.5 justify-between py-0.5">
                      <View>
                        <Text
                          className="text-[15px] font-semibold mb-1"
                          style={{ color: colors.text }}
                          numberOfLines={1}
                        >
                          {list.title}
                        </Text>
                        <View className="flex-row items-center">
                          <MapPin
                            size={13}
                            color={colors.placeholder}
                            weight="regular"
                          />
                          <Text
                            className="text-[12px] ml-1"
                            style={{ color: colors.placeholder }}
                            numberOfLines={1}
                          >
                            {list.location || "Location TBA"}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-end justify-between mt-3">
                        <View className="flex-row items-baseline">
                          <Text
                            className="text-[15px] font-bold"
                            style={{ color: colors.primary }}
                          >
                            {formatDiscoverPrice(list.price)}
                          </Text>
                          {!!periodForPropertyType(list.propertyType) && (
                            <Text
                              className="text-[11px] font-medium"
                              style={{ color: colors.primary }}
                            >
                              {periodForPropertyType(list.propertyType)}
                            </Text>
                          )}
                        </View>

                        {renderMeta(list, { compact: true })}
                      </View>
                    </View>
                  </TouchableOpacity>

                  {renderAgentRow(list)}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
