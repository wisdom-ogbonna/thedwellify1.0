import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/hooks/use-theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "phosphor-react-native";
import { API } from "../../services/api";
import * as Location from "expo-location";
import { playRingtone, stopRingtone } from "../../services/ringtone";

export default function RequestDetailsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { requestId, propertyType, lat, lng, clientName } =
    useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [stale, setStale] = useState(false);
  const [staleMessage, setStaleMessage] = useState("");
  const [address, setAddress] = useState("");
  const AGENT_HOME = "/(agent)/agent-dashboard";

  const handleAction = async (
    endpoint: string,
    successMsg: string,
    nav: string
  ) => {
    if (!requestId) return;
    setLoading(true);
    try {
      await stopRingtone();
      await API.post(endpoint, { requestId });
      Alert.alert("Success", successMsg);
      router.replace((nav || AGENT_HOME) as any);
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.error || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const verifyRequest = async () => {
      if (!requestId) {
        setStale(true);
        setStaleMessage("Missing request ID");
        setVerifying(false);
        return;
      }

      try {
        const res = await API.get(`/match/request/${requestId}`);
        const data = res.data;

        if (!data?.actionable) {
          await stopRingtone();
          setStale(true);
          setStaleMessage(
            data?.error ||
              `This request is no longer available (${data?.status || "unknown"}).`,
          );
        } else {
          playRingtone();
        }
      } catch (error: any) {
        await stopRingtone();
        setStale(true);
        setStaleMessage(
          error?.response?.data?.error || "This request is no longer available.",
        );
      } finally {
        setVerifying(false);
      }
    };

    verifyRequest();
    return () => {
      stopRingtone();
    };
  }, [requestId]);

  useEffect(() => {
    const getAddress = async () => {
      try {
        if (!lat || !lng) return;

        const result = await Location.reverseGeocodeAsync({
          latitude: Number(lat),
          longitude: Number(lng),
        });

        if (result.length > 0) {
          const place = result[0];

          const formattedAddress = [
            place.name,
            place.street,
            place.district,
            place.city,
            place.region,
            place.country,
          ]
            .filter(Boolean)
            .join(", ");

          setAddress(formattedAddress);
        }
      } catch (error) {
        console.log("Reverse geocode error:", error);
        setAddress("Address unavailable");
      }
    };

    getAddress();
  }, [lat, lng]);

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background, paddingTop: insets.top }}
    >
      {/* Close Header */}
      <View className="px-8 py-4 flex-row justify-end">
        <TouchableOpacity
          onPress={async () => {
            await stopRingtone();
            router.replace("/(agent)/agent-dashboard");
          }}
          className="p-2 rounded-full"
        >
          <X size={30} color={colors.text} weight="bold" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 32 }}>
        {verifying ? (
          <View className="items-center py-20">
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.text }} className="mt-4">
              Checking request...
            </Text>
          </View>
        ) : stale ? (
          <View className="py-10">
            <Text
              className="text-3xl font-black mb-4"
              style={{ color: colors.text }}
            >
              Request unavailable
            </Text>
            <Text style={{ color: colors.text, opacity: 0.6 }} className="mb-8">
              {staleMessage}
            </Text>
            <TouchableOpacity
              onPress={() => router.replace(AGENT_HOME)}
              className="py-5 rounded-full items-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-bold">Back to dashboard</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!verifying && !stale ? (
          <>
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
          <DetailRow
            label="Property Address"
            value={address || "Loading address..."}
          />
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-4">
          <TouchableOpacity
            onPress={() =>
              handleAction(
                "/client/request/decline",
                "Request declined",
                AGENT_HOME
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
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              handleAction(
                "/client/request/accept",
                "Request accepted",
                // "/(utilities)/inspection?requestId=" + requestId
                AGENT_HOME
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
          </TouchableOpacity>
        </View>
          </>
        ) : null}
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
