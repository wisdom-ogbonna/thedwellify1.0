// app/(client)/history.tsx

import React, { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getAddress = async (
    id: string,
    latitude: number,
    longitude: number
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

      console.log(
        "History Response:",
        JSON.stringify(response.data, null, 2)
      );

const data = Array.isArray(response.data?.history)
  ? response.data.history.filter(
      (item: any) => item.status === "matched"
    )
  : [];

      setHistory(data);

      data.forEach((item: HistoryItem) => {
        if (
          typeof item.lat === "number" &&
          typeof item.lng === "number"
        ) {
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

  const formatDate = (
    createdAt?: {
      _seconds?: number;
    }
  ) => {
    try {
      if (!createdAt?._seconds) {
        return "Unknown Date";
      }

      return new Date(
        createdAt._seconds * 1000
      ).toLocaleString();
    } catch {
      return "Unknown Date";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "matched":
        return "#22c55e";

      case "inspection_started":
        return "#f59e0b";

      case "inspection_completed":
        return "#3b82f6";

      default:
        return "#6b7280";
    }
  };

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const hasCoordinates =
      typeof item.lat === "number" &&
      typeof item.lng === "number";

    return (
      <View style={styles.card}>
        <Text style={styles.propertyType}>
          {item.propertyType || "Property"}
        </Text>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: getStatusColor(item.status),
            },
          ]}
        >
          <Text style={styles.statusText}>
            {(item.status || "unknown")
              .replace(/_/g, " ")
              .toUpperCase()}
          </Text>
        </View>

        <Text style={styles.label}>Request ID</Text>
        <Text style={styles.value}>
          {item.requestId || "N/A"}
        </Text>

        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>
          {addresses[item.id] ||
            (hasCoordinates
              ? "Loading address..."
              : "Address unavailable")}
        </Text>
        <Text style={styles.label}>Created</Text>
        <Text style={styles.value}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!history.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>
          No Match History Found
        </Text>

        <Text style={styles.emptyText}>
          Your completed inspections will appear here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
  },

  propertyType: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 15,
  },

  statusText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

  label: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 10,
  },

  value: {
    fontSize: 14,
    color: "#111827",
    marginTop: 2,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
  },

  emptyText: {
    marginTop: 10,
    textAlign: "center",
    color: "#6b7280",
  },
});