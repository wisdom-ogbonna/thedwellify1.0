import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

  if (normalized.includes("hotel")) {
    return "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600";
  }

  if (normalized.includes("apartment")) {
    return "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=600";
  }

  if (normalized.includes("shortlet")) {
    return "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=600";
  }

  if (normalized.includes("rent")) {
    return "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=600";
  }

  if (normalized.includes("sale")) {
    return "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600";
  }

  if (normalized.includes("land")) {
    return "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600";
  }

  if (normalized.includes("house")) {
    return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600";
  }

  return "https://images.unsplash.com/photo-1600607687931-cecebd80d62f?auto=format&fit=crop&q=80&w=600";
};

export default function Request({
  PROPERTY_TYPES,
  selectedType,
  setSelectedType,
  handleRequest,
  loading,
}: RequestProps): React.JSX.Element {
  const { colors, isDark } = useTheme();

  const [listingMode, setListingMode] = useState<"buy" | "rent">("buy");

  const primaryColor = colors.primary || "#0066FF";

  const cardBg = isDark ? "#18181B" : "#FFFFFF";

  const borderColor = isDark ? "#27272A" : "#E2E8F0";

  const secondaryText = isDark ? "#A1A1AA" : "#64748B";

  const router = useRouter();

  return (
    <View
      className="flex-1 relative"
      style={{ backgroundColor: colors.background }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 105,
        }}
      >
        {/* HEADER */}
        <View className="px-6 pt-7 mb-6">
          <Text
            style={{ color: colors.text }}
            className="text-3xl font-black tracking-tight leading-[40px] mb-2"
          >
            Find Your Next Premium Stay
          </Text>

          <Text
            style={{ color: secondaryText }}
            className="text-[14px] font-medium"
          >
            Discover tailored properties designed for your lifestyle.
          </Text>
        </View>

        {/* BUY / RENT SWITCH */}
        <View className="px-6 mb-7">
          <View
            className="w-full h-13 rounded-full p-1 flex-row"
            style={{
              backgroundColor: isDark ? "#151C2B" : "#F1F5F9",
              borderWidth: 1,
              borderColor: borderColor,
            }}
          >
            {/* BUY */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setListingMode("buy")}
              className="flex-1 rounded-full flex-row items-center justify-center"
              style={{
                backgroundColor:
                  listingMode === "buy" ? primaryColor : "transparent",
              }}
            >
              <Ionicons
                name="home"
                size={18}
                color={listingMode === "buy" ? "#FFFFFF" : secondaryText}
              />

              <Text
                className="ml-2 text-[14px] font-medium"
                style={{
                  color: listingMode === "buy" ? "#FFFFFF" : secondaryText,
                }}
              >
                Buy
              </Text>
            </TouchableOpacity>

            {/* RENT */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setListingMode("rent")}
              className="flex-1 rounded-full flex-row items-center justify-center"
              style={{
                backgroundColor:
                  listingMode === "rent" ? primaryColor : "transparent",
              }}
            >
              <Ionicons
                name="key-outline"
                size={18}
                color={listingMode === "rent" ? "#FFFFFF" : secondaryText}
              />

              <Text
                className="ml-2 text-[14px] font-medium"
                style={{
                  color: listingMode === "rent" ? "#FFFFFF" : secondaryText,
                }}
              >
                Rent
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PROPERTY TYPES */}
        <View className="mb-6">
          <View className="px-6 mb-4">
            <Text
              style={{ color: colors.text }}
              className="text-[16px] font-bold"
            >
              What are you looking for?
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 8,
              gap: 12,
            }}
            decelerationRate="fast"
          >
            {PROPERTY_TYPES.map((type: string) => {
              const active = selectedType === type;

              return (
                <TouchableOpacity
                  key={type}
                  activeOpacity={0.85}
                  onPress={() => setSelectedType(type)}
                  style={{
                    width: CARD_WIDTH,
                    backgroundColor: active ? primaryColor : cardBg,
                    borderColor: active ? primaryColor : borderColor,
                    borderWidth: active ? 2 : 1,
                  }}
                  className="rounded-[20px] p-2.5 min-h-35.75"
                >
                  {/* IMAGE */}
                  <View className="w-full h-19 rounded-[15px] overflow-hidden bg-gray-200 relative">
                    <Image
                      source={{
                        uri: getPremiumImage(type),
                      }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />

                    {/* SELECTED ICON */}
                    {active && (
                      <View
                        className="absolute bottom-2 left-2 w-7 h-7 rounded-full items-center justify-center"
                        style={{
                          backgroundColor: primaryColor,
                        }}
                      >
                        <Ionicons name="home" size={15} color="#FFFFFF" />
                      </View>
                    )}
                  </View>

                  {/* TEXT */}
                  <View className="px-1.5 pt-2">
                    <Text
                      style={{
                        color: active ? "#FFFFFF" : colors.text,
                      }}
                      className="text-[14px] font-bold"
                    >
                      {type}
                    </Text>

                    <Text
                      style={{
                        color: active
                          ? "rgba(255,255,255,0.75)"
                          : secondaryText,
                      }}
                      className="text-[11px] font-medium mt-0.5"
                    >
                      {listingMode === "buy"
                        ? `Buy ${type.toLowerCase()}`
                        : `Rent ${type.toLowerCase()}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* CUSTOM PROPERTY REQUEST */}
        <View className="px-6 mb-1">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/(utilities)/request-custom-property")}
            style={{
              backgroundColor: isDark ? "#151C2B" : "#F8FAFC",
              borderColor: borderColor,
            }}
            className="w-full rounded-[20px] border p-4 flex-row items-center"
          >
            {/* ICON */}
            <View
              className="w-12 h-12 rounded-[14px] items-center justify-center mr-4"
              style={{
                backgroundColor: isDark ? "rgba(0,102,255,0.18)" : "#E8F1FF",
              }}
            >
              <Ionicons name="home-outline" size={23} color={primaryColor} />
            </View>

            {/* TEXT */}
            <View className="flex-1">
              <Text
                style={{ color: colors.text }}
                className="text-[14px] font-bold mb-1"
              >
                Request Custom Property
              </Text>

              <Text
                style={{ color: secondaryText }}
                className="text-[11px] font-medium leading-[16px] mr-4"
                numberOfLines={2}
              >
                Tell us what you&apos;re looking for and we&apos;ll find the best options.
              </Text>
            </View>

            {/* ARROW */}
            <Ionicons name="chevron-forward" size={20} color={secondaryText} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* BOTTOM REQUEST BUTTON */}
      <View
        className="absolute bottom-0 w-full px-6 pt-3 pb-5"
        style={{
          backgroundColor: colors.background,
        }}
      >
        <TouchableOpacity
          onPress={handleRequest}
          disabled={loading}
          activeOpacity={0.85}
          style={{
            backgroundColor: primaryColor,
            opacity: loading ? 0.8 : 1,
          }}
          className="w-full h-14 rounded-2xl items-center justify-center flex-row shadow-lg"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>

              <Text className="text-white font-bold text-[16px] ml-2 mr-2">
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
