import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  useTheme,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import OfflineModal from "./(utilities)/offlineModal";
import { ActivityIndicator, useColorScheme, View } from "react-native";
import { Colors } from "../constants/theme";
import { AuthProvider, useAuth } from "../context/AuthContext";
import "../global.css";

/* =========================
   APP CONTENT
========================= */
function AppContent() {
  const { colors } = useTheme();
  const { user, role, isVerified, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        // Using absolute path
        router.push({
          pathname: "/(utilities)/requests",
          params: {
            requestId: String(data.requestId),
            agentId: String(data.agentId),
            propertyType: String(data.propertyType),
            lat: String(data.lat),
            lng: String(data.lng),
          },
        });
      },
    );
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inAgentGroup = segments[0] === "(agent)";
    const inClientGroup = segments[0] === "(client)";
    const inUtilitiesGroup = segments[0] === "(utilities)"; // Added this
    const currentScreen = segments[1];

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/phone");
    } else if (user && !role && !inAuthGroup) {
      router.replace("/(auth)/role");
    } else if (user && role && !isVerified) {
      if (role === "agent" && currentScreen !== "agentsetup")
        router.replace("/(auth)/agentsetup");
      if (role === "client" && currentScreen !== "clientsetup")
        router.replace("/(auth)/clientsetup");
    } else if (user && role && isVerified) {
      if (!inAgentGroup && !inClientGroup && !inUtilitiesGroup) {
        router.replace(
          role === "agent" ? "/(agent)/dashboard" : "/(client)/dashboard",
        );
      }
    }
  }, [user, role, isVerified, loading, segments, router]);

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
    <ThemeProvider value={theme}>
      <AuthProvider>
        <OfflineModal
          visible={!isConnected}
          onRetry={() => NetInfo.refresh()}
        />
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
