import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";

export default function PhoneScreen() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isValid = phone.length > 9;

  const sendOTP = async () => {
    if (!isValid) return;

    try {
      setLoading(true);

      const res = await axios.post(
        "https://dwellify-backend-bq39.onrender.com/api/otp/send",
        {
          phone_number: phone,
        }
      );

      const pinId = res.data?.pin_id;

      if (!pinId) throw new Error("Invalid response");

      router.push({
        pathname: "/(auth)/otp",
        params: {
          phone,
          pinId,
        },
      });
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome 👋</Text>
            <Text style={styles.subtitle}>
              Enter your phone number to continue
            </Text>
          </View>

          {/* Input */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              placeholder="+234 801 234 5678"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Hint */}
          <Text style={styles.hint}>
            Use your active number (Nigeria format)
          </Text>

          {/* Button */}
          <Pressable
            onPress={sendOTP}
            disabled={!isValid || loading}
            style={[
              styles.button,
              !isValid ? styles.buttonDisabled : styles.buttonActive,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </Pressable>

          {/* Footer */}
          <Text style={styles.footer}>
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

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
    fontSize: 30,
    fontWeight: "800",
    color: "#000",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#6B7280",
  },
  inputCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
  },
  input: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  hint: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 24,
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
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 24,
  },
});