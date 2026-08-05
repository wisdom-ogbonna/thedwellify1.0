import BottomModal from "@/components/dialogs/bottom-modal";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Bell } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
  location?: string;
  lat?: number;
  lng?: number;
  clientName?: string;
  clientPhone?: string;
  clientLng?: number;
  clientLat?: number;
  requestId?: string;
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
      const liveData = liveRes.data;

      setAgent(liveData);
      setAgentStatus(liveData?.status || null);
      setRequestId(liveData?.requestId || null);

      if (liveData?.status === "suspended") {
        setMessage("Your account is suspended. Please make payment.");
      } else if (liveData?.status === "matched") {
        setMessage("You have an active request. Start inspection.");
      } else if (liveData?.status === "inspection_started") {
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
    }
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
      const activeReqId = requestId || agent?.requestId;
      if (!user || !activeReqId) {
        Alert.alert("Error", "Missing active request ID");
        return;
      }

      setMessage("Starting inspection...");
      await API.post("/client/inspection/start", {
        requestId: activeReqId,
        agentId: user.uid,
      });

      setMessage("Inspection started successfully");
      await fetchAgentStatus();
    } catch (err: any) {
      console.log("Start inspection error:", err.response?.data || err.message);
      setMessage("Failed to start inspection");
    } finally {
      setBtnLoading(false);
    }
  };

  const endInspection = async () => {
    setBtnLoading(true);
    try {
      const user = auth.currentUser;
      const activeReqId = requestId || agent?.requestId;
      if (!user || !activeReqId) {
        Alert.alert("Error", "Missing active request ID");
        return;
      }

      setMessage("Ending inspection...");
      await API.post("/client/inspection/end", {
        requestId: activeReqId,
        agentId: user.uid,
      });

      setMessage("Inspection completed successfully");
      await fetchAgentStatus();
    } catch (err: any) {
      console.log("End inspection error:", err.response?.data || err.message);
      setMessage("Failed to end inspection");
    } finally {
      setBtnLoading(false);
    }
  };

  const declineRequest = async () => {
    try {
      const user = auth.currentUser;
      const activeReqId = requestId || agent?.requestId;
      if (!user || !activeReqId) return;

      setBtnLoading(true);
      await API.post("/client/cancel-match", {
        requestId: activeReqId,
        reason: "Agent is busy",
      });

      Alert.alert("Declined", "Request has been successfully declined.");
      await fetchAgentStatus();
    } catch (err: any) {
      console.log("Decline error:", err.response?.data || err.message);
      Alert.alert("Error", "Failed to decline the request");
    } finally {
      setBtnLoading(false);
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

    const interval = setInterval(() => {
      fetchAgentStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Get user location
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
      (currentStatus === "matched" || currentStatus === "inspection_started") &&
      agent?.clientLat &&
      agent?.clientLng
    ) {
      coordinates.push({
        latitude: agent.clientLat,
        longitude: agent.clientLng,
      });
    }

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 120, right: 80, bottom: 120, left: 80 },
      animated: true,
    });
  }, [agent]);

  const copyToClipboard = async (text: string, title: string) => {
    if (!text || text.includes("Not matched yet")) return;
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", `${title} copied to clipboard!`, [{ text: "OK" }], {
      cancelable: true,
    });
  };

  const currentStatus = agentStatus || agent?.status;

  const isSheetVisible = Boolean(
    currentStatus &&
    ["matched", "inspection_started", "suspended"].includes(currentStatus),
  );

  const isMatchedOrStarted =
    currentStatus === "matched" || currentStatus === "inspection_started";

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      {/* Header Overlay */}
      <View className="absolute top-12 left-0 right-0 z-50 flex-row items-center justify-between px-4 py-2">
        {/* Left Pill Container (Brand & Notification) */}
        <View
          className="flex-row items-center p-1.5 pr-5 rounded-full shadow-lg"
          style={{ backgroundColor: "#2A2A2A" }}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            className="w-10 h-10 rounded-full justify-center items-center mr-3"
            style={{ backgroundColor: colors.primary }}
          >
            <Bell size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white text-base font-bold tracking-wide">
            Dwellify
          </Text>
        </View>

        {/* Right Profile Avatar */}
        <TouchableOpacity activeOpacity={0.85} className="shadow-md">
          <Image
            source={{
              uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5d-Q11KjCzqjJTsFyu52nPBtSBvIIyW1-Ew8mw8ENBw&s=10",
            }}
            className="w-15 h-15 rounded-full"
            style={{
              borderWidth: 2,
              borderColor: colors.border || "#3A3A3A",
            }}
          />
        </TouchableOpacity>
      </View>

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
        {/* AGENT MARKER */}
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

        {/* CLIENT MARKER */}
        {isMatchedOrStarted && agent?.clientLat && agent?.clientLng && (
          <Marker
            coordinate={{
              latitude: agent.clientLat,
              longitude: agent.clientLng,
            }}
            title={agent.clientName || "Client"}
            description={agent.clientPhone}
            pinColor="green"
          />
        )}
      </MapView>

      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
        onPress={focusUser}
      >
        <Ionicons name="locate" size={22} color={colors.text} />
      </TouchableOpacity>

      {/* BOTTOM MODAL DISPLAY LOGIC */}
      <View pointerEvents="box-none" style={styles.sheetOverlayContainer}>
        <BottomModal
          visible={isSheetVisible}
          onClose={() => {}}
          colors={colors}
        >
          <View className="w-full">
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              bounces={false}
              overScrollMode="never"
              contentContainerClassName="pb-6 px-4 pt-2 gap-4"
            >
              {/* Top Status Card */}
              <View
                style={{
                  backgroundColor: colors.text,
                  borderColor: colors.border,
                }}
                className="border rounded-3xl p-4 shadow-sm"
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text
                    style={{ color: colors.placeholder }}
                    className="text-[10px] font-bold uppercase tracking-widest"
                  >
                    Status
                  </Text>
                  <View className="flex-row items-center bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full gap-1.5">
                    <View className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <Text className="text-[11px] font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                      AVAILABLE
                    </Text>
                  </View>
                </View>

                <Text
                  style={{ color: colors.text }}
                  className="text-base font-extrabold tracking-tight mb-4"
                  numberOfLines={1}
                >
                  {isMatchedOrStarted
                    ? `You're matched with ${agent?.clientName || "Client"}`
                    : currentStatus === "suspended"
                      ? "Account Suspended"
                      : "Awaiting match..."}
                </Text>

                {/* Client Info Grid */}
                <View className="flex-row gap-3">
                  {/* Client Name */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      copyToClipboard(
                        agent?.clientName || "Not matched yet",
                        "Client Name",
                      )
                    }
                    style={{
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    }}
                    className="flex-1 border rounded-2xl p-3 justify-between"
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text
                        style={{ color: colors.placeholder }}
                        className="text-[9px] font-bold uppercase tracking-wider"
                      >
                        Client Name
                      </Text>
                      {agent?.clientName && isMatchedOrStarted && (
                        <Ionicons
                          name="copy-outline"
                          size={12}
                          color={colors.placeholder}
                        />
                      )}
                    </View>
                    <Text
                      style={{ color: colors.text }}
                      className="text-xs font-bold"
                      numberOfLines={1}
                    >
                      {isMatchedOrStarted
                        ? agent?.clientName || "Client"
                        : "Not matched yet"}
                    </Text>
                  </TouchableOpacity>

                  {/* Client Phone */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      copyToClipboard(
                        agent?.clientPhone || "Not matched yet",
                        "Phone number",
                      )
                    }
                    style={{
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    }}
                    className="flex-1 border rounded-2xl p-3 justify-between"
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text
                        style={{ color: colors.placeholder }}
                        className="text-[9px] font-bold uppercase tracking-wider"
                      >
                        Phone
                      </Text>
                      {agent?.clientPhone && isMatchedOrStarted && (
                        <Ionicons
                          name="copy-outline"
                          size={12}
                          color={colors.placeholder}
                        />
                      )}
                    </View>
                    <Text
                      style={{ color: colors.text }}
                      className="text-xs font-bold font-mono"
                      numberOfLines={1}
                    >
                      {isMatchedOrStarted
                        ? agent?.clientPhone || "Client"
                        : "Not matched yet"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Current Location Card */}
              <View
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }}
                className="border rounded-3xl p-4 flex-row items-center justify-between shadow-sm"
              >
                <View className="flex-row items-center flex-1 pr-3">
                  <View
                    style={{ backgroundColor: colors.primary }}
                    className="w-9 h-9 rounded-2xl justify-center items-center shadow-sm mr-3"
                  >
                    <Ionicons name="location" size={18} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text
                      style={{ color: colors.placeholder }}
                      className="text-[9px] font-bold uppercase tracking-wider mb-0.5"
                    >
                      Current Location
                    </Text>
                    <Text
                      style={{ color: colors.text }}
                      className="text-xs font-bold"
                      numberOfLines={1}
                    >
                      {agent?.location ||
                        "Off East West, Choba, Port Harcourt..."}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={fetchAgentStatus}
                  style={{ backgroundColor: colors.disabled }}
                  className="w-8 h-8 rounded-full justify-center items-center"
                >
                  <Ionicons
                    name="refresh-outline"
                    size={14}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>

              {/* Dynamic Buttons Based on Current State */}
              <View className="gap-3 pt-1">
                {/* STATE 1: MATCHED STATE -> Decline & Start Inspection Buttons Side by Side */}
                {currentStatus === "matched" && (
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={btnLoading}
                      onPress={declineRequest}
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.error,
                      }}
                      className="flex-1 h-14 border rounded-2xl flex-row justify-center items-center gap-2"
                    >
                      <Ionicons name="close" size={18} color={colors.error} />
                      <Text
                        style={{ color: colors.error }}
                        className="text-xs font-extrabold uppercase tracking-wider"
                      >
                        Decline
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={btnLoading}
                      onPress={startInspection}
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      }}
                      className="flex-1 h-14 border rounded-2xl flex-row justify-center items-center gap-2"
                    >
                      {btnLoading ? (
                        <ActivityIndicator size="small" color={colors.text} />
                      ) : (
                        <>
                          <Ionicons
                            name="time-outline"
                            size={16}
                            color={colors.text}
                          />
                          <Text
                            style={{ color: colors.text }}
                            className="text-xs font-extrabold uppercase tracking-wider"
                          >
                            Start Inspection
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* STATE 2: INSPECTION STARTED -> Full Width END INSPECTION Button */}
                {currentStatus === "inspection_started" && (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    disabled={btnLoading}
                    onPress={endInspection}
                    style={{ backgroundColor: colors.primary }}
                    className="w-full h-14 rounded-2xl flex-row justify-center items-center gap-2 shadow-lg"
                  >
                    {btnLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Text className="text-white text-xs font-extrabold uppercase tracking-tight">
                          END INSPECTION
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#FFFFFF"
                        />
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* STATE 3: SUSPENDED STATE -> Full Width Pay Now Button */}
                {currentStatus === "suspended" && (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    disabled={paying}
                    onPress={triggerPayment}
                    style={{ backgroundColor: colors.primary }}
                    className="w-full h-14 rounded-2xl flex-row justify-center items-center gap-2 shadow-lg"
                  >
                    {paying ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Text className="text-white text-xs font-extrabold tracking-tight">
                          Pay Now
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#FFFFFF"
                        />
                      </>
                    )}
                  </TouchableOpacity>
                )}
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
    padding: 14,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 5,
    borderWidth: 1,
  },
  sheetOverlayContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99,
  },
});
