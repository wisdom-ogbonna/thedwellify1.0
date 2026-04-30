import React from "react";
import { View, Text, Image } from "react-native";
import { useTheme } from "@react-navigation/native";
import { SealCheck, MapPin, Bell, CaretRight } from "phosphor-react-native";

interface AgentHeaderProps {
  name: string;
  agencyName: string;
  location: string;
  image?: string;
}

const AgentHeader: React.FC<AgentHeaderProps> = ({
  name,
  agencyName,
  location,
  image,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="flex-row items-center p-4 rounded-3xl border-[0.5px] shadow-sm"
    >
      <View className="shadow-sm">
        <Image
          source={{
            uri: image || "https://via.placeholder.com/150",
          }}
          className="w-14 h-14 rounded-2xl bg-gray-200"
        />
      </View>

      <View className="flex-1 ml-4">
        <View className="flex-row items-center">
          <Text
            style={{ color: colors.text }}
            className="text-lg font-bold tracking-tight"
          >
            {name}
          </Text>
          <SealCheck
            size={18}
            color="#1DA1F2"
            weight="fill"
            style={{ marginLeft: 4 }}
          />
        </View>

        <Text
          style={{ color: colors.text }}
          className="text-sm opacity-60 font-medium"
        >
          {agencyName}
        </Text>

        <View className="flex-row items-center mt-1">
          <MapPin size={14} color={colors.text} weight="bold" />
          <Text
            style={{ color: colors.text }}
            className="text-xs opacity-50 ml-1 font-medium"
          >
            {location}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-x-2">
        <View
          style={{ backgroundColor: colors.background }}
          className="p-2.5 rounded-full"
        >
          <Bell size={22} color={colors.text} weight="regular" />
        </View>
      </View>
    </View>
  );
};

export default AgentHeader;
