import React, { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";
import { useTheme } from "@react-navigation/native";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import {
  ArrowClockwiseIcon,
  ClockIcon,
  FileTextIcon,
  CalendarBlankIcon,
  MapPinIcon,
} from "phosphor-react-native";
import { API } from "../../services/api";

interface HistoryItem {
  id: string;
  requestId?: string;
  propertyType?: string;
  status?: string;
  lat?: number | null;
  lng?: number | null;
  createdAt?: {
    _seconds?: number;
    _nanoseconds?: number;
  };
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getAddress = async (
    id: string,
    latitude: number,
    longitude: number,
  ) => {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result.length > 0) {
        const place = result[0];

        const address = [
          place.name,
          place.street,
          place.city,
          place.region,
          place.country,
        ]
          .filter(Boolean)
          .join(", ");

        setAddresses((prev) => ({
          ...prev,
          [id]: address,
        }));
      }
    } catch (error) {
      console.log("Reverse geocode error:", error);

      setAddresses((prev) => ({
        ...prev,
        [id]: "Address unavailable",
      }));
    }
  };

  const loadHistory = async () => {
    try {
      const response = await API.get("/client/history");

      const data = Array.isArray(response.data?.history)
        ? response.data.history.filter((item: any) => item.status === "matched")
        : [];

      setHistory(data);

      data.forEach((item: HistoryItem) => {
        if (typeof item.lat === "number" && typeof item.lng === "number") {
          getAddress(item.id, item.lat, item.lng);
        }
      });
    } catch (error) {
      console.log("History Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory();
  }, []);

  const formatDate = (createdAt?: { _seconds?: number }) => {
    try {
      if (!createdAt?._seconds) {
        return "Unknown Date";
      }

      return new Date(createdAt._seconds * 1000).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown Date";
    }
  };

  const getStatusStyle = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "matched":
        return { bg: colors.border, text: colors.primary };
      case "inspection_started":
        return { bg: "#FEF3C7", text: "#D97706" };
      case "inspection_completed":
        return { bg: "#DBEAFE", text: "#2563EB" };
      default:
        return { bg: colors.border, text: colors.text };
    }
  };

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const hasCoordinates =
      typeof item.lat === "number" && typeof item.lng === "number";

    const statusStyle = getStatusStyle(item.status);

    return (
      <View
        className="p-5 mb-4 border rounded-3xl shadow-sm"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <View className="flex-row justify-between items-center">
          <Text
            className="text-base font-bold flex-1 mr-2"
            style={{ color: colors.text }}
          >
            {item.propertyType || "Property Inspection"}
          </Text>
          <View
            className="px-2.5 py-1 rounded-xl"
            style={{ backgroundColor: statusStyle.bg }}
          >
            <Text
              className="text-[10px] font-bold tracking-wider"
              style={{ color: statusStyle.text }}
            >
              {(item.status || "unknown").replace(/_/g, " ").toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Separator Line */}
        <View
          className="h-[1px] my-4 opacity-40"
          style={{ backgroundColor: colors.border }}
        />

        <View className="flex-row justify-between">
          {/* Request ID Field */}
          <View className="flex-1 mr-2">
            <View className="flex-row items-center gap-1">
              <FileTextIcon size={12} color="#71717a" weight="medium" />
              <Text className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                Request ID
              </Text>
            </View>
            <Text
              className="text-sm font-semibold mt-1 pl-4"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {item.requestId || "N/A"}
            </Text>
          </View>

          {/* Date Field */}
          <View className="flex-1 items-end">
            <View className="flex-row items-center gap-1">
              <CalendarBlankIcon size={12} color="#71717a" weight="medium" />
              <Text className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                Created On
              </Text>
            </View>
            <Text
              className="text-sm font-semibold mt-1"
              style={{ color: colors.text }}
            >
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>

        {/* Location Field */}
        <View className="mt-4">
          <View className="flex-row items-center gap-1">
            <MapPinIcon size={12} color="#71717a" weight="medium" />
            <Text className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              Inspection Location
            </Text>
          </View>
          <Text
            className="text-sm font-semibold mt-1 pl-4"
            style={{ color: colors.text }}
          >
            {addresses[item.id] ||
              (hasCoordinates ? "Loading address..." : "Address unavailable")}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!history.length) {
    return (
      <View
        className="flex-1 justify-center items-center px-10"
        style={{ backgroundColor: colors.background }}
      >
        <View
          className="w-20 h-20 rounded-full border items-center justify-center mb-5"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <ClockIcon size={36} color={colors.primary} weight="light" />
        </View>
        <Text
          className="text-xl font-bold text-center"
          style={{ color: colors.text }}
        >
          No History Found
        </Text>
        <Text className="mt-2 text-zinc-500 text-sm text-center line-clamp-2 mb-6">
          Your matched and completed inspection history listings will be
          displayed safely here.
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          className="flex-row items-center px-5 py-3 rounded-xl"
          style={{ backgroundColor: colors.primary }}
        >
          <ArrowClockwiseIcon
            size={14}
            color={colors.background}
            weight="bold"
          />
          <Text
            className="text-sm font-semibold ml-2"
            style={{ color: colors.background }}
          >
            Check Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 pt-15" style={{ backgroundColor: colors.background }}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{ padding: 20, paddingTop: 15 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
