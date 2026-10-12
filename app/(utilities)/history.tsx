import { useTheme } from "@react-navigation/native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import {
  ArrowClockwiseIcon,
  BuildingsIcon,
  CalendarBlankIcon,
  CaretLeftIcon,
  CaretRightIcon,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  color: string;
}

const MUTED = "#71717a";

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

  // Tinted (translucent) pills read well in both light and dark themes
  const statusStyle = useMemo((): StatusStyle => {
    switch (item.status?.toLowerCase()) {
      case "matched":
        return { color: colors.primary };
      case "inspection_started":
        return { color: "#D97706" };
      case "inspection_completed":
        return { color: "#2563EB" };
      case "cancelled":
        return { color: "#DC2626" };
      default:
        return { color: MUTED };
    }
  }, [item.status, colors]);

  const tileBg = `${colors.primary}14`;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="mb-4 border rounded-3xl overflow-hidden"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <View className="p-5">
        {/* Title + status */}
        <View className="flex-row items-center">
          <View
            className="w-11 h-11 rounded-2xl items-center justify-center"
            style={{ backgroundColor: tileBg }}
          >
            <BuildingsIcon size={22} color={colors.primary} weight="duotone" />
          </View>

          <View className="flex-1 mx-3">
            <Text
              className="text-base font-bold"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {item.propertyType || "Property Inspection"}
            </Text>
            <View
              className="self-start flex-row items-center mt-1.5 px-2.5 py-1 rounded-full border"
              style={{
                backgroundColor: `${statusStyle.color}1A`,
                borderColor: `${statusStyle.color}55`,
              }}
            >
              <View
                className="w-1.5 h-1.5 rounded-full mr-1.5"
                style={{ backgroundColor: statusStyle.color }}
              />
              <Text
                className="text-[10px] font-bold tracking-widest"
                style={{ color: statusStyle.color }}
              >
                {(item.status || "unknown").replace(/_/g, " ").toUpperCase()}
              </Text>
            </View>
          </View>

          <CaretRightIcon size={18} color={MUTED} weight="bold" />
        </View>

        {/* Start / End panel */}
        <View
          className="flex-row mt-5 rounded-2xl border"
          style={{
            backgroundColor: `${colors.primary}08`,
            borderColor: colors.border,
          }}
        >
          <View className="flex-1 p-3.5">
            <View className="flex-row items-center gap-1.5">
              <CalendarBlankIcon size={13} color={MUTED} weight="regular" />
              <Text
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: MUTED }}
              >
                Started
              </Text>
            </View>
            <Text
              className="text-sm font-semibold mt-1.5"
              style={{ color: colors.text }}
              numberOfLines={2}
            >
              {formatDate(item.inspectionStartedAt)}
            </Text>
          </View>

          <View
            className="w-px my-3"
            style={{ backgroundColor: colors.border }}
          />

          <View className="flex-1 p-3.5">
            <View className="flex-row items-center gap-1.5">
              <CalendarBlankIcon size={13} color={MUTED} weight="regular" />
              <Text
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: MUTED }}
              >
                Ended
              </Text>
            </View>
            <Text
              className="text-sm font-semibold mt-1.5"
              style={{ color: colors.text }}
              numberOfLines={2}
            >
              {formatDate(item.inspectionEndedAt)}
            </Text>
          </View>
        </View>

        {/* Location */}
        <View className="flex-row items-center mt-4">
          <View
            className="w-9 h-9 rounded-xl items-center justify-center"
            style={{ backgroundColor: tileBg }}
          >
            <MapPinIcon size={17} color={colors.primary} weight="duotone" />
          </View>
          <View className="flex-1 ml-3">
            <Text
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: MUTED }}
            >
              Inspection Location
            </Text>
            <Text
              className="text-sm font-semibold mt-0.5"
              style={{ color: colors.text }}
              numberOfLines={2}
            >
              {address ||
                (hasCoordinates ? "Loading address..." : "Address unavailable")}
            </Text>
          </View>
        </View>
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
  const insets = useSafeAreaInsets();
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
          className="w-24 h-24 rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: `${colors.primary}14` }}
        >
          <View
            className="w-16 h-16 rounded-full border items-center justify-center"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <ClockIcon size={30} color={colors.primary} weight="duotone" />
          </View>
        </View>
        <Text
          className="text-xl font-bold text-center"
          style={{ color: colors.text }}
        >
          No History Found
        </Text>
        <Text
          className="mt-2 text-sm text-center mb-7 leading-5"
          style={{ color: MUTED }}
        >
          Your full history listings and status updates will be safely displayed
          here.
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onRefresh}
          className="flex-row items-center justify-center h-12 px-7 rounded-2xl"
          style={{ backgroundColor: colors.primary }}
        >
          <ArrowClockwiseIcon size={16} color="#FFFFFF" weight="bold" />
          <Text className="text-sm font-bold ml-2 text-white">Check Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background, paddingTop: insets.top }}
    >
      {/* Header */}
      <View
        className="flex-row items-center px-5 pt-3 pb-2"
        style={{ gap: 14 }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          hitSlop={8}
          onPress={() => router.push("/(client)/client-dashboard")}
          className="w-11 h-11 rounded-full border items-center justify-center"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <CaretLeftIcon size={20} color={colors.text} weight="bold" />
        </TouchableOpacity>

        <View className="flex-1">
          <Text
            style={{ color: colors.text }}
            className="text-2xl font-black tracking-tight"
          >
            History
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: MUTED }}>
            {filteredHistory.length}{" "}
            {filteredHistory.length === 1 ? "inspection" : "inspections"}
          </Text>
        </View>
      </View>

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
        ListEmptyComponent={
          <View className="items-center pt-20 px-8">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: `${colors.primary}14` }}
            >
              <ClockIcon size={28} color={colors.primary} weight="duotone" />
            </View>
            <Text
              className="text-lg font-bold text-center"
              style={{ color: colors.text }}
            >
              Nothing here yet
            </Text>
            <Text
              className="text-sm text-center mt-2 leading-5"
              style={{ color: MUTED }}
            >
              Completed and cancelled inspections will show up here.
            </Text>
          </View>
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
}
