import BottomSheet, {
  BottomSheetRefProps,
} from "@/components/short-bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard"; // ✅ Added Clipboard support
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { CaretLeftIcon } from "phosphor-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { API } from "../../services/api";

const { width, height } = Dimensions.get("screen");

export default function MapScreen() {
  const mapRef = useRef(null);

  const [location, setLocation] = useState(null);
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const ref = useRef<BottomSheetRefProps>(null);

  const SNAP_25 = -height * 0.2;
  const SNAP_50 = -height * 0.5;
  const SNAP_80 = -height * 0.8;

  /**
   * ✅ Get user location
   */
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setLocation(loc.coords);
      } catch (err) {
        console.log("Location error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ref.current) {
        ref.current.scrollTo(SNAP_50);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [SNAP_50]);

  /**
   * ✅ Fetch live agent data
   */
  const fetchAgent = async () => {
    try {
      const res = await API.get("/agent/live");
      setAgent(res.data);
    } catch (err) {
      console.log("Agent fetch error:", err.response?.data || err.message);
    }
  };

  /**
   * ✅ Auto refresh
   */
  useEffect(() => {
    fetchAgent();

    const interval = setInterval(() => {
      fetchAgent();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /**
   * ✅ Focus map on current user
   */
  const focusUser = () => {
    if (!location || !mapRef.current) return;

    mapRef.current.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      600,
    );
  };

  /**
   * ✅ Auto fit markers
   */
  useEffect(() => {
    if (!mapRef.current || !agent?.isOnline || !agent?.lat || !agent?.lng) {
      return;
    }

    const coordinates = [
      {
        latitude: agent.lat,
        longitude: agent.lng,
      },
    ];

    if (
      (agent?.status === "matched" || agent?.status === "inspection_started") &&
      agent?.clientLat &&
      agent?.clientLng
    ) {
      coordinates.push({
        latitude: agent.clientLat,
        longitude: agent.clientLng,
      });
    }

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: {
        top: 120,
        right: 80,
        bottom: 120,
        left: 80,
      },
      animated: true,
    });
  }, [agent]);

  /**
   * ✅ Handle Copy Action Method
   */
  const copyToClipboard = async (text: string, title: string) => {
    if (!text || text.includes("Not matched yet")) return;
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", `${title} copied to clipboard!`, [{ text: "OK" }], {
      cancelable: true,
    });
  };

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: "#0B0F1A" }]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsCompass={false}
        showsMyLocationButton={false}
        initialRegion={{
          latitude: location?.latitude || 4.8156,
          longitude: location?.longitude || 7.0498,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* ✅ AGENT MARKER */}
        {agent?.isOnline && agent?.lat && agent?.lng && (
          <Marker
            coordinate={{
              latitude: agent.lat,
              longitude: agent.lng,
            }}
            title="You"
            description="Your Location"
          />
        )}

        {/* ✅ CLIENT MARKER */}
        {(agent?.status === "matched" ||
          agent?.status === "inspection_started") &&
          agent?.clientLat &&
          agent?.clientLng && (
            <Marker
              coordinate={{
                latitude: agent.clientLat,
                longitude: agent.clientLng,
              }}
              title={agent.clientName}
              description={agent.clientPhone}
              pinColor="green"
            />
          )}
      </MapView>

      <TouchableOpacity style={styles.fab} onPress={focusUser}>
        <Ionicons name="locate" size={22} color="#ffffff" />
      </TouchableOpacity>

      <View pointerEvents="box-none" style={styles.sheetOverlayContainer}>
        <BottomSheet ref={ref}>
          <View
            style={{ width: "100%", minHeight: 40 }}
            onLayout={() => ref.current?.scrollTo(SNAP_50)}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              bounces={false}
              overScrollMode="never"
            >
              <View className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 mb-4 shadow-sm">
                {agent?.status === "matched" ||
                agent?.status === "inspection_started" ? (
                  <Text className="text-sm text-slate-200 font-medium leading-relaxed">
                    You&apos;re currently matched to this client. Please call
                    him/her now.
                  </Text>
                ) : (
                  <Text className="text-sm text-slate-400 font-medium tracking-wide italic">
                    Awaiting match...
                  </Text>
                )}

                {/* Status Badge */}
                <View className="mt-4 pt-4 border-t border-slate-700/50 flex-row items-center justify-between">
                  <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Status
                  </Text>
                  <View
                    className={`px-3 py-1 rounded-full border ${
                      agent?.status === "matched" ||
                      agent?.status === "inspection_started"
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-amber-500/10 border-amber-500/30"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold font-mono uppercase tracking-tight ${
                        agent?.status === "matched" ||
                        agent?.status === "inspection_started"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {agent?.status || "offline"}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  copyToClipboard(agent?.clientName, "Client Name")
                }
                style={styles.infoCard}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.infoLabel}>Client Name</Text>
                  {agent?.clientName && (
                    <Ionicons name="copy-outline" size={14} color="#94A3B8" />
                  )}
                </View>
                <Text style={styles.infoValue}>
                  {agent?.status === "matched" ||
                  agent?.status === "inspection_started"
                    ? agent?.clientName || "Client"
                    : "Not matched yet"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  copyToClipboard(agent?.clientPhone, "Phone number")
                }
                style={styles.infoCard}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.infoLabel}>Client Phone Number</Text>
                  {agent?.clientPhone && (
                    <Ionicons name="copy-outline" size={14} color="#94A3B8" />
                  )}
                </View>
                <Text style={styles.infoValue}>
                  {agent?.status === "matched" ||
                  agent?.status === "inspection_started"
                    ? agent?.clientPhone || "Client"
                    : "Not matched yet"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </BottomSheet>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F1A",
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  fab: {
    position: "absolute",
    right: 16,
    bottom: 90,
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 5,
    borderWidth: 1,
    borderColor: "#334155",
  },

  sheetOverlayContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99,
  },

  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  infoCard: {
    backgroundColor: "#1E293B",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },

  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "between",
    alignItems: "center",
    marginBottom: 4,
  },

  infoLabel: {
    flex: 1,
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  infoValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },

  agentMarker: {
    alignItems: "center",
    justifyContent: "center",
  },

  pulse: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(37,99,235,0.25)",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "#2563eb",
  },

  agentBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 6,
  },

  clientMarker: {
    alignItems: "center",
  },

  clientBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 6,
  },

  clientPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },

  bubbleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
});
