import { useTheme } from "@/hooks/use-theme";
import NetInfo from "@react-native-community/netinfo";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
// import * as NavigationBar from "expo-navigation-bar";
import { CustomModalProvider } from "@/components/dialogs/popup-modal";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { AppState, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Colors } from "../constants/theme";
import { AuthProvider, useAuth } from "../context/AuthContext";
import "../global.css";
import { setupNotifications } from "../services/notification";
import { sendHeartbeat } from "../services/chatApi";
import { flushOutbox, startOutboxWatcher, stopOutboxWatcher } from "../services/chatOutbox";
import { connectSocket, disconnectSocket } from "../services/socket";
import OfflineModal from "./(utilities)/offlineModal";

SplashScreen.preventAutoHideAsync();

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
  const { isDark } = useTheme();
  const { user, role, isVerified, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  /* =========================
     HANDLE NOTIFICATIONS
  ========================= */
  useEffect(() => {
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        if (data?.type === "incoming_request") {
          router.push({
            pathname: "/requests",

            params: {
              requestId: String(data.requestId),
              agentId: String(data.agentId),
              clientName: String(data.clientName),
              propertyType: String(data.propertyType),
              lat: String(data.lat),
              lng: String(data.lng),
            },
          });
        }

        if (data?.type === "NEW_PROPERTY") {
          router.push({
            pathname: "/",

            params: {
              productId: String(data.productId),
              title: String(data.title),
              propertyType: String(data.propertyType),
              location: String(data.location),
              price: String(data.price),
            },
          });
        }

        // Chat push (sent by utils/chatPush.js as type "chat_message").
        if (data?.type === "chat_message" && data?.conversationId) {
          router.push({
            pathname: "/(utilities)/chats",
            params: { id: String(data.conversationId) },
          });
        }
      },
    );

    return () => {
      responseSub.remove();
    };
  }, [router]);

  /* =========================
     CHAT LIFECYCLE
     Socket is an optional accelerator; the outbox flushes queued sends on
     reconnect; presence flips with foreground/background.
  ========================= */
  useEffect(() => {
    if (!user?.uid) {
      disconnectSocket();
      return;
    }

    startOutboxWatcher();
    void connectSocket();
    void sendHeartbeat(null, true).catch(() => {});

    const appStateSub = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        void connectSocket();
        void sendHeartbeat(null, true).catch(() => {});
        void flushOutbox();
      } else if (next === "background" || next === "inactive") {
        void sendHeartbeat(null, false).catch(() => {});
      }
    });

    return () => {
      appStateSub.remove();
      stopOutboxWatcher();
      disconnectSocket();
    };
  }, [user?.uid]);

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
      // Stay inside auth flow (onboarding → phone → otp). Only force
      // onboarding when the user is outside the auth group entirely.
      if (!inAuth) {
        router.replace("/(auth)/onboarding");
      }
      return;
    }

    /* 🧩 ROLE NOT SELECTED */
    if (!role) {
      // ✅ FIX: Check if the screen is specifically NOT the selection screen,
      // instead of checking the whole group folder.
      if (screen !== "role") {
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
    const target = role === "agent" ? "agent-dashboard" : "client-map";

    const isInsideApp = inAgent || inClient || inUtilities || inProduct;

    if (!isInsideApp && screen !== target) {
      router.replace(`/${target}`);
      return;
    }
  }, [user, role, isVerified, loading, segments, router]);

  /* Hide android navigation buttons and auto-fade them out */
  // useEffect(() => {
  //   const configureNavBar = async () => {
  //     try {
  //       await NavigationBar.setPositionAsync("absolute");

  //       await NavigationBar.setBehaviorAsync("inset-swipe");

  //       await NavigationBar.setVisibilityAsync("hidden");
  //     } catch (error) {
  //       console.warn("NavigationBar layout configuration failed:", error);
  //     }
  //   };

  //   configureNavBar();

  //   const subscription = AppState.addEventListener("change", (nextAppState) => {
  //     if (nextAppState === "active") {
  //       configureNavBar();
  //     }
  //   });

  //   return () => {
  //     subscription.remove();
  //   };
  // }, [segments]);

  /* =========================
   SPLASH SCREEN MANAGEMENT
========================= */

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch((err) => {
        console.warn("Splash screen hide error:", err);
      });
    }
  }, [loading]);

  if (loading) {
    return null;
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} animated={true} />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    </>
  );
}

/* =========================
   ROOT LAYOUT
========================= */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    setupNotifications();

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
        <CustomModalProvider>
          <AuthProvider>
            <OfflineModal
              visible={!isConnected}
              onRetry={() => NetInfo.refresh()}
            />
            <AppContent />
          </AuthProvider>
        </CustomModalProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
