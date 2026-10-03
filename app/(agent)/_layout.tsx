import { useTheme } from "@/hooks/use-theme";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { Tabs } from "expo-router";
import {
  BriefcaseIcon,
  ChatIcon,
  HouseIcon,
  UserCircleIcon,
} from "phosphor-react-native";
import React from "react";
import { Platform } from "react-native";

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
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === "ios" ? 85 : 78,
          paddingBottom: Platform.OS === "ios" ? 30 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          letterSpacing: 0,
          fontFamily: "Inter_500Medium",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="agent-dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <HouseIcon
              size={26}
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
              size={26}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="agent-messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => (
            <ChatIcon
              size={26}
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
              size={26}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
    </Tabs>
  );
}
