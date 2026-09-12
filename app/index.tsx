import { ONBOARDING_SEEN_KEY } from "@/constants/onboarding";
import { useTheme } from "@/hooks/use-theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

/**
 * Cold-start entry. Unauthenticated users who already finished/skipped
 * onboarding land on phone; first-timers see the carousel.
 * Authenticated routing is handled by the root auth gate.
 */
export default function Index() {
  const { colors } = useTheme();
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
        if (!alive) return;
        setHref(seen === "1" ? "/(auth)/phone" : "/(auth)/onboarding");
      } catch {
        if (alive) setHref("/(auth)/onboarding");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!href) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={href as any} />;
}
