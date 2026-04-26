import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Alert,
} from "react-native";

import { API } from "../../services/api";
import { registerForPushNotificationsAsync } from "../../services/notifications";

export default function AgentDashboard() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // 🔥 SEND TOKEN TO BACKEND
  const sendTokenToBackend = async () => {
    try {
      setLoading(true);

      const pushData = await registerForPushNotificationsAsync();

      if (!pushData) {
        setStatus("Failed to get push token");
        return;
      }

      const payload: any = {
        platform: pushData.platform,
      };

      if (pushData.platform === "ios") {
        payload.expoPushToken = pushData.token;
      } else {
        payload.fcmToken = pushData.token;
      }

      console.log("Sending payload:", payload);

      const res = await API.post("/notifications/agent", payload);

      console.log("Response:", res.data);

      setStatus("✅ Push token saved successfully");
    } catch (error: any) {
      console.log("Error:", error?.response?.data || error.message);
      setStatus("❌ Failed to save token");

      Alert.alert(
        "Error",
        error?.response?.data?.error || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔥 INITIAL LOAD
  useEffect(() => {
    sendTokenToBackend();
  }, []);

  // 🔥 PULL TO REFRESH
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await sendTokenToBackend();
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Agent Dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Notification Status</Text>

        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Text style={styles.status}>
            {status || "Initializing..."}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={sendTokenToBackend}
      >
        <Text style={styles.buttonText}>Retry / Update Token</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f5f7fb",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});