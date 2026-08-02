import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";

interface RequestProps {
  locationLoading: boolean;
  address: string;
  getLocation: () => void;
  PROPERTY_TYPES: string[];
  selectedType: string;
  setSelectedType: (type: string) => void;
  handleRequest: () => void;
  loading: boolean;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.42;

const getPremiumImage = (type: string): string => {
  const normalized = type.toLowerCase();

  if (normalized.includes("hotel"))
    return "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600";
  if (normalized.includes("apartment"))
    return "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=600";
  if (normalized.includes("shortlet"))
    return "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=600";
  if (normalized.includes("rent"))
    return "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=600";
  if (normalized.includes("sale"))
    return "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600";
  if (normalized.includes("land"))
    return "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600";
  if (normalized.includes("house"))
    return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600";

  return "https://images.unsplash.com/photo-1600607687931-cecebd80d62f?auto=format&fit=crop&q=80&w=600";
};

export default function Request({
  locationLoading,
  address,
  getLocation,
  PROPERTY_TYPES,
  selectedType,
  setSelectedType,
  handleRequest,
  loading,
}: RequestProps): React.JSX.Element {
  const { colors, isDark } = useTheme();

  const primaryColor = colors.primary || "#0066FF";
  const mutedBg = isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9";
  const cardBg = isDark ? "#18181B" : "#FFFFFF";
  const borderColor = isDark ? "#27272A" : "#E2E8F0";
  const secondaryText = isDark ? "#A1A1AA" : "#64748B";

  return (
    <View
      className="flex-1 relative"
      style={{ backgroundColor: colors.background }}
    >
      <View className="pb-[140px] pt-5">
        <View className="px-6 mb-8 mt-4">
          <Text
            style={{ color: colors.text }}
            className="text-[34px] font-black tracking-tight leading-[40px] mb-3"
          >
            Find Your Next Premium Stay
          </Text>
          <Text
            style={{ color: secondaryText }}
            className="text-lg font-medium"
          >
            Discover tailored properties designed for your lifestyle.
          </Text>
        </View>

        <View className="px-6 mb-12">
          <TouchableOpacity
            onPress={getLocation}
            activeOpacity={0.7}
            style={{
              backgroundColor: cardBg,
              borderColor: borderColor,
              borderWidth: 1,
            }}
            className="flex-row items-center rounded-3xl p-3 pr-5 shadow-sm shadow-black/5"
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: mutedBg }}
            >
              <Ionicons name="location" size={22} color={primaryColor} />
            </View>

            <View className="flex-1 justify-center">
              <Text
                style={{ color: secondaryText }}
                className="text-[11px] uppercase font-bold tracking-wider mb-1"
              >
                Current Location
              </Text>
              {locationLoading ? (
                <ActivityIndicator
                  color={primaryColor}
                  size="small"
                  style={{ alignSelf: "flex-start" }}
                />
              ) : (
                <Text
                  style={{ color: colors.text }}
                  className="text-[15px] font-semibold"
                  numberOfLines={1}
                >
                  {address || "Tap to detect your location..."}
                </Text>
              )}
            </View>

            <View
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? "#27272A" : "#F8FAFC" }}
            >
              <Ionicons
                name="refresh"
                size={16}
                color={isDark ? "#E4E4E7" : "#475569"}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View className="mb-8">
          <View className="px-6 mb-5 flex-row justify-between items-end">
            <Text style={{ color: colors.text }} className="text-xl font-bold">
              What are you looking for?
            </Text>

            <View className="flex-row items-center opacity-70 bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-full">
              <Text
                style={{ color: secondaryText }}
                className="text-[11px] font-bold uppercase tracking-wider mr-1"
              >
                Swipe
              </Text>
              <Ionicons name="arrow-forward" size={12} color={secondaryText} />
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
            snapToInterval={CARD_WIDTH + 16}
            decelerationRate="fast"
          >
            {PROPERTY_TYPES.map((type: string) => {
              const active = selectedType === type;

              return (
                <TouchableOpacity
                  key={type}
                  activeOpacity={0.8}
                  onPress={() => setSelectedType(type)}
                  style={{
                    width: CARD_WIDTH,
                    backgroundColor: active ? primaryColor : cardBg,
                    borderColor: active ? primaryColor : borderColor,
                    borderWidth: active ? 2 : 1,
                  }}
                  className="rounded-[28px] p-3 flex-col justify-between shadow-sm shadow-black/5 min-h-55"
                >
                  <View className="w-full h-30 rounded-[20px] overflow-hidden bg-gray-200 mb-4 relative">
                    <Image
                      source={{ uri: getPremiumImage(type) }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    {active && (
                      <View
                        style={{ backgroundColor: colors.primary }}
                        className="absolute top-2 right-2 backdrop-blur-md rounded-full p-1.5 shadow-md"
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#FFFFFF"
                        />
                      </View>
                    )}
                  </View>

                  <View className="px-2 pb-2">
                    <Text
                      style={{
                        color: active ? "#FFFFFF" : colors.text,
                      }}
                      className="text-[17px] font-bold tracking-tight mb-1 capitalize"
                    >
                      {type}
                    </Text>
                    <Text
                      style={{
                        color: active ? "rgba(255,255,255,0.8)" : secondaryText,
                      }}
                      className="text-[12px] font-medium"
                    >
                      Explore {type.toLowerCase()}s
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <View
        className="absolute bottom-0 w-full px-6 pt-4 pb-8"
        style={{
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: borderColor,
        }}
      >
        <TouchableOpacity
          onPress={handleRequest}
          disabled={loading}
          style={{ backgroundColor: primaryColor }}
          className="w-full h-15 rounded-[20px] items-center justify-center flex-row shadow-lg active:scale-[0.98]"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="large" />
          ) : (
            <>
              <Text className="text-white font-bold text-[17px] mr-2">
                Request Match
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
