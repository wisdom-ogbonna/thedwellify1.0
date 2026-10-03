import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";

export default function ProductDetailsRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Redirect
      href={{
        pathname: "/(agent)/listings/[id]",
        params: { id: String(id || "") },
      }}
    />
  );
}
