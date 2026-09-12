import { Redirect } from "expo-router";
import React from "react";

/** Legacy path used by onboarding — real create flow lives under (product)/create. */
export default function CreatePropertyRedirect() {
  return <Redirect href="/(product)/create" />;
}
