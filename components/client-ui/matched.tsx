import { useTheme } from "@/hooks/use-theme";
import { API } from "@/services/api";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { CaretLeft } from "phosphor-react-native";
import React from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";

interface AgentProps {
  agentId?: string;
  name?: string;
  phone?: string;
  agencyName?: string;
  rating?: string | number;
  distanceKm?: string | number;
  avatar?: string;
  lastSeen?: string;
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

  const name = agent?.name ? `AGENT: ${agent.name}` : "AGENT: Benjamin Y.";
  const phone = agent?.phone || "Not Available";
  const rating = agent?.rating || "5";
  const distance =
    agent?.distanceKm !== undefined ? `${agent.distanceKm}km` : "0.03km";
  const lastSeen = agent?.lastSeen || "1 MIN AGO";
  const avatar =
    agent?.avatar ||
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150";

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
          bg: "bg-emerald-100",
          text: "text-emerald-700",
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
          bg: "bg-emerald-100",
          text: "text-emerald-700",
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
    <View className="p-4 flex-1 bg-black justify-start">
      {/* STATUS BADGE */}
      <View className="flex-row items-center mb-2">
        <View className="bg-[#22C55E]/20 px-3 py-1 rounded-full border border-[#22C55E]/30">
          <Text className="text-[#4ADE80] font-bold text-xs tracking-wider">
            {status.label}
          </Text>
        </View>
      </View>

      {/* STATUS MESSAGE */}
      <View className="mb-6">
        <Text
          style={{ color: colors.text }}
          className="text-left text-sm opacity-70"
        >
          {requestStatus === "inspection_started"
            ? "Your agent is on the way and inspection has started."
            : "An agent has been assigned to your request."}
        </Text>
      </View>

      {/* AGENT CARD */}
      <View
        style={{ backgroundColor: "#161616", borderColor: "#262626" }}
        className="p-5 rounded-3xl border shadow-2xl mb-6"
      >
        <View className="flex-row items-center">
          {/* Avatar */}
          <Image
            source={{ uri: avatar }}
            className="w-16 h-16 rounded-full mr-4 bg-gray-700"
          />

          {/* Details */}
          <View className="flex-1 justify-center">
            <View className="flex-row justify-between items-start">
              <Text className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-0.5">
                AGENT NAME
              </Text>

              {/* Rating Badge */}
              <View className="bg-[#2A261B] px-2 py-0.5 rounded-md flex-row items-center border border-[#4B401B]">
                <Text className="text-yellow-400 text-xs mr-1">★</Text>
                <Text className="text-yellow-400 font-bold text-xs">
                  {rating}
                </Text>
              </View>
            </View>

            <Text
              className="text-white text-base font-bold tracking-tight mb-3"
              numberOfLines={1}
            >
              {name}
            </Text>

            <View className="flex-row justify-between items-center pr-2">
              <View>
                <Text className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
                  DISTANCE
                </Text>
                <Text className="text-white font-semibold text-sm">
                  {distance}
                </Text>
              </View>

              <View>
                <Text className="text-[10px] uppercase tracking-widest text-gray-400 font-medium text-right">
                  LAST SEEN
                </Text>
                <Text className="text-gray-300 font-semibold text-xs mt-0.5">
                  {lastSeen}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ACTIONS */}
      {requestStatus === "inspection_started" ? (
        <View className="mt-2 gap-4 items-center flex-col">
          <TouchableOpacity
            style={{
              backgroundColor: colors.background,
              borderColor: colors.text,
            }}
            className="w-full h-14 rounded-2xl items-center justify-center border"
            onPress={handlePropertyView}
          >
            <Text
              style={{ color: colors.text }}
              className="font-bold text-base"
            >
              Explore Property Details
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="mt-2 flex-row gap-3 items-center">
          <TouchableOpacity
            onPress={handleCancel}
            style={{ backgroundColor: "#161616", borderColor: "#262626" }}
            className="w-16 h-14 rounded-2xl items-center justify-center border"
          >
            <CaretLeft color="#9CA3AF" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: "#0055FF" }}
            className="flex-1 h-14 rounded-2xl items-center justify-center shadow-lg"
            onPress={handlePropertyView}
          >
            <Text className="text-white font-bold text-base tracking-wide">
              Explore Property Details
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {requestStatus === "matched" ? (
        <TouchableOpacity
          className="w-full h-14 rounded-2xl items-center justify-center border border-red-500/40 bg-red-500/10 mt-4"
          onPress={() => cancelRequest(matchData?.requestId || "")}
        >
          <Text className="text-base font-semibold text-red-400">
            Cancel Match
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default Matched;
