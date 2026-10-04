import { formatPrice, purposeLabel } from "@/constants/listings";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API } from "../../services/api";

const CONTENT_MAX_WIDTH = 640;
const SHEET_OVERLAP = 24; // how far the content card overlaps the hero
const DESCRIPTION_PREVIEW_CHARS = 280;

export default function PropertyView() {
  const { colors } = useTheme();
  const { role, user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { propertyId } = useLocalSearchParams<{ propertyId?: string }>();
  const videoRef = useRef<Video>(null);

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const fetchProperty = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/agentid/property/${propertyId}`);
      setProperty(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load property");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (propertyId) fetchProperty();
  }, [fetchProperty, propertyId]);

  const openChat = () => {
    if (!property?.id) return;
    router.push({
      pathname: "/(utilities)/chats",
      params: { productId: String(property.id) },
    });
  };

  const onGalleryScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  /* ------------------------------ Loading / error ------------------------------ */

  if (loading || error || !property) {
    return (
      <View style={[styles.safe, { backgroundColor: colors.background }]}>
        <BackButton
          tone="plain"
          colors={colors}
          style={{ top: insets.top + 8 }}
        />
        <View style={styles.centered}>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Ionicons
                name="alert-circle-outline"
                size={36}
                color={colors.placeholder}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {error || "Property not found"}
              </Text>
              <Pressable
                onPress={fetchProperty}
                style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.primaryBtnText}>Retry</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    );
  }

  /* --------------------------------- Content ---------------------------------- */

  const isOwner = Boolean(user?.uid && property.agentId === user.uid);
  const canChat = role === "client" && !isOwner;
  const images: string[] = Array.isArray(property.images)
    ? property.images.filter(Boolean)
    : [];
  const label = purposeLabel(property.purpose, property.tag);
  const heroHeight = Math.min(Math.round(width * 0.85), 440);
  const description = property.description || "No description available";
  const isLongDescription = description.length > DESCRIPTION_PREVIEW_CHARS;

  return (
    <View style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ---------------------------- Hero gallery ---------------------------- */}
        <View style={{ height: heroHeight + SHEET_OVERLAP }}>
          {images.length > 0 ? (
            <FlatList
              data={images}
              keyExtractor={(uri, index) => `${index}-${uri}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onGalleryScrollEnd}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={{ width, height: heroHeight + SHEET_OVERLAP }}
                  resizeMode="cover"
                />
              )}
            />
          ) : (
            <View
              style={[
                styles.heroFallback,
                {
                  height: heroHeight + SHEET_OVERLAP,
                  backgroundColor: colors.disabled + "33",
                },
              ]}
            >
              <Ionicons
                name="image-outline"
                size={36}
                color={colors.placeholder}
              />
              <Text style={[styles.noPhoto, { color: colors.placeholder }]}>
                No photo
              </Text>
            </View>
          )}

          {images.length > 1 && (
            <View style={[styles.counter, { bottom: SHEET_OVERLAP + 12 }]}>
              <Ionicons name="images-outline" size={14} color="#fff" />
              <Text style={styles.counterText}>
                {activeImage + 1} / {images.length}
              </Text>
            </View>
          )}
        </View>

        {/* Content card overlaps the hero's bottom edge */}
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.background, marginTop: -SHEET_OVERLAP },
          ]}
        >
          <View style={styles.content}>
            {/* Badges */}
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.purpose,
                  {
                    backgroundColor:
                      property.purpose === "Sale" ? "#16A34A" : colors.primary,
                  },
                ]}
              >
                <Text style={styles.purposeText}>{label}</Text>
              </View>
              <View
                style={[
                  styles.typePill,
                  { backgroundColor: colors.disabled + "22" },
                ]}
              >
                <Text style={[styles.typePillText, { color: colors.text }]}>
                  {property.propertyType || "Property"}
                </Text>
              </View>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              {property.title || "Untitled property"}
            </Text>

            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color={colors.placeholder}
              />
              <Text
                style={[styles.location, { color: colors.placeholder }]}
                numberOfLines={2}
              >
                {property.location || "Location not added"}
              </Text>
            </View>

            <Text style={[styles.price, { color: colors.primary }]}>
              {property.price
                ? formatPrice(property.price)
                : "Price on request"}
            </Text>

            {/* Agent */}
            {property.agent?.name ? (
              <View
                style={[
                  styles.agentCard,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.disabled + "10",
                  },
                ]}
              >
                <View
                  style={[
                    styles.agentMark,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.agentLetter}>
                    {String(property.agent.name).slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.flex}>
                  <Text
                    style={[styles.agentName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {property.agent.name}
                  </Text>
                  <Text
                    style={[styles.agentMeta, { color: colors.placeholder }]}
                    numberOfLines={1}
                  >
                    {property.agent.agencyName || "Listing agent"}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* About */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                About this property
              </Text>
              <Text
                style={[styles.description, { color: colors.text }]}
                numberOfLines={expanded || !isLongDescription ? undefined : 6}
              >
                {description}
              </Text>
              {isLongDescription && (
                <Pressable
                  onPress={() => setExpanded((v) => !v)}
                  hitSlop={8}
                  accessibilityRole="button"
                >
                  <Text style={[styles.readMore, { color: colors.primary }]}>
                    {expanded ? "Show less" : "Read more"}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Virtual tour */}
            {property.video ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Virtual tour
                </Text>
                <View style={styles.videoWrap}>
                  <Video
                    ref={videoRef}
                    source={{ uri: property.video }}
                    style={styles.video}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={false}
                    isLooping
                    useNativeControls
                  />
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* Back button floats over the hero, below the status bar */}
      <BackButton
        tone="overlay"
        colors={colors}
        style={{ top: insets.top + 8 }}
      />

      {/* ------------------------------- Footer ------------------------------- */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        {canChat ? (
          <Pressable
            onPress={openChat}
            accessibilityRole="button"
            accessibilityLabel="Message agent"
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color="#fff"
            />
            <Text style={styles.primaryBtnText}>Message agent</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            style={[
              styles.primaryBtn,
              {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.primaryBtnText, { color: colors.text }]}>
              {isOwner ? "This is your listing" : "Close"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* BACK BUTTON                                                                */
/* -------------------------------------------------------------------------- */

function BackButton({
  tone,
  colors,
  style,
}: {
  tone: "overlay" | "plain";
  colors: ReturnType<typeof useTheme>["colors"];
  style?: object;
}) {
  const overlay = tone === "overlay";
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={[
        styles.back,
        overlay
          ? { backgroundColor: "rgba(0,0,0,0.45)" }
          : { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      <Ionicons
        name="chevron-back"
        size={24}
        color={overlay ? "#fff" : colors.text}
      />
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  scroll: { paddingBottom: 32 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },

  back: {
    position: "absolute",
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  // Hero
  heroFallback: { alignItems: "center", justifyContent: "center", gap: 8 },
  noPhoto: { fontSize: 14, fontWeight: "700" },
  counter: {
    position: "absolute",
    right: 16,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  counterText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // Sheet
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
  },
  content: {
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
    paddingHorizontal: 20,
  },

  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  purpose: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
  purposeText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  typePill: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
  typePillText: { fontSize: 12, fontWeight: "700" },

  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginTop: 14,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginTop: 8,
  },
  location: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  price: { fontSize: 24, fontWeight: "900", marginTop: 14 },

  // Agent
  agentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 20,
  },
  agentMark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  agentLetter: { color: "#fff", fontWeight: "900", fontSize: 17 },
  agentName: { fontSize: 15, fontWeight: "800" },
  agentMeta: { fontSize: 13, marginTop: 2 },

  // Sections
  section: { marginTop: 28 },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginBottom: 10 },
  description: { fontSize: 15, lineHeight: 24 },
  readMore: { fontSize: 14, fontWeight: "700", marginTop: 8 },
  videoWrap: {
    aspectRatio: 16 / 9,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  video: { flex: 1 },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    alignItems: "center",
  },
  primaryBtn: {
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  retryBtn: {
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: "center",
    marginTop: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
});
