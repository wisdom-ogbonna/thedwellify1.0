import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInRight } from "react-native-reanimated";
import { ArrowLeft, ImagePlus, CheckCircle } from "lucide-react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { API } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "@/hooks/use-theme";

export default function PremiumBiodataScreen() {
  const { user, checkProfile } = useAuth();
  const { colors } = useTheme();
  const { role } = useLocalSearchParams();
  const isAgent = role === "agent";

  // Form Field States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(""); // Shared/used inside endpoints
  const [agencyName, setAgencyName] = useState(""); // Agent only
  const [operatingArea, setOperatingArea] = useState(""); // Bound to 'address'
  const [licenseId, setLicenseId] = useState(""); // Agent only (optional in UI)

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Focus tracking for input border colors
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Validation Logic Matchers
  const isEmailValid = (emailStr: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);

  const isFormValid = isAgent
    ? fullName.trim().length > 2 &&
      agencyName.trim().length > 2 &&
      operatingArea.trim().length > 2
    : fullName.trim().length > 2 &&
      isEmailValid(email) &&
      operatingArea.trim().length > 2;

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (isAgent) {
        // Original expected agent/verify schema: { name, email, address, agencyName, licenseId, phone }
        await API.post("/agent/verify", {
          name: fullName,
          email: email || user?.email || "agent@dwellify.com", // Fallback if email field is hidden/omitted
          address: operatingArea, // Operating Area mapped to address field
          agencyName: agencyName,
          licenseId: licenseId || "N/A", // optional field fallback
          phone: user?.phone || "",
        });
      } else {
        // Original expected client/verify schema: { name, email }
        // Sends location metadata or falls back safely
        await API.post("/client/verify", {
          name: fullName,
          email: email,
          // Extra payload field if backend supports location schema extensions
          address: operatingArea,
        });
      }

      await checkProfile();
      setIsSuccess(true);
    } catch (err: any) {
      Alert.alert(
        "Setup Failed",
        err?.response?.data?.error ||
          "Something went wrong while setting up your profile.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. SUCCESS PROFILE STATE VIEW
  if (isSuccess) {
    return (
      <SafeAreaView
        style={{ backgroundColor: colors.background, flex: 1 }}
        edges={["top", "bottom"]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <Animated.View
            entering={FadeInRight.springify()}
            style={{ alignItems: "center", width: "100%" }}
          >
            <View
              style={{
                marginBottom: 32,
                width: 120,
                height: 120,
                backgroundColor: "#EFF6FF",
                borderRadius: 60,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 96,
                  height: 96,
                  backgroundColor: "#DBEAFE",
                  borderRadius: 48,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CheckCircle size={56} color="#2563EB" strokeWidth={1.5} />
              </View>
            </View>

            <Text
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: colors.text,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Profile Created!
            </Text>

            <Text
              style={{
                fontSize: 15,
                textAlign: "center",
                color: colors.text,
                opacity: 0.6,
                marginBottom: 40,
                lineHeight: 24,
              }}
            >
              Welcome to Dwellify. Your premium {isAgent ? "Agent" : "Client"}{" "}
              account is now completely set up.
            </Text>

            <Pressable
              onPress={() => {
                router.dismissAll();
                router.replace(
                  isAgent ? "/(agent)/create-property" : "/(tabs)/profile",
                );
              }}
              style={{
                width: "100%",
                height: 56,
                borderRadius: 16,
                backgroundColor: "#2563EB",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}
              >
                Enter Dashboard
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // 2. FORM INTERFACE VIEW
  return (
    <SafeAreaView
      style={{ backgroundColor: "#FFFFFF", flex: 1 }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Modern Mockup Top Navigation Row */}
      <View style={styles.navHeader}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color="#000000" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
            {/* Header Title Styling matching Mockup Screen */}
            <View style={{ marginBottom: 24, marginTop: 10 }}>
              <Text style={styles.mainTitle}>
                {isAgent ? "Your agent " : "Set up your "}
                <Text style={{ color: "#2563EB" }}>profile.</Text>
              </Text>
              <Text style={styles.subtitle}>
                {isAgent
                  ? "Complete your professional details so clients can find you."
                  : "Tell us about yourself so agents can reach you easily."}
              </Text>
            </View>

            {/* Custom Tap to Add Photo Component */}
            <View style={styles.avatarContainer}>
              <Pressable style={styles.avatarCircle}>
                <ImagePlus size={36} color="#475569" strokeWidth={1.5} />
              </Pressable>
              <Text style={styles.avatarText}>
                {isAgent ? "Tap to add photo" : "Tap to add photo (optional)"}
              </Text>
            </View>

            {/* Form Fields Section */}
            <View style={{ gap: 16 }}>
              {/* FIELD: FULL NAME */}
              <View>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFocusedField("fullName")}
                  onBlur={() => setFocusedField(null)}
                  placeholder={
                    isAgent ? "e.g. Tunde Bakare" : "e.g. Adaeze Okafor"
                  }
                  placeholderTextColor="#94A3B8"
                  style={[
                    styles.textInput,
                    focusedField === "fullName" && styles.focusedBorder,
                  ]}
                />
              </View>

              {/* FIELD: EMAIL ADDRESS (Included on Client dynamic state or as a default helper) */}
              {!isAgent && (
                <View>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="you@email.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[
                      styles.textInput,
                      focusedField === "email" && styles.focusedBorder,
                    ]}
                  />
                </View>
              )}

              {/* FIELD: AGENCY / COMPANY NAME (Agent Only) */}
              {isAgent && (
                <View>
                  <Text style={styles.inputLabel}>Agency / Company Name</Text>
                  <TextInput
                    value={agencyName}
                    onChangeText={setAgencyName}
                    onFocus={() => setFocusedField("agencyName")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. Bakare Properties Ltd"
                    placeholderTextColor="#94A3B8"
                    style={[
                      styles.textInput,
                      focusedField === "agencyName" && styles.focusedBorder,
                    ]}
                  />
                </View>
              )}

              {/* FIELD: LOCATION OR OPERATING AREA (Dynamic naming to match mockup) */}
              <View>
                <Text style={styles.inputLabel}>
                  {isAgent ? "Operating Area" : "Location / City"}
                </Text>
                <TextInput
                  value={operatingArea}
                  onChangeText={setOperatingArea}
                  onFocus={() => setFocusedField("operatingArea")}
                  onBlur={() => setFocusedField(null)}
                  placeholder={
                    isAgent ? "e.g. Lekki, Lagos" : "e.g. Lagos, Nigeria"
                  }
                  placeholderTextColor="#94A3B8"
                  style={[
                    styles.textInput,
                    focusedField === "operatingArea" && styles.focusedBorder,
                  ]}
                />
              </View>

              {/* FIELD: LICENSE ID (Agent Only) */}
              {isAgent && (
                <View>
                  <Text style={styles.inputLabel}>
                    License / REAN Number (optional)
                  </Text>
                  <TextInput
                    value={licenseId}
                    onChangeText={setLicenseId}
                    onFocus={() => setFocusedField("licenseId")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. REAN-2024-00123"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="characters"
                    style={[
                      styles.textInput,
                      focusedField === "licenseId" && styles.focusedBorder,
                    ]}
                  />
                </View>
              )}
            </View>

            {/* Bottom Form Action Controller Button */}
            <View style={{ marginTop: 32 }}>
              <Pressable
                disabled={!isFormValid || isSubmitting}
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.submitButton,
                  isFormValid && !isSubmitting
                    ? styles.activeSubmitButton
                    : styles.disabledSubmitButton,
                  pressed && { opacity: 0.85 },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Finish Setup</Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  navHeader: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -1,
    textAlign: "center",
  },
  subtitle: {
    color: "#475569",
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "500",
  },
  inputLabel: {
    color: "#0F172A",
    fontWeight: "600",
    marginBottom: 8,
    fontSize: 14,
  },
  textInput: {
    height: 56,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  focusedBorder: {
    borderColor: "#2563EB",
  },
  submitButton: {
    height: 56,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  activeSubmitButton: {
    backgroundColor: "#2563EB",
  },
  disabledSubmitButton: {
    backgroundColor: "#E2E8F0",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
