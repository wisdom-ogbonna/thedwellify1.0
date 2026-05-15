import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Appearance,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";

import { useAuth } from "../../context/AuthContext";
import { API } from "../../services/api";

export default function ClientDashboard() {
  const { logout } = useAuth();

  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();

  const [profile, setProfile] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  /**
   * =========================
   * FETCH PROFILE
   * =========================
   */
  const fetchProfile = async () => {
    try {
      setLoading(true);

      const res = await API.get("/client/profile");

      setProfile(res.data);
    } catch (error) {
      console.log("PROFILE ERROR:", error);

      Alert.alert(
        "Error",
        "Failed to load your profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  /**
   * =========================
   * THEME SWITCHER
   * =========================
   */
  const handleThemeChange = () => {
    Alert.alert(
      "Appearance Settings",
      "Choose your preferred theme",
      [
        {
          text: "Light Mode",
          onPress: () => Appearance.setColorScheme("light"),
        },
        {
          text: "Dark Mode",
          onPress: () => Appearance.setColorScheme("dark"),
        },
        {
          text: "System Default",
          onPress: () => Appearance.setColorScheme(null),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  /**
   * =========================
   * DELETE ACCOUNT
   * =========================
   */
  const deleteAccount = async () => {
    try {
      setDeleting(true);

      const res = await API.delete("/client/delete");

      Alert.alert(
        "Account Deleted",
        res.data?.message || "Your account was deleted successfully.",
        [
          {
            text: "OK",
            onPress: async () => {
              await logout();
            },
          },
        ]
      );
    } catch (error: any) {
      console.log("DELETE ACCOUNT ERROR:", error);

      const message =
        error?.response?.data?.error ||
        "Unable to delete account. Please try again.";

      Alert.alert("Delete Failed", message);
    } finally {
      setDeleting(false);
    }
  };

  /**
   * =========================
   * CONFIRM DELETE
   * =========================
   */
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action permanently removes your account and all associated data. This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: deleteAccount,
        },
      ],
      {
        cancelable: true,
      }
    );
  };

  /**
   * =========================
   * LOADING
   * =========================
   */
  if (loading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      style={{
        backgroundColor: colors.background,
      }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 24,
      }}
    >
      {/* =========================
          HEADER
      ========================= */}
      <View className="mb-12">
        <Text
          className="text-xs font-bold uppercase tracking-widest opacity-40"
          style={{
            color: colors.text,
          }}
        >
          Dashboard
        </Text>

        <Text
          className="text-5xl font-black tracking-tight mt-2"
          style={{
            color: colors.text,
          }}
        >
          {profile?.name?.split(" ")[0] || "User"}.
        </Text>
      </View>

      {/* =========================
          ACCOUNT DETAILS
      ========================= */}
      <View className="mb-10">
        <DetailItem label="Email" value={profile?.email || "N/A"} />

        <DetailItem
          label="Phone"
          value={profile?.phone || "Not provided"}
        />

        <DetailItem
          label="Status"
          value={profile?.verified ? "Verified" : "Pending"}
        />
      </View>

      {/* =========================
          THEME CARD
      ========================= */}
      <View
        className="border rounded-3xl p-6 mb-8 flex-row items-center justify-between"
        style={{
          borderColor: colors.border,
        }}
      >
        <View>
          <Text
            className="text-xs uppercase tracking-widest opacity-40 font-bold mb-1"
            style={{
              color: colors.text,
            }}
          >
            Theme
          </Text>

          <Text
            className="font-semibold text-base"
            style={{
              color: colors.text,
            }}
          >
            {scheme === "dark"
              ? "Dark Mode"
              : scheme === "light"
              ? "Light Mode"
              : "System Default"}
          </Text>
        </View>

        <Pressable
          onPress={handleThemeChange}
          className="px-5 py-3 rounded-full"
          style={{
            backgroundColor: colors.primary + "15",
          }}
        >
          <Text
            className="text-xs font-bold uppercase tracking-widest"
            style={{
              color: colors.primary,
            }}
          >
            Change
          </Text>
        </Pressable>
      </View>



      {/* =========================
          SIGN OUT
      ========================= */}
      <Pressable
        onPress={logout}
        className="py-5 rounded-3xl items-center mb-4"
        style={{
          backgroundColor: colors.primary,
        }}
      >
        <Text
          className="font-bold uppercase tracking-widest"
          style={{
            color: "#ffffff",
          }}
        >
          Sign Out
        </Text>
      </Pressable>

      {/* =========================
          DELETE ACCOUNT
      ========================= */}
      <Pressable
        onPress={handleDeleteAccount}
        disabled={deleting}
        className="py-5 rounded-3xl items-center border"
        style={{
          borderColor: "#ef4444",
          opacity: deleting ? 0.7 : 1,
        }}
      >
        {deleting ? (
          <ActivityIndicator color="#ef4444" />
        ) : (
          <Text
            className="font-bold uppercase tracking-widest"
            style={{
              color: "#ef4444",
            }}
          >
            Delete Account
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

/**
 * =========================
 * DETAIL ITEM
 * =========================
 */
const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  const { colors } = useTheme();

  return (
    <View
      className="border-b pb-5 mb-5"
      style={{
        borderColor: colors.border,
      }}
    >
      <Text
        className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1"
        style={{
          color: colors.text,
        }}
      >
        {label}
      </Text>

      <Text
        className="text-lg font-semibold"
        style={{
          color: colors.text,
        }}
      >
        {value}
      </Text>
    </View>
  );
};