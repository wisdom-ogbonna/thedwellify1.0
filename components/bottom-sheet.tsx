import React, { useCallback, useImperativeHandle } from "react";
import { Dimensions, View, Pressable } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { useTheme } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const SNAP_POINTS = {
  CLOSED: 0,
  LOW: -SCREEN_HEIGHT * 0.10,
  MID: -SCREEN_HEIGHT * 0.59,
  HIGH: -SCREEN_HEIGHT * 0.80,
};

type BottomSheetProps = {
  children?: React.ReactNode;
};

export type BottomSheetRefProps = {
  scrollTo: (destination: number) => void;
  close: () => void;
};

const BottomSheet = React.forwardRef<BottomSheetRefProps, BottomSheetProps>(
  ({ children }, ref) => {
    const { colors } = useTheme();
    const translateY = useSharedValue(0);
    const context = useSharedValue({ y: 0 });

    const triggerHaptic = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const scrollTo = useCallback((destination: number) => {
      "worklet";
      if (destination !== 0) runOnJS(triggerHaptic)();

      translateY.value = withSpring(destination, {
        damping: 20,
        stiffness: 90,
      });
    }, [translateY]);

    const close = useCallback(() => {
      scrollTo(SNAP_POINTS.CLOSED);
    }, [scrollTo]);

    useImperativeHandle(ref, () => ({ scrollTo, close }), [scrollTo, close]);

    const gesture = Gesture.Pan()
      .onStart(() => {
        context.value = { y: translateY.value };
      })
      .onUpdate((event) => {
        translateY.value = event.translationY + context.value.y;
        // Constraint: Don't pull higher than the HIGH snap point
        translateY.value = Math.max(translateY.value, SNAP_POINTS.HIGH - 20);
      })
      .onEnd((event) => {
        // Snap logic including velocity for a "flick" feel
        const totalTranslation = translateY.value + event.velocityY * 0.1;

        if (totalTranslation > SNAP_POINTS.LOW / 2) {
          scrollTo(SNAP_POINTS.CLOSED);
        } else if (totalTranslation > (SNAP_POINTS.LOW + SNAP_POINTS.MID) / 2) {
          scrollTo(SNAP_POINTS.LOW);
        } else if (
          totalTranslation >
          (SNAP_POINTS.MID + SNAP_POINTS.HIGH) / 2
        ) {
          scrollTo(SNAP_POINTS.MID);
        } else {
          scrollTo(SNAP_POINTS.HIGH);
        }
      });

    const rBottomSheetStyle = useAnimatedStyle(() => {
      const borderRadius = interpolate(
        translateY.value,
        [SNAP_POINTS.HIGH, SNAP_POINTS.LOW],
        [32, 16],
        Extrapolate.CLAMP,
      );

      return {
        borderRadius,
        transform: [{ translateY: translateY.value }],
      };
    });

    const rBackdropStyle = useAnimatedStyle(() => {
      return {
        opacity: interpolate(
          translateY.value,
          [SNAP_POINTS.CLOSED, SNAP_POINTS.MID],
          [0, 1],
          Extrapolate.CLAMP,
        ),
        pointerEvents: translateY.value < -50 ? "auto" : "none",
      };
    });

    return (
      <>
        {/* Backdrop */}
        <Animated.View
          style={[
            {
              backgroundColor: "rgba(0,0,0,0.5)",
              position: "absolute",
              inset: 0,
            },
            rBackdropStyle,
          ]}
        >
          <Pressable className="flex-1" onPress={close} />
        </Animated.View>

        {/* Sheet */}
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              {
                height: SCREEN_HEIGHT,
                top: SCREEN_HEIGHT,
                backgroundColor: colors.primary,
                shadowColor: colors.text,
              },
              rBottomSheetStyle,
            ]}
            className="absolute w-full z-50 shadow-xl"
          >
            {/* Handle Bar */}
            <View className="items-center py-4">
              <View
                style={{ backgroundColor: colors.text }}
                className="w-12 h-1.5 rounded-full opacity-40"
              />
            </View>

            <View className="flex-1 px-4">{children}</View>
          </Animated.View>
        </GestureDetector>
      </>
    );
  },
);

BottomSheet.displayName = "BottomSheet";

export default BottomSheet;
