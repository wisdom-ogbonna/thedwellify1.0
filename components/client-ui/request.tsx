import { useTheme } from "@/hooks/use-theme";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// 1. Map the icons using public folder URI strings
const iconMap: Record<string, string> = {
  hotel: "/icons/icon-hotel.png",
  apartment: "/icons/icon-apartment.png",
  shortlet: "/icons/icon-shortlet.png",
  land: "/icons/icon-land.png",
  house: "/icons/icon-house.png",
};

function Request({
  locationLoading,
  address,
  getLocation,
  PROPERTY_TYPES,
  selectedType,
  setSelectedType,
  handleRequest,
  loading,
}: any): React.JSX.Element {
  const { colors, isDark } = useTheme();

  return (
    <View className="px-4 pt-2">
      {/* Header section with title and image placeholder / card */}
      <View className="flex-row justify-between items-start mb-6">
        <View className="flex-1 pr-4">
          <Text
            style={{ color: colors.text }}
            className="text-3xl font-extrabold tracking-tight leading-tight"
          >
            Find Your <Text style={{ color: "#0066FF" }}>Perfect</Text>
            {"\n"}Property
          </Text>
          <Text
            style={{ color: colors.text }}
            className="opacity-60 text-md mt-1"
          >
            Discover amazing places to stay
          </Text>
        </View>

        {/* Top-right card image element matching design */}
        <View
          className="w-23 h-23 rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
          style={{ backgroundColor: colors.background }}
        >
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
            }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Location Card */}
      <View
        style={{
          backgroundColor: colors.background,
          borderColor: isDark ? colors.border : "#EAEAEA",
        }}
        className={`p-5 border rounded-3xl mb-6 shadow-sm ${isDark ? "shadow-white/10" : "shadow-gray-200/50"}`}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <Ionicons name="location" size={18} color="#FF3B30" />
            <Text style={{ color: colors.text }} className="text-md font-bold">
              Your Location
            </Text>
          </View>

          <TouchableOpacity onPress={getLocation} className="p-1">
            <Ionicons name="refresh" size={18} color="#0066FF" />
          </TouchableOpacity>
        </View>

        {locationLoading ? (
          <View className="py-3 items-start">
            <ActivityIndicator color={colors.text} />
          </View>
        ) : (
          <Text
            style={{ color: colors.text }}
            className="text-md opacity-80 leading-snug mt-1 mb-4"
          >
            {address || "Locating..."}
          </Text>
        )}

        <TouchableOpacity
          onPress={getLocation}
          style={{
            backgroundColor: isDark ? "rgba(0,102,255,0.15)" : "#F0F5FF",
          }}
          className="w-full py-3.5 rounded-2xl items-center flex-row justify-center gap-2 active:opacity-60 mt-1"
        >
          <Ionicons name="locate-outline" size={16} color="#0066FF" />
          <Text className="font-semibold text-md" style={{ color: "#0066FF" }}>
            Use my current location
          </Text>
        </TouchableOpacity>
      </View>

      {/* Property Type Section */}
      <View className="mb-8">
        <Text style={{ color: colors.text }} className="text-md font-bold mb-3">
          Property Type
        </Text>

        <View className="flex-row flex-wrap gap-3">
          {PROPERTY_TYPES.map((type: string) => {
            const active = selectedType === type;

            return (
              <TouchableOpacity
                key={type}
                onPress={() => setSelectedType(type)}
                style={{
                  backgroundColor: colors.background,
                  borderColor: active
                    ? "#0066FF"
                    : isDark
                      ? colors.border
                      : "#EAEAEA",
                }}
                className={`flex-1 min-w-[30%] py-4 px-3 rounded-2xl items-center border-[1.5px] relative ${
                  active ? "bg-blue-50/10" : ""
                }`}
              >
                <View className="h-10 w-10 items-center justify-center mb-2">
                  <Image
                    source={{
                      uri: iconMap[type.toLowerCase()] || iconMap["hotel"],
                    }}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                </View>

                <Text
                  style={{ color: colors.text }}
                  className={`text-md font-bold ${active ? "text-blue-600" : ""}`}
                >
                  {type}
                </Text>

                {active && (
                  <View className="absolute top-2 right-2">
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#0066FF"
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Request Match Action Button */}
      <TouchableOpacity
        onPress={handleRequest}
        disabled={loading}
        style={{ backgroundColor: "#0066FF" }}
        className="w-full py-4 rounded-2xl items-center flex-row justify-center gap-2 shadow-lg active:scale-[0.98]"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text className="text-white font-bold text-lg">Request Match</Text>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </>
        )}
      </TouchableOpacity>

      <Text
        style={{ color: colors.text }}
        className="text-center opacity-40 text-md mt-4"
      >
        We&apos;ll find the best properties for you
      </Text>
    </View>
  );
}

export default Request;
