import { useAuth } from "../../context/AuthContext";
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

export default function ClientSetupScreen() {
  const { checkProfile, logout } = useAuth();
  const { colors, isDark } = useTheme();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const isEmailValid = (emailStr: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);

  const isFormValid =
    fullName.trim().length > 2 &&
    isEmailValid(email) &&
    city.trim().length > 2;

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

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await API.post("/client/verify", {
        name: fullName.trim(),
        email: email.trim(),
        address: city.trim(),
      });
      await checkProfile("client");
      setIsSuccess(true);
    } catch (err: any) {
      Alert.alert(
        "Setup Failed",
        err?.response?.data?.error ||
          "Something went wrong while setting up your profile."
      );
    } finally {
      setIsSubmitting(false);
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
              Profile ready
            </Text>
            <Text
              className="text-[15px] text-center mb-10 leading-6 px-2"
              style={{ color: colors.placeholder }}
            >
              Welcome to Dwellify. Your client account is set up and ready to
              explore homes.
            </Text>

            <Pressable
              onPress={() => router.replace("/(client)/client-map")}
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
                Enter Dashboard
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.background, flex: 1 }}
      edges={["top", "bottom"]}
    >
      <View className="px-6 pt-2 pb-2">
        <Pressable
          onPress={() => {
            Alert.alert(
              "Leave setup?",
              "You can finish your profile later to start exploring.",
              [
                { text: "Stay", style: "cancel" },
                {
                  text: "Sign out",
                  style: "destructive",
                  onPress: () => void logout(),
                },
              ]
            );
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
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6">
            <View className="mb-8 mt-2 items-center">
              <Text
                className="text-[32px] font-black tracking-tight text-center"
                style={{ color: colors.text }}
              >
                Set up your <Text style={{ color: colors.primary }}>profile</Text>
              </Text>
              <Text
                className="text-[15px] text-center mt-3 leading-6 px-3"
                style={{ color: colors.placeholder }}
              >
                Tell us about yourself so agents can reach you easily.
              </Text>
            </View>

            <View className="gap-4">
              <View>
                <Text
                  className="font-semibold mb-2 text-[14px]"
                  style={{ color: colors.text }}
                >
                  Full Name
                </Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFocusedField("fullName")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="e.g. Adaeze Okafor"
                  placeholderTextColor={colors.placeholder}
                  style={fieldStyle(focusedField === "fullName")}
                />
              </View>

              <View>
                <Text
                  className="font-semibold mb-2 text-[14px]"
                  style={{ color: colors.text }}
                >
                  Email Address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@email.com"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={fieldStyle(focusedField === "email")}
                />
              </View>

              <View>
                <Text
                  className="font-semibold mb-2 text-[14px]"
                  style={{ color: colors.text }}
                >
                  Location / City
                </Text>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  onFocus={() => setFocusedField("city")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="e.g. Lagos, Nigeria"
                  placeholderTextColor={colors.placeholder}
                  style={fieldStyle(focusedField === "city")}
                />
              </View>
            </View>

            <Pressable
              disabled={!isFormValid || isSubmitting}
              onPress={handleSubmit}
              style={({ pressed }) => ({
                marginTop: 28,
                height: 56,
                borderRadius: 16,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor:
                  isFormValid && !isSubmitting
                    ? colors.primary
                    : colors.disabled,
                opacity: pressed && isFormValid && !isSubmitting ? 0.92 : 1,
              })}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-[16px] font-bold">
                  Finish Setup
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
