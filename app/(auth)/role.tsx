import { useTheme } from "@/hooks/use-theme";
import { router } from "expo-router";
import { ArrowLeft, Check } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { API } from "../../services/api";

type UserRole = "client" | "agent";

export default function RoleSelectionScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<UserRole | null>(null);

  /* =======================================
     ROLE ASSIGNMENT LOGIC (From Commented Code)
     ======================================= */
  const handleProceed = async () => {
    if (!selectedRole || loading) return;

    try {
      setLoading(selectedRole);

      // 1. Assign role metadata via custom Backend API endpoint
      const res = await API.post("/role/assign", { role: selectedRole });
      if (!res?.data?.success) throw new Error("Role assignment failed");

      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("Session lost.");

      // 2. Force token structural update refresh to pull down fresh custom claims
      await firebaseUser.getIdToken(true);
      const tokenResult = await firebaseUser.getIdTokenResult();
      const roleFromClaims = tokenResult.claims.role as
        | "agent"
        | "client"
        | undefined;

      if (!roleFromClaims) {
        throw new Error("Role validation mapping not found in token.");
      }

      // 3. Hand off control to the updated context engine
      await login({
        uid: firebaseUser.uid,
        phone: firebaseUser.phoneNumber || "",
        role: roleFromClaims,
      });
    } catch (err: any) {
      console.log("Role Selection Error Debug:", err);
      Alert.alert(
        "Error",
        err?.response?.data?.error || err.message || "Assignment failed",
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>

      {/* Navigation Back Header */}
      <View className="mt-6 px-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 items-center justify-center rounded-2xl border"
          style={{
            backgroundColor: "#F8FAFC",
            borderColor: "#F1F5F9",
          }}
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Main Centered Typography */}
      <View className="flex-1 px-6 mt-6 justify-between pb-8">
        <View>
          <View className="mb-10 items-center">
            <Text
              className="text-4xl font-black text-center tracking-tight"
              style={{ color: "#0F172A" }}
            >
              How will you <Text style={{ color: colors.primary }}>use</Text>{" "}
              Dwellify?
            </Text>
            <Text className="text-slate-400 text-lg text-center mt-4 leading-6 font-normal max-w-sm">
              Pick your role. You can switch anytime from settings.
            </Text>
          </View>

          {/* Cards Selection Container */}
          <View className="space-y-4">
            {/* Client Option */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedRole("client")}
              disabled={loading !== null}
              className="p-6 py-10 rounded-3xl border-2 flex-row items-center justify-between mb-4"
              style={{
                borderColor:
                  selectedRole === "client" ? colors.primary : "#F8FAFC",
                backgroundColor:
                  selectedRole === "client" ? "transparent" : "#F8FAFC",
              }}
            >
              <View className="flex-1 pr-4">
                <Text className="text-xl font-bold text-slate-900">
                  I&apos;m a Client
                </Text>
                <Text className="text-lg text-slate-400 mt-2 leading-5">
                  Browse, rent, or buy properties across Nigeria
                </Text>
              </View>

              {/* Selection Check Circle */}
              <View
                className="w-8 h-8 rounded-full border items-center justify-center"
                style={{
                  backgroundColor:
                    selectedRole === "client" ? colors.primary : "transparent",
                  borderColor:
                    selectedRole === "client" ? colors.primary : "#E2E8F0",
                }}
              >
                {selectedRole === "client" && (
                  <Check size={16} color="#FFFFFF" strokeWidth={3} />
                )}
              </View>
            </TouchableOpacity>

            {/* Agent Option */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedRole("agent")}
              disabled={loading !== null}
              className="p-6 py-10 rounded-3xl border-2 flex-row items-center justify-between"
              style={{
                borderColor:
                  selectedRole === "agent" ? colors.primary : "#F8FAFC",
                backgroundColor:
                  selectedRole === "agent" ? "transparent" : "#F8FAFC",
              }}
            >
              <View className="flex-1 pr-4">
                <Text className="text-xl font-bold text-slate-900">
                  I&apos;m an Agent
                </Text>
                <Text className="text-lg text-slate-400 mt-2 leading-5">
                  List properties, connect with buyers & renters
                </Text>
              </View>

              {/* Selection Check Circle */}
              <View
                className="w-8 h-8 rounded-full border items-center justify-center"
                style={{
                  backgroundColor:
                    selectedRole === "agent" ? colors.primary : "transparent",
                  borderColor:
                    selectedRole === "agent" ? colors.primary : "#E2E8F0",
                }}
              >
                {selectedRole === "agent" && (
                  <Check size={16} color="#FFFFFF" strokeWidth={3} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Continue Button */}
        <View className="w-full">
          {loading ? (
            <View className="h-14 items-center justify-center">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <TouchableOpacity
              disabled={!selectedRole}
              onPress={handleProceed}
              className="h-14 rounded-2xl justify-center items-center"
              style={{
                backgroundColor: !selectedRole
                  ? `${colors.primary}40`
                  : colors.primary,
              }}
            >
              <Text className="text-white text-lg font-bold">Continue</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
