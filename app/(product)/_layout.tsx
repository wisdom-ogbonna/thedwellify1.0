import { Stack } from "expo-router";
import React from "react";

export default function ProductLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_bottom" }}
    >
      <Stack.Screen name="create" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
