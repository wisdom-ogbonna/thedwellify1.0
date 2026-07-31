import { useTheme } from "@/hooks/use-theme";
import { ArrowLeft } from "lucide-react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API } from "../../services/api";

export default function PhoneScreen() {
  const { role } = useLocalSearchParams();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  const getFormattedNumber = (input: string) => {
    let clean = input.replace(/\D/g, "");
    if (clean.length === 11 && clean.startsWith("0")) {
      clean = clean.substring(1);
    }
    return clean;
  };

  const processedPhone = getFormattedNumber(phone);
  const isValid = processedPhone.length === 10;

  const sendOTP = async () => {
    if (!isValid) return;
    try {
      setLoading(true);

      const res = await API.post("/otp/send", {
        phone_number: `+234${processedPhone}`,
      });

      const pinId = res.data?.pin_id;

      if (!pinId) {
        throw new Error("Server did not return a pin_id");
      }

      router.push({
        pathname: "/(auth)/otp",
        params: {
          phone: `+234${processedPhone}`,
          pinId: pinId,
          role: role,
        },
      });
    } catch (err: any) {
      alert(err?.response?.data?.error || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>

      {/* Back Button */}
      <View className="mt-6 px-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 items-center justify-center rounded-2xl border"
          style={{
            backgroundColor: "#F8FAFC",
            borderColor: "#F1F5F9",
          }}
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Centered Typography Header */}
      <View className="px-10 mt-6 items-center">
        <Text
          className="text-5xl font-extrabold mb-4 tracking-tight text-center"
          style={{ color: colors.text }}
        >
          Let&apos;s get you <Text style={{ color: colors.primary }}>in</Text>.
        </Text>
        <Text className="text-slate-400 text-lg mt-4 leading-6 text-center font-normal px-2">
          Enter your phone number to receive a one-time verification code.
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="px-6 mt-12">
          {/* Input Label */}
          <Text style={{ color: colors.text }} className="font-bold text-xl mb-2 px-1">
            Phone Number
          </Text>

          {/* Unified Styled Input Container */}
          <View
            className="flex-row items-center h-16 px-4 rounded-2xl border"
            style={{
              borderColor: "#E2E8F0",
              backgroundColor: "#FFFFFF",
            }}
          >
            {/* Country Badge */}
            <View
              className="flex-row items-center h-10 px-3 rounded-xl mr-3"
              style={{ backgroundColor: "#F8FAFC" }}
            >
              <Text className="text-xl mr-1.5">🇳🇬</Text>
              <Text className="text-xl font-semibold text-slate-800">
                +234
              </Text>
            </View>

            {/* Core Text Input */}
            <TextInput
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 11))}
              keyboardType="phone-pad"
              maxLength={11}
              autoFocus
              placeholder="801 234 5678"
              placeholderTextColor="#94A3B8"
              className="flex-1 text-xl font-medium text-slate-800"
              style={{ letterSpacing: 0.5 }}
            />
          </View>
        </View>

        {/* Primary Action Button */}
        <View className="px-6 mt-10">
          {loading ? (
            <View className="h-14 items-center justify-center">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <TouchableOpacity
              onPress={sendOTP}
              disabled={!isValid}
              className="h-14 rounded-2xl items-center justify-center"
              style={{
                backgroundColor: !isValid
                  ? `${colors.disabled}`
                  : colors.primary,
              }}
            >
              <Text className="text-white font-bold text-xl">Send Code</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
