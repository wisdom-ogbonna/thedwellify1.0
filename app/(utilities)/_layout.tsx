import { Stack } from "expo-router";
import React from "react";

export default function UtilitiesLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="requests" />
    </Stack>
  );
}
