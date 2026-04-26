import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth, AuthProvider } from "../context/AuthContext";
import * as Notifications from "expo-notifications";
import "../global.css";

/* =========================
   APP LAYOUT
========================= */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // ✅ REQUIRED (iOS foreground popup)
    shouldShowList: true, // ✅ shows in notification center
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function AppLayout() {
  const { user, role, isVerified, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        console.log("🔔 Notification tapped:", data);

        router.push({
          pathname: "/(agent)/requests",
          params: {
            requestId: String(data.requestId),
            agentId: String(data.agentId),
            propertyType: String(data.propertyType),
            lat: String(data.lat),
            lng: String(data.lng),
          },
        });
      }
    );

    return () => sub.remove();
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /* =========================
     ROUTE GUARD
  ========================= */
  useEffect(() => {
    if (!isMounted || loading) return;
    if (!Array.isArray(segments) || segments.length === 0) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inAgentGroup = segments[0] === "(agent)";
    const inClientGroup = segments[0] === "(client)";

    const currentScreen = segments[1]; // safe access

    /* =========================
       1. NOT LOGGED IN
    ========================= */
    if (!user) {
      if (!inAuthGroup) {
        router.replace("/(auth)/phone");
      }
      return;
    }

    /* =========================
       2. NO ROLE
    ========================= */
    if (!role) {
      if (!(inAuthGroup && currentScreen === "role")) {
        router.replace("/(auth)/role");
      }
      return;
    }

    /* =========================
       3. NOT VERIFIED
    ========================= */
    if (!isVerified) {
      if (role === "agent") {
        if (!(inAgentGroup && currentScreen === "setup")) {
          router.replace("/(auth)/agentsetup");
        }
      } else {
        if (!(inClientGroup && currentScreen === "setup")) {
          router.replace("/(auth)/clientsetup");
        }
      }
      return;
    }

    /* =========================
       4. VERIFIED USERS
    ========================= */

    // 🚫 Prevent cross-role access
    if (role === "agent" && inClientGroup) {
      router.replace("/(agent)/dashboard");
      return;
    }

    if (role === "client" && inAgentGroup) {
      router.replace("/(client)/dashboard");
      return;
    }

    // 🚀 Ensure user lands on dashboard if outside group
    if (role === "agent") {
      if (!inAgentGroup) {
        router.replace("/(agent)/dashboard");
        return;
      }
    } else {
      if (!inClientGroup) {
        router.replace("/(client)/dashboard");
        return;
      }
    }
  }, [isMounted, user, role, isVerified, loading, segments, router]);

  /* =========================
     UI
  ========================= */

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />

      {(loading || !isMounted) && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#fff", // match your theme if needed
          }}
        >
          <ActivityIndicator size="large" />
        </View>
      )}
    </>
  );
}

/* =========================
   ROOT
========================= */
export default function RootLayout() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}
