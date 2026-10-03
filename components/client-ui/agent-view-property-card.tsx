import { formatPrice, purposeLabel } from "@/constants/listings";
import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

const PropertyCard = ({ item }: { item: any }) => {
  const { colors } = useTheme();
  const router = useRouter();
  const image = item.images?.[0] || item.image;
  const label = purposeLabel(item.purpose, item.tag);

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/(utilities)/property-view",
          params: { propertyId: item.id },
        })
      }
      style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imageFallback, { backgroundColor: colors.disabled + "33" }]}>
          <Text style={{ color: colors.placeholder, fontWeight: "700" }}>No photo</Text>
        </View>
      )}

      <View style={styles.body}>
        <View
          style={[
            styles.badge,
            { backgroundColor: item.purpose === "Sale" ? "#16A34A" : colors.primary },
          ]}
        >
          <Text style={styles.badgeText}>{label}</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {item.title || "Untitled property"}
        </Text>
        <Text style={[styles.price, { color: colors.primary }]}>
          {item.price ? formatPrice(item.price) : "Price on request"}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 200,
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 16,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: "900",
  },
});

export default PropertyCard;
