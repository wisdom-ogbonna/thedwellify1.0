import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

function Matched({ agent, request, setMatchData }: any) {
  const { colors } = useTheme();
  const router = useRouter();
  const { name, phone, agencyName, rating, distanceKm } = agent;

  return (
    <View className="p-4">
      <View className="flex-row items-center mb-4">
        <View className="bg-green-100 px-3 py-1 rounded-full">
          <Text className="text-green-700 font-bold text-xs">MATCHED</Text>
        </View>
      </View>

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
            <Text style={{ color: colors.background }} className="text-sm">
              {agencyName}
            </Text>
          </View>
          <View className="bg-white/10 px-2 py-1 rounded-lg flex-row items-center">
            <Text className="text-yellow-400 mr-1">⭐</Text>
            <Text style={{ color: colors.background }} className="font-bold">
              {rating}
            </Text>
          </View>
        </View>

        <View
          style={{ backgroundColor: colors.background }}
          className="h-px w-full mb-4"
        />

        <View className="flex-row justify-between">
          <View>
            <Text
              style={{ color: colors.background }}
              className="text-xs uppercase tracking-widest"
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
              className="text-xs uppercase tracking-widest"
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

      <View className="mt-6 space-y-3">
        <Pressable
          style={{ backgroundColor: colors.text }}
          className="w-full py-4 mb-4 rounded-2xl items-center"
          // Move onPress here and pass the agent data as params
          onPress={() =>
            router.push({
              pathname: "/(utilities)/agent-available-properties",
              params: {
                agentId: agent.agentId,
                name: agent.name,
                agency: agent.agencyName,

                // request data
                requestId: request.requestId,
                clientId: request.clientId,
                propertyType: request.propertyType,
                lat: String(request.lat),
                lng: String(request.lng),
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
          className="w-full py-4 rounded-2xl items-center border border-gray-200"
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
