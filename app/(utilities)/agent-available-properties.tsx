import { useTheme } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StatusBar,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API } from "../../services/api";
import AgentHeader from "../../components/client-ui/agent-view-header";
import PropertyCard from "../../components/client-ui/agent-view-property-card";
import CategoryFilter from "../../components/client-ui/agent-view-category-filter";

const CATEGORIES = ["All", "Apartment", "Hotel", "Shortlet"];

const AvailableProperties: React.FC = () => {
  const { colors } = useTheme();

  const {
    agentId,
    name,
    agency,
    clientId,
    clientName,
    propertyType,
    lat,
    lng,
    requestId,
  } = useLocalSearchParams<any>();

  const [activeCategory, setActiveCategory] = useState("All");
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * FETCH FROM BACKEND
   */
  const fetchProperties = useCallback(async () => {
    if (!agentId) return;

    try {
      setLoading(true);
      setError("");

      const query =
        activeCategory !== "All"
          ? `?propertyType=${activeCategory}`
          : "";

      const res = await API.get(`/agentid/${agentId}${query}`);

      setProperties(res.data?.products || []);
    } catch (err: any) {
      console.log("❌ API Error:", err?.response?.data || err.message);
      setError("Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  /**
   * FINAL SAFE FILTER (VERY IMPORTANT)
   * ensures correct matching: Hotel → Hotel tab
   */
  const filteredProperties = useMemo(() => {
    if (activeCategory === "All") return properties;

    return properties.filter((item) =>
      (item?.propertyType || "")
        .toLowerCase()
        .trim() === activeCategory.toLowerCase()
    );
  }, [properties, activeCategory]);

  const listData = useMemo(() => {
    return [
      { id: "header", type: "header" },
      { id: "filter", type: "filter" },
      ...filteredProperties.map((p) => ({
        ...p,
        type: "property",
      })),
    ];
  }, [filteredProperties]);

  const handleBooking = () => {
    router.push({
      pathname: "/(utilities)/client-payment-start-inspection",
      params: {
        agentId,
        clientId,
        clientName,
        propertyType,
        lat,
        lng,
        requestId,
        forceBooking: "true",
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={
          colors.text === "#FFFFFF"
            ? "light-content"
            : "dark-content"
        }
      />

      {/* LOADING */}
      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* ERROR */}
      {!loading && error ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text style={{ color: colors.text, textAlign: "center" }}>
            {error}
          </Text>

          <Pressable
            onPress={fetchProperties}
            className="mt-4 px-4 py-2 rounded-lg"
            style={{ backgroundColor: colors.primary }}
          >
            <Text style={{ color: "#fff" }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          stickyHeaderIndices={[1]}
          renderItem={({ item }: any) => {
            if (item.type === "header") {
              return (
                <View className="px-4 py-2">
                  <AgentHeader
                    name={name || "Professional Agent"}
                    agencyName={agency || "Dwellify Realty"}
                    location="Lagos, Nigeria"
                    image="https://randomuser.me/api/portraits/men/32.jpg"
                  />
                </View>
              );
            }

            if (item.type === "filter") {
              return (
                <View
                  style={{ backgroundColor: colors.background }}
                  className="pb-2"
                >
                  <CategoryFilter
                    categories={CATEGORIES}
                    activeCategory={activeCategory}
                    onSelect={setActiveCategory}
                  />

                  <Text
                    style={{ color: colors.text }}
                    className="text-lg font-bold px-4 pt-2"
                  >
                    Available Properties
                  </Text>
                </View>
              );
            }

            return (
              <View className="px-4 mb-4">
                <PropertyCard item={item} />
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* BOOK BUTTON */}
      <View
        style={{ borderTopColor: colors.border }}
        className="absolute bottom-0 w-full p-4"
      >
        <Pressable
          onPress={handleBooking}
          style={{ backgroundColor: colors.primary }}
          className="py-4 rounded-2xl items-center shadow-lg active:opacity-90"
        >
          <Text className="text-white text-lg font-bold">
            Book Agent (₦7,000)
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default AvailableProperties;