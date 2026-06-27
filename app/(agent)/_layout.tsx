import { Stack } from "expo-router";
import React from "react";

export default function AgentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="agent-dashboard" />
      <Stack.Screen name="map" />
      <Stack.Screen name="agent-profile" />
    </Stack>
  );
}
