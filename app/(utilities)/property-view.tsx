import { ChatAvatar } from "@/components/chat/chat-avatar";
import { PropertyGallery } from "@/components/property-gallery";
import { PropertyVideo } from "@/components/property-video";
import { useTheme } from "@/hooks/use-theme";
import { startConversation } from "@/services/chatApi";
import {
  fetchPublicProduct,
  formatPropertyPrice,
  periodLabel,
  purposeLabel,
  type Property,
} from "@/services/productApi";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Bathtub,
  Bed,
  ChatCircle,
  MapPin,
  ShareNetwork,
  Triangle,
} from "phosphor-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const formatSize = (size: Property["size"]) => {
  if (size === null || size === undefined || size === "") return null;
  const raw = String(size);
  return /sqm|sq\.?\s*m|m²/i.test(raw) ? raw : `${raw} sqm`;
};

const PropertyView = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingChat, setStartingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const fetchProperty = useCallback(async () => {
    if (!propertyId) {
      setLoading(false);
      setError("Missing property id");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await fetchPublicProduct(String(propertyId));
      setProperty(data);
    } catch (err: any) {
      console.log("Property Fetch Error:", err?.response?.data || err?.message);
      setProperty(null);
      setError(
        err?.response?.data?.error ||
          "This property is no longer available."
      );
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  const openChat = async () => {
    if (!propertyId || startingChat) return;
    setStartingChat(true);
    setChatError(null);
    try {
      const { conversationId } = await startConversation(String(propertyId));
      router.push(`/(utilities)/chats/?id=${conversationId}`);
    } catch (err: any) {
      const message =
        err?.response?.data?.error || "Couldn't start chat. Please try again.";
      setChatError(message);
    } finally {
      setStartingChat(false);
    }
  };

  const onShare = async () => {
    if (!property) return;
    try {
      await Share.share({
        message: `${property.title}\n${formatPropertyPrice(property.price)}\n${property.location || ""}\nView on Dwellify`,
      });
    } catch {
      /* cancelled */
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-3 text-sm" style={{ color: colors.placeholder }}>
          Loading property…
        </Text>
      </SafeAreaView>
    );
  }

  if (error || !property) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: colors.background }}
      >
        <Text className="text-lg font-bold text-center mb-2" style={{ color: colors.text }}>
          Property unavailable
        </Text>
        <Text className="text-sm text-center mb-5" style={{ color: colors.placeholder }}>
          {error || "Not found"}
        </Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-5 py-3 rounded-2xl border"
            style={{ borderColor: colors.border }}
          >
            <Text className="font-bold" style={{ color: colors.text }}>
              Go back
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={fetchProperty}
            className="px-5 py-3 rounded-2xl"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const beds = property.bedrooms ?? property.beds;
  const baths = property.bathrooms ?? property.baths;
  const sizeLabel = formatSize(property.size);
  const tag = purposeLabel(property.purpose, property.propertyType);
  const period = periodLabel(property.purpose, property.propertyType);
  const agent = property.agent;
  const online = Boolean(agent?.isOnline);

  // Dedupe: purposeLabel can equal propertyType (e.g. Shortlet/Hotel/Apartment).
  const highlights = [
    ...new Set(
      [
        property.propertyType,
        tag,
        beds != null && beds !== "" ? `${beds} Beds` : null,
        baths != null && baths !== "" ? `${baths} Baths` : null,
        sizeLabel,
      ].filter(Boolean) as string[]
    ),
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View
        className="absolute top-0 left-0 right-0 z-50"
        style={{ paddingTop: Platform.OS === "ios" ? 54 : 36 }}
      >
        <View className="flex-row items-center justify-between px-5">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 rounded-full items-center justify-center bg-white/95"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <ArrowLeft size={20} color="#111" weight="bold" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onShare}
            className="w-11 h-11 rounded-full items-center justify-center bg-white/95"
          >
            <ShareNetwork size={18} color="#111" weight="bold" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        <PropertyGallery images={property.images || []} height={340} />

        <View
          className="px-5 -mt-6 pt-7 rounded-t-[32px]"
          style={{ backgroundColor: colors.background }}
        >
          <View
            className="self-start px-2.5 py-1 rounded-lg mb-3"
            style={{ backgroundColor: `${colors.primary}14` }}
          >
            <Text className="text-[11px] font-extrabold" style={{ color: colors.primary }}>
              {tag}
            </Text>
          </View>

          <Text className="text-[26px] font-black leading-8 mb-2" style={{ color: colors.text }}>
            {property.title || "Untitled Property"}
          </Text>

          <View className="flex-row items-center mb-5">
            <MapPin size={16} color={colors.primary} weight="fill" />
            <Text
              className="ml-1.5 text-sm font-semibold flex-1"
              style={{ color: colors.placeholder }}
            >
              {property.location || "Location not specified"}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-4 mb-6">
            {beds != null && beds !== "" ? (
              <View className="flex-row items-center">
                <Bed size={16} color={colors.primary} />
                <Text className="ml-1.5 text-[13px] font-semibold" style={{ color: colors.text }}>
                  {beds} Beds
                </Text>
              </View>
            ) : null}
            {baths != null && baths !== "" ? (
              <View className="flex-row items-center">
                <Bathtub size={16} color={colors.primary} />
                <Text className="ml-1.5 text-[13px] font-semibold" style={{ color: colors.text }}>
                  {baths} Baths
                </Text>
              </View>
            ) : null}
            {sizeLabel ? (
              <View className="flex-row items-center">
                <Triangle size={16} color={colors.primary} />
                <Text className="ml-1.5 text-[13px] font-semibold" style={{ color: colors.text }}>
                  {sizeLabel}
                </Text>
              </View>
            ) : null}
          </View>

          {highlights.length ? (
            <View className="mb-7">
              <Text
                className="text-[11px] font-black uppercase tracking-[1.5px] mb-3"
                style={{ color: colors.placeholder }}
              >
                Key details
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {highlights.map((h) => (
                  <View
                    key={h}
                    className="px-3 py-2 rounded-full border"
                    style={{
                      borderColor: colors.border + "50",
                      backgroundColor: colors.card,
                    }}
                  >
                    <Text className="text-[12px] font-semibold" style={{ color: colors.text }}>
                      {h}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {property.video ? (
            <View className="mb-7">
              <Text
                className="text-[11px] font-black uppercase tracking-[1.5px] mb-3"
                style={{ color: colors.placeholder }}
              >
                Virtual tour
              </Text>
              <View className="h-56 rounded-3xl overflow-hidden bg-black">
                <PropertyVideo
                  uri={property.video}
                  style={{ flex: 1 }}
                  contentFit="cover"
                />
              </View>
            </View>
          ) : null}

          <View className="mb-7">
            <Text
              className="text-[11px] font-black uppercase tracking-[1.5px] mb-3"
              style={{ color: colors.placeholder }}
            >
              About this property
            </Text>
            <Text
              className="text-[15px] font-medium leading-7"
              style={{ color: colors.text, opacity: 0.78 }}
            >
              {property.description || "No description available"}
            </Text>
          </View>

          {agent ? (
            <View className="mb-4">
              <Text
                className="text-[11px] font-black uppercase tracking-[1.5px] mb-3"
                style={{ color: colors.placeholder }}
              >
                Listed by
              </Text>
              <View
                className="flex-row items-center p-3.5 rounded-2xl border"
                style={{
                  borderColor: colors.border + "45",
                  backgroundColor: colors.card,
                }}
              >
                <ChatAvatar
                  name={agent.name}
                  userId={agent.id}
                  uri={agent.avatar}
                  size={48}
                  isOnline={online}
                  showPresence
                />
                <View className="ml-3 flex-1">
                  <Text
                    className="text-[15px] font-bold"
                    style={{ color: colors.text }}
                    numberOfLines={1}
                  >
                    {agent.name}
                  </Text>
                  {agent.agencyName ? (
                    <Text
                      className="text-[12px] mt-0.5"
                      style={{ color: colors.placeholder }}
                      numberOfLines={1}
                    >
                      {agent.agencyName}
                    </Text>
                  ) : null}
                  <Text
                    className="text-[12px] font-semibold mt-1"
                    style={{ color: online ? colors.success : colors.placeholder }}
                  >
                    {online ? "Online now" : "Offline"}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {chatError ? (
            <Text className="text-sm mb-2" style={{ color: colors.error }}>
              {chatError}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 px-5 pt-4 pb-7 flex-row items-center border-t"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.border + "35",
        }}
      >
        <View className="flex-1 mr-3">
          <Text
            className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: colors.placeholder }}
          >
            Price
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            className="text-xl font-black"
            style={{ color: colors.text }}
          >
            {formatPropertyPrice(property.price)}
            {period ? (
              <Text className="text-sm font-semibold" style={{ color: colors.placeholder }}>
                {period}
              </Text>
            ) : null}
          </Text>
        </View>

        <TouchableOpacity
          onPress={openChat}
          disabled={startingChat}
          className="px-5 rounded-2xl flex-row items-center justify-center"
          style={{
            backgroundColor: colors.primary,
            opacity: startingChat ? 0.7 : 1,
            minWidth: 150,
            height: 52,
          }}
          activeOpacity={0.9}
        >
          {startingChat ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <ChatCircle size={20} color="#FFF" weight="fill" />
              <Text className="text-white font-extrabold text-sm ml-2">
                Chat Agent
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PropertyView;
