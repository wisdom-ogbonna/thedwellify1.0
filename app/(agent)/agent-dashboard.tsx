import Sidebar from "@/components/sidebar/sidebar";
import { useTheme } from "@react-navigation/native";
import { useFocusEffect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  ArrowClockwiseIcon,
  BellIcon,
  BroadcastIcon,
  ClockIcon,
  HeadphonesIcon,
} from "phosphor-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { API } from "../../services/api";
import { registerForPushNotificationsAsync } from "../../services/notification";

const { width } = Dimensions.get("screen");

export default function AgentDashboard() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isOnline, goOnline, goOffline } = useAuth();

  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [btnLoading, setBtnLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [paying, setPaying] = useState<boolean>(false);
  const [toggling, setToggling] = useState<boolean>(false);
  const [agentName, setAgentName] = useState<string>("Agent");
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [requestId, setRequestId] = useState<string | null>(null);

  const sidebarX = useRef(new Animated.Value(-width)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isWorkflowActive = [
    "suspended",
    "matched",
    "inspection_started",
  ].includes(agentStatus || "");

  const getFormattedStatusLabel = () => {
    switch (agentStatus) {
      case "suspended":
        return "Account Suspended";
      case "matched":
        return "Matched with Client";
      case "inspection_started":
        return "Inspection in Progress";
      case "online":
      case "active":
        return "Available & Active";
      case "offline":
        return "Agent is Offline";
      default:
        return "Active";
    }
  };

  const getHeaderStatusText = () => {
    if (toggling) return "UPDATING...";
    if (agentStatus === "suspended") return "SUSPENDED";
    if (agentStatus === "matched") return "MATCHED";
    if (agentStatus === "inspection_started") return "INSPECTION";
    return isOnline ? "ONLINE" : "OFFLINE";
  };

  const currentStatusText = getHeaderStatusText();

  // Handle Online-Only Pulse Animation
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (currentStatusText === "ONLINE") {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [currentStatusText]);

  const toggleSidebar = () => {
    const toOpen = !isSidebarVisible;

    if (toOpen) {
      setIsSidebarVisible(true);
    }

    Animated.timing(sidebarX, {
      toValue: toOpen ? 0 : -width,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (!toOpen) {
        setIsSidebarVisible(false);
      }
    });
  };

  // UPDATED: Added a status validation guard before allowing toggles
  const handleOnlineToggle = async (value: boolean) => {
    const status = agentStatus?.toLowerCase();

    // 🔒 SAFETY GATE: Intercept if the account isn't approved/active yet
    if (
      value &&
      (status === "suspended" ||
        status === "pending" ||
        !status ||
        status === "offline")
    ) {
      // Allow passing through if status is 'offline' but they are approved
      if (status === "offline") {
        // Proceed to allow going online
      } else {
        Alert.alert(
          "Account Restrictions",
          "Your agent registration is currently undergoing review or requires an outstanding payment update.",
        );
        return;
      }
    }

    setToggling(true);
    try {
      if (value) {
        const response = await goOnline();

        if (response && response.success === false) {
          Alert.alert(
            "Location Required",
            response.message ||
              "Please enable location services on your device to go online.",
          );
          setToggling(false);
          return;
        }
      } else {
        await goOffline();
      }
      await fetchAgentStatus();
    } catch (e) {
      Alert.alert("Error", "Status update failed");
    } finally {
      setToggling(false);
    }
  };

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

  useFocusEffect(
    useCallback(() => {
      setIsSidebarVisible(false);
      fetchAgentStatus();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgentStatus();
  };

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
      Alert.alert("Error", "Failed to decline the request.");
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header Section */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 60,
            paddingBottom: 20,
          }}
        >
          <TouchableOpacity
            onPress={toggleSidebar}
            style={{ padding: 10, borderRadius: 8 }}
          >
            <View
              style={{
                width: 22,
                height: 2.5,
                backgroundColor: colors.text,
                marginBottom: 4,
                borderRadius: 2,
              }}
            />
            <View
              style={{
                width: 16,
                height: 2.5,
                backgroundColor: colors.text,
                marginBottom: 4,
                borderRadius: 2,
              }}
            />
            <View
              style={{
                width: 22,
                height: 2.5,
                backgroundColor: colors.text,
                borderRadius: 2,
              }}
            />
          </TouchableOpacity>

          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>
            Welcome, {agentName}
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            style={{ padding: 10, borderRadius: 8 }}
          >
            <BellIcon size={20} color={colors.text} weight="bold" />
          </TouchableOpacity>
        </View>

        {/* Status Card Body */}
        <View
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 24,
            marginHorizontal: 20,
            paddingVertical: 30,
            paddingHorizontal: 20,
            alignItems: "center",
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              <Animated.View
                style={{
                  backgroundColor: colors.border,
                  padding: 12,
                  borderRadius: 30,
                  marginBottom: 15,
                  transform: [{ scale: pulseAnim }],
                }}
              >
                <BroadcastIcon size={25} color={colors.primary} weight="bold" />
              </Animated.View>

              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.text,
                  textTransform: "uppercase",
                  opacity: 0.7,
                  letterSpacing: 0.5,
                }}
              >
                Agent Status
              </Text>

              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "800",
                  color: colors.primary,
                  marginVertical: 8,
                }}
              >
                {currentStatusText}
              </Text>

              {/* Status Pill Badge */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 5,
                  borderRadius: 15,
                  marginBottom: 30,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor:
                      agentStatus === "suspended" ? "#ef4444" : colors.primary,
                    marginRight: 6,
                  }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {getFormattedStatusLabel()}
                </Text>
              </View>

              <Text
                style={{
                  fontSize: 13,
                  color: colors.text,
                  textAlign: "center",
                  marginBottom: 30,
                  lineHeight: 18,
                  paddingHorizontal: 10,
                  opacity: 0.8,
                }}
              >
                {agentStatus === "suspended"
                  ? "Your matches are blocked until outstanding requests are paid."
                  : isWorkflowActive
                    ? "Please confirm availability of property before starting inspection, note: you can't be rematched while on inspection"
                    : isOnline
                      ? "Your agent profile is currently live and waiting for requests."
                      : "Your agent profile is currently offline.\nYou can go online to start receiving requests."}
              </Text>

              {toggling ? (
                <View
                  style={{
                    backgroundColor: colors.border,
                    paddingVertical: 14,
                    borderRadius: 12,
                    width: "85%",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ActivityIndicator
                    color={isOnline ? colors.text : colors.primary}
                    size="small"
                  />
                </View>
              ) : !isWorkflowActive ? (
                <TouchableOpacity
                  onPress={() => handleOnlineToggle(!isOnline)}
                  disabled={toggling}
                  style={{
                    backgroundColor: isOnline ? "red" : colors.primary,
                    paddingVertical: 14,
                    borderRadius: 12,
                    width: "85%",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontWeight: "600",
                      fontSize: 15,
                    }}
                  >
                    {isOnline ? "Go Offline" : "Go Online"}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {/* Core Workflow Actions */}
              {agentStatus === "suspended" && (
                <TouchableOpacity
                  onPress={triggerPayment}
                  disabled={paying}
                  style={{
                    backgroundColor: paying ? colors.border : colors.text,
                    padding: 14,
                    borderRadius: 12,
                    width: "85%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {paying ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <Text
                      style={{ color: colors.background, fontWeight: "600" }}
                    >
                      Pay Now
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Matched State Action Section */}
              {agentStatus === "matched" && requestId && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "85%",
                  }}
                >
                  <TouchableOpacity
                    onPress={startInspection}
                    style={{
                      backgroundColor: colors.primary,
                      padding: 14,
                      borderRadius: 12,
                      flex: 0.48,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    disabled={btnLoading}
                  >
                    {btnLoading ? (
                      <ActivityIndicator color="#ffffff" size={25} />
                    ) : (
                      <Text
                        style={{
                          color: "#ffffff",
                          fontWeight: "600",
                          textAlign: "center",
                        }}
                      >
                        Start Inspection
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        "Decline Request",
                        "Are you sure you want to decline this assignment?",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Decline",
                            style: "destructive",
                            onPress: declineRequest,
                          },
                        ],
                      )
                    }
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 14,
                      borderRadius: 12,
                      flex: 0.48,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: "600",
                        textAlign: "center",
                      }}
                    >
                      Decline
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {agentStatus === "inspection_started" && requestId && (
                <TouchableOpacity
                  onPress={endInspection}
                  style={{
                    backgroundColor: "#2563eb",
                    padding: 14,
                    borderRadius: 12,
                    width: "85%",
                  }}
                  disabled={btnLoading}
                >
                  {btnLoading ? (
                    <ActivityIndicator color="#ffffff" size={25} />
                  ) : (
                    <Text
                      style={{
                        color: "#fff",
                        textAlign: "center",
                        fontWeight: "600",
                      }}
                    >
                      End Inspection
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Quick Actions Panel */}
        <View style={{ marginHorizontal: 20, marginTop: 25 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 15,
              marginLeft: 5,
            }}
          >
            Quick Actions
          </Text>

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <TouchableOpacity
              onPress={onRefresh}
              style={{ flex: 1, alignItems: "center" }}
            >
              <View
                style={{
                  backgroundColor: colors.border,
                  padding: 16,
                  borderRadius: 16,
                  width: 65,
                  height: 65,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <ArrowClockwiseIcon color={colors.primary} size={24} />
              </View>
              <Text
                style={{ color: colors.text, fontSize: 12, fontWeight: "500" }}
              >
                Refresh Status
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ flex: 1, alignItems: "center" }}>
              <View
                style={{
                  backgroundColor: colors.border,
                  padding: 16,
                  borderRadius: 16,
                  width: 65,
                  height: 65,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <HeadphonesIcon color={colors.primary} size={24} />
              </View>
              <Text
                style={{ color: colors.text, fontSize: 12, fontWeight: "500" }}
              >
                Support
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ flex: 1, alignItems: "center" }}>
              <View
                style={{
                  backgroundColor: colors.border,
                  padding: 16,
                  borderRadius: 16,
                  width: 65,
                  height: 65,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <ClockIcon color={colors.primary} size={24} />
              </View>
              <Text
                style={{ color: colors.text, fontSize: 12, fontWeight: "500" }}
              >
                History
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Sidebar Component */}
      <Sidebar
        visible={isSidebarVisible}
        translateX={sidebarX}
        onOverlayPress={toggleSidebar}
        name={agentName}
        items={[
          {
            label: "Home",
            icon: "House",
            isActive: true,
            onPress: () => router.push("/(agent)/agent-dashboard"),
          },
          {
            label: "My Listings",
            icon: "Buildings",
            onPress: () => router.push("/(product)/products"),
          },
          {
            label: "Map",
            icon: "MapTrifold",
            onPress: () => router.push("/(agent)/map"),
          },
          {
            label: "Profile",
            icon: "User",
            onPress: () => router.push("/(agent)/agent-profile"),
          },
        ]}
        rating={5}
      />
    </View>
  );
}
