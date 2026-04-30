import { useTheme } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AgentHeader from "../../components/client-ui/agent-view-header";
import PropertyCard from "../../components/client-ui/agent-view-property-card";
import CategoryFilter from "../../components/client-ui/agent-view-category-filter";

const CATEGORIES = ["All", "Apartment", "Hotel", "Shortlet"];

const DUMMY_PROPERTIES = [
  {
    id: "1",
    title: "Modern 2-Bedroom Apartment",
    location: "Lekki Phase 1, Lagos",
    price: "₦4,500,000/year",
    propertyType: "Apartment",
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"],
    agentId: "agent_01",
  },
  {
    id: "2",
    title: "Luxury Suite Hotel",
    location: "Victoria Island, Lagos",
    price: "₦85,000/night",
    propertyType: "Hotel",
    images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945"],
    agentId: "agent_01",
  },
];

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
  } = useLocalSearchParams<{
    agentId: string;
    name: string;
    agency: string;
    clientId: string;
    clientName: string;
    propertyType: string;
    lat: string;
    lng: string;
    requestId: string;
  }>();

  const [activeCategory, setActiveCategory] = useState("All");

  const filteredProperties = useMemo(() => {
    const data = DUMMY_PROPERTIES;
    if (activeCategory === "All") return data;
    return data.filter((p) => p.propertyType === activeCategory);
  }, [activeCategory]);

  const listData = useMemo(
    () => [
      { id: "header", type: "header" },
      { id: "filter", type: "filter" },
      ...filteredProperties.map((p) => ({ ...p, type: "property" })),
    ],
    [filteredProperties],
  );

  const handleBooking = () => {
    router.push({
      pathname: "/(utilities)/agent-available-properties",
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
        barStyle={colors.text === "#FFFFFF" ? "light-content" : "dark-content"}
      />

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

      <View
        style={{ borderTopColor: colors.border }}
        className="absolute bottom-0 w-full p-4 bg-transparent border-t-0"
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
