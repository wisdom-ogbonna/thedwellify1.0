import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { API } from "../../services/api";

type AgentProfile = {
  name: string;
  email: string;
  phone?: string;
  address: string;
  agencyName?: string;
  licenseId?: string;
  verified: boolean;
};

export default function ProfileScreen() {
  const { logout } = useAuth();

  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* =========================
     FETCH PROFILE
  ========================= */
  const fetchProfile = async () => {
    try {
      const res = await API.get("/agent/profile");

      setProfile(res.data);
    } catch (error: any) {
      const status = error?.response?.status;

      console.log("Profile error:", error?.response || error);

      // 🔐 Invalid session
      if (status === 401) {
        await logout();
        return;
      }

      // 👤 Profile not found
      if (status === 404) {
        Alert.alert("Error", "Profile not found. Please complete setup.");
        return;
      }

      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to load profile"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =========================
     INITIAL LOAD
  ========================= */
  useEffect(() => {
    fetchProfile();
  }, []);

  /* =========================
     PULL TO REFRESH
  ========================= */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, []);

  /* =========================
     LOGOUT
  ========================= */
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  /* =========================
     LOADING STATE
  ========================= */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* =========================
     EMPTY STATE
  ========================= */
  if (!profile) {
    return (
      <View style={styles.center}>
        <Text>No profile data available</Text>
      </View>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.email}>{profile.email}</Text>

        <Text
          style={[
            styles.badge,
            profile.verified ? styles.verified : styles.pending,
          ]}
        >
          {profile.verified ? "Verified" : "Pending Verification"}
        </Text>
      </View>

      {/* DETAILS */}
      <View style={styles.card}>
        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{profile.phone || "N/A"}</Text>

        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>{profile.address}</Text>

        <Text style={styles.label}>Agency Name</Text>
        <Text style={styles.value}>
          {profile.agencyName || "Not provided"}
        </Text>

        <Text style={styles.label}>License ID</Text>
        <Text style={styles.value}>
          {profile.licenseId || "Not provided"}
        </Text>
      </View>

      {/* LOGOUT */}
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 25,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
  },
  email: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  badge: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "700",
  },
  verified: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
  },
  pending: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
  },
  card: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 14,
    marginBottom: 30,
  },
  label: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 10,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "700",
  },
});