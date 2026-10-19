import BottomModal from "@/components/dialogs/bottom-modal";
import { NotificationBell } from "@/components/notifications/notification-bell";
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
  Image,
  Pressable,
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

type ThemeColors = ReturnType<typeof useTheme>["colors"];

/* -------------------------------------------------------------------------- */
/* SMALL UI PIECES                                                            */
/* -------------------------------------------------------------------------- */

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{ backgroundColor: color + "1A", borderColor: color + "40" }}
      className="flex-row items-center border px-3 py-1.5 rounded-full gap-1.5"
    >
      <View
        style={{ backgroundColor: color }}
        className="w-1.5 h-1.5 rounded-full"
      />
      <Text
        style={{ color }}
        className="text-[11px] font-extrabold tracking-wider"
      >
        {label}
      </Text>
    </View>
  );
}

function InfoCard({
  icon,
  label,
  value,
  copyable,
  onPress,
  colors,
  mono,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  copyable: boolean;
  onPress: () => void;
  colors: ThemeColors;
  mono?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        backgroundColor: colors.disabled + "14",
        borderColor: colors.border,
      }}
      className="flex-1 border rounded-2xl p-3.5"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-1.5 flex-1">
          <Ionicons name={icon} size={13} color={colors.placeholder} />
          <Text
            style={{ color: colors.placeholder }}
            className="text-[10px] font-bold uppercase tracking-wider"
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
        {copyable ? (
          <Ionicons name="copy-outline" size={13} color={colors.placeholder} />
        ) : null}
      </View>
      <Text
        style={{ color: colors.text }}
        className={`text-sm font-bold ${mono ? "font-mono" : ""}`}
        numberOfLines={1}
      >
        {value}
      </Text>
    </TouchableOpacity>
  );
}

