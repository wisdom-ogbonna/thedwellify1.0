import React from "react";
import { Image, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { colorForId, initialsOf } from "./format";

interface Props {
  name?: string | null;
  userId?: string | null;
  /** Dwellify profiles store no photo, so this is normally absent. */
  uri?: string | null;
  size?: number;
  isOnline?: boolean;
  showPresence?: boolean;
}

/**
 * Chat avatar. Falls back to deterministic initials because no profile in the
 * system has an avatar field (agentDetails/clientDetails store name + email only).
 */
export const ChatAvatar = ({
  name,
  userId,
  uri,
  size = 52,
  isOnline = false,
  showPresence = false,
}: Props) => {
  const { colors } = useTheme();

  const dot = Math.max(10, Math.round(size * 0.23));

  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colorForId(userId),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: Math.round(size * 0.36),
              fontWeight: "700",
            }}
          >
            {initialsOf(name)}
          </Text>
        </View>
      )}

      {showPresence ? (
        <View
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: isOnline ? colors.success : colors.placeholder,
            borderWidth: 2,
            borderColor: colors.background,
          }}
        />
      ) : null}
    </View>
  );
};
