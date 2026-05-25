import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

const PropertyCard = ({ item }: { item: any }) => {
  const { colors } = useTheme();
  const router = useRouter();

  const handleNavigation = () => {
    router.push({
      pathname: "/(utilities)/[id]",
      params: { id: item.id },
    });
  };

  return (
    <View className="mb-8 mt-2 active:opacity-95">
      <View className="rounded-4xl overflow-hidden mb-3">
        <Image
          source={{ uri: item.image || item.images?.[0] }}
          className="w-full h-64 bg-gray-100"
          resizeMode="cover"
        />
      </View>

      <View className="mt-3">
        {/* Price & View Property Action Button */}
        <View className="flex-row justify-between items-end">
          <View>
            <Text
              style={{ color: colors.text }}
              className="text-xl font-semibold mb-1 tracking-tight"
              numberOfLines={1}
            >
              {item.location || "Location not available"}
            </Text>
            <Text
              style={{ color: colors.text }}
              className="text-3xl font-black tracking-tight"
            >
              $
              {item.price ? item.price.toLocaleString() : "Price not available"}
            </Text>
          </View>

          <Pressable
            onPress={handleNavigation}
            className="px-7 py-5 rounded-xl active:opacity-90"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-bold text-lg tracking-wide">
              View Property
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default PropertyCard;
