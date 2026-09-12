import { PropertyGallery } from "@/components/property-gallery";
import { PropertyVideo } from "@/components/property-video";
import { useModal } from "@/components/dialogs/popup-modal";
import { ChatAvatar } from "@/components/chat/chat-avatar";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { startConversation } from "@/services/chatApi";
import {
  deleteProduct,
  fetchOwnedProduct,
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
  MapPin,
  PencilSimple,
  ShareNetwork,
  Trash,
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

export default function ProductDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { role } = useAuth();
  const { showModal } = useModal();

  const isAgent = role === "agent";

  const [product, setProduct] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError("Missing property id");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = isAgent
        ? await fetchOwnedProduct(String(id))
        : await fetchPublicProduct(String(id));
      setProduct(data);
    } catch (err: any) {
      setProduct(null);
      setError(
        err?.response?.data?.error ||
          "Couldn't load this property. It may have been removed."
      );
    } finally {
      setLoading(false);
    }
  }, [id, isAgent]);

  useEffect(() => {
    load();
  }, [load]);

  const openChat = async () => {
    if (!id || startingChat || isAgent) return;
    setStartingChat(true);
    try {
      const { conversationId } = await startConversation(String(id));
      router.push(`/(utilities)/chats/?id=${conversationId}`);
    } catch (err: any) {
      showModal({
        type: "error",
        title: "Couldn't open chat",
        text: err?.response?.data?.error || "Please try again.",
        ctaText1: "Okay",
      });
    } finally {
      setStartingChat(false);
    }
  };

  const onShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `${product.title}\n${formatPropertyPrice(product.price)}\n${product.location || ""}\nView on Dwellify`,
      });
    } catch {
      /* user cancelled */
    }
  };

  const confirmDelete = () => {
    if (!product || deleting) return;
    showModal({
      type: "delete",
      title: "Delete property?",
      text: `"${product.title}" and its media will be permanently removed.`,
      ctaText1: "Delete",
      ctaText2: "Cancel",
      onCta1: () => {
        void (async () => {
          setDeleting(true);
          try {
            await deleteProduct(product.id);
            router.replace("/(agent)/listings");
          } catch (err: any) {
            showModal({
              type: "error",
              title: "Couldn't delete",
              text: err?.response?.data?.error || "Please try again.",
              ctaText1: "Okay",
            });
          } finally {
            setDeleting(false);
          }
        })();
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !product) {
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
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-5 py-3 rounded-2xl"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-bold">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const beds = product.bedrooms ?? product.beds;
  const baths = product.bathrooms ?? product.baths;
  const sizeLabel = formatSize(product.size);
  const tag = purposeLabel(product.purpose, product.propertyType);
  const period = periodLabel(product.purpose, product.propertyType);
  // Dedupe: purposeLabel can equal propertyType (e.g. Shortlet/Hotel/Apartment).
  const highlights = [
    ...new Set(
      [
        product.propertyType,
        tag,
        beds != null && beds !== "" ? `${beds} Beds` : null,
        baths != null && baths !== "" ? `${baths} Baths` : null,
        sizeLabel,
      ].filter(Boolean) as string[]
    ),
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="absolute top-0 left-0 right-0 z-50" style={{ paddingTop: Platform.OS === "ios" ? 54 : 36 }}>
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
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onShare}
              className="w-11 h-11 rounded-full items-center justify-center bg-white/95"
            >
              <ShareNetwork size={18} color="#111" weight="bold" />
            </TouchableOpacity>
            {isAgent ? (
              <TouchableOpacity
                onPress={confirmDelete}
                disabled={deleting}
                className="w-11 h-11 rounded-full items-center justify-center bg-white/95"
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <Trash size={18} color={colors.error} weight="bold" />
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <PropertyGallery images={product.images || []} height={340} />

        <View
          className="px-5 -mt-6 pt-7 rounded-t-[32px]"
          style={{ backgroundColor: colors.background }}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <View
              className="px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: `${colors.primary}14` }}
            >
              <Text className="text-[11px] font-extrabold" style={{ color: colors.primary }}>
                {tag}
              </Text>
            </View>
            {product.status ? (
              <View
                className="px-2.5 py-1 rounded-lg"
                style={{
                  backgroundColor:
                    product.status === "Active"
                      ? `${colors.success}18`
                      : colors.disabled + "40",
                }}
              >
                <Text
                  className="text-[11px] font-extrabold"
                  style={{
                    color:
                      product.status === "Active"
                        ? colors.success
                        : colors.placeholder,
                  }}
                >
                  {product.status}
                </Text>
              </View>
            ) : null}
          </View>

          <Text className="text-[26px] font-black leading-8 mb-2" style={{ color: colors.text }}>
            {product.title}
          </Text>

          <View className="flex-row items-center mb-5">
            <MapPin size={16} color={colors.primary} weight="fill" />
            <Text
              className="ml-1.5 text-sm font-semibold flex-1"
              style={{ color: colors.placeholder }}
            >
              {product.location || "Location not specified"}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-4 mb-6">
            {beds != null && beds !== "" ? (
              <MetaChip icon={<Bed size={16} color={colors.primary} />} label={`${beds} Beds`} colors={colors} />
            ) : null}
            {baths != null && baths !== "" ? (
              <MetaChip icon={<Bathtub size={16} color={colors.primary} />} label={`${baths} Baths`} colors={colors} />
            ) : null}
            {sizeLabel ? (
              <MetaChip icon={<Triangle size={16} color={colors.primary} />} label={sizeLabel} colors={colors} />
            ) : null}
          </View>

          {highlights.length ? (
            <View className="mb-7">
              <SectionTitle colors={colors}>Key details</SectionTitle>
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

          {product.video ? (
            <View className="mb-7">
              <SectionTitle colors={colors}>Virtual tour</SectionTitle>
              <View className="h-56 rounded-3xl overflow-hidden bg-black">
                <PropertyVideo uri={product.video} style={{ flex: 1 }} contentFit="cover" />
              </View>
            </View>
          ) : null}

          <View className="mb-7">
            <SectionTitle colors={colors}>About this property</SectionTitle>
            <Text className="text-[15px] leading-7 font-medium" style={{ color: colors.text, opacity: 0.78 }}>
              {product.description || "No description provided."}
            </Text>
          </View>

          {!isAgent && product.agent ? (
            <View className="mb-4">
              <SectionTitle colors={colors}>Listed by</SectionTitle>
              <View
                className="flex-row items-center p-3.5 rounded-2xl border"
                style={{ borderColor: colors.border + "45", backgroundColor: colors.card }}
              >
                <ChatAvatar
                  name={product.agent.name}
                  userId={product.agent.id}
                  uri={product.agent.avatar}
                  size={48}
                  isOnline={Boolean(product.agent.isOnline)}
                  showPresence
                />
                <View className="ml-3 flex-1">
                  <Text className="text-[15px] font-bold" style={{ color: colors.text }} numberOfLines={1}>
                    {product.agent.name}
                  </Text>
                  {product.agent.agencyName ? (
                    <Text className="text-[12px] mt-0.5" style={{ color: colors.placeholder }} numberOfLines={1}>
                      {product.agent.agencyName}
                    </Text>
                  ) : null}
                  <Text
                    className="text-[12px] font-semibold mt-1"
                    style={{
                      color: product.agent.isOnline ? colors.success : colors.placeholder,
                    }}
                  >
                    {product.agent.isOnline ? "Online now" : "Offline"}
                  </Text>
                </View>
              </View>
            </View>
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
          <Text className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.placeholder }}>
            Price
          </Text>
          <Text className="text-xl font-black" style={{ color: colors.text }} numberOfLines={1}>
            {formatPropertyPrice(product.price)}
            {period ? (
              <Text className="text-sm font-semibold" style={{ color: colors.placeholder }}>
                {period}
              </Text>
            ) : null}
          </Text>
        </View>

        {isAgent ? (
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: "/(product)/edit", params: { id: String(id) } })
            }
            className="px-6 rounded-2xl flex-row items-center justify-center"
            style={{ backgroundColor: colors.primary, height: 52 }}
          >
            <PencilSimple size={18} color="#FFF" weight="bold" />
            <Text className="text-white font-extrabold text-sm ml-2">Edit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={openChat}
            disabled={startingChat}
            className="px-6 rounded-2xl flex-row items-center justify-center"
            style={{
              backgroundColor: colors.primary,
              opacity: startingChat ? 0.7 : 1,
              height: 52,
            }}
          >
            {startingChat ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white font-extrabold text-sm">Chat Agent</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function SectionTitle({
  children,
  colors,
}: {
  children: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <Text
      className="text-[11px] font-black uppercase tracking-[1.5px] mb-3"
      style={{ color: colors.placeholder }}
    >
      {children}
    </Text>
  );
}

function MetaChip({
  icon,
  label,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View className="flex-row items-center">
      {icon}
      <Text className="ml-1.5 text-[13px] font-semibold" style={{ color: colors.text }}>
        {label}
      </Text>
    </View>
  );
}
