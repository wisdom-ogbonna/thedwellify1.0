import { useTheme } from "@/hooks/use-theme";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { API } from "../../services/api";

export default function PhoneScreen() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { colors, isDark } = useTheme();

  const getFormattedNumber = (input: string) => {
    let clean = input.replace(/\D/g, "");
    if (clean.length === 11 && clean.startsWith("0")) {
      clean = clean.substring(1);
    }
    return clean;
  };

  const processedPhone = getFormattedNumber(phone);
  const isValid = processedPhone.length === 10;
  const canSubmit = isValid && !loading;

  const sendOTP = async () => {
    if (!canSubmit) return;
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
          pinId: String(pinId),
        },
      });
    } catch (err: any) {
      Alert.alert(
        "Couldn't send code",
        err?.response?.data?.error || err?.message || "Connection failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.background, flex: 1 }}
      edges={["top", "bottom"]}
    >
      <View className="mt-2 px-6">
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/(auth)/onboarding");
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-12 h-12 items-center justify-center rounded-2xl border"
          style={{
            backgroundColor: colors.background,
            borderColor: isDark ? `${colors.border}66` : colors.border,
          }}
        >
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
      </View>

      <Animated.View entering={FadeInDown.duration(420)} className="px-8 mt-8">
        <Text
          className="text-[40px] font-extrabold mb-3 tracking-tight text-center leading-[46px]"
          style={{ color: colors.text }}
        >
          Let&apos;s get you <Text style={{ color: colors.primary }}>in</Text>.
        </Text>
        <Text
          className="text-[16px] leading-6 text-center px-2"
          style={{ color: colors.placeholder }}
        >
          Enter your Nigerian phone number to receive a one-time verification
          code.
        </Text>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View className="px-6 mt-12">
          <Text
            style={{ color: colors.text }}
            className="font-semibold text-[15px] mb-2.5 px-1"
          >
            Phone Number
          </Text>

          <View
            className="flex-row items-center h-16 px-3 rounded-2xl border"
            style={{
              borderColor: isValid ? colors.primary : `${colors.border}99`,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.04)"
                : "rgba(15,23,42,0.02)",
            }}
          >
            <View
              className="flex-row items-center h-10 px-3 rounded-xl mr-2"
              style={{
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(15,23,42,0.04)",
              }}
            >
              <Text className="text-lg mr-1.5">🇳🇬</Text>
              <Text
                className="text-[16px] font-semibold"
                style={{ color: colors.text }}
              >
                +234
              </Text>
            </View>

            <TextInput
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 11))}
              keyboardType="phone-pad"
              maxLength={11}
              autoFocus
              placeholder="801 234 5678"
              placeholderTextColor={colors.placeholder}
              className="flex-1 text-[18px] font-medium"
              style={{ letterSpacing: 0.4, color: colors.text }}
              returnKeyType="done"
              onSubmitEditing={sendOTP}
            />
          </View>
        </View>

        <View className="px-6 mt-8 mb-6">
          <Pressable
            onPress={sendOTP}
            disabled={!canSubmit}
            accessibilityRole="button"
            style={({ pressed }) => ({
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: canSubmit ? colors.primary : colors.disabled,
              opacity: pressed && canSubmit ? 0.92 : 1,
            })}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold text-[17px]">Send Code</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
