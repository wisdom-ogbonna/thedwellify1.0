import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  ScrollView,
  Pressable,
  Linking,
} from "react-native";

import { useLocalSearchParams } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API } from "../../services/api";

const PropertyView = () => {
  const { colors } = useTheme();
  const { propertyId } = useLocalSearchParams<any>();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchProperty = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get(`/agentid/property/${propertyId}`);
      setProperty(res.data);
    } catch (err: any) {
      console.log("❌ Property Fetch Error:", err?.response?.data || err.message);
      setError("Failed to load property");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (propertyId) fetchProperty();
  }, [fetchProperty, propertyId]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ color: colors.text, textAlign: "center" }}>{error}</Text>

        <Pressable
          onPress={fetchProperty}
          style={{ marginTop: 15, backgroundColor: colors.primary, padding: 14, borderRadius: 12 }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO IMAGE */}
        <View style={{ position: "relative" }}>
          <Image
            source={{ uri: property?.images?.[0] }}
            style={{ width: "100%", height: 320 }}
            resizeMode="cover"
          />

          {/* floating badge */}
          <View
            style={{
              position: "absolute",
              bottom: 15,
              left: 15,
              backgroundColor: "rgba(0,0,0,0.6)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 12 }}>
              {property?.propertyType}
            </Text>
          </View>
        </View>

        {/* CONTENT CARD */}
        <View
          style={{
            marginTop: -20,
            backgroundColor: colors.card,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            padding: 20,
          }}
        >
          {/* TITLE */}
          <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.text }}>
            {property?.title || "Untitled Property"}
          </Text>

          {/* LOCATION */}
          <Text style={{ marginTop: 5, color: colors.text, opacity: 0.6 }}>
            📍 {property?.location}
          </Text>

          {/* PRICE */}
          <Text
            style={{
              marginTop: 12,
              fontSize: 28,
              fontWeight: "900",
              color: colors.primary,
            }}
          >
            ₦{Number(property?.price || 0).toLocaleString()}
          </Text>

          {/* DESCRIPTION */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
              Description
            </Text>
            <Text style={{ marginTop: 8, color: colors.text, opacity: 0.8, lineHeight: 22 }}>
              {property?.description || "No description available"}
            </Text>
          </View>

          {/* VIDEO BUTTON */}
          {property?.video && (
            <Pressable
              onPress={() => Linking.openURL(property.video)}
              style={{
                marginTop: 20,
                backgroundColor: colors.primary,
                padding: 15,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                ▶ Watch Video Tour
              </Text>
            </Pressable>
          )}

          {/* EXTRA SPACING */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PropertyView;