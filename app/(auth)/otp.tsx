import { useTheme } from "@/hooks/use-theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { signInWithCustomToken } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
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
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { API } from "../../services/api";

export default function Otp() {
  const params = useLocalSearchParams();
  const { login } = useAuth();
  const { colors, isDark } = useTheme();

  const phone = String(params.phone || "");
  const [pinId, setPinId] = useState(String(params.pinId || ""));
  const routeRole = String(params.role || "");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const [timer, setTimer] = useState(30);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const intervalId = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(intervalId);
  }, [timer]);

  const handleResend = async () => {
    if (timer > 0 || resending || !phone) return;

    try {
      setResending(true);
      const res = await API.post("/otp/send", { phone_number: phone });
      const nextPinId = res.data?.pin_id;
      if (!nextPinId) throw new Error("Server did not return a pin_id");

      setPinId(String(nextPinId));
      setTimer(30);
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } catch (err: any) {
      Alert.alert(
        "Couldn't resend",
        err?.response?.data?.error || err?.message || "Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  const handleChange = (text: string, index: number) => {
    const cleanText = text.replace(/\D/g, "");
    if (!cleanText) {
      const newCode = [...code];
      newCode[index] = "";
      setCode(newCode);
      return;
    }

    if (cleanText.length > 1) {
      const pastedDigits = cleanText.slice(0, 6).split("");
      const newCode = ["", "", "", "", "", ""];
      pastedDigits.forEach((digit, idx) => {
        newCode[idx] = digit;
      });
      setCode(newCode);
      const targetFocusIndex = Math.min(pastedDigits.length - 1, 5);
      inputs.current[targetFocusIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = cleanText;
    setCode(newCode);

    if (index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (key: string, index: number) => {
    if (key !== "Backspace") return;

    if (!code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
      inputs.current[index - 1]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = "";
    setCode(newCode);
  };

  const finalCode = code.join("");
  const isValid = finalCode.length === 6;

  const verifyOTP = async () => {
    if (!isValid || loading) return;

    try {
      setLoading(true);

      const res = await API.post("/otp/verify", {
        phone_number: phone,
        pin_id: pinId,
        pin: finalCode,
      });

      const { firebaseToken, role: backendRole } = res.data;
      if (!firebaseToken) throw new Error("Invalid server response");

      const finalRole = (backendRole || routeRole || null) as
        | "agent"
        | "client"
        | null;
      if (finalRole) {
        await AsyncStorage.setItem("role", finalRole);
      }

      await signInWithCustomToken(auth, firebaseToken);
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("Authentication failed. Try again.");

      await login({
        uid: firebaseUser.uid,
        phone: firebaseUser.phoneNumber || phone,
        role: finalRole,
      });
    } catch (err: any) {
      console.log("OTP Error:", err?.response || err);
      Alert.alert(
        "Verification Failed",
        err?.response?.data?.error || err.message || "Something went wrong."
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
      <View className="mt-2 px-6 py-2">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          className="w-11 h-11 items-center justify-center rounded-xl border"
          style={{
            backgroundColor: colors.background,
            borderColor: `${colors.border}99`,
          }}
        >
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>
      </View>

      <Animated.View entering={FadeInDown.duration(400)} className="px-6 mt-6">
        <Text
          className="text-[34px] font-bold text-center tracking-tight"
          style={{ color: colors.text }}
        >
          Verify your <Text style={{ color: colors.primary }}>number</Text>
        </Text>
        <Text
          className="text-[16px] mt-3 text-center leading-6"
          style={{ color: colors.placeholder }}
        >
          Enter the 6-digit code sent to{" "}
          <Text className="font-semibold" style={{ color: colors.text }}>
            {phone || "your phone"}
          </Text>
        </Text>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View className="flex-row justify-between mt-10 mb-6 px-6">
          {code.map((digit, index) => {
            const isCurrentFocused = focusedIndex === index;
            const hasValue = !!digit;

            return (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputs.current[index] = ref;
                }}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={({ nativeEvent }) =>
                  handleBackspace(nativeEvent.key, index)
                }
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                keyboardType="number-pad"
                selectTextOnFocus
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                maxLength={index === 0 ? 6 : 1}
                style={{
                  width: 48,
                  height: 56,
                  textAlign: "center",
                  color: colors.text,
                  borderRadius: 16,
                  fontSize: 22,
                  fontWeight: "700",
                  borderColor:
                    isCurrentFocused || hasValue
                      ? colors.primary
                      : `${colors.border}99`,
                  backgroundColor:
                    isCurrentFocused || hasValue
                      ? `${colors.primary}14`
                      : isDark
                        ? "rgba(255,255,255,0.04)"
                        : "transparent",
                  borderWidth: isCurrentFocused || hasValue ? 2 : 1,
                }}
              />
            );
          })}
        </View>

        <View className="flex-row justify-center items-center px-6 mb-8 min-h-[28px]">
          {timer > 0 ? (
            <Text style={{ color: colors.placeholder }} className="text-[15px]">
              Resend code in{" "}
              <Text className="font-bold" style={{ color: colors.primary }}>
                {timer}s
              </Text>
            </Text>
          ) : resending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Pressable onPress={handleResend} hitSlop={8}>
              <Text
                className="text-[15px] font-semibold"
                style={{ color: colors.primary }}
              >
                Resend verification code
              </Text>
            </Pressable>
          )}
        </View>

        <View className="px-6 mt-auto mb-6">
          <Pressable
            disabled={!isValid || loading}
            onPress={verifyOTP}
            style={({ pressed }) => ({
              height: 56,
              borderRadius: 16,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor:
                !isValid || loading ? colors.disabled : colors.primary,
              opacity: pressed && isValid && !loading ? 0.92 : 1,
            })}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-[17px] font-bold text-white">
                Verify & Proceed
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
