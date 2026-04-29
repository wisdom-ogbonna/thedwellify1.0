import { useTheme } from "@react-navigation/native";
import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

function Request({
  locationLoading,
  address,
  lat,
  lng,
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
        className="text-3xl font-extrabold mb-6 text-white"
      >
        Find Property
      </Text>

      <View
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
        className="p-5 border rounded-3xl mb-5 shadow-sm"
      >
        <Text
          style={{ color: colors.text }}
          className="opacity-50 text-xs font-bold uppercase tracking-widest mb-3"
        >
          Your Location
        </Text>

        {locationLoading ? (
          <View className="py-2 items-start">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <>
            <Text
              style={{ color: colors.text }}
              className="font-semibold text-base"
            >
              {address || "Locating..."}
            </Text>

            {lat && lng && (
              <Text className="text-gray-500 text-xs mt-1">
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </Text>
            )}
          </>
        )}

        <Pressable onPress={getLocation} className="mt-4 active:opacity-60">
          <Text style={{ color: colors.border }} className="font-bold">
            Refresh Location
          </Text>
        </Pressable>
      </View>

      <View
        style={{ backgroundColor: colors.card }}
        className="p-5 rounded-3xl mb-8"
      >
        <Text
          style={{ color: colors.text }}
          className="opacity-50 text-xs font-bold uppercase tracking-widest mb-4"
        >
          Property Type
        </Text>

        <View className="flex-row gap-3">
          {PROPERTY_TYPES.map((type: string) => {
            const active = selectedType === type;

            return (
              <Pressable
                key={type}
                onPress={() => setSelectedType(type)}
                style={{
                  backgroundColor: active ? colors.primary : colors.background,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                }}
                className="flex-1 py-3 rounded-2xl items-center transition-all"
              >
                <Text
                  style={{ color: active ? "white" : colors.text }}
                  className="text-sm font-bold"
                >
                  {type}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={handleRequest}
        disabled={loading}
        style={{ backgroundColor: colors.primary }}
        className="w-full py-5 rounded-2xl items-center border border-white/50 shadow-lg active:scale-[0.98]"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-lg font-black uppercase tracking-tight">
            Request Match
          </Text>
        )}
      </Pressable>
    </View>
  );
}

export default Request;
