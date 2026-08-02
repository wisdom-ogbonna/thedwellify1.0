import { useTheme } from "@/hooks/use-theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { signInWithCustomToken } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { API } from "../../services/api";

export default function Otp() {
  const params = useLocalSearchParams();
  const { login } = useAuth();
  const { colors } = useTheme();

  const phone = String(params.phone || "");
  const pinId = String(params.pinId || "");
  const routeRole = String(params.role || "");

  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const [timer, setTimer] = useState(30);
  const inputs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const intervalId = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(intervalId);
  }, [timer]);

  const handleResend = () => {
    if (timer > 0) return;
    setTimer(30);
    setCode(["", "", "", "", "", ""]);
    inputs.current[0]?.focus();
  };

  const handleChange = (text: string, index: number) => {
    // Clean all non-numeric characters from the typed/pasted text
    const cleanText = text.replace(/\D/g, "");
    if (!cleanText) {
      // If backspaced to empty
      const newCode = [...code];
      newCode[index] = "";
      setCode(newCode);
      return;
    }

    // Smart Paste Handler: Check if the text length is greater than 1 (Pasted Code)
    if (cleanText.length > 1) {
      const pastedDigits = cleanText.slice(0, 6).split(""); // limit to 6 digits
      const newCode = [...code];

      pastedDigits.forEach((digit, idx) => {
        if (idx < 6) {
          newCode[idx] = digit;
        }
      });

      setCode(newCode);

      // Auto-focus the last populated box (or the last box entirely)
      const targetFocusIndex = Math.min(pastedDigits.length - 1, 5);
      inputs.current[targetFocusIndex]?.focus();
      return;
    }

    // Normal typing handler (Single Character)
    const newCode = [...code];
    newCode[index] = cleanText;
    setCode(newCode);

    if (index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (key: string, index: number) => {
    if (key === "Backspace") {
      if (!code[index] && index > 0) {
        const newCode = [...code];
        newCode[index - 1] = "";
        setCode(newCode);
        inputs.current[index - 1]?.focus();
      } else {
        const newCode = [...code];
        newCode[index] = "";
        setCode(newCode);
      }
    }
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

      const finalRole = backendRole || routeRole;
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
        err?.response?.data?.error || err.message || "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>

      <View className="mt-4 px-6 py-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-xl border"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
          }}
        >
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View className="px-6 mt-8">
        <Text
          className="text-4xl font-bold font-['Poppins'] text-center tracking-tight"
          style={{ color: colors.text }}
        >
          Verify your <Text style={{ color: colors.primary }}>number</Text>
        </Text>
        <Text
          className="font-['Inter'] text-lg mt-3 text-center opacity-60"
          style={{ color: colors.text }}
        >
          Enter the 6 digit code safely routed to{" "}
          <Text className="font-semibold" style={{ color: colors.text }}>
            {phone}
          </Text>
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-row justify-between mt-10 mb-6 px-6">
          {code.map((digit, index) => {
            const isCurrentFocused = focusedIndex === index;
            const hasValue = !!digit;

            return (
              <TextInput
                key={index}
                ref={(ref) => {
                  if (ref) inputs.current[index] = ref;
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
                style={{
                  textAlign: "center",
                  color: colors.text,
                  borderColor:
                    isCurrentFocused || hasValue
                      ? colors.primary
                      : colors.border,
                  backgroundColor:
                    isCurrentFocused || hasValue
                      ? `${colors.primary}15`
                      : "transparent",
                  borderWidth: isCurrentFocused || hasValue ? 2 : 1,
                }}
                className="w-12 h-14 text-2xl font-bold rounded-2xl"
              />
            );
          })}
        </View>

        <View className="flex-row justify-center items-center px-6 mb-8">
          {timer > 0 ? (
            <Text style={{ color: colors.text }} className="text-lg opacity-60">
              Resend code in{" "}
              <Text className="font-bold" style={{ color: colors.primary }}>
                {timer}s
              </Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
              <Text
                className="text-lg font-semibold underline"
                style={{ color: colors.primary }}
              >
                Resend verification code
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="px-6 mt-auto mb-6">
          {loading ? (
            <View className="h-14 items-center justify-center">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <TouchableOpacity
              disabled={!isValid}
              onPress={verifyOTP}
              className="h-14 rounded-2xl justify-center items-center"
              style={{
                backgroundColor: !isValid ? colors.disabled : colors.primary,
              }}
            >
              <Text
                className="text-xl font-bold font-['Poppins'] text-white"
              >
                Verify & Proceed
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
