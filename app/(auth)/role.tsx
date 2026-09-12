import { useTheme } from "@/hooks/use-theme";
import { Briefcase, Home, Check } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { API } from "../../services/api";

type UserRole = "client" | "agent";

export default function RoleSelectionScreen() {
  const { login, logout } = useAuth();
  const { colors, isDark } = useTheme();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<UserRole | null>(null);

  const handleProceed = async () => {
    if (!selectedRole || loading) return;

    try {
      setLoading(selectedRole);

      const res = await API.post("/role/assign", { role: selectedRole });
      if (!res?.data?.success) throw new Error("Role assignment failed");

      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("Session lost.");

      await firebaseUser.getIdToken(true);
      const tokenResult = await firebaseUser.getIdTokenResult();
      const roleFromClaims = tokenResult.claims.role as
        | "agent"
        | "client"
        | undefined;

      if (!roleFromClaims) {
        throw new Error("Role validation mapping not found in token.");
      }

      await login({
        uid: firebaseUser.uid,
        phone: firebaseUser.phoneNumber || "",
        role: roleFromClaims,
      });
    } catch (err: any) {
      console.log("Role Selection Error Debug:", err);
      Alert.alert(
        "Error",
        err?.response?.data?.error || err.message || "Assignment failed"
      );
    } finally {
      setLoading(null);
    }
  };

  const RoleCard = ({
    role,
    title,
    description,
    icon,
  }: {
    role: UserRole;
    title: string;
    description: string;
    icon: React.ReactNode;
  }) => {
    const selected = selectedRole === role;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={() => setSelectedRole(role)}
        disabled={loading !== null}
        className="p-5 rounded-3xl border-2 flex-row items-center justify-between mb-3.5"
        style={({ pressed }) => ({
          borderColor: selected ? colors.primary : `${colors.border}66`,
          backgroundColor: selected
            ? `${colors.primary}12`
            : isDark
              ? "rgba(255,255,255,0.03)"
              : "rgba(15,23,42,0.02)",
          opacity: pressed ? 0.92 : 1,
        })}
      >
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
          style={{
            backgroundColor: selected
              ? `${colors.primary}22`
              : isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(15,23,42,0.05)",
          }}
        >
          {icon}
        </View>
        <View className="flex-1 pr-3">
          <Text
            className="text-[18px] font-bold"
            style={{ color: colors.text }}
          >
            {title}
          </Text>
          <Text
            className="text-[14px] mt-1.5 leading-5"
            style={{ color: colors.placeholder }}
          >
            {description}
          </Text>
        </View>

        <View
          className="w-8 h-8 rounded-full border items-center justify-center"
          style={{
            backgroundColor: selected ? colors.primary : "transparent",
            borderColor: selected ? colors.primary : `${colors.border}99`,
          }}
        >
          {selected ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : null}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.background, flex: 1 }}
      edges={["top", "bottom"]}
    >
      <View className="mt-2 px-6">
        <Pressable
          onPress={() => {
            Alert.alert(
              "Sign out?",
              "You'll need to verify your phone again to continue.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Sign out",
                  style: "destructive",
                  onPress: () => void logout(),
                },
              ]
            );
          }}
          className="self-start px-1 py-2"
        >
          <Text style={{ color: colors.placeholder }} className="font-medium">
            Sign out
          </Text>
        </Pressable>
      </View>

      <View className="flex-1 px-6 mt-2 justify-between pb-8">
        <Animated.View entering={FadeInDown.duration(400)}>
          <View className="mb-9 items-center">
            <Text
              className="text-[34px] font-black text-center tracking-tight leading-10"
              style={{ color: colors.text }}
            >
              How will you <Text style={{ color: colors.primary }}>use</Text>{" "}
              Dwellify?
            </Text>
            <Text
              className="text-[16px] text-center mt-4 leading-6 max-w-sm"
              style={{ color: colors.placeholder }}
            >
              Choose how you want to start. You can manage listings or search
              for homes based on this choice.
            </Text>
          </View>

          <RoleCard
            role="client"
            title="I'm a Client"
            description="Browse, rent, or buy properties across Nigeria"
            icon={
              <Home
                size={22}
                color={selectedRole === "client" ? colors.primary : colors.text}
              />
            }
          />
          <RoleCard
            role="agent"
            title="I'm an Agent"
            description="List properties and connect with buyers & renters"
            icon={
              <Briefcase
                size={22}
                color={selectedRole === "agent" ? colors.primary : colors.text}
              />
            }
          />
        </Animated.View>

        <View className="w-full">
          <Pressable
            disabled={!selectedRole || loading !== null}
            onPress={handleProceed}
            style={({ pressed }) => ({
              height: 56,
              borderRadius: 16,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor:
                !selectedRole || loading
                  ? colors.disabled
                  : colors.primary,
              opacity: pressed && selectedRole && !loading ? 0.92 : 1,
            })}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white text-[17px] font-bold">Continue</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
