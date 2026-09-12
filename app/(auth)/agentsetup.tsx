import { useTheme } from "@/hooks/use-theme";
import { router } from "expo-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { API } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function AgentSetupScreen() {
  const { user, checkProfile, logout } = useAuth();
  const { colors, isDark } = useTheme();

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    agencyName: "",
    licenseId: "",
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const isFormValid =
    form.name.trim().length > 2 &&
    isEmailValid &&
    form.address.trim().length > 2 &&
    form.agencyName.trim().length > 2 &&
    form.licenseId.trim().length > 1;

  const fieldStyle = useMemo(
    () => (focused: boolean) => ({
      height: 56,
      borderWidth: 1.5,
      borderRadius: 16,
      paddingHorizontal: 16,
      fontSize: 15,
      color: colors.text,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.background,
      borderColor: focused ? colors.primary : `${colors.border}99`,
    }),
    [colors, isDark]
  );

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!isFormValid || loading) {
      if (!isFormValid) {
        Alert.alert("Validation", "Please complete all required fields.");
      }
      return;
    }

    try {
      setLoading(true);
      await API.post("/agent/verify", {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        agencyName: form.agencyName.trim(),
        licenseId: form.licenseId.trim(),
        phone: user?.phone || "",
      });
      await checkProfile("agent");
      setIsSuccess(true);
    } catch (err: any) {
      Alert.alert(
        "Setup Failed",
        err?.response?.data?.error || "Setup failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView
        style={{ backgroundColor: colors.background, flex: 1 }}
        edges={["top", "bottom"]}
      >
        <View className="flex-1 justify-center items-center px-6">
          <Animated.View
            entering={FadeInRight.springify()}
            className="items-center w-full"
          >
            <View
              className="mb-8 w-[104px] h-[104px] rounded-full items-center justify-center"
              style={{ backgroundColor: `${colors.primary}18` }}
            >
              <CheckCircle2 size={52} color={colors.primary} strokeWidth={1.6} />
            </View>
            <Text
              className="text-[26px] font-extrabold mb-3 text-center"
              style={{ color: colors.text }}
            >
              Agent profile submitted
            </Text>
            <Text
              className="text-[15px] text-center mb-10 leading-6 px-2"
              style={{ color: colors.placeholder }}
            >
              Your credentials are in. You can manage listings from your
              dashboard while verification completes.
            </Text>
            <Pressable
              onPress={() => router.replace("/(agent)/agent-dashboard")}
              style={({ pressed }) => ({
                width: "100%",
                height: 56,
                borderRadius: 16,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <Text className="text-white text-[16px] font-bold">
                Go to Dashboard
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  const fields: {
    key: keyof typeof form;
    label: string;
    placeholder: string;
    props?: Partial<React.ComponentProps<typeof TextInput>>;
  }[] = [
    {
      key: "name",
      label: "Full Name",
      placeholder: "e.g. Tunde Bakare",
    },
    {
      key: "email",
      label: "Email Address",
      placeholder: "you@agency.com",
      props: { keyboardType: "email-address", autoCapitalize: "none" },
    },
    {
      key: "agencyName",
      label: "Agency / Company Name",
      placeholder: "e.g. Bakare Properties Ltd",
    },
    {
      key: "licenseId",
      label: "License / REAN Number",
      placeholder: "e.g. REAN-2024-00123",
      props: { autoCapitalize: "characters" },
    },
    {
      key: "address",
      label: "Office Address / Operating Area",
      placeholder: "e.g. Lekki, Lagos",
    },
  ];

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.background, flex: 1 }}
      edges={["top", "bottom"]}
    >
      <View className="px-6 pt-2 pb-2">
        <Pressable
          onPress={() => {
            Alert.alert("Leave setup?", "Sign out to exit agent onboarding.", [
              { text: "Stay", style: "cancel" },
              {
                text: "Sign out",
                style: "destructive",
                onPress: () => void logout(),
              },
            ]);
          }}
          className="w-11 h-11 rounded-xl items-center justify-center"
          style={{
            backgroundColor: isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(15,23,42,0.05)",
          }}
        >
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingBottom: 48,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-8 mt-2 items-center">
            <Text
              className="text-[32px] font-black tracking-tight text-center"
              style={{ color: colors.text }}
            >
              Agent <Text style={{ color: colors.primary }}>profile</Text>
            </Text>
            <Text
              className="text-[15px] mt-3 text-center leading-6 px-2"
              style={{ color: colors.placeholder }}
            >
              Complete your professional details so clients can find and trust
              you.
            </Text>
          </View>

          <View className="gap-4">
            {fields.map((field) => (
              <View key={field.key}>
                <Text
                  className="font-semibold mb-2 text-[14px]"
                  style={{ color: colors.text }}
                >
                  {field.label}
                </Text>
                <TextInput
                  value={form[field.key]}
                  onChangeText={(t) => update(field.key, t)}
                  onFocus={() => setFocusedField(field.key)}
                  onBlur={() => setFocusedField(null)}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.placeholder}
                  style={fieldStyle(focusedField === field.key)}
                  {...field.props}
                />
              </View>
            ))}
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={!isFormValid || loading}
            style={({ pressed }) => ({
              marginTop: 28,
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                isFormValid && !loading ? colors.primary : colors.disabled,
              opacity: pressed && isFormValid && !loading ? 0.92 : 1,
            })}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold text-[16px]">
                Submit Verification
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
