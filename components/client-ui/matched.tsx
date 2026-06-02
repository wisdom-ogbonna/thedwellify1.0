import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

function Matched({
  agent,
  request,
  requestStatus,
  setMatchData,
}: any) {
  const { colors } = useTheme();
  const router = useRouter();

  const name = agent?.name || "Agent";
  const phone = agent?.phone || "Not Available";
  const agencyName = agent?.agencyName || "Dwellify Partner";
  const rating = agent?.rating || "5.0";
  const distanceKm = agent?.distanceKm || "Nearby";

  const getStatus = () => {
    switch (requestStatus) {
      case "inspection_started":
        return {
          label: "INSPECTION IN PROGRESS",
          bg: "bg-blue-100",
          text: "text-blue-700",
        };

      case "matched":
        return {
          label: "MATCHED",
          bg: "bg-green-100",
          text: "text-green-700",
        };

      case "completed":
        return {
          label: "COMPLETED",
          bg: "bg-purple-100",
          text: "text-purple-700",
        };

      default:
        return {
          label: "MATCHED",
          bg: "bg-green-100",
          text: "text-green-700",
        };
    }
  };

  const status = getStatus();

  return (
    <View className="p-4">
      {/* STATUS */}
      <View className="flex-row items-center mb-4">
        <View className={`${status.bg} px-3 py-1 rounded-full`}>
          <Text className={`${status.text} font-bold text-xs`}>
            {status.label}
          </Text>
        </View>
      </View>

      {/* AGENT CARD */}
      <View
        style={{ backgroundColor: colors.text }}
        className="p-6 rounded-3xl shadow-xl"
      >
        <View className="flex-row justify-between items-start mb-4">
          <View>
            <Text
              style={{ color: colors.background }}
              className="text-2xl font-bold"
            >
              {name}
            </Text>

            <Text
              style={{ color: colors.background }}
              className="text-sm opacity-80"
            >
              {agencyName}
            </Text>
          </View>

          <View className="bg-white/10 px-2 py-1 rounded-lg flex-row items-center">
            <Text className="text-yellow-400 mr-1">⭐</Text>

            <Text
              style={{ color: colors.background }}
              className="font-bold"
            >
              {rating}
            </Text>
          </View>
        </View>

        <View
          style={{ backgroundColor: colors.background }}
          className="h-px w-full mb-4 opacity-20"
        />

        <View className="flex-row justify-between">
          <View>
            <Text
              style={{ color: colors.background }}
              className="text-xs uppercase tracking-widest opacity-70"
            >
              Distance
            </Text>

            <Text
              style={{ color: colors.background }}
              className="font-semibold"
            >
              {distanceKm} km away
            </Text>
          </View>

          <View className="items-end">
            <Text
              style={{ color: colors.background }}
              className="text-xs uppercase tracking-widest opacity-70"
            >
              Contact
            </Text>

            <Text
              style={{ color: colors.background }}
              className="font-semibold"
            >
              {phone}
            </Text>
          </View>
        </View>
      </View>

      {/* STATUS MESSAGE */}
      <View className="mt-4">
        <Text className="text-white text-center text-sm">
          {requestStatus === "inspection_started"
            ? "Your agent is on the way and inspection has started."
            : "An agent has been assigned to your request."}
        </Text>
      </View>

      {/* ACTIONS */}
      <View className="mt-6">
        <Pressable
          style={{ backgroundColor: colors.text }}
          className="w-full py-4 mb-4 rounded-2xl items-center"
          onPress={() =>
            router.push({
              pathname: "/(utilities)/agent-available-properties",
              params: {
                agentId: agent?.agentId,
                name: agent?.name,
                agency: agent?.agencyName,

                requestId: request?.requestId,
                clientId: request?.clientId,
                propertyType: request?.propertyType,
                lat: String(request?.lat || ""),
                lng: String(request?.lng || ""),
              },
            })
          }
        >
          <Text
            style={{ color: colors.background }}
            className="font-bold text-base"
          >
            View Agent Profile
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setMatchData(null)}
          className="w-full py-4 rounded-2xl items-center border border-gray-600"
        >
          <Text className="font-semibold text-base text-white">
            Request Rematch
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default Matched;