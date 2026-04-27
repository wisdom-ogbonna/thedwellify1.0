import React, { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { useTheme } from "@react-navigation/native";
import { API } from "../../services/api";

interface HistoryItem {
  title: string;
  date: string;
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const fetchHistory = async () => {
    try {
      const res = await API.get("/client/history");
      setHistory(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <FlatList
      data={history}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={fetchHistory}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={
        <Text
          className="text-4xl font-black mb-8"
          style={{ color: colors.text }}
        >
          History.
        </Text>
      }
      renderItem={({ item }) => (
        <View
          className="border-b-2 py-6"
          style={{ borderColor: colors.border }}
        >
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            {item.title}
          </Text>
          <Text className="opacity-50" style={{ color: colors.text }}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
      )}
    />
  );
}
