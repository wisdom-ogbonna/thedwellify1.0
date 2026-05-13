import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "phosphor-react-native";
import { API } from "../../services/api";
import { stopRingtone } from "../../services/ringtone";

export default function RequestDetailsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { requestId, propertyType, lat, lng, clientName } =
    useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  const handleAction = async (
    endpoint: string,
    successMsg: string,
    nav: string
  ) => {
    if (!requestId) return;
    setLoading(true);
    try {
      // ✅ STOP SOUND
      await stopRingtone();
      await API.post(endpoint, { requestId });
      Alert.alert("Success", successMsg);
      router.replace(nav as any);
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.error || "Action failed");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
  return () => {
    stopRingtone();
  };
}, []);

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background, paddingTop: insets.top }}
    >
      {/* Close Header */}
      <View className="px-8 py-4 flex-row justify-end">
        <Pressable
          onPress={() => router.replace("/(agent)/dashboard")}
          className="p-2 rounded-full"
        >
          <X size={30} color={colors.text} weight="bold" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 32 }}>
        <Text
          className="text-sm font-bold uppercase tracking-widest opacity-40 mb-2"
          style={{ color: colors.text }}
        >
          New Request
        </Text>
        <Text
          className="text-5xl font-black tracking-tighter mb-12"
          style={{ color: colors.text }}
        >
          Details.
        </Text>

        {/* Details Card */}
        <View
          className="border-2 rounded-3xl p-8 mb-8"
          style={{ borderColor: colors.border }}
        >
          <DetailRow label="Client" value={clientName as string} />
          <DetailRow label="Property Type" value={propertyType as string} />
          <DetailRow label="Coordinates" value={`${lat}, ${lng}`} />
          <DetailRow label="Request ID" value={requestId as string} isLast />
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-4">
          <Pressable
            onPress={() =>
              handleAction(
                "/client/request/decline",
                "Request declined",
                "/(agent)/dashboard"
              )
            }
            className="flex-1 py-5 rounded-full border-2 items-center"
            style={{ borderColor: colors.border }}
          >
            <Text
              className="font-bold uppercase tracking-widest"
              style={{ color: colors.text }}
            >
              Decline
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              handleAction(
                "/client/request/accept",
                "Request accepted",
                "/(utilities)/inspection?requestId=" + requestId
              )
            }
            className="flex-1 py-5 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-bold text-white uppercase tracking-widest">
                Accept
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const DetailRow = ({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) => {
  const { colors } = useTheme();
  return (
    <View
      className={`py-4 ${!isLast ? "border-b-2" : ""}`}
      style={{ borderColor: colors.border }}
    >
      <Text
        className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1"
        style={{ color: colors.text }}
      >
        {label}
      </Text>
      <Text className="text-lg font-semibold" style={{ color: colors.text }}>
        {value || "N/A"}
      </Text>
    </View>
  );
};
