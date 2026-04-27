import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";

export default function NotFound() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View
      className="flex-1 px-8 justify-center items-center"
      style={{ backgroundColor: colors.background }}
    >
      {/* Visual Indicator */}
      <Text
        className="text-8xl font-black opacity-10 mb-4"
        style={{ color: colors.text }}
      >
        404
      </Text>

      {/* Message */}
      <Text
        className="text-3xl font-black tracking-tighter text-center"
        style={{ color: colors.text }}
      >
        Space not found.
      </Text>
      <Text
        className="text-lg mt-4 text-center opacity-60 px-4"
        style={{ color: colors.text }}
      >
        It seems the property or page you are looking for has been moved or
        doesn't exist.
      </Text>

      {/* Navigation Action */}
      <Pressable
        onPress={() => router.replace("/")}
        className="mt-12 py-4 px-8 rounded-full border-2 items-center justify-center"
        style={{ borderColor: colors.primary }}
      >
        <Text className="font-bold text-lg" style={{ color: colors.primary }}>
          Return Home
        </Text>
      </Pressable>
    </View>
  );
}
