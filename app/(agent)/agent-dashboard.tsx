import BottomModal from "@/components/dialogs/bottom-modal";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../config/firebase";
import { API } from "../../services/api";
import { registerForPushNotificationsAsync } from "../../services/notification";
interface Agent {
  status?: string;
  isOnline?: boolean;
  lat?: number;
  lng?: number;
  clientName?: string;
  clientPhone?: string;
  clientLng?: number;
  clientLat?: number;
}

interface LocationObj {
  latitude: number;
  longitude: number;
}

export default function MapScreen() {
  const mapRef = useRef<MapView | null>(null);
  const { colors } = useTheme();

  const [location, setLocation] = useState<LocationObj | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);

  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [btnLoading, setBtnLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [paying, setPaying] = useState<boolean>(false);
  const [agentName, setAgentName] = useState<string>("Agent");
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [requestId, setRequestId] = useState<string | null>(null);

  const syncPushToken = async () => {
    try {
      const pushData = await registerForPushNotificationsAsync();
      if (!pushData) return;

      const payload = {
        platform: pushData.platform,
        ...(pushData.platform === "ios"
          ? { expoPushToken: pushData.token }
          : { fcmToken: pushData.token }),
      };

      await API.post("/notifications/agent", payload);
    } catch (err) {
      console.log("Push token sync failed:", err);
    }
  };

  const fetchAgentStatus = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setMessage("User not authenticated");
        return;
      }

      const token = await user.getIdToken();
      const authHeader = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const liveRes = await API.get("/agent/live", authHeader);
      const agent = liveRes.data;

      setAgentStatus(agent.status);
      setRequestId(agent.requestId || null);

      if (agent.status === "suspended") {
        setMessage("Your account is suspended. Please make payment.");
      } else if (agent.status === "matched") {
        setMessage("You have an active request. Start inspection.");
      } else if (agent.status === "inspection_started") {
        setMessage("Inspection in progress. Complete it when done.");
      } else {
        setMessage("Agent is active");
      }

      try {
        const response: any = await API.get("/agent/requests", authHeader);

        const requestsList = response?.requests || response?.data?.requests;

        if (
          requestsList &&
          Array.isArray(requestsList) &&
          requestsList.length > 0
        ) {
          const sorted = [...requestsList].sort(
            (a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0),
          );
          const latestItem = sorted[0];

          if (
            latestItem &&
            latestItem.status === "pending" &&
            latestItem.requestId
          ) {
            router.push({
              pathname: "/(utilities)/requests",
              params: {
                requestId: String(latestItem.requestId),
                agentId: String(latestItem.agentId),
                clientName: String(latestItem.clientName),
                propertyType: String(latestItem.propertyType),
                lat: String(latestItem.lat),
                lng: String(latestItem.lng),
              },
            });
          }
        } else {
          console.log("No requests found in the response.");
        }
      } catch (err: any) {
        console.error("Request Check failed:", err);
      }

      try {
        const profileRes = await API.get("/agent/profile", authHeader);
        const profileData = profileRes.data;
        setAgentName(
          profileData?.name ? profileData.name.split(" ")[0] : "Agent",
        );
      } catch (profileErr) {
        console.log("Profile fetch failed:", profileErr);
      }
    } catch (err: any) {
      console.log("Fetch agent error:", err.response?.data || err.message);
      setMessage("Failed to fetch agent status");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchAgentStatus();
  };
  
  useFocusEffect(
    useCallback(() => {
      fetchAgentStatus();
    }, []),
  );


  const startInspection = async () => {
    setBtnLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !requestId) {
        Alert.alert("Error", "Missing active request ID");
        return;
      }

      setMessage("Starting inspection...");
      await API.post("/client/inspection/start", {
        requestId,
        agentId: user.uid,
      });

      setMessage("Inspection started successfully");
      setBtnLoading(false);
      await fetchAgentStatus();
    } catch (err: any) {
      console.log("Start inspection error:", err.response?.data || err.message);
      setMessage("Failed to start inspection");
    }
  };

  const endInspection = async () => {
    setBtnLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !requestId) {
        Alert.alert("Error", "Missing active request ID");
        return;
      }

      setMessage("Ending inspection...");
      await API.post("/client/inspection/end", {
        requestId,
        agentId: user.uid,
      });

      setMessage("Inspection completed successfully");
      setBtnLoading(false);
      await fetchAgentStatus();
    } catch (err: any) {
      console.log("End inspection error:", err.response?.data || err.message);
      setMessage("Failed to end inspection");
    }
  };

  const declineRequest = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !requestId) return;

      setLoading(true);
      await API.post("/client/cancel-match", {
        requestId,
        reason: "Agent is busy",
      });

      Alert.alert("Declined", "Request has been successfully declined.");
      await fetchAgentStatus();
    } catch (err: any) {
      console.log("Decline error:", err.response?.data || err.message);
      Alert.alert("Error", "Failed to decline the request");
    } finally {
      setLoading(false);
    }
  };

  const triggerPayment = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      setPaying(true);
      setMessage("Redirecting to payment...");

      const res = await API.post("/payment/pay", { agentId: user.uid });
      const { paymentUrl } = res.data;

      if (!paymentUrl) {
        setMessage("No payment link received");
        return;
      }

      await WebBrowser.openBrowserAsync(paymentUrl);
      setMessage("Checking payment status...");

      setTimeout(() => {
        fetchAgentStatus();
      }, 3000);
    } catch (err: any) {
      console.log("Payment error:", err.response?.data || err.message);
      setMessage("Payment failed. Try again.");
    } finally {
      setPaying(false);
    }
  };

  useEffect(() => {
    syncPushToken();
    fetchAgentStatus();
  }, []);

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
    const timer = setTimeout(() => {}, 400);
    return () => clearTimeout(timer);
  }, []);

  /**
   * ✅ Fetch live agent data
   */
  const fetchAgent = async () => {
    try {
      const res = await API.get("/agent/live");
      setAgent(res.data);
    } catch (err: any) {
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
        <BottomModal visible={true} onClose={() => {}} colors={colors}>
          <View style={{ width: "100%", minHeight: 40 }}>
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
                  copyToClipboard(
                    agent?.clientName || "Not matched yet",
                    "Client Name",
                  )
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
                  copyToClipboard(
                    agent?.clientPhone || "Not matched yet",
                    "Phone number",
                  )
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
              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={declineRequest}
                  style={styles.infoCard}
                >
                  <Text style={styles.infoLabel}>Decline Request</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={startInspection}
                  style={styles.infoCard}
                >
                  <Text style={styles.infoLabel}>Start Inspection</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={endInspection}
                  style={styles.infoCard}
                >
                  <Text style={styles.infoLabel}>End Inspection</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={triggerPayment}
                  style={styles.infoCard}
                >
                  <Text style={styles.infoLabel}>Pay now</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </BottomModal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
