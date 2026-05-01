import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { API } from "../../services/api";
import { registerForPushNotificationsAsync } from "../../services/notifications";

export default function AgentDashboard() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const sendTokenToBackend = async () => {
    try {
      setLoading(true);

      const pushData = await registerForPushNotificationsAsync();

      if (!pushData || !pushData.token) {
        setStatus("Failed to get push token");
        return;
      }

      const payload: any = {
        platform: pushData.platform,
      };

      if (pushData.platform === "ios") {
        payload.expoPushToken = pushData.token;
      }

      if (pushData.platform === "android") {
        payload.fcmToken = pushData.token;
      }

      console.log("📤 Sending payload:", payload);

      await API.post("/notifications/agent", payload);

      setStatus("Token Synced ✅");
    } catch (error: any) {
      console.log("❌ Sync error:", error?.response || error);
      setStatus("Sync Failed ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sendTokenToBackend();
  }, []);

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 32, paddingTop: 64 }}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={sendTokenToBackend}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View className="mb-12">
        <Text
          className="text-xs font-bold uppercase tracking-widest opacity-40"
          style={{ color: colors.text }}
        >
          System
        </Text>
        <Text
          className="text-5xl font-black tracking-tighter mt-2"
          style={{ color: colors.text }}
        >
          Status.
        </Text>
      </View>

      {/* Notification Status */}
      <View
        className="border-2 rounded-3xl p-8"
        style={{ borderColor: colors.border }}
      >
        <Text
          className="text-xs font-bold uppercase tracking-widest opacity-40 mb-4"
          style={{ color: colors.text }}
        >
          Push Notification
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text
            className="text-xl font-semibold"
            style={{ color: colors.text }}
          >
            {status}
          </Text>
        )}
      </View>

      {/* Manual Sync Button */}
      <Pressable
        onPress={sendTokenToBackend}
        className="mt-8 h-16 border-2 rounded-full items-center justify-center"
        style={{ borderColor: colors.border }}
      >
        <Text
          className="font-bold uppercase tracking-widest text-sm"
          style={{ color: colors.text }}
        >
          Sync Token
        </Text>
      </Pressable>
    </ScrollView>
  );
}