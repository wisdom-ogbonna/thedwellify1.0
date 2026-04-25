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
  phone?: string;
  verified: boolean;
};

export default function ClientDashboard() {
  const { logout } = useAuth();

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/client/profile");
      setProfile(res.data);
    } catch (error: any) {
      const status = error?.response?.status;

      if (status === 401) {
        await logout();
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

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, []);

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text>No dashboard data</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* ================= PROFILE CARD ================= */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile.name?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
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
      </View>

      {/* ================= ACCOUNT INFO ================= */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>

        <View style={styles.infoCard}>
          <InfoItem label="Full Name" value={profile.name} />
          <InfoItem label="Email Address" value={profile.email} />
          <InfoItem
            label="Phone Number"
            value={profile.phone || "Not provided"}
          />
        </View>
      </View>

      {/* ================= QUICK ACTIONS ================= */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.grid}>
          <ActionCard
            title="Search Properties"
            desc="Find houses & apartments"
          />
          <ActionCard
            title="Saved Listings"
            desc="View saved properties"
          />
          <ActionCard
            title="Contact Agents"
            desc="Chat with agents"
          />
          <ActionCard
            title="My Requests"
            desc="Track inquiries"
          />
        </View>
      </View>

      {/* ================= LOGOUT ================= */}
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

/* ================= COMPONENTS ================= */

const InfoItem = ({ label, value }: any) => (
  <View style={styles.infoItem}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const ActionCard = ({ title, desc }: any) => (
  <Pressable style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDesc}>{desc}</Text>
  </Pressable>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#F3F4F6",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* PROFILE */
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    padding: 20,
    borderRadius: 20,
    marginBottom: 25,
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 50,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },

  name: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  badge: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    fontSize: 11,
    fontWeight: "700",
    alignSelf: "flex-start",
  },

  verified: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
  },

  pending: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
  },

  /* SECTION */
  section: {
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },

  /* INFO */
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
  },

  infoItem: {
    marginBottom: 12,
  },

  label: {
    fontSize: 12,
    color: "#6B7280",
  },

  value: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 3,
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
    borderRadius: 16,
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  cardDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 5,
  },

  /* LOGOUT */
  logoutBtn: {
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontWeight: "700",
  },
});