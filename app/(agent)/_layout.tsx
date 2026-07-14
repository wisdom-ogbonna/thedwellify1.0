import { useTheme } from "@/hooks/use-theme";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { Tabs } from "expo-router";
import { BriefcaseIcon, ChatIcon, SquaresFourIcon, UserCircleIcon } from "phosphor-react-native";
import React from "react";

export default function AgentLayout() {
  const { colors } = useTheme();
  const [FontsLoaded] = useFonts({
    Inter_500Medium,
  });

  if (!FontsLoaded) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: "500",
          letterSpacing: 0.1,
          fontFamily: "Inter_500Medium",
          marginTop: 5,
        },
      }}
    >
      <Tabs.Screen
        name="agent-dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <SquaresFourIcon
              size={30}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="listings"
        options={{
          title: "Listings",
          tabBarIcon: ({ color, focused }) => (
            <BriefcaseIcon
              size={30}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => (
            <ChatIcon
              size={30}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="agent-profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <UserCircleIcon
              size={30}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
    </Tabs>
  );
}
