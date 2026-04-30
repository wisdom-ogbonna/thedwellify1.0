import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { MapPin } from "phosphor-react-native";
import { useTheme } from "@react-navigation/native";

const PropertyCard = ({ item }: { item: any }) => {
  const { colors } = useTheme();

  return (
    <Pressable
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 0.5,
      }}
      className="rounded-4xl overflow-hidden shadow-sm mb-4 active:scale-[0.98] transition-all"
    >
      <View className="relative">
        <Image
          source={{ uri: item.image || item.images?.[0] }}
          className="w-full h-56 bg-gray-200"
          resizeMode="cover"
        />

        <View
          className="absolute top-4 left-4 px-4 py-1.5 rounded-full"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.75)" }} // Primary with opacity
        >
          <Text className="text-white text-[10px] font-black uppercase tracking-widest">
            {item.type || item.propertyType}
          </Text>
        </View>
      </View>

      <View className="p-5">
        <View className="flex-row justify-between items-start mb-2">
          <Text
            style={{ color: colors.text }}
            className="text-xl font-bold flex-1 mr-2"
            numberOfLines={1}
          >
            {item.title}
          </Text>
        </View>

        <View className="flex-row items-center mb-4">
          <MapPin size={14} color={colors.border} weight="bold" />
          <Text
            style={{ color: colors.text }}
            className="text-sm opacity-50 ml-1 font-medium"
            numberOfLines={1}
          >
            {item.location}
          </Text>
        </View>

        <View className="flex-row items-baseline">
          <Text
            style={{ color: colors.text }}
            className="text-2xl font-black"
          >
            {item.price?.toLocaleString()}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default PropertyCard;
