import { useTheme } from "@/hooks/use-theme";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { CaretLeftIcon } from "phosphor-react-native";
import React from "react";
import { Alert, Pressable, Text, View } from "react-native";

function Matched({ agent, request, requestStatus, setMatchData }: any) {
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

  const handleCancel = () => {
    Alert.alert(
      "Cancel Match",
      "Are you sure you want to cancel this match? This action cannot be undone.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            alert("Match cancelled. Returning to home screen.");
          },
        },
      ],
    );
  };

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

      {/* STATUS MESSAGE */}
      <View className="my-4">
        <Text className="text-black text-center text-sm">
          {requestStatus === "inspection_started"
            ? "Your agent is on the way and inspection has started."
            : "An agent has been assigned to your request."}
        </Text>
      </View>

      {/* AGENT CARD */}
      <View
        style={{ backgroundColor: colors.background }}
        className="p-6 rounded-3xl shadow-xl"
      >
        <View className="flex-row justify-between items-start mb-4">
          <View>
            <Text style={{ color: colors.text }} className="text-2xl font-bold">
              {name}
            </Text>
          </View>

          <View className="bg-white/10 px-2 py-1 rounded-lg flex-row items-center">
            <Text className="text-yellow-400 mr-1">⭐</Text>

            <Text style={{ color: colors.text }} className="font-bold">
              {rating}
            </Text>
          </View>
        </View>

        <View
          style={{ backgroundColor: colors.text }}
          className="h-px w-full mb-4 opacity-20"
        />

        <View className="flex-row justify-between">
          <View className="flex-row flex-1 items-center justify-between">
            <Text
              style={{ color: colors.text }}
              className="text-xs uppercase tracking-widest opacity-70"
            >
              Phone Number
            </Text>

            <Text
              onPress={async () => {
                await Clipboard.setStringAsync(String(phone));
                alert("Phone number copied!");
              }}
              style={{ color: colors.text }}
              className="font-semibold underline"
            >
              {phone}
            </Text>
          </View>
        </View>
      </View>

      {/* ACTIONS */}
      <View className="mt-6 flex-row gap-4">
        <Pressable
          onPress={handleCancel}
          className="w-[20%] h-15 py-2 rounded-2xl items-center justify-center border border-gray-600"
        >
          <CaretLeftIcon color="#000000" size={30} />
        </Pressable>
        <Pressable
          style={{ backgroundColor: colors.primary }}
          className="flex-1 h-15 py-5 mb-4 rounded-2xl items-center"
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
          <Text style={{ color: "#ffffff" }} className="font-bold text-lg">
            View Agent Profile
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default Matched;
