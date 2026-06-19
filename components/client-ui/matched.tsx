import { useTheme } from "@/hooks/use-theme";
import { API } from "@/services/api";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { BellIcon, CaretLeftIcon } from "phosphor-react-native";
import React from "react";
import { Alert, TouchableOpacity, Text, View } from "react-native";

interface AgentProps {
  agentId?: string;
  name?: string;
  phone?: string;
  agencyName?: string;
  rating?: string | number;
  distanceKm?: string | number;
}

interface RequestProps {
  requestId?: string;
  clientId?: string;
  propertyType?: string;
  lat?: string | number;
  lng?: string | number;
  clientName: string;
}

interface MatchedProps {
  agent: AgentProps;
  request: RequestProps;
  requestStatus: "inspection_started" | "matched" | "completed" | string;
  matchData: any;
  setMatchData?: (data: any) => void;
}

function Matched({
  agent,
  request,
  requestStatus,
  matchData,
  setMatchData,
}: MatchedProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const name = agent?.name || "Agent";
  const phone = agent?.phone || "Not Available";
  const rating = agent?.rating || "5.0";
  const distance = agent?.distanceKm + "km" || "NaN";

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
    Alert.alert("Cancel Match", "Are you sure you want to cancel this match?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: () => {
          Alert.alert("Success", "Match cancelled.");
          setMatchData && setMatchData(null);
        },
      },
    ]);
  };

  const cancelRequest = (requestId: string) => {
    try {
      const handleCancelRequest = async () => {
        console.log(requestId);
        await API.post("/client/cancel-match", {
          requestId,
          reason: "Client cancelled request",
        });

        Alert.alert(
          "Request Cancelled",
          "Request has been successfully cancelled.",
        );
      };

      Alert.alert(
        "Cancel Request",
        "Are you sure you want to cancel this request, you have been matched?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            onPress: handleCancelRequest,
          },
        ],
      );
      if (requestId) return;
    } catch (err: any) {
      console.log("Cancel error:", err.response?.data || err.message);
      Alert.alert("Error", "Failed to cancel the request.");
    }
  };

  const handlePropertyView = () => {
    router.push({
      pathname: "/(utilities)/agent-available-properties",
      params: {
        agentId: agent?.agentId,
        name: agent?.name,
        agency: agent?.agencyName,
        requestId: request?.requestId,
        clientId: request?.clientId,
        clientName: request?.clientName,
        propertyType: request?.propertyType,
        lat: String(request?.lat || ""),
        lng: String(request?.lng || ""),
        phone: agent?.phone,
        rating: agent?.rating,
        status: requestStatus,
      },
    });
  };

  const handleCopyPhone = async () => {
    if (!agent?.phone) {
      Alert.alert("Error", "Phone number is not available.");
      return;
    }
    await Clipboard.setStringAsync(String(phone));
    return;
  };

  return (
    <View className="p-4">
      {/* STATUS BADGE */}
      <View className="flex-row items-center mb-4">
        <View className={`${status.bg} px-3 py-1 rounded-full`}>
          <Text className={`${status.text} font-bold text-xs`}>
            {status.label}
          </Text>
        </View>
      </View>

      {/* STATUS MESSAGE */}
      <View className="my-4">
        <Text
          style={{ color: colors.text }}
          className="text-center text-sm opacity-80"
        >
          {requestStatus === "inspection_started"
            ? "Your agent is on the way and inspection has started."
            : "An agent has been assigned to your request."}
        </Text>
      </View>

      {/* AGENT CARD */}
      <View
        style={{ backgroundColor: colors.background, borderColor: colors.text }}
        className="p-6 rounded-3xl shadow-xl border"
      >
        <View className="flex-row justify-between items-start mb-4">
          <View>
            <Text style={{ color: colors.text }} className="text-2xl font-bold">
              {name}
            </Text>
          </View>

          <View style={{ backgroundColor: colors.background }} className="px-2 py-1 rounded-lg flex-row items-center">
            <Text className="text-yellow-400 mr-1">⭐</Text>
            <Text style={{ color: colors.text }} className="font-bold">
              {rating}
            </Text>
          </View>
        </View>

        <View
          style={{ backgroundColor: colors.background }}
          className="h-px w-full mb-4 opacity-20"
        />

        <View className="flex-row justify-between">
          {requestStatus === "matched" ||
          requestStatus === "inspection_started" ? (
            <View className="flex-row flex-1 items-center justify-between">
              <Text
                style={{ color: colors.text }}
                className="text-xs uppercase tracking-widest opacity-70"
              >
                Phone Number
              </Text>

              <Text
                onPress={handleCopyPhone}
                style={{ color: colors.text }}
                className="font-semibold underline"
              >
                {phone}
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-1 items-center justify-between">
              <Text
                style={{ color: colors.text }}
                className="text-xs uppercase tracking-widest opacity-70"
              >
                Distance
              </Text>

              <Text style={{ color: colors.text }} className="font-semibold">
                {distance}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ACTIONS */}
      {requestStatus === "inspection_started" ? (
        <View className="mt-6 gap-4 items-center flex-col">
          <TouchableOpacity
            style={{ backgroundColor: colors.background, borderColor: colors.text }}
            className="w-full h-14 rounded-2xl items-center justify-center border"
            onPress={handlePropertyView}
          >
            <Text style={{ color: colors.text }} className="font-bold text-base">
              View Agent Listings
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="mt-6 flex-row gap-4 items-center">
          {requestStatus === "matched" ? (
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Notify Agent to start Inspection",
                  "Coming soon...",
                )
              }
              style={{ borderColor: colors.text }}
              className="w-[20%] h-14 rounded-2xl items-center justify-center border opacity-70"
            >
              <BellIcon color={colors.text} size={24} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleCancel}
              style={{ borderColor: colors.text }}
              className="w-[20%] h-14 rounded-2xl items-center justify-center border opacity-70"
            >
              <CaretLeftIcon color={colors.text} size={24} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={{ backgroundColor: colors.primary }}
            className="flex-1 h-14 rounded-2xl items-center justify-center"
            onPress={handlePropertyView}
          >
            <Text className="text-white font-bold text-base">
              View Agent Listings
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {requestStatus === "matched" ? (
        <TouchableOpacity
          className="w-full h-14 rounded-2xl items-center justify-center border border-red-500 mt-4 opacity-70"
          onPress={() => cancelRequest(matchData?.requestId || "")}
        >
          <Text className="text-lg font-semibold text-red-500">
            Cancel Match
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default Matched;
