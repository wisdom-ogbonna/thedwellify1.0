import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { API } from "../../services/api";
import { auth } from "../../config/firebase";

export default function RoleScreen() {
  const { setUserRole, checkProfile } = useAuth();
  const [loading, setLoading] = useState<"agent" | "client" | null>(null);

  const selectRole = async (role: "agent" | "client") => {
    try {
      setLoading(role);

      // 🔐 1. Call backend (UID comes from token automatically)
      const res = await API.post("/role/assign", {
        role,
      });

      if (!res?.data?.success) {
        throw new Error("Role assignment failed");
      }

      // 🔥 2. Refresh Firebase token to get updated claims
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        throw new Error("User session lost. Please login again.");
      }

      await firebaseUser.getIdToken(true); // 🔥 FORCE REFRESH

      const tokenResult = await firebaseUser.getIdTokenResult();
      const roleFromClaims = tokenResult.claims.role as
        | "agent"
        | "client"
        | undefined;

      if (!roleFromClaims) {
        throw new Error("Role not found in token. Try again.");
      }

      // 🔥 3. Sync role to app state
      await setUserRole(roleFromClaims);

      // 🔍 4. Check profile (non-blocking is okay too)
      await checkProfile(roleFromClaims);

      Alert.alert("Success", "Role assigned successfully");
    } catch (err: any) {
      console.log("❌ ROLE ERROR:", err?.response?.data || err.message);

      Alert.alert(
        "Error",
        err?.response?.data?.error ||
          err.message ||
          "Role assignment failed"
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Role</Text>

      {/* Agent */}
      <Pressable
        style={[
          styles.btn,
          loading === "agent" && styles.disabled,
        ]}
        onPress={() => selectRole("agent")}
        disabled={!!loading}
      >
        {loading === "agent" ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.txt}>I am an Agent</Text>
        )}
      </Pressable>

      {/* Client */}
      <Pressable
        style={[
          styles.btn,
          styles.client,
          loading === "client" && styles.disabled,
        ]}
        onPress={() => selectRole("client")}
        disabled={!!loading}
      >
        {loading === "client" ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.txt}>I am a Client</Text>
        )}
      </Pressable>
    </View>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 30,
  },
  btn: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 14,
    marginBottom: 15,
    alignItems: "center",
  },
  client: {
    backgroundColor: "#333",
  },
  disabled: {
    opacity: 0.7,
  },
  txt: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});