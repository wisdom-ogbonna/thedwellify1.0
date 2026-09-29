import { useTheme } from "@/hooks/use-theme";
import { API } from "@/services/api";
import React from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";

export default function Waiting({
  requestStatus,
  requestId,
  message,
  onReset,
}: {
  requestStatus: string | null;
  requestId?: string | null;
  message?: string | null;
  onReset?: () => void;
}) {
  const { colors } = useTheme();

  const title =
    requestStatus === "pending"
      ? "Finding an available agent..."
      : requestStatus === "offered"
        ? "Waiting for agent response..."
        : requestStatus === "no_agents"
          ? "Agent unavailable"
          : requestStatus === "cancelled"
            ? "Request cancelled"
            : requestStatus === "expired" || requestStatus === "invalidated"
              ? "Request expired"
              : "Sending your request...";

  const body =
    message ||
    (requestStatus === "offered"
      ? "A nearby agent has been notified. You are not connected until they accept."
      : requestStatus === "pending"
        ? "Looking for an eligible online agent in your area."
        : "You can start a new request.");

  const cancelRequest = async () => {
    if (!requestId) {
      onReset?.();
      return;
    }

    try {
      await API.post("/client/cancel-match", {
        requestId,
        reason: "Client cancelled request",
      });
      onReset?.();
    } catch (error: any) {
      const serverStatus = error?.response?.data?.requestStatus;
      if (
        error?.response?.status === 404 ||
        ["cancelled", "expired", "invalidated"].includes(serverStatus)
      ) {
        onReset?.();
        return;
      }
      Alert.alert(
        "Cancel failed",
        error?.response?.data?.error || "Could not cancel this request.",
      );
    }
  };

  return (
    <View className="p-6">
      <Text style={{ color: colors.text }} className="text-2xl font-black mb-3">
        {title}
      </Text>
      <Text style={{ color: colors.text, opacity: 0.65 }} className="text-sm mb-6">
        {body}
      </Text>

      {(requestStatus === "pending" || requestStatus === "offered") && (
        <ActivityIndicator color={colors.primary} className="mb-6" />
      )}

      {(requestStatus === "offered" || requestStatus === "pending") && (
        <TouchableOpacity
          onPress={cancelRequest}
          className="h-14 rounded-2xl items-center justify-center border border-red-500/40"
        >
          <Text className="text-red-400 font-semibold">Cancel request</Text>
        </TouchableOpacity>
      )}

      {(requestStatus === "no_agents" ||
        requestStatus === "cancelled" ||
        requestStatus === "expired" ||
        requestStatus === "invalidated") && (
        <TouchableOpacity
          onPress={onReset}
          className="h-14 rounded-2xl items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-bold">Start a new request</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
