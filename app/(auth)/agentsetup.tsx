import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { InputField } from "../../components/ui/input-field";
import { API } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "@react-navigation/native";

export default function AgentSetupScreen() {
  const { user, checkProfile } = useAuth();
  const { colors } = useTheme();

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    agencyName: "",
    licenseId: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (Object.values(form).some((v) => !v)) {
      Alert.alert("Validation", "All fields are required.");
      return;
    }

    try {
      setLoading(true);
      await API.post("/agent/verify", { ...form, phone: user?.phone || "" });
      await checkProfile();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Setup failed.");
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
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 32,
            paddingVertical: 60,
          }}
        >
          <View className="mb-12">
            <Text
              className="text-4xl font-black tracking-tighter"
              style={{ color: colors.text }}
            >
              Agent Profile.
            </Text>
            <Text
              className="text-lg mt-2 font-medium opacity-60"
              style={{ color: colors.text }}
            >
              Verify your professional credentials.
            </Text>
          </View>

          <InputField
            label="Full Name"
            placeholder="John Doe"
            value={form.name}
            onChangeText={(t: string) => setForm({ ...form, name: t })}
          />
          <InputField
            label="Email Address"
            placeholder="john@agency.com"
            value={form.email}
            onChangeText={(t: string) => setForm({ ...form, email: t })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputField
            label="Agency Name"
            placeholder="Dwellify Realty"
            value={form.agencyName}
            onChangeText={(t: string) => setForm({ ...form, agencyName: t })}
          />
          <InputField
            label="License ID"
            placeholder="LIC-12345"
            value={form.licenseId}
            onChangeText={(t: string) => setForm({ ...form, licenseId: t })}
          />
          <InputField
            label="Office Address"
            placeholder="123 Main St, Lagos"
            value={form.address}
            onChangeText={(t: string) => setForm({ ...form, address: t })}
          />

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="h-16 rounded-full items-center justify-center shadow-lg"
            style={{ backgroundColor: colors.primary }}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text className="text-white font-bold text-lg">
                Submit Verification
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