function ActionButton({
  label,
  icon,
  onPress,
  disabled,
  loading,
  colors,
  variant,
  trailingIcon,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  colors: ThemeColors;
  variant: "primary" | "danger";
  trailingIcon?: boolean;
}) {
  const isPrimary = variant === "primary";
  const fg = isPrimary ? "#FFFFFF" : colors.error;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      style={[
        {
          backgroundColor: isPrimary ? colors.primary : colors.error + "14",
          borderColor: isPrimary ? colors.primary : colors.error + "50",
          opacity: disabled && !loading ? 0.6 : 1,
        },
        isPrimary && {
          shadowColor: colors.primary,
          shadowOpacity: 0.3,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        },
      ]}
      className="flex-1 h-14 border rounded-2xl flex-row justify-center items-center gap-2"
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text
            style={{ color: fg }}
            className="text-xs font-extrabold uppercase tracking-wider"
          >
            {label}
          </Text>
          {trailingIcon ? (
            <Ionicons name="arrow-forward" size={16} color={fg} />
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
}

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

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
  const openedRequestRef = useRef<string | null>(null);

  const syncPushToken = async () => {
    try {
      const pushData = await registerForPushNotificationsAsync();
      if (!pushData) return;

      const payload = {
        platform: pushData.platform,
        expoPushToken: pushData.token,
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
            (latestItem.status === "offered" ||
              latestItem.redisStatus === "offered") &&
            latestItem.requestId &&
            openedRequestRef.current !== String(latestItem.requestId)
          ) {
            openedRequestRef.current = String(latestItem.requestId);
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
      const reason =
        err.response?.data?.error || "Payment failed. Try again.";
      console.log("Payment error:", err.response?.data || err.message);
      setMessage(reason);
      Alert.alert("Payment", reason);
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

  const currentStatus = agentStatus || agent?.status;

  const isSheetVisible = Boolean(
    currentStatus &&
    ["matched", "inspection_started", "suspended"].includes(currentStatus),
  );

  const isMatchedOrStarted =
    currentStatus === "matched" || currentStatus === "inspection_started";

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

  /* ------------------------------ Derived UI ------------------------------ */

  const statusMeta = (() => {
    switch (currentStatus) {
      case "suspended":
        return { label: "SUSPENDED", color: colors.error };
      case "matched":
        return { label: "MATCHED", color: colors.success };
      case "inspection_started":
        return { label: "IN PROGRESS", color: colors.primary };
      default:
        return { label: "AVAILABLE", color: colors.primary };
    }
  })();

  const isAwaiting = !isMatchedOrStarted && currentStatus !== "suspended";

  const title = isMatchedOrStarted
    ? `You're matched with ${agent?.clientName || "Client"}`
    : currentStatus === "suspended"
      ? "Account Suspended"
      : "Awaiting match...";

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
      {/* Header Overlay */}
      <View className="absolute top-12 left-0 right-0 z-50 flex-row items-center justify-between px-4 py-2">
        {/* Left Pill (Notification & Brand) */}
        <View
          className="flex-row items-center p-1.5 pr-5 rounded-full"
          style={{
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          <NotificationBell
            color="#FFFFFF"
            size={18}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary,
              marginRight: 12,
            }}
          />
          <Text
            style={{ color: colors.text }}
            className="text-base font-bold tracking-wide"
          >
            Dwellify
          </Text>
        </View>

        <Pressable onPress={() => router.push("/(utilities)/agent-profile")}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300",
            }}
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              borderWidth: 2,
              borderColor: colors.success,
            }}
          />
        </Pressable>
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

      {/* BOTTOM MODAL */}
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
              {/* Header: label + status pill, then title and message */}
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text
                    style={{ color: colors.placeholder }}
                    className="text-[10px] font-bold uppercase tracking-widest"
                  >
                    Status
                  </Text>
                  <StatusPill
                    label={statusMeta.label}
                    color={statusMeta.color}
                  />
                </View>

                <Text
                  style={{ color: colors.text }}
                  className="text-xl font-extrabold tracking-tight"
                  numberOfLines={1}
                >
                  {title}
                </Text>
                {message ? (
                  <Text
                    style={{ color: colors.placeholder }}
                    className="text-xs mt-1"
                    numberOfLines={2}
                  >
                    {message}
                  </Text>
                ) : null}
              </View>

              {/* Current location card */}
              <View
                style={{
                  backgroundColor: colors.disabled + "14",
                  borderColor: colors.border,
                }}
                className="border rounded-3xl p-3.5 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1 pr-3">
                  <View
                    style={{
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    }}
                    className="w-11 h-11 rounded-2xl border justify-center items-center mr-3"
                  >
                    {isAwaiting ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons
                        name="location"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      style={{ color: colors.placeholder }}
                      className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                    >
                      Current Location
                    </Text>
                    <Text
                      style={{ color: colors.text }}
                      className="text-sm font-bold"
                      numberOfLines={1}
                    >
                      {agent?.location ||
                        "Off East West, Choba, Port Harcourt..."}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={fetchAgentStatus}
                  style={{ backgroundColor: colors.disabled + "26" }}
                  className="w-9 h-9 rounded-full justify-center items-center"
                >
                  <Ionicons
                    name="refresh-outline"
                    size={16}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>

              {/* Client info (hidden while suspended) */}
              {currentStatus !== "suspended" && (
                <View className="flex-row gap-3">
                  <InfoCard
                    icon="person-outline"
                    label="Client Name"
                    value={
                      isMatchedOrStarted
                        ? agent?.clientName || "Client"
                        : "Not matched yet"
                    }
                    copyable={Boolean(agent?.clientName && isMatchedOrStarted)}
                    onPress={() =>
                      copyToClipboard(
                        agent?.clientName || "Not matched yet",
                        "Client Name",
                      )
                    }
                    colors={colors}
                  />
                  <InfoCard
                    icon="call-outline"
                    label="Phone"
                    value={
                      isMatchedOrStarted
                        ? agent?.clientPhone || "Client"
                        : "Not matched yet"
                    }
                    copyable={Boolean(agent?.clientPhone && isMatchedOrStarted)}
                    onPress={() =>
                      copyToClipboard(
                        agent?.clientPhone || "Not matched yet",
                        "Phone number",
                      )
                    }
                    colors={colors}
                    mono
                  />
                </View>
              )}

              {/* Actions per state */}
              {currentStatus === "matched" && (
                <View className="flex-row gap-3 pt-1">
                  <ActionButton
                    label="Decline"
                    icon="close"
                    variant="danger"
                    disabled={btnLoading}
                    onPress={declineRequest}
                    colors={colors}
                  />
                  <ActionButton
                    label="Start Inspection"
                    icon="play-circle-outline"
                    variant="primary"
                    disabled={btnLoading}
                    loading={btnLoading}
                    onPress={startInspection}
                    colors={colors}
                  />
                </View>
              )}

              {currentStatus === "inspection_started" && (
                <View className="flex-row gap-3 pt-1">
                  <ActionButton
                    label="End Inspection"
                    icon="checkmark-circle-outline"
                    variant="primary"
                    trailingIcon
                    disabled={btnLoading}
                    loading={btnLoading}
                    onPress={endInspection}
                    colors={colors}
                  />
                </View>
              )}

              {currentStatus === "suspended" && (
                <View className="flex-row gap-3 pt-1">
                  <ActionButton
                    label="Pay Now"
                    icon="card-outline"
                    variant="primary"
                    trailingIcon
                    disabled={paying}
                    loading={paying}
                    onPress={triggerPayment}
                    colors={colors}
                  />
                </View>
              )}
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
  accentBar: {
    height: 4,
    borderRadius: 2,
    width: "100%",
  },
});
