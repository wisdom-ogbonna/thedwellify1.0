import { useTheme } from "@/hooks/use-theme";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { CaretLeftIcon } from "phosphor-react-native";
import React from "react";
import { Alert, Pressable, Text, View } from "react-native";

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
  setMatchData?: (data: any) => void;
}

function Matched({
  agent,
  request,
  requestStatus,
  setMatchData,
}: MatchedProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const name = agent?.name || "Agent";
  const phone = agent?.phone || "Not Available";
  const rating = agent?.rating || "5.0";
  const agency = agent?.agencyName || "Agency";

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
            Alert.alert(
              "Success",
              "Match cancelled. Returning to home screen.",
            );
            setMatchData && setMatchData(null);
          },
        },
      ],
    );
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
          style={{ color: "#000000" }}
          className="text-center text-sm opacity-80"
        >
          {requestStatus === "inspection_started"
            ? "Your agent is on the way and inspection has started."
            : "An agent has been assigned to your request."}
        </Text>
      </View>

      {/* AGENT CARD */}
      <View
        style={{ backgroundColor: "#FFFFFF" }}
        className="p-6 rounded-3xl shadow-xl"
      >
        <View className="flex-row justify-between items-start mb-4">
          <View>
            <Text style={{ color: "#000000" }} className="text-2xl font-bold">
              {name}
            </Text>
          </View>

          <View className="bg-white px-2 py-1 rounded-lg flex-row items-center">
            <Text className="text-yellow-400 mr-1">⭐</Text>
            <Text style={{ color: "#000000" }} className="font-bold">
              {rating}
            </Text>
          </View>
        </View>

        <View
          style={{ backgroundColor: "#000000" }}
          className="h-px w-full mb-4 opacity-20"
        />

        <View className="flex-row justify-between">
          {requestStatus === "matched" ||
          requestStatus === "inspection_started" ? (
            <View className="flex-row flex-1 items-center justify-between">
              <Text
                style={{ color: "#000000" }}
                className="text-xs uppercase tracking-widest opacity-70"
              >
                Phone Number
              </Text>

              <Text
                onPress={handleCopyPhone}
                style={{ color: "#000000" }}
                className="font-semibold underline"
              >
                {phone}
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-1 items-center justify-between">
              <Text
                style={{ color: "#000000" }}
                className="text-xs uppercase tracking-widest opacity-70"
              >
                Agency
              </Text>

              <Text style={{ color: "#000000" }} className="font-semibold">
                {agency}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ACTIONS */}
      {requestStatus === "inspection_started" ? (
        <View className="mt-6 gap-4 items-center flex-col">
          <Pressable
            style={{ backgroundColor: "#ffffff" }}
            className="w-full h-14 rounded-2xl items-center justify-center border border-black"
            onPress={handlePropertyView}
          >
            <Text className="text-black font-bold text-base">
              View Agent Listings
            </Text>
          </Pressable>
          <Pressable
            className="w-full h-14 rounded-2xl items-center justify-center bg-red-500 mt-1"
            onPress={() => Alert.alert("Forfeit Inspection", "Coming soon...")}
          >
            <Text className="text-white font-bold text-base">
              Forfeit Inspection
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="mt-6 flex-row gap-4 items-center">
          <Pressable
            onPress={handleCancel}
            style={{ borderColor: "#000000" }}
            className="w-[20%] h-14 rounded-2xl items-center justify-center border opacity-70"
          >
            <CaretLeftIcon color={"#000000"} size={24} />
          </Pressable>
          <Pressable
            style={{ backgroundColor: colors.primary }}
            className="flex-1 h-14 rounded-2xl items-center justify-center"
            onPress={handlePropertyView}
          >
            <Text className="text-white font-bold text-base">
              View Agent Listings
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default Matched;
