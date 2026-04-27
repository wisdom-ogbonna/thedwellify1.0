import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { API } from "../../services/api";
import { auth } from "../../config/firebase";
import { useTheme } from "@react-navigation/native";

export default function RoleScreen() {
  const { setUserRole, checkProfile } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState<"agent" | "client" | null>(null);

  const selectRole = async (role: "agent" | "client") => {
    try {
      setLoading(role);
      const res = await API.post("/role/assign", { role });
      if (!res?.data?.success) throw new Error("Role assignment failed");

      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("Session lost.");

      await firebaseUser.getIdToken(true);
      const tokenResult = await firebaseUser.getIdTokenResult();
      const roleFromClaims = tokenResult.claims.role as
        | "agent"
        | "client"
        | undefined;

      if (!roleFromClaims) throw new Error("Role not found in token.");

      await setUserRole(roleFromClaims);
      await checkProfile(roleFromClaims);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Assignment failed");
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
      <Pressable
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
      </Pressable>

      {/* Client Card */}
      <Pressable
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
      </Pressable>
    </View>
  );
}
