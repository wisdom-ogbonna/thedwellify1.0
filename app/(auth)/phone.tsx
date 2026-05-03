import { useTheme } from "@react-navigation/native";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import CountryFlag from "react-native-country-flag";

export default function PhoneScreen() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();

  // Logic remains consistent
  const getFormattedNumber = (input: string) => {
    let clean = input.replace(/\D/g, "");
    if (clean.length === 11 && clean.startsWith("0"))
      clean = clean.substring(1);
    return clean;
  };

  const processedPhone = getFormattedNumber(phone);
  const isValid = processedPhone.length === 10;

  const sendOTP = async () => {
    if (!isValid) return;
    try {
      setLoading(true);

      // 1. Send the request
      const res = await axios.post(
        "https://dwellify-backend-bq39.onrender.com/api/otp/send",
        {
          phone_number: `+234${processedPhone}`,
        },
      );

      const pinId = res.data?.pin_id;

      if (!pinId) {
        throw new Error("Server did not return a pin_id");
      }

      router.push({
        pathname: "/(auth)/otp",
        params: {
          phone: `+234${processedPhone}`,
          pinId: pinId,
        },
      });
    } catch (err: any) {
      alert(err?.response?.data?.error || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 px-8 justify-center">
          {/* Aesthetic Header */}
          <View className="mb-12">
            <Text
              className="text-4xl font-black tracking-tighter"
              style={{ color: colors.text }}
            >
              Find your home.
            </Text>
            <Text
              className="text-lg mt-2 font-medium opacity-60"
              style={{ color: colors.text }}
            >
              Enter your mobile to get started.
            </Text>
          </View>

          {/* Premium Input Container */}
          <View
            className="border-b-2 pb-2 flex-row items-center"
            style={{ borderColor: isValid ? colors.primary : colors.border }}
          >
            <CountryFlag isoCode="ng" size={20} style={{ marginRight: 8 }} />

            <Text
              className="text-xl font-bold mr-3"
              style={{ color: colors.text }}
            >
              +234
            </Text>
            <TextInput
              placeholder="801 234 5678"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 11))}
              keyboardType="phone-pad"
              maxLength={11}
              className="text-xl font-bold flex-1"
              style={{ color: colors.text }}
              placeholderTextColor={colors.border}
            />
          </View>

          <Text
            className="mt-4 text-xs font-semibold uppercase tracking-widest opacity-40"
            style={{ color: colors.text }}
          >
            Nigeria Coverage
          </Text>

          {/* Bold Action Button */}
          <Pressable
            onPress={sendOTP}
            disabled={!isValid || loading}
            className="mt-12 h-16 rounded-full items-center justify-center shadow-lg"
            style={{
              backgroundColor: !isValid ? colors.border : colors.primary,
            }}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text className="text-white font-bold text-lg">
                Send Verification
              </Text>
            )}
          </Pressable>

          <Text
            className="text-center text-[10px] mt-8 opacity-30"
            style={{ color: colors.text }}
          >
            SECURE ACCESS BY DWELLIFY
          </Text>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
