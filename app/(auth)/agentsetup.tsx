import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { API } from "../../services/api";

export default function AgentSetupScreen() {
  const { user, checkProfile } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    agencyName: "",
    licenseId: "",
  });

  const [loading, setLoading] = useState(false);

  /* =========================
     VALIDATION
  ========================= */
  const validate = () => {
    const { name, email, address, agencyName, licenseId } = form;

    if (!name || !email || !address || !agencyName || !licenseId) {
      return "All fields are required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Enter a valid email address";
    }

    if (name.length < 3) {
      return "Name must be at least 3 characters";
    }

    return null;
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async () => {
    const errorMsg = validate();

    if (errorMsg) {
      Alert.alert("Validation Error", errorMsg);
      return;
    }

    try {
      setLoading(true);

      // 🔐 DO NOT SEND UID (backend gets it from token)
      const payload = {
        ...form,
        phone: user?.phone || "",
      };

      const res = await API.post("/agent/verify", payload);

      if (!res?.data?.success) {
        throw new Error("Failed to complete setup");
      }

      // 🔥 Re-check profile (updates isVerified)
      await checkProfile();

      Alert.alert("Success", "Profile submitted successfully");
    } catch (error: any) {
      console.log("Agent setup error:", error?.response || error);

      Alert.alert(
        "Error",
        error?.response?.data?.error ||
          error?.message ||
          "Failed to complete setup"
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
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Agent Setup</Text>

          {/* NAME */}
          <TextInput
            placeholder="Full Name"
            value={form.name}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, name: text }))
            }
            style={styles.input}
          />

          {/* EMAIL */}
          <TextInput
            placeholder="Email Address"
            value={form.email}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, email: text }))
            }
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          {/* ADDRESS */}
          <TextInput
            placeholder="Address"
            value={form.address}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, address: text }))
            }
            style={styles.input}
          />

          {/* AGENCY NAME */}
          <TextInput
            placeholder="Agency Name"
            value={form.agencyName}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, agencyName: text }))
            }
            style={styles.input}
          />

          {/* LICENSE ID */}
          <TextInput
            placeholder="License ID"
            value={form.licenseId}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, licenseId: text }))
            }
            style={styles.input}
          />

          {/* SUBMIT */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={[
              styles.button,
              loading && styles.buttonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Complete Setup</Text>
            )}
          </Pressable>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    backgroundColor: "#F9FAFB",
  },
  button: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});