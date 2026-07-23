import { useTheme } from "@/hooks/use-theme";
import NetInfo from "@react-native-community/netinfo";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
// import * as NavigationBar from "expo-navigation-bar";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { useColorScheme, AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Colors } from "../constants/theme";
import { AuthProvider, useAuth } from "../context/AuthContext";
import "../global.css";
import { setupNotifications } from "../services/notification";
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
  const { colors, isDark } = useTheme();
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
      },
    );

    return () => {
      responseSub.remove();
    };
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
        router.replace("/onboarding");
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
    const target = role === "agent" ? "agent-dashboard" : "client-dashboard";

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
