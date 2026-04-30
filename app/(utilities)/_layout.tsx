import { Stack } from "expo-router";
import React from "react";

export default function UtilitiesLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="requests" />
      <Stack.Screen name="inspection" />
      <Stack.Screen name="agent-available-properties" />
      <Stack.Screen name="agent-tracking" />
      <Stack.Screen name="client-payment-start-inspection" />
    </Stack>
  );
}
