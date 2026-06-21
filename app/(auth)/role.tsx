import { useTheme } from "@/hooks/use-theme";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { API } from "../../services/api";


export default function RoleScreen() {
const { login, setUserRole, checkProfile } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState<"agent" | "client" | null>(null);

const selectRole = async (selectedRole: "agent" | "client") => {
  try {
    setLoading(selectedRole);
    
    // Normalize string to lowercase
    const normalizedRole = selectedRole.toLowerCase() as "agent" | "client";
    
    // 1. Assign role metadata via custom Backend API endpoint
    const res = await API.post("/role/assign", { role: normalizedRole });
    if (!res?.data?.success) throw new Error("Role assignment failed");

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Session lost.");

    // 2. Force token structural update refresh to pull down fresh custom claims
    await firebaseUser.getIdToken(true);
    const tokenResult = await firebaseUser.getIdTokenResult();
    const roleFromClaims = tokenResult.claims.role as "agent" | "client" | undefined;

    if (!roleFromClaims) throw new Error("Role validation mapping not found in token.");

    // 3. Hand off control to the updated context engine 
    await login({
      uid: firebaseUser.uid,
      phone: firebaseUser.phoneNumber || "",
      role: roleFromClaims,
    });
    
  } catch (err: any) {
    console.log("Role Selection Error Debug:", err);
    Alert.alert("Error", err?.response?.data?.error || err.message || "Assignment failed");
  } finally {
    setLoading(null);
  }
};

  return (
    <View
      className="flex-1 px-8 justify-center"
      style={{ backgroundColor: colors.background }}
    >
      <View className="mb-12">
        <Text
          className="text-4xl font-black tracking-tighter"
          style={{ color: colors.text }}
        >
          Choose your path.
        </Text>
        <Text
          className="text-lg mt-2 opacity-60"
          style={{ color: colors.text }}
        >
          Are you looking to list properties or find your dream home?
        </Text>
      </View>

      {/* Agent Card */}
      <TouchableOpacity
        onPress={() => selectRole("agent")}
        disabled={!!loading}
        className="h-32 rounded-3xl mb-4 p-6 justify-center border-2"
        style={{
          borderColor: colors.primary,
          backgroundColor: loading === "agent" ? colors.border : "transparent",
        }}
      >
        {loading === "agent" ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              Agent
            </Text>
            <Text className="opacity-50" style={{ color: colors.text }}>
              Manage and list properties
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Client Card */}
      <TouchableOpacity
        onPress={() => selectRole("client")}
        disabled={!!loading}
        className="h-32 rounded-3xl p-6 justify-center border-2"
        style={{
          borderColor: colors.primary,
          backgroundColor: loading === "client" ? colors.border : "transparent",
        }}
      >
        {loading === "client" ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              Client
            </Text>
            <Text className="opacity-50" style={{ color: colors.text }}>
              Find your next home
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
