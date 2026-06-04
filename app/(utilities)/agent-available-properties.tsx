import { useTheme } from "@/hooks/use-theme";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CaretLeftIcon } from "phosphor-react-native";
import CategoryFilter from "../../components/client-ui/agent-view-category-filter";
import AgentHeader from "../../components/client-ui/agent-view-header";
import PropertyCard from "../../components/client-ui/agent-view-property-card";
import { API } from "../../services/api";

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
  }, []);

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

          <Pressable
            onPress={fetchProperties}
            className="mt-4 px-4 py-3 rounded-xl"
            style={{
              backgroundColor: colors.primary,
            }}
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
        <Pressable
          onPress={() => router.back()}
          style={{
            flex: 0.3,
            borderColor: colors.text,
            backgroundColor: "transparent",
          }}
          className="mr-3 items-center justify-center rounded-2xl border py-5"
        >
          <CaretLeftIcon size={22} color={colors.text} />
        </Pressable>

        {/* Book Button - 70% */}
        {status === "inspection_started" || status === "matched" ? null : (
          <Pressable
            onPress={() => setBookingModalOpen(true)}
            style={{
              flex: 0.7,
              backgroundColor: colors.primary,
            }}
            className="items-center justify-center rounded-2xl py-5"
          >
            <Text className="text-lg font-bold text-white">Book Agent Now</Text>
          </Pressable>
        )}
      </View>

      {/* Modal */}
      <ConfirmBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        propertyType={propertyType}
        price={propertyType === "Apartment" ? 5000 : propertyType === "Hotel" ? 3000 : propertyType === "Shortlet" ? 7000 : 5000}
        onConfirm={() => {
          handleBooking();
          setBookingModalOpen(false);
        }}
      />
    </SafeAreaView>
  );
};

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  price: number;
  propertyType: string;
  onConfirm: () => void;
};

function ConfirmBookingModal({
  isOpen,
  onClose,
  propertyType,
  price,
  onConfirm,
}: ModalProps) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: 20,
        }}
      >
        <View className="bg-white rounded-3xl p-6 w-full max-w-md">
          <Text className="text-2xl font-bold mb-3">Confirm Booking</Text>

          <Text className="mb-2 text-lg">
            Are you sure you want to book this agent for an inspection?
          </Text>

          <Text className="mb-4 text-lg font-semibold">
            Property Type: {propertyType}
          </Text>

          <Text className="mb-4 text-lg font-semibold">
            Price: ₦{price.toLocaleString()}
          </Text>

          <View className="flex-row justify-between">
            <Pressable
              onPress={onClose}
              className="px-7 py-3 rounded-xl border border-gray-300"
            >
              <Text className="text-lg font-semibold">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              className="px-7 py-3 rounded-xl bg-green-500"
            >
              <Text className="text-white text-lg font-semibold">Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default AvailableProperties;
