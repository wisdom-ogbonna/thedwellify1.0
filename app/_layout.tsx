import NetInfo from "@react-native-community/netinfo";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  useTheme,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, useColorScheme, View } from "react-native";
import { Colors } from "../constants/theme";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import OfflineModal from "./(utilities)/offlineModal";

/* =========================
   NOTIFICATIONS CONFIG
========================= */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/* =========================
   APP CONTENT
========================= */
function AppContent() {
  const { colors } = useTheme();
  const { user, role, isVerified, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  /* =========================
     HANDLE NOTIFICATIONS
  ========================= */
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        // ✅ Safe navigation
        if (data?.requestId) {
          router.push({
            pathname: "/requests",
            params: {
              requestId: String(data.requestId),
              agentId: String(data.agentId),
              propertyType: String(data.propertyType),
              lat: String(data.lat),
              lng: String(data.lng),
            },
          });
        }
      }
    );

    return () => sub.remove();
  }, [router]);

  /* =========================
     AUTH + ROLE ROUTING
  ========================= */
  useEffect(() => {
    if (loading) return;

    const root = segments[0] ?? "";
    const screen = segments[1] ?? "";

    const inAuth = root === "(auth)";
    const inAgent = root === "(agent)";
    const inClient = root === "(client)";
    const inUtilities = root === "(utilities)";
    const inProduct = root === "(product)";

    /* 🚫 NOT LOGGED IN */
    if (!user) {
      if (!inAuth) {
        router.replace("/phone");
      }
      return;
    }

    /* 🧩 ROLE NOT SELECTED */
    if (!role) {
      if (!inAuth) {
        router.replace("/role");
      }
      return;
    }

    /* 🛠️ NOT VERIFIED */
    if (!isVerified) {
      if (role === "agent" && screen !== "agentsetup") {
        router.replace("/agentsetup");
        return;
      }

      if (role === "client" && screen !== "clientsetup") {
        router.replace("/clientsetup");
        return;
      }

      return;
    }

    /* ✅ FULLY READY */
    const target =
      role === "agent" ? "agent-dashboard" : "client-dashboard";

    const isInsideApp =
      inAgent || inClient || inUtilities || inProduct;

    if (!isInsideApp && screen !== target) {
      router.replace(`/${target}`);
      return;
    }
  }, [user, role, isVerified, loading, segments, router]);

  /* =========================
     LOADING SCREEN
  ========================= */
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

/* =========================
   ROOT LAYOUT
========================= */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  const theme = {
    ...(colorScheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      background:
        colorScheme === "dark"
          ? Colors.dark.background
          : Colors.light.background,
      text: colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
      primary: colorScheme === "dark" ? Colors.dark.tint : Colors.light.tint,
      border: colorScheme === "dark" ? "#333" : "#E5E5E5",
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={theme}>
        <AuthProvider>
          <OfflineModal
            visible={!isConnected}
            onRetry={() => NetInfo.refresh()}
          />
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}