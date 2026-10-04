import type { ChatMessageStatus } from "@/services/chat";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function MessageTicks({
  status,
  muted = "#667781",
  read = "#53BDEB",
  failed = "#EF4444",
}: {
  status?: ChatMessageStatus;
  muted?: string;
  read?: string;
  failed?: string;
}) {
  if (status === "failed") {
    return <Text style={[styles.tick, { color: failed }]}>!</Text>;
  }
  if (status === "pending") {
    return <Text style={[styles.tick, { color: muted }]}>◌</Text>;
  }
  if (status === "read") {
    return <Text style={[styles.tick, { color: read }]}>✓✓</Text>;
  }
  if (status === "delivered") {
    return <Text style={[styles.tick, { color: muted }]}>✓✓</Text>;
  }
  return (
    <View style={styles.row}>
      <Text style={[styles.tick, { color: muted }]}>✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  tick: { fontSize: 11, fontWeight: "800", marginLeft: 4, letterSpacing: -1 },
});
