import BottomSheet, { BottomSheetRefProps } from "@/components/short-bottom-sheet";
import Sidebar from "@/components/sidebar/sidebar";
import { useTheme } from "@react-navigation/native";
import { useFocusEffect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { API } from "../../services/api";
import { registerForPushNotificationsAsync } from "../../services/notification";

const { width, height } = Dimensions.get("screen");

export default function AgentDashboard() {
  const { colors } = useTheme();
  const router = useRouter();

  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [agentName, setAgentName] = useState<string>("Agent");
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [requestId, setRequestId] = useState(null);

  const ref = useRef<BottomSheetRefProps>(null);
  const sidebarX = useRef(new Animated.Value(-width)).current;

  const SNAP_25 = -height * 0.1;

  const SNAP_50 = -height * 0.59;

  const SNAP_80 = -height * 0.8;

  const toggleSidebar = () => {
    const open = !isSidebarVisible;
    Animated.timing(sidebarX, {
      toValue: open ? 0 : -width,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setIsSidebarVisible(open));
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

      // ✅ same endpoint as working version
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

      // ✅ Keep profile fetch for welcome name
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
      fetchAgentStatus();
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
      fetchAgentStatus();
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
    ref.current?.scrollTo(SNAP_25);
    syncPushToken();
    fetchAgentStatus();
  }, []);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 5 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 10,
        }}
      >
        <Pressable
          onPress={toggleSidebar}
          style={{
            padding: 10,
            borderRadius: 8,
            backgroundColor: colors.card,
          }}
        >
          <View
            style={{
              width: 24,
              height: 2,
              backgroundColor: colors.text,
              marginBottom: 5,
            }}
          />
          <View
            style={{
              width: 18,
              height: 2,
              backgroundColor: colors.text,
              marginBottom: 5,
            }}
          />
          <View
            style={{ width: 24, height: 2, backgroundColor: colors.text }}
          />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
          Welcome, {agentName}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <View style={{ alignItems: "center", marginTop: 20 }}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: 10,
                }}
              >
                Agent Status
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: agentStatus === "suspended" ? "red" : "green",
                  marginBottom: 20,
                }}
              >
                {agentStatus?.toUpperCase() || "UNKNOWN"}
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  color: colors.text,
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                {message}
              </Text>

              {agentStatus === "suspended" && (
                <Pressable
                  onPress={triggerPayment}
                  disabled={paying}
                  style={{
                    backgroundColor: paying ? "#999" : "#000",
                    padding: 15,
                    borderRadius: 10,
                    width: "100%",
                  }}
                >
                  {paying ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      style={{
                        color: "#fff",
                        textAlign: "center",
                        fontWeight: "600",
                      }}
                    >
                      Pay Now
                    </Text>
                  )}
                </Pressable>
              )}

              {agentStatus === "matched" && requestId && (
                <Pressable
                  onPress={startInspection}
                  style={{
                    backgroundColor: "green",
                    padding: 15,
                    borderRadius: 10,
                    width: "100%",
                    marginTop: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    Start Inspection
                  </Text>
                </Pressable>
              )}

              {agentStatus === "inspection_started" && requestId && (
                <Pressable
                  onPress={endInspection}
                  style={{
                    backgroundColor: "#2563eb",
                    padding: 15,
                    borderRadius: 10,
                    width: "100%",
                    marginTop: 10,
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
      </ScrollView>

      <BottomSheet ref={ref}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          bounces={false}
          overScrollMode="never"
          contentContainerStyle={{
            paddingBottom: 120,
          }}
        >
          <Text style={{ padding: 20, color: "#000000" }}>
            Client Name: John Doe
          </Text>
          <Text style={{ padding: 20, color: "#000000" }}>
            Client Phone Number: 08000000000
          </Text>
        </ScrollView>
      </BottomSheet>

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
    </ScrollView>
  );
}
