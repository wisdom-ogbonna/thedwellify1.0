import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { API } from "../../services/api";
import { registerForPushNotificationsAsync } from "../../services/notifications";
import { auth } from "../../config/firebase";
import * as WebBrowser from "expo-web-browser";

export default function AgentDashboard() {
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [agentStatus, setAgentStatus] = useState(null);
  const [message, setMessage] = useState("");

  /**
   * ✅ Sync push token
   */
  const syncPushToken = async () => {
    try {
      const pushData = await registerForPushNotificationsAsync();
      if (!pushData) return;

      const payload = { platform: pushData.platform };

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

      if (agent.status === "suspended") {
        setMessage("Your account is suspended. Please make payment.");
      } else {
        setMessage("Agent is active");
      }
    } catch (err) {
      console.log("Fetch agent error:", err);
      setMessage("Failed to fetch agent status");
    } finally {
      setLoading(false);
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

  } catch (err) {
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
                color:
                  agentStatus === "suspended" ? "red" : "green",
                marginBottom: 20,
              }}
            >
              {agentStatus?.toUpperCase()}
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
          </>
        )}
      </View>
    </ScrollView>
  );
}