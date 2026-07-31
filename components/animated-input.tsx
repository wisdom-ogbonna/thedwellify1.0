// components/AnimatedInput.tsx
import React, { useState } from "react";
import { View, TextInput, Text, TextInputProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolate,
  useSharedValue,
  withSequence,
} from "react-native-reanimated";

interface AnimatedInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  error,
  value,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(value ? 1 : 0);
  const shakeAnim = useSharedValue(0);

  React.useEffect(() => {
    focusAnim.value = withTiming(isFocused || value ? 1 : 0, { duration: 200 });
  }, [isFocused, value]);

  React.useEffect(() => {
    if (error) {
      shakeAnim.value = withSequence(
        withTiming(-6, { duration: 40 }),
        withTiming(6, { duration: 40 }),
        withTiming(-3, { duration: 40 }),
        withTiming(3, { duration: 40 }),
        withTiming(0, { duration: 40 }),
      );
    }
  }, [error]);

  const labelStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: interpolate(focusAnim.value, [0, 1], [14, -10]) },
        { scale: interpolate(focusAnim.value, [0, 1], [1, 0.85]) },
      ],
      backgroundColor: focusAnim.value > 0.5 ? "#FFFFFF" : "transparent",
    };
  });

  const inputContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeAnim.value }],
    };
  });

  return (
    <View className="mb-5 relative">
      <Animated.Text
        style={labelStyle}
        className={`absolute left-4 z-10 px-1 font-['Inter'] ${
          error
            ? "text-red-500"
            : isFocused
              ? "text-blue-500 font-semibold"
              : "text-gray-400"
        }`}
      >
        {label}
      </Animated.Text>
      <Animated.View
        style={inputContainerStyle}
        className={`h-13.5 rounded-2xl bg-white justify-center border ${
          error
            ? "border-red-500 border-[1.5px]"
            : isFocused
              ? "border-blue-500 border-[1.5px]"
              : "border-slate-200"
        }`}
      >
        <TextInput
          {...props}
          value={value}
          className="flex-1 px-4 text-slate-800 text-base font-['Inter']"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </Animated.View>
      {error && (
        <Text className="text-red-500 text-xs mt-1 ml-1 font-['Inter']">
          {error}
        </Text>
      )}
    </View>
  );
};
