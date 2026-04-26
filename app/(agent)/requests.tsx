import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { API } from "../../services/api";

export default function RequestDetailsScreen() {
  const router = useRouter();

  const { requestId, propertyType, lat, lng, clientName } =
    useLocalSearchParams();

  const [loading, setLoading] = useState(false);

  /* =========================
     ACCEPT REQUEST
  ========================= */
  const handleAccept = async () => {
    if (!requestId) return;

    setLoading(true);

    try {
      await API.post("/client/request/accept", {
        requestId,
      });

      Alert.alert("Success 🎉", "Request accepted");

      router.replace("/(agent)/dashboard");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to accept request"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     DECLINE REQUEST
  ========================= */
  const handleDecline = async () => {
    if (!requestId) return;

    setLoading(true);

    try {
      await API.post("/client/request/decline", {
        requestId,
      });

      Alert.alert("Declined", "Request declined");

      router.back();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to decline request"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* CARD */}
      <View style={styles.card}>
        <Text style={styles.title}>New Client Request</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Client</Text>
          <Text style={styles.value}>
            {clientName || "Unknown"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Property</Text>
          <Text style={styles.value}>{propertyType}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>
            {lat}, {lng}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Request ID</Text>
          <Text style={styles.valueSmall}>{requestId}</Text>
        </View>
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, styles.decline]}
          onPress={handleDecline}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Decline</Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.btn, styles.accept]}
          onPress={handleAccept}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Accept</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 20,
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 20,
  },
  row: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    color: "#6B7280",
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  valueSmall: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  btn: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  accept: {
    backgroundColor: "#16A34A",
  },
  decline: {
    backgroundColor: "#DC2626",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
  },
});