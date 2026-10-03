// components/AnimatedButton.tsx
import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "success" | "danger";
  loading?: boolean;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled = false, // Default to false
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: disabled ? 1 : scale.value }],
  }));

  const variantClass = {
    primary: "bg-blue-500 text-white",
    success: "bg-emerald-500 text-white",
    danger: "bg-red-500 text-white",
  }[variant];

  return (
    <AnimatedPressable
      style={animatedStyle}
      // Only allow scaling animations and press events if NOT disabled and NOT loading
      onPressIn={() =>
        !disabled && !loading && (scale.value = withSpring(0.96))
      }
      onPressOut={() => !disabled && !loading && (scale.value = withSpring(1))}
      onPress={() => !disabled && !loading && onPress()}
      disabled={disabled || loading}
      className={`h-16 rounded-2xl justify-center items-center my-2.5 ${variantClass} ${
        disabled ? "opacity-40" : "opacity-100"
      }`}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className="text-white text-base font-semibold font-['Poppins']">
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
};
