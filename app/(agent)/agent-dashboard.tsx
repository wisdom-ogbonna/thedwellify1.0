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
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [agentName, setAgentName] = useState<string>("Agent");
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [requestId, setRequestId] = useState(null);

  const sidebarX = useRef(new Animated.Value(-width)).current;
  // Dynamic animated value for the online status pulse
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

  // Status header values
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
    const open = !isSidebarVisible;
    Animated.timing(sidebarX, {
      toValue: open ? 0 : -width,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setIsSidebarVisible(open));
  };

  const handleOnlineToggle = async (value: boolean) => {
    setToggling(true);
    try {
      if (value) {
        await goOnline();
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

      const payload: any = { platform: pushData.platform };

      if (pushData.platform === "ios") {
        payload.expoPushToken = pushData.token;
      } else {
        payload.fcmToken = pushData.token;
      }

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        const profileRes = await API.get("/agent/profile", authHeader);
        const profileData = profileRes.data;

        if (profileData?.name) {
          setAgentName(profileData.name.split(" ")[0] || "Agent");
        } else {
          setAgentName("Agent");
        }
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
    try {
      const user = auth.currentUser;
      if (!user || !requestId) {
        alert("Missing request");
        return;
      }

      setMessage("Starting inspection...");
      await API.post("/client/inspection/start", {
        requestId,
        agentId: user.uid,
      });

      setMessage("Inspection started successfully");
      await fetchAgentStatus();
    } catch (err) {
      const error = err as any;
      console.log(
        "Start inspection error:",
        error.response?.data || error.message,
      );
      setMessage("Failed to start inspection");
    }
  };

  const endInspection = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !requestId) {
        alert("Missing request");
        return;
      }

      setMessage("Ending inspection...");
      await API.post("/client/inspection/end", {
        requestId,
        agentId: user.uid,
      });

      setMessage("Inspection completed successfully");
      await fetchAgentStatus();
    } catch (err) {
      const error = err as any;
      console.log(
        "End inspection error:",
        error.response?.data || error.message,
      );
      setMessage("Failed to end inspection");
    }
  };

  const triggerPayment = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("User not authenticated");
        return;
      }

      setPaying(true);
      setMessage("Redirecting to payment...");

      const res = await API.post("/payment/pay", {
        agentId: user.uid,
      });

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
    } catch (err) {
      const error = err as any;
      console.log("Payment error:", error.response?.data || error.message);
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
            paddingTop: 50,
            paddingBottom: 20,
          }}
        >
          <Pressable
            onPress={toggleSidebar}
            style={{
              padding: 10,
              borderRadius: 8,
            }}
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
          </Pressable>

          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>
            Welcome, {agentName}
          </Text>

          <Pressable
            onPress={toggleSidebar}
            style={{ padding: 10, borderRadius: 8 }}
          >
            <BellIcon size={20} color={colors.text} weight="bold" />
          </Pressable>
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
              {/* Indicator Badge Icon with Pulse Effect applied */}
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

              {/* Clean Status Pill Badge */}
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
                    ? "You have an ongoing inspection or request. Complete your ongoing inspection to update your status."
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
                !isOnline ? (
                  <Pressable
                    onPress={() => handleOnlineToggle(true)}
                    disabled={toggling}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.primary,
                      paddingVertical: 14,
                      borderRadius: 12,
                      width: "85%",
                    }}
                  >
                    <Text
                      style={{
                        color: "#ffffff",
                        fontWeight: "600",
                        fontSize: 15,
                      }}
                    >
                      Go Online
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => handleOnlineToggle(false)}
                    disabled={toggling}
                    style={{
                      backgroundColor: colors.text,
                      paddingVertical: 14,
                      borderRadius: 12,
                      width: "85%",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: colors.background,
                        fontWeight: "600",
                        fontSize: 15,
                      }}
                    >
                      Go Offline
                    </Text>
                  </Pressable>
                )
              ) : null}

              {/* Core Workflow Actions */}
              {agentStatus === "suspended" && (
                <Pressable
                  onPress={triggerPayment}
                  disabled={paying}
                  style={{
                    backgroundColor: paying ? colors.border : colors.text,
                    padding: 14,
                    borderRadius: 12,
                    width: "85%",
                    marginTop: 0,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {paying ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <Text
                      style={{
                        color: colors.background,
                        textAlign: "center",
                        fontWeight: "600",
                      }}
                    >
                      Pay Now
                    </Text>
                  )}
                </Pressable>
              )}

              {/* Matched State Action Section with New Side-by-Side Decline Button */}
              {agentStatus === "matched" && requestId && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "85%",
                    marginTop: 0,
                  }}
                >
                  <Pressable
                    onPress={startInspection}
                    style={{
                      backgroundColor: colors.primary,
                      padding: 14,
                      borderRadius: 12,
                      flex: 0.48,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#ffffff",
                        textAlign: "center",
                        fontWeight: "600",
                      }}
                    >
                      Start Inspection
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      Alert.alert("Declined", "Request has been declined.")
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
                        textAlign: "center",
                        fontWeight: "600",
                      }}
                    >
                      Decline
                    </Text>
                  </Pressable>
                </View>
              )}

              {agentStatus === "inspection_started" && requestId && (
                <Pressable
                  onPress={endInspection}
                  style={{
                    backgroundColor: "#2563eb",
                    padding: 14,
                    borderRadius: 12,
                    width: "85%",
                    marginTop: 0,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    End Inspection
                  </Text>
                </Pressable>
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
            {/* Refresh */}
            <Pressable
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
            </Pressable>

            {/* Support */}
            <Pressable style={{ flex: 1, alignItems: "center" }}>
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
            </Pressable>

            {/* Activity Log */}
            <Pressable style={{ flex: 1, alignItems: "center" }}>
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
                Activity Log
              </Text>
            </Pressable>
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
          { label: "Dashboard", icon: "House" },
          {
            label: "My Listings",
            icon: "Buildings",
            onPress: () => router.push("/(product)/products"),
          },
          { label: "Earnings", icon: "CurrencyNgn" },
          { label: "Settings", icon: "Gear" },
          { label: "Logout", icon: "SignOut" },
        ]}
        rating={5}
      />
    </View>
  );
}
