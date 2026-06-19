import { useTheme } from "@react-navigation/native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import {
  ArrowClockwiseIcon,
  CalendarBlankIcon,
  ClockIcon,
  MapPinIcon,
} from "phosphor-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API } from "../../services/api";

// --- TYPES & INTERFACES ---
interface FirestoreTimestamp {
  _seconds?: number;
  _nanoseconds?: number;
}

export interface HistoryItem {
  id: string;
  requestId?: string;
  propertyType?: string;
  status?: string;
  lat?: number | null;
  lng?: number | null;
  createdAt?: FirestoreTimestamp;
  inspectionStartedAt?: FirestoreTimestamp;
  inspectionEndedAt?: FirestoreTimestamp;
  cancelledAt?: FirestoreTimestamp;
  cancelledBy?: string;
  cancelReason?: string;
}

interface StatusStyle {
  bg: string;
  text: string;
}

// --- HELPER FUNCTIONS ---
export const formatDate = (createdAt?: FirestoreTimestamp): string => {
  if (!createdAt?._seconds) return "Unknown Date";
  try {
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

// --- MEMOIZED CHILD ITEM COMPONENT ---
const HistoryListItemComponent = ({
  item,
  address,
  colors,
  onPress,
}: {
  item: HistoryItem;
  address?: string;
  colors: any;
  onPress: () => void;
}) => {
  const hasCoordinates =
    typeof item.lat === "number" && typeof item.lng === "number";

  const statusStyle = useMemo((): StatusStyle => {
    switch (item.status?.toLowerCase()) {
      case "matched":
        return { bg: colors.border, text: colors.primary };
      case "inspection_started":
        return { bg: "#FEF3C7", text: "#D97706" };
      case "inspection_completed":
        return { bg: "#DBEAFE", text: "#2563EB" };
      case "cancelled":
        return { bg: "#FEE2E2", text: "#DC2626" };
      default:
        return { bg: colors.border, text: colors.text };
    }
  }, [item.status, colors]);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="p-5 mb-4 border rounded-3xl shadow-sm"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <View className="flex-row justify-between items-center">
        <Text
          className="text-base font-bold flex-1 mr-2"
          style={{ color: colors.text }}
          numberOfLines={1}
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
        className="h-px my-4 opacity-40"
        style={{ backgroundColor: colors.border }}
      />

      <View className="flex-row justify-between">
        {/* Start Date Field */}
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-1">
            <CalendarBlankIcon size={12} color="#71717a" weight="regular" />
            <Text className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              Inspection started at
            </Text>
          </View>
          <Text
            className="text-sm font-semibold mt-1 pl-4"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {formatDate(item.inspectionStartedAt)}
          </Text>
        </View>

        {/* End Date Field */}
        <View className="flex-1 items-end">
          <View className="flex-row items-center gap-1">
            <CalendarBlankIcon size={12} color="#71717a" weight="regular" />
            <Text className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              Inspection ended at
            </Text>
          </View>
          <Text
            className="text-sm font-semibold mt-1"
            style={{ color: colors.text }}
          >
            {formatDate(item.inspectionEndedAt)}
          </Text>
        </View>
      </View>

      {/* Location Field */}
      <View className="mt-4">
        <View className="flex-row items-center gap-1">
          <MapPinIcon size={12} color="#71717a" weight="regular" />
          <Text className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
            Inspection Location
          </Text>
        </View>
        <Text
          className="text-sm font-semibold mt-1 pl-4"
          style={{ color: colors.text }}
        >
          {address ||
            (hasCoordinates ? "Loading address..." : "Address unavailable")}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const HistoryListItem = React.memo(HistoryListItemComponent);
HistoryListItem.displayName = "HistoryListItem";

// --- MAIN SCREEN COMPONENT ---
export default function HistoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchAddressesBatch = async (
    items: HistoryItem[],
    isMounted: boolean,
  ) => {
    const validItems = items.filter(
      (item) => typeof item.lat === "number" && typeof item.lng === "number",
    );

    if (validItems.length === 0) return;

    const promises = validItems.map(async (item) => {
      try {
        const result = await Location.reverseGeocodeAsync({
          latitude: item.lat!,
          longitude: item.lng!,
        });

        if (result && result.length > 0) {
          const place = result[0];
          const addressString = [
            place.name,
            place.street,
            place.city,
            place.region,
            place.country,
          ]
            .filter(Boolean)
            .join(", ");
          return { id: item.id, address: addressString || "Address found" };
        }
        return { id: item.id, address: "Address unavailable" };
      } catch (error) {
        console.error(`Reverse geocode error for ${item.id}:`, error);
        return { id: item.id, address: "Address unavailable" };
      }
    });

    const results = await Promise.allSettled(promises);

    if (!isMounted) return;

    const updates: Record<string, string> = {};
    results.forEach((res) => {
      if (res.status === "fulfilled" && res.value) {
        updates[res.value.id] = res.value.address;
      }
    });

    setAddresses((prev) => ({ ...prev, ...updates }));
  };

  const loadHistory = useCallback(async (isMounted = true) => {
    try {
      const response = await API.get("/client/history");
      const fetchedData = response.data?.history;

      const data: HistoryItem[] = Array.isArray(fetchedData) ? fetchedData : [];

      if (isMounted) {
        setHistory(data);
      }

      if (data.length > 0) {
        await fetchAddressesBatch(data, isMounted);
      }
    } catch (error) {
      console.error("History Loading Error:", error);
    } finally {
      if (isMounted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadHistory(isMounted);

    return () => {
      isMounted = false;
    };
  }, [loadHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory(true);
  }, [loadHistory]);

  const filteredHistory = useMemo(() => {
    return history.filter(
      (currentItem: HistoryItem) =>
        currentItem.status?.toLowerCase() !== "matched",
    );
  }, [history]);

  const renderItem = useCallback(
    ({ item }: { item: HistoryItem }) => (
      <HistoryListItem
        item={item}
        address={addresses[item.id]}
        colors={colors}
        onPress={() => {
          router.push({
            pathname: "/(utilities)/client-history-event",
            params: {
              item: JSON.stringify(item),
              address: addresses[item.id] || "",
            },
          });
        }}
      />
    ),
    [addresses, colors, router],
  );

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

  if (history.length === 0) {
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
        <Text className="mt-2 text-zinc-500 text-sm text-center mb-6">
          Your full history listings and status updates will be safely displayed
          here.
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
    <View
      className="flex-1 pt-8"
      style={{ backgroundColor: colors.background }}
    >
      <FlatList
        data={filteredHistory}
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
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
}
