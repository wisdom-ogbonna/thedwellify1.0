import { useTheme } from "@/hooks/use-theme";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import React, { useCallback, useImperativeHandle } from "react";
import { Dimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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

    const insets = useSafeAreaInsets();

    const tabBarHeight = useBottomTabBarHeight();

    const usableHeight = SCREEN_HEIGHT - tabBarHeight - insets.bottom;

    const SNAP_POINTS = {
      CLOSED: -usableHeight * 0.11,
      LOW: -usableHeight * 0.11,
      MID: -usableHeight * 0.3,
    };

    const translateY = useSharedValue(0);

    const context = useSharedValue({
      y: 0,
    });

    const triggerHaptic = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const scrollTo = useCallback(
      (destination: number) => {
        "worklet";

        const clampedDestination = Math.max(
          SNAP_POINTS.MID,
          Math.min(SNAP_POINTS.CLOSED, destination),
        );

        if (clampedDestination !== 0) {
          runOnJS(triggerHaptic)();
        }

        translateY.value = withSpring(clampedDestination, {
          damping: 24,
          stiffness: 140,
          mass: 0.8,
          overshootClamping: true,
        });
      },
      [translateY],
    );

    const close = useCallback(() => {
      scrollTo(SNAP_POINTS.CLOSED);
    }, [scrollTo]);

    useImperativeHandle(
      ref,
      () => ({
        scrollTo,
        close,
      }),
      [scrollTo, close],
    );

    const gesture = Gesture.Pan()
      .shouldCancelWhenOutside(false)
      .activeOffsetY([-10, 10])
      .onStart(() => {
        context.value = {
          y: translateY.value,
        };
      })
      .onUpdate((event) => {
        let nextPosition = event.translationY + context.value.y;

        // hard clamp between MID and CLOSED
        nextPosition = Math.max(
          SNAP_POINTS.MID,
          Math.min(SNAP_POINTS.CLOSED, nextPosition),
        );

        translateY.value = nextPosition;
      })
      .onEnd((event) => {
        const projected = translateY.value + event.velocityY * 0.12;

        const snapPoints = [
          SNAP_POINTS.CLOSED,
          SNAP_POINTS.LOW,
          SNAP_POINTS.MID,
          SNAP_POINTS.MID,
        ];

        let destination = snapPoints.reduce((prev, curr) =>
          Math.abs(curr - projected) < Math.abs(prev - projected) ? curr : prev,
        );

        // HARD LIMITS
        destination = Math.max(
          SNAP_POINTS.MID,
          Math.min(SNAP_POINTS.CLOSED, destination),
        );

        scrollTo(destination);
      });

    const rBottomSheetStyle = useAnimatedStyle(() => {
      const borderRadius = interpolate(
        translateY.value,
        [SNAP_POINTS.MID, SNAP_POINTS.LOW],
        [34, 18],
        Extrapolate.CLAMP,
      );

      return {
        borderRadius,
        transform: [
          {
            translateY: translateY.value,
          },
        ],
      };
    });

    const rBackdropStyle = useAnimatedStyle(() => {
      return {
        opacity: interpolate(
          translateY.value,
          [SNAP_POINTS.CLOSED, SNAP_POINTS.MID],
          [0, 0],
          Extrapolate.CLAMP,
        ),
      };
    });

    return (
      <>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              backgroundColor: "transparent",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
            rBackdropStyle,
          ]}
        />

        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              {
                height: usableHeight + tabBarHeight,
                top: SCREEN_HEIGHT,
                backgroundColor: "#f8f8f8",
                shadowColor: colors.text,
                paddingBottom: insets.bottom,
              },
              rBottomSheetStyle,
            ]}
            className="absolute z-2 w-screen shadow-xl"
          >
            <View className="items-center py-4">
              <View
                style={{
                  backgroundColor: "gray",
                }}
                className="h-1.5 w-12 rounded-full opacity-40"
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
