import { useTheme } from "@react-navigation/native";
import { Tabs } from "expo-router";
import { House, Package, User } from "phosphor-react-native";
import React from "react";

export default function AgentLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: "#777777",
        tabBarStyle: {
          backgroundColor: colors.border,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 75,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 1,
        },
      }}
    >
      <Tabs.Screen
        name="agent-dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <House
              size={24}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, focused }) => (
            <Package
              size={24}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <User
              size={24}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
    </Tabs>
  );
}
