import { useTheme } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { auth } from "../../config/firebase";
import { API } from "../../services/api";
import { registerForPushNotificationsAsync } from "../../services/notifications";

export default function AgentDashboard() {
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [agentStatus, setAgentStatus] = useState(null);
  const [status, setStatus] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [requestId, setRequestId] = useState(null);

  /**
   * ✅ Sync push token
   */
  const sendTokenToBackend = async () => {
    try {
      setLoading(true);

      const pushData = await registerForPushNotificationsAsync();

      if (!pushData || !pushData.token) {
        setStatus("Failed to get push token");
        return;
      }

      const payload: any = {
        platform: pushData.platform,
      };

      if (pushData.platform === "ios") {
        payload.expoPushToken = pushData.token;
      }

      if (pushData.platform === "android") {
        payload.fcmToken = pushData.token;
      }

      console.log("📤 Sending payload:", payload);

      await API.post("/notifications/agent", payload);

      setStatus("Token Synced ✅");
    } catch (error: any) {
      console.log("❌ Sync error:", error?.response || error);
      setStatus("Sync Failed ❌");
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ Fetch agent status (ID from Firebase 🔥)
   */
  const fetchAgentStatus = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        setMessage("User not authenticated");
        return;
      }

      const agentId = user.uid;

      const res = await API.get(`/agent/live/${agentId}`);
      const agent = res.data;

      setAgentStatus(agent.status);

      // 🔥 STORE requestId
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
    } catch (err: any) {
      console.log("Fetch agent error:", err);
      setMessage("Failed to fetch agent status");
    } finally {
      setLoading(false);
    }
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

      // refresh status
      fetchAgentStatus();
    } catch (err: any) {
      console.log("Start inspection error:", err.response?.data || err.message);
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

      // 🔄 refresh state
      fetchAgentStatus();
    } catch (err: any) {
      console.log("End inspection error:", err.response?.data || err.message);
      setMessage("Failed to end inspection");
    }
  };
  /**
   * ✅ Trigger payment (ONLY on button click 🔥)
   */
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

      // 🔥 OPEN PAYSTACK
      await WebBrowser.openBrowserAsync(paymentUrl);

      // 🔥 AFTER USER RETURNS
      setMessage("Checking payment status...");

      // give webhook time to update
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
    sendTokenToBackend();
    fetchAgentStatus();
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20 }}
    >
      <View style={{ alignItems: "center", marginTop: 50 }}>
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
                color: agentStatus === "suspended" ? "red" : "green",
                marginBottom: 20,
              }}
            >
              {status}
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

            {/* ✅ SHOW BUTTON ONLY IF SUSPENDED */}
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

            {/* ✅ SHOW BUTTON IF MATCHED */}
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

            {/* ✅ SHOW BUTTON IF INSPECTION STARTED */}
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
  );
}
