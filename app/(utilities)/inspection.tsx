import React, { useState } from "react";
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
import { X, Play } from "phosphor-react-native";
import { API } from "../../services/api";

export default function InspectionScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { requestId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  const startInspection = async () => {
    setLoading(true);
    try {
      await API.post("/agent/inspection/start", { requestId });
      Alert.alert("Success", "Inspection started!");
      
      router.replace(`/(agent)/dashboard?requestId=${requestId}`);
    } catch (error: any) {
      Alert.alert("Error", "Could not start inspection");
      console.error("Start Inspection Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background, paddingTop: insets.top }}
    >
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
          Active Session
        </Text>
        <Text
          className="text-5xl font-black tracking-tighter mb-12"
          style={{ color: colors.text }}
        >
          Inspection.
        </Text>

        <View
          className="border-2 rounded-3xl p-8 mb-8"
          style={{ borderColor: colors.border }}
        >
          <Text
            className="text-lg font-semibold mb-2"
            style={{ color: colors.text }}
          >
            Ready to begin property assessment?
          </Text>
          <Text className="opacity-60" style={{ color: colors.text }}>
            This will record the start time and initialize the digital checklist
            for Request #{requestId}.
          </Text>
        </View>

        <Pressable
          onPress={startInspection}
          disabled={loading}
          className="py-6 rounded-full items-center justify-center flex-row gap-3"
          style={{ backgroundColor: colors.primary }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Play size={20} color="#fff" weight="fill" />
              <Text className="font-bold text-white text-lg uppercase tracking-widest">
                Start Inspection
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
