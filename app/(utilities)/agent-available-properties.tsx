import { useTheme } from "@/hooks/use-theme";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CaretLeft } from "phosphor-react-native";
import CategoryFilter from "../../components/client-ui/agent-view-category-filter";
import AgentHeader from "../../components/client-ui/agent-view-header";
import PropertyCard from "../../components/client-ui/agent-view-property-card";
import { API } from "../../services/api";
import ConfirmBookingModal from "../modal";

const CATEGORIES = ["All", "Apartment", "Hotel", "Shortlet"];

const AvailableProperties: React.FC = () => {
  const { colors } = useTheme();

  const {
    agentId,
    name,
    phone,
    rating,
    agency,
    clientId,
    clientName,
    propertyType,
    lat,
    lng,
    requestId,
    status,
  } = useLocalSearchParams<any>();

  const [activeCategory, setActiveCategory] = useState("All");
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [error, setError] = useState("");

  const fetchProperties = useCallback(async () => {
    if (!agentId) return;

    try {
      setLoading(true);
      setError("");

      const query =
        activeCategory !== "All" ? `?propertyType=${activeCategory}` : "";

      const res = await API.get(`/agentid/${agentId}${query}`);

      setProperties(res.data?.products || []);
    } catch (err: any) {
      console.log("❌ API Error:", err?.response?.data || err.message);
      setError("Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, [activeCategory, agentId]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const filteredProperties = useMemo(() => {
    if (activeCategory === "All") return properties;

    return properties.filter(
      (item) =>
        item?.propertyType?.toLowerCase()?.trim() ===
        activeCategory.toLowerCase(),
    );
  }, [properties, activeCategory]);

  const listData = useMemo(() => {
    return [
      { id: "header", type: "header" },
      { id: "filter", type: "filter" },
      ...filteredProperties.map((p) => ({
        ...p,
        type: propertyType,
      })),
    ];
  }, [filteredProperties, propertyType]);

  const handleBooking = () => {
    router.replace({
      pathname: "/(utilities)/client-payment-start-inspection",
      params: {
        agentId,
        clientId,
        clientName,
        propertyType,
        name,
        phone,
        rating,
        agency,
        lat,
        lng,
        requestId,
        forceBooking: "true",
      },
    });
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text
            style={{
              color: colors.text,
              textAlign: "center",
            }}
          >
            {error}
          </Text>

          <TouchableOpacity
            onPress={fetchProperties}
            className="mt-4 px-4 py-3 rounded-xl"
            style={{
              backgroundColor: colors.primary,
            }}
          >
            <Text style={{ color: "#fff" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, index) => item.id || index.toString()}
          stickyHeaderIndices={[1]}
          renderItem={({ item }: any) => {
            if (item.type === "header") {
              return (
                <View
                  className="px-4 py-2"
                  style={{ backgroundColor: colors.background }}
                >
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
                  style={{
                    backgroundColor: colors.background,
                    paddingBottom: 12,
                  }}
                >
                  <CategoryFilter
                    categories={CATEGORIES}
                    activeCategory={activeCategory}
                    onSelect={setActiveCategory}
                  />

                  <Text
                    style={{
                      color: colors.text,
                    }}
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
          contentContainerStyle={{
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom Button */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 24,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        }}
      >
        {/* Back Button - 30% */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flex: 0.3,
            borderColor: colors.text,
            backgroundColor: "transparent",
          }}
          className="mr-3 items-center justify-center rounded-2xl border py-5"
        >
          <CaretLeft size={22} color={colors.text} />
        </TouchableOpacity>

        {/* Book Button - 70% */}
        {status === "inspection_started" || status === "matched" ? null : (
          <TouchableOpacity
            onPress={() => setBookingModalOpen(true)}
            style={{
              flex: 0.7,
              backgroundColor: colors.primary,
            }}
            className="items-center justify-center rounded-2xl py-5"
          >
            <Text className="text-lg font-bold text-white">Book Agent Now</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal */}
      <ConfirmBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        propertyType={propertyType}
        price={
          propertyType === "Apartment"
            ? 5000
            : propertyType === "Hotel"
              ? 3000
              : propertyType === "Shortlet"
                ? 7000
                : 5000
        }
        onConfirm={() => {
          handleBooking();
          setBookingModalOpen(false);
        }}
      />
    </SafeAreaView>
  );
};

export default AvailableProperties;
