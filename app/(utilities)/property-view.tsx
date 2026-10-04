import { formatPrice, purposeLabel } from "@/constants/listings";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { ResizeMode, Video } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API } from "../../services/api";

export default function PropertyView() {
  const { colors } = useTheme();
  const { role, user } = useAuth();
  const { propertyId } = useLocalSearchParams<{ propertyId?: string }>();
  const videoRef = useRef<Video>(null);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingChat, setStartingChat] = useState(false);

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

  const openChat = async () => {
    if (!property?.id) return;
    setStartingChat(true);
    router.push({
      pathname: "/(utilities)/chats",
      params: { productId: String(property.id) },
    });
    setStartingChat(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !property) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {error || "Not found"}
          </Text>
          <Pressable onPress={fetchProperty} style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = Boolean(user?.uid && property.agentId === user.uid);
  const canChat = role === "client" && !isOwner;
  const image = property.images?.[0];
  const label = purposeLabel(property.purpose, property.tag);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View>
          {image ? (
            <Image source={{ uri: image }} style={styles.hero} />
          ) : (
            <View style={[styles.hero, styles.heroFallback, { backgroundColor: colors.disabled + "33" }]}>
              <Text style={{ color: colors.placeholder, fontWeight: "800" }}>No photo</Text>
            </View>
          )}
          <Pressable
            onPress={() => router.back()}
            style={[styles.back, { backgroundColor: colors.background }]}
          >
            <Text style={[styles.backText, { color: colors.text }]}>‹</Text>
          </Pressable>
          <View style={[styles.typeBadge, { backgroundColor: colors.background }]}>
            <Text style={[styles.typeBadgeText, { color: colors.text }]}>
              {property.propertyType || "Property"}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={[styles.purpose, { backgroundColor: property.purpose === "Sale" ? "#16A34A" : colors.primary }]}>
            <Text style={styles.purposeText}>{label}</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {property.title || "Untitled property"}
          </Text>
          <Text style={[styles.location, { color: colors.placeholder }]}>
            {property.location || "Location not added"}
          </Text>
          <Text style={[styles.price, { color: colors.primary }]}>
            {property.price ? formatPrice(property.price) : "Price on request"}
          </Text>

          {property.agent?.name ? (
            <View style={[styles.agentCard, { borderColor: colors.border }]}>
              <View style={[styles.agentMark, { backgroundColor: colors.primary }]}>
                <Text style={styles.agentLetter}>
                  {String(property.agent.name).slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={[styles.agentName, { color: colors.text }]}>{property.agent.name}</Text>
                <Text style={[styles.agentMeta, { color: colors.placeholder }]}>
                  {property.agent.agencyName || "Listing agent"}
                </Text>
              </View>
            </View>
          ) : null}

          {property.video ? (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>Virtual tour</Text>
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

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>About the property</Text>
            <Text style={[styles.description, { color: colors.text }]}>
              {property.description || "No description available"}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <View style={styles.flex}>
          <Text style={[styles.footerLabel, { color: colors.placeholder }]}>Total price</Text>
          <Text style={[styles.footerPrice, { color: colors.text }]} numberOfLines={1}>
            {property.price ? formatPrice(property.price) : "Price on request"}
          </Text>
        </View>
        {canChat ? (
          <Pressable
            onPress={openChat}
            disabled={startingChat}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: startingChat ? 0.6 : 1 }]}
          >
            <Text style={styles.primaryBtnText}>
              {startingChat ? "Opening…" : "Message agent"}
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.back()} style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.primaryBtnText}>{isOwner ? "Your listing" : "Close"}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingBottom: 120 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  hero: { width: "100%", height: 320 },
  heroFallback: { alignItems: "center", justifyContent: "center" },
  back: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 30, lineHeight: 32, fontWeight: "300" },
  typeBadge: {
    position: "absolute",
    top: 22,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  body: { paddingHorizontal: 20, paddingTop: 22 },
  purpose: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  purposeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  title: { fontSize: 28, fontWeight: "900", marginTop: 12, lineHeight: 34 },
  location: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  price: { fontSize: 22, fontWeight: "900", marginTop: 10 },
  agentCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginTop: 18,
  },
  agentMark: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  agentLetter: { color: "#fff", fontWeight: "900", fontSize: 16 },
  agentName: { fontSize: 15, fontWeight: "800" },
  agentMeta: { fontSize: 12, marginTop: 2 },
  section: { marginTop: 24 },
  sectionLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
  description: { fontSize: 15, lineHeight: 24, fontWeight: "500" },
  videoWrap: { height: 210, borderRadius: 24, overflow: "hidden", backgroundColor: "#000" },
  video: { flex: 1 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  footerLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  footerPrice: { fontSize: 18, fontWeight: "900", marginTop: 2 },
  primaryBtn: { height: 48, paddingHorizontal: 18, borderRadius: 14, justifyContent: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
  emptyTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
});
