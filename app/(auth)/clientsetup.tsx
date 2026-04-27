import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { API } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "@react-navigation/native";

export default function ClientSetupScreen() {
  const { checkProfile } = useAuth();
  const { colors } = useTheme();
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (
      form.name.length < 3 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    ) {
      Alert.alert("Validation", "Please enter a valid name and email.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/client/verify", { ...form });
      if (!res?.data?.success) throw new Error("Setup failed");
      await checkProfile();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.error || "Something went wrong",
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
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 32,
            justifyContent: "center",
          }}
        >
          <View className="mb-12">
            <Text
              className="text-4xl font-black tracking-tighter"
              style={{ color: colors.text }}
            >
              Final touches.
            </Text>
            <Text
              className="text-lg mt-2 font-medium opacity-60"
              style={{ color: colors.text }}
            >
              Help us know you better.
            </Text>
          </View>


          <View className="space-y-8">
            <View
              className="border-b-2 pb-2 mb-3"
              style={{ borderColor: colors.border }}
            >
              <Text
                className="text-md font-bold uppercase tracking-widest opacity-40 mb-2"
                style={{ color: colors.text }}
              >
                Full Name
              </Text>
              <TextInput
                placeholder="Jane Doe"
                value={form.name}
                onChangeText={(t) => setForm((p) => ({ ...p, name: t }))}
                style={{ color: colors.text, fontSize: 18, fontWeight: "600", paddingHorizontal: 4 }}
                placeholderTextColor={colors.border}
              />
            </View>

            <View
              className="border-b-2 pb-2"
              style={{ borderColor: colors.border }}
            >
              <Text
                className="text-md font-bold uppercase tracking-widest opacity-40 mb-2"
                style={{ color: colors.text }}
              >
                Email Address
              </Text>
              <TextInput
                placeholder="jane@example.com"
                value={form.email}
                onChangeText={(t) => setForm((p) => ({ ...p, email: t }))}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ color: colors.text, fontSize: 18, fontWeight: "600", paddingHorizontal: 4 }}
                placeholderTextColor={colors.border}
              />
            </View>
          </View>

          {/* Action Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="mt-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text className="text-white font-bold text-lg">
                Complete Setup
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
