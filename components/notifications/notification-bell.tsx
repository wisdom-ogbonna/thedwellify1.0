import { useInbox } from "@/context/InboxContext";
import { useFocusEffect, useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  color?: string;
  size?: number;
  badgeColor?: string;
  style?: object;
};

export function NotificationBell({
  color = "#111827",
  size = 20,
  badgeColor = "#E11D48",
  style,
}: Props) {
  const router = useRouter();
  const { unreadCount, refresh } = useInbox();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <Pressable
      onPress={() => router.push("/(utilities)/notifications")}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        unreadCount > 0 ? `Notifications, ${unreadCount} new` : "Notifications"
      }
      style={[styles.wrap, style]}
    >
      <Bell size={size} color={color} />
      {unreadCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
});
