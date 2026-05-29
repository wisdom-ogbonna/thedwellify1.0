import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "expo-router";
import { CaretRight, Star } from "phosphor-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const profileImage = require("../../../assets/images/icon.png");

// PROFILE TEMPLATE (Fallback / Local asset reference)
const profile = {
  ImageSrc: profileImage,
};

type MiniProfileProps = {
  name: string;
  rating: number | null;
};

const MAX_RATING = 5;

export default function MiniProfile({ name, rating }: MiniProfileProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const currentRating = rating ?? 5;

  const filledStars = Array(Math.min(currentRating, MAX_RATING)).fill(0);
  const outlineStars = Array(Math.max(0, MAX_RATING - currentRating)).fill(0);

  // Helper to safely append alpha values to hex color tokens if needed
  const getAlphaColor = (hex: string, alphaHex: string) => {
    return hex.startsWith("#") && hex.length === 7 ? `${hex}${alphaHex}` : hex;
  };

  return (
    <TouchableOpacity
      onPress={() => router.push("/(product)/agent-profile")}
      activeOpacity={0.85}
      className="flex-row items-center p-4 rounded-2xl w-full"
      style={{
        minHeight: 76,
        // Uses a subtle ~6% opacity layout plate driven by your text color
        // to handle dark/light contrast perfectly without manual overrides
        backgroundColor: getAlphaColor(colors.text, "0F"),
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Profile Image with polished ring wrapper */}
      <View className="relative">
        <Image
          source={profile.ImageSrc}
          className="w-14 h-14 rounded-full border"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.background,
          }}
        />
      </View>

      {/* Text Content (Name and Rating) */}
      <View className="flex-1 ml-4 justify-center">
        <Text
          numberOfLines={1}
          className="text-lg font-black tracking-tight"
          style={{ color: colors.text }}
        >
          {name}
        </Text>

        {/* Dynamic Theme Rating Row */}
        <View className="flex-row items-center mt-1.5" style={{ gap: 4 }}>
          {filledStars.map((_, index) => (
            <Star
              key={`filled-${index}`}
              size={18}
              color={colors.tint}
              weight="fill"
            />
          ))}

          {outlineStars.map((_, index) => (
            <Star
              key={`outline-${index}`}
              size={18}
              color={colors.placeholder}
              weight="regular"
            />
          ))}
        </View>
      </View>

      {/* Crisp Navigation Caret */}
      <CaretRight size={22} color={colors.text} weight="bold" />
    </TouchableOpacity>
  );
}
