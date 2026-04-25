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
  StyleSheet,
} from "react-native";
import { API } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function ClientSetupScreen() {
  const { checkProfile } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);

  /* =========================
     VALIDATION
  ========================= */
  const validate = () => {
    const { name, email } = form;

    if (!name || !email) {
      return "All fields are required";
    }

    if (name.length < 3) {
      return "Name must be at least 3 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Enter a valid email address";
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

      // 🔐 DO NOT SEND UID
      const res = await API.post("/client/verify", {
        ...form,
      });

      if (!res?.data?.success) {
        throw new Error("Failed to complete setup");
      }

      // 🔥 Refresh auth state → triggers navigation automatically
      await checkProfile();

      Alert.alert("Success", "Profile setup complete");
    } catch (err: any) {
      console.log("Client setup error:", err?.response || err);

      const status = err?.response?.status;

      if (status === 401) {
        Alert.alert("Session Expired", "Please login again");
        return;
      }

      if (status === 403) {
        Alert.alert("Error", "Invalid role. Please re-login.");
        return;
      }

      Alert.alert(
        "Error",
        err?.response?.data?.error ||
          err?.message ||
          "Something went wrong"
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
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Let’s set up your client account
            </Text>
          </View>

          {/* FORM CARD */}
          <View style={styles.card}>
            {/* NAME */}
            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                placeholder="Enter your name"
                value={form.name}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, name: text }))
                }
                style={styles.input}
              />
            </View>

            {/* EMAIL */}
            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                placeholder="Enter your email"
                value={form.email}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, email: text }))
                }
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            {/* BUTTON */}
            <Pressable
              style={[
                styles.button,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </Pressable>
          </View>
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
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F3F4F6",
    padding: 14,
    borderRadius: 12,
    fontSize: 14,
  },
  button: {
    backgroundColor: "#6366F1",
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