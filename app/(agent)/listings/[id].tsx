import {
  formatPrice,
  isLand,
  purposeLabel,
  type Listing,
} from "@/constants/listings";
import { useTheme } from "@/hooks/use-theme";
import { listingsApi } from "@/services/listings";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function ListingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError("");
      const data = await listingsApi.get(id);
      setListing(data);
    } catch (err: any) {
      setListing(null);
      setError(err?.response?.data?.error || "Could not load this property.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggleAvailability = async () => {
    if (!listing) return;
    const next = listing.availability === "Unavailable" ? "Available" : "Unavailable";
    try {
      setUpdating(true);
      await listingsApi.setAvailability(listing.id, next);
      setListing({ ...listing, availability: next, status: next });
    } catch {
      Alert.alert("Error", "Could not update availability.");
    } finally {
      setUpdating(false);
    }
  };

  const onDelete = () => {
    if (!listing) return;
    Alert.alert("Delete property", "This will permanently remove the listing.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await listingsApi.remove(listing.id);
            router.replace("/(agent)/listings");
          } catch {
            Alert.alert("Error", "Could not delete this property.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {error || "Property not found"}
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.primary, fontWeight: "800" }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const available = listing.availability !== "Unavailable";
  const images = listing.images?.length ? listing.images : [];

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {images[0] ? (
          <Image source={{ uri: images[0] }} style={styles.hero} resizeMode="cover" />
        ) : (
          <View style={[styles.hero, styles.heroFallback, { backgroundColor: colors.disabled + "33" }]}>
            <Text style={{ color: colors.placeholder, fontWeight: "700" }}>No photo</Text>
          </View>
        )}

        <SafeAreaView edges={["top"]} style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹</Text>
          </Pressable>
          <View style={[styles.status, { backgroundColor: available ? "#22C55E" : "#6B7280" }]}>
            <Text style={styles.badgeText}>{available ? "Available" : "Unavailable"}</Text>
          </View>
        </SafeAreaView>

        <View style={styles.body}>
          <View style={styles.row}>
            <View style={[styles.pill, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{purposeLabel(listing.purpose, listing.tag)}</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: colors.disabled + "22" }]}>
              <Text style={{ color: colors.text, fontWeight: "800", fontSize: 11 }}>
                {listing.propertyType}
              </Text>
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {listing.title || "Untitled property"}
          </Text>
          {!!listing.location && (
            <Text style={[styles.location, { color: colors.placeholder }]}>{listing.location}</Text>
          )}
          <Text style={[styles.price, { color: colors.primary }]}>
            {listing.price ? formatPrice(listing.price) : "Price on request"}
          </Text>

          {isLand(listing.propertyType) && (
            <Text style={[styles.meta, { color: colors.text }]}>
              {listing.plots ?? 0} plot{(listing.plots || 0) === 1 ? "" : "s"}
            </Text>
          )}

          {!!listing.description && (
            <Text style={[styles.description, { color: colors.text }]}>{listing.description}</Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable
          onPress={toggleAvailability}
          disabled={updating}
          style={[styles.footerBtn, { borderColor: colors.border, borderWidth: 1 }]}
        >
          <Text style={{ color: colors.text, fontWeight: "800" }}>
            {updating ? "Updating..." : available ? "Mark unavailable" : "Mark available"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(agent)/listings/edit",
              params: { id: listing.id },
            })
          }
          style={[styles.footerBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>Edit</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={styles.deleteBtn}>
          <Text style={{ color: colors.error, fontWeight: "800" }}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  hero: { width, height: 320 },
  heroFallback: { alignItems: "center", justifyContent: "center" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: { fontSize: 28, lineHeight: 30, color: "#111" },
  status: { height: 32, paddingHorizontal: 12, borderRadius: 16, justifyContent: "center" },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  row: { flexDirection: "row", gap: 8, marginBottom: 12 },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  title: { fontSize: 26, fontWeight: "900" },
  location: { fontSize: 14, marginTop: 8 },
  price: { fontSize: 22, fontWeight: "900", marginTop: 12 },
  meta: { fontSize: 15, fontWeight: "700", marginTop: 12 },
  description: { fontSize: 15, lineHeight: 22, marginTop: 16, opacity: 0.8 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  footerBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: { width: "100%", height: 40, alignItems: "center", justifyContent: "center" },
});
