import { useTheme } from "@react-navigation/native";
import { API } from "../../services/api";
import { useLocalSearchParams } from "expo-router";
import { signInWithCustomToken } from "firebase/auth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { OtpInput } from "react-native-otp-entry";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

export default function OtpScreen() {
  const params = useLocalSearchParams();
  const { login, setUserRole, checkProfile } = useAuth();
  const { colors } = useTheme();

  const phone = String(params.phone || "");
  const pinId = String(params.pinId || "");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = otp.length === 6;

  /* =========================
     VERIFY OTP LOGIC
  ========================= */
  const verifyOTP = async () => {
    if (!isValid) return;

    try {
      setLoading(true);

      // 🔐 Step 1: Verify OTP with backend
const res = await API.post("/otp/verify", {
  phone_number: phone,
  pin_id: pinId,
  pin: otp,
});

      const { firebaseToken } = res.data;
      if (!firebaseToken) throw new Error("Invalid server response");

      // 🔐 Step 2: Sign in to Firebase
      await signInWithCustomToken(auth, firebaseToken);
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("Authentication failed. Try again.");

      // 🔥 Step 3: Get fresh token + claims
      const tokenResult = await firebaseUser.getIdTokenResult(true);
      const roleFromClaims = tokenResult.claims.role as
        | "agent"
        | "client"
        | undefined;

      // 🔥 Step 4: Update app state
      await login({
        uid: firebaseUser.uid,
        phone: firebaseUser.phoneNumber || phone,
      });

      // 🔥 Step 5: Handle role
      if (roleFromClaims) {
        await setUserRole(roleFromClaims);
        checkProfile(roleFromClaims);
      }
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 px-8 justify-center">
          {/* Header */}
          <View className="mb-12">
            <Text
              className="text-4xl font-black tracking-tighter"
              style={{ color: colors.text }}
            >
              Verify code.
            </Text>
            <Text
              className="text-lg mt-2 font-medium opacity-60"
              style={{ color: colors.text }}
            >
              Sent to {phone}
            </Text>
          </View>

          {/* Luxury OTP Input */}
          <OtpInput
            numberOfDigits={6}
            onTextChange={setOtp}
            theme={{
              pinCodeContainerStyle: {
                backgroundColor: "transparent",
                borderWidth: 0,
                borderBottomWidth: 2,
                borderColor: colors.border,
                borderRadius: 0,
                width: 45,
                height: 50,
              },
              pinCodeTextStyle: {
                fontSize: 24,
                fontWeight: "800",
                color: colors.text,
              },
              containerStyle: {
                width: "100%",
                justifyContent: "space-between",
              },
            }}
          />

          {/* Action Button */}
          <Pressable
            onPress={verifyOTP}
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
                Verify & Access
              </Text>
            )}
          </Pressable>

          <Text
            className="text-center text-[10px] mt-8 opacity-30 uppercase tracking-widest"
            style={{ color: colors.text }}
          >
            Dwellify Secure OTP
          </Text>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
