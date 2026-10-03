import { Stack } from "expo-router";
import React from "react";

export default function ListingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="new"
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="edit"
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
