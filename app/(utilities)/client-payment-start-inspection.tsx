import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API } from "../../services/api";

const ClientPaymentStartInspection: React.FC = () => {
  const { colors } = useTheme();

  const params = useLocalSearchParams();

  const requestId = params.requestId as string;
  const agentId = params.agentId as string;
  const propertyType = params.propertyType as string;
  const lat = params.lat as string;
  const lng = params.lng as string;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ SEND REQUEST
  const sendInspectionRequest = async () => {
    console.log("📦 MYPARAMS:", {
      requestId,
      agentId,
      propertyType,
      lat,
      lng,
    });

    if (!requestId || !agentId) {
      setError("Missing requestId or agentId");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        requestId,
        agentId,
        propertyType,
        lat: Number(lat),
        lng: Number(lng),
      };

      console.log("🚀 Sending payload:", payload);

      const res = await API.post("/notifications/request", payload);

      console.log("✅ Success:", res.data);

      setSuccess(true);
    } catch (e: any) {
      const message =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e.message;

      console.error("❌ API ERROR:", message);

      setError(message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ AUTO RUN
  useEffect(() => {
    sendInspectionRequest();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={colors.text === "#FFFFFF" ? "light-content" : "dark-content"}
      />

      <View className="flex-1 justify-center items-center px-6">

        {/* 🔄 LOADING */}
        {loading && (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.text }} className="mt-4 text-lg">
              Sending request to agent...
            </Text>
          </>
        )}

        {/* ✅ SUCCESS */}
        {!loading && success && (
          <>
            <Text style={{ color: colors.text }} className="text-2xl font-bold text-center">
              ✅ Request Sent!
            </Text>

            <Text style={{ color: colors.text }} className="text-center mt-2">
              Agent has been notified. Waiting for response...
            </Text>

            <Pressable
              onPress={() => router.replace("/(client)/dashboard")}
              style={{ backgroundColor: colors.primary }}
              className="mt-6 px-6 py-4 rounded-xl"
            >
              <Text className="text-white font-bold">
                Go to Dashboard
              </Text>
            </Pressable>
          </>
        )}

        {/* ❌ ERROR */}
        {!loading && error && (
          <>
            <Text style={{ color: "red", textAlign: "center" }}>
              ❌ {error}
            </Text>

            <Pressable
              onPress={sendInspectionRequest}
              style={{ backgroundColor: colors.primary }}
              className="mt-4 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-bold">
                Retry
              </Text>
            </Pressable>
          </>
        )}

      </View>
    </SafeAreaView>
  );
};

export default ClientPaymentStartInspection;