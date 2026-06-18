import { useTheme } from "@/hooks/use-theme";
import React from "react";
import { ActivityIndicator, TouchableOpacity, Text, View } from "react-native";

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
  const { colors } = useTheme();

  return (
    <View className="px-1">
      <Text
        style={{ color: colors.text }}
        className="text-3xl font-extrabold mb-6"
      >
        Find Property
      </Text>

      <View
        style={{
          backgroundColor: colors.text,
          borderColor: colors.border,
        }}
        className="p-5 border rounded-3xl mb-5 shadow-sm"
      >
        <Text
          style={{ color: colors.background }}
          className="opacity-50 text-xs font-bold uppercase tracking-widest mb-3"
        >
          Your Location
        </Text>

        {locationLoading ? (
          <View className="py-2 items-start">
            <ActivityIndicator color={colors.background} />
          </View>
        ) : (
          <>
            <Text
              style={{ color: colors.background }}
              className="font-semibold text-base"
            >
              {address || "Locating..."}
            </Text>
          </>
        )}

        <TouchableOpacity
          onPress={getLocation}
          className="mt-4 active:opacity-60"
        >
          <Text style={{ color: colors.placeholder }} className="font-bold">
            Refresh Location
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={{ backgroundColor: "transparent" }}
        className="p-5 rounded-3xl mb-8"
      >
        <Text
          style={{ color: colors.text }}
          className="opacity-50 text-sm font-bold uppercase tracking-widest mb-4"
        >
          Property Type
        </Text>

        <View className="flex-row gap-3">
          {PROPERTY_TYPES.map((type: string) => {
            const active = selectedType === type;

            return (
              <TouchableOpacity
                key={type}
                onPress={() => setSelectedType(type)}
                style={{
                  backgroundColor: active ? colors.text : colors.background,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.text,
                }}
                className="flex-1 py-3 rounded-2xl items-center transition-all"
              >
                <Text
                  style={{ color: active ? colors.background : colors.text }}
                  className="text-sm font-bold"
                >
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        onPress={handleRequest}
        disabled={loading}
        style={{ backgroundColor: colors.primary }}
        className="w-full py-5 rounded-2xl items-center border border-white/50 shadow-lg active:scale-[0.98]"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-lg uppercase tracking-tight">
            Request Match
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default Request;
