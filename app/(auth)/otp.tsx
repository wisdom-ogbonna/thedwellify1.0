import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { OtpInput } from "react-native-otp-entry";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../../config/firebase";

export default function OtpScreen() {
  const params = useLocalSearchParams();
  const { login, setUserRole, checkProfile } = useAuth();

  const phone = String(params.phone || "");
  const pinId = String(params.pinId || "");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = otp.length === 6;

  /* =========================
     VERIFY OTP
  ========================= */
  const verifyOTP = async () => {
    if (!isValid) {
      Alert.alert("Error", "Enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);

      // 🔐 Step 1: Verify OTP with backend
      const res = await axios.post(
        "https://dwellify-backend-bq39.onrender.com/api/otp/verify",
        {
          phone_number: phone,
          pin_id: pinId,
          pin: otp,
        }
      );

      const { firebaseToken } = res.data;

      if (!firebaseToken) {
        throw new Error("Invalid server response");
      }

      // 🔐 Step 2: Sign in to Firebase
      await signInWithCustomToken(auth, firebaseToken);

      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        throw new Error("Authentication failed. Try again.");
      }

      // 🔥 Step 3: Get fresh token + claims (VERY IMPORTANT)
      const tokenResult = await firebaseUser.getIdTokenResult(true);
      const roleFromClaims = tokenResult.claims.role as "agent" | "client" | undefined;

      // 🔥 Step 4: Update app state (SOURCE OF TRUTH = Firebase)
      await login({
        uid: firebaseUser.uid,
        phone: firebaseUser.phoneNumber || phone,
      });

      // 🔥 Step 5: Handle role (from claims, not backend)
      if (roleFromClaims) {
        await setUserRole(roleFromClaims);

        // ⚡ Non-blocking profile check
        checkProfile(roleFromClaims);
      }

      // ❌ No navigation (handled globally)

    } catch (err: any) {
      console.log("OTP Error:", err?.response || err);

      Alert.alert(
        "Verification Failed",
        err?.response?.data?.error ||
          err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>Code sent to {phone}</Text>
          </View>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            <OtpInput
              numberOfDigits={6}
              onTextChange={setOtp}
              theme={{
                pinCodeContainerStyle: styles.otpBox,
                pinCodeTextStyle: styles.otpText,
                containerStyle: styles.otpRow,
              }}
            />
          </View>

          {/* Button */}
          <Pressable
            onPress={verifyOTP}
            disabled={!isValid || loading}
            style={[
              styles.button,
              isValid ? styles.buttonActive : styles.buttonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </Pressable>

          {/* Footer */}
          <Text style={styles.footer}>
            Didn’t receive code? Resend in 30s
          </Text>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#000",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#6B7280",
  },
  otpContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  otpRow: {
    justifyContent: "space-between",
    width: "100%",
  },
  otpBox: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    width: 48,
    height: 58,
    backgroundColor: "#F9FAFB",
  },
  otpText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  button: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonActive: {
    backgroundColor: "#000",
  },
  buttonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    textAlign: "center",
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 24,
  },
});