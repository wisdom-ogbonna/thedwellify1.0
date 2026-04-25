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

type ClientProfile = {
  name: string;
  email: string;
  verified: boolean;
};

export default function ClientDashboard() {
  const { logout } = useAuth();

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* =========================
     FETCH PROFILE
  ========================= */
  const fetchProfile = async () => {
    try {
      const res = await API.get("/client/profile");

      setProfile(res.data);
    } catch (error: any) {
      const status = error?.response?.status;

      console.log("Dashboard error:", error?.response || error);

      if (status === 401) {
        await logout();
        return;
      }

      if (status === 404) {
        Alert.alert("Error", "Profile not found. Please complete setup.");
        return;
      }

      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to load dashboard"
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
     REFRESH
  ========================= */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, []);

  /* =========================
     LOGOUT
  ========================= */
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
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
     LOADING
  ========================= */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* =========================
     EMPTY
  ========================= */
  if (!profile) {
    return (
      <View style={styles.center}>
        <Text>No dashboard data</Text>
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
        <Text style={styles.welcome}>Welcome 👋</Text>
        <Text style={styles.name}>{profile.name}</Text>

        <Text
          style={[
            styles.badge,
            profile.verified ? styles.verified : styles.pending,
          ]}
        >
          {profile.verified ? "Verified" : "Unverified"}
        </Text>
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.grid}>
          <Pressable style={styles.card}>
            <Text style={styles.cardTitle}>Search Properties</Text>
            <Text style={styles.cardDesc}>
              Find houses, apartments & more
            </Text>
          </Pressable>

          <Pressable style={styles.card}>
            <Text style={styles.cardTitle}>Saved Listings</Text>
            <Text style={styles.cardDesc}>
              View your saved properties
            </Text>
          </Pressable>

          <Pressable style={styles.card}>
            <Text style={styles.cardTitle}>Contact Agents</Text>
            <Text style={styles.cardDesc}>
              Chat with verified agents
            </Text>
          </Pressable>

          <Pressable style={styles.card}>
            <Text style={styles.cardTitle}>My Requests</Text>
            <Text style={styles.cardDesc}>
              Track your inquiries
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ACCOUNT */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.accountCard}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{profile.email}</Text>
        </View>
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
    backgroundColor: "#F9FAFB",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* HEADER */
  header: {
    marginBottom: 25,
  },
  welcome: {
    fontSize: 14,
    color: "#6B7280",
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
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

  /* SECTIONS */
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },

  /* GRID */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  cardDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
  },

  /* ACCOUNT */
  accountCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
  },
  label: {
    fontSize: 12,
    color: "#6B7280",
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
  },

  /* LOGOUT */
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