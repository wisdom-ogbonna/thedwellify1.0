import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";

interface Props {
  /** Rendered inside a bubble when true; used as the thread-header text otherwise. */
  compact?: boolean;
}

/**
 * Three-dot "typing…" bubble. Uses the core Animated API rather than Reanimated
 * to keep this a plain mount-and-forget component with no worklet setup.
 */
export const TypingIndicator = ({ compact = false }: Props) => {
  const { colors, isDark } = useTheme();

  const dots = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 150),
          Animated.timing(dot, {
            toValue: 1,
            duration: 350,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 350,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay((dots.length - index - 1) * 150),
        ])
      )
    );

    animations.forEach((animation) => animation.start());

    return () => animations.forEach((animation) => animation.stop());
  }, [dots]);

  const size = compact ? 5 : 7;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 4,
        paddingHorizontal: compact ? 0 : 14,
        paddingVertical: compact ? 0 : 12,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        backgroundColor: compact
          ? "transparent"
          : isDark
            ? "#111111"
            : "#FFFFFF",
      }}
    >
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.placeholder,
            opacity: dot.interpolate({
              inputRange: [0, 1],
              outputRange: [0.35, 1],
            }),
            transform: [
              {
                translateY: dot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -3],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
};
