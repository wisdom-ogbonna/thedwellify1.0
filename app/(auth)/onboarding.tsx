import { ONBOARDING_SEEN_KEY } from "@/constants/onboarding";
import { useTheme } from "@/hooks/use-theme";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { Sora_600SemiBold, Sora_700Bold, useFonts } from "@expo-google-fonts/sora";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageSourcePropType,
  Linking,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  FadeIn,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface Slide {
  id: string;
  headlineParts: { text: string; accent: boolean }[];
  subtitle: string;
  cta: string;
  image: ImageSourcePropType;
}

const SLIDES: Slide[] = [
  {
    id: "1",
    headlineParts: [
      { text: "Find your ", accent: false },
      { text: "perfect home", accent: true },
      { text: ", anywhere.", accent: false },
    ],
    subtitle:
      "Browse apartments, shortlets, and land curated for you across Nigeria.",
    cta: "Continue",
    image: require("../../assets/images/onboarding/screen-one.png"),
  },
  {
    id: "2",
    headlineParts: [
      { text: "Connect with ", accent: false },
      { text: "trusted", accent: true },
      { text: " agents.", accent: false },
    ],
    subtitle:
      "Talk directly with verified agents near you — no middlemen, no guesswork.",
    cta: "Continue",
    image: require("../../assets/images/onboarding/screen-two.png"),
  },
  {
    id: "3",
    headlineParts: [
      { text: "Secure your ", accent: false },
      { text: "dream", accent: true },
      { text: " property.", accent: false },
    ],
    subtitle:
      "Complete transactions safely and move into your new space with confidence.",
    cta: "Get Started",
    image: require("../../assets/images/onboarding/screen-three.png"),
  },
];

const TERMS_URL = "https://dwellify.app/terms";
const PRIVACY_URL = "https://dwellify.app/privacy";

function ProgressDashes({
  activeIndex,
  primary,
  track,
}: {
  activeIndex: number;
  primary: string;
  track: string;
}) {
  return (
    <View className="flex-row items-center justify-center gap-x-2 w-full px-6">
      {SLIDES.map((_, i) => {
        const isActive = i === activeIndex;
        return (
          <View
            key={i}
            style={{
              height: 4,
              borderRadius: 999,
              flex: 1,
              backgroundColor: isActive ? primary : track,
              opacity: isActive ? 1 : 0.55,
            }}
          />
        );
      })}
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const scrollX = useSharedValue(0);
  const { colors, isDark } = useTheme();

  const [fontsLoaded] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const markSeenAndGoPhone = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "1");
    } catch {
      // non-blocking
    }
    router.replace("/(auth)/phone");
  }, [router]);

  const handleNext = useCallback(() => {
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
      return;
    }
    void markSeenAndGoPhone();
  }, [activeIndex, markSeenAndGoPhone]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.value = e.nativeEvent.contentOffset.x;
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (index >= 0 && index < SLIDES.length) {
      setActiveIndex(index);
    }
  };

  const trackColor = useMemo(
    () => (isDark ? "rgba(255,255,255,0.18)" : "#E2E8F0"),
    [isDark]
  );

  const renderItem = ({ item, index }: ListRenderItemInfo<Slide>) => (
    <SlidePage
      item={item}
      index={index}
      scrollX={scrollX}
      colors={colors}
      onNext={handleNext}
    />
  );

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} />
    );
  }

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.background, flex: 1 }}
      edges={["top", "bottom"]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      <View className="pt-3 pb-2 z-20">
        <ProgressDashes
          activeIndex={activeIndex}
          primary={colors.primary}
          track={trackColor}
        />
      </View>

      {activeIndex < SLIDES.length - 1 ? (
        <Animated.View entering={FadeIn} className="absolute top-14 right-5 z-30">
          <Pressable
            onPress={() => void markSeenAndGoPhone()}
            hitSlop={12}
            className="px-4 py-2 rounded-full"
            style={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(15,23,42,0.05)",
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 13,
                color: colors.placeholder,
              }}
            >
              Skip
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}

      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_W,
          offset: SCREEN_W * index,
          index,
        })}
      />
    </SafeAreaView>
  );
}

function SlidePage({
  item,
  index,
  scrollX,
  colors,
  onNext,
}: {
  item: Slide;
  index: number;
  scrollX: SharedValue<number>;
  colors: ReturnType<typeof useTheme>["colors"];
  onNext: () => void;
}) {
  const imageStyle = useAnimatedStyle(() => {
    const input = [
      (index - 1) * SCREEN_W,
      index * SCREEN_W,
      (index + 1) * SCREEN_W,
    ];
    return {
      opacity: interpolate(scrollX.value, input, [0.4, 1, 0.4], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(
            scrollX.value,
            input,
            [24, 0, 24],
            Extrapolation.CLAMP
          ),
        },
        {
          scale: interpolate(
            scrollX.value,
            input,
            [0.92, 1, 0.92],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <View
      style={{ width: SCREEN_W, backgroundColor: colors.background }}
      className="flex-1 justify-between pt-10 pb-4"
    >
      <View className="flex-1 justify-center items-center px-6">
        <Animated.View style={imageStyle}>
          <Image
            source={item.image}
            style={styles.imageIllustration}
            resizeMode="contain"
            accessibilityLabel={item.subtitle}
          />
        </Animated.View>
      </View>

      <View className="px-7 w-full">
        <Text style={styles.headline} className="text-center tracking-tight mb-3">
          {item.headlineParts.map((part, i) => (
            <Text
              key={i}
              style={{ color: part.accent ? colors.primary : colors.text }}
            >
              {part.text}
            </Text>
          ))}
        </Text>

        <Text
          style={[styles.subtitle, { color: colors.placeholder }]}
          className="text-center mb-8 px-1"
        >
          {item.subtitle}
        </Text>

        <Pressable
          onPress={onNext}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.92 : 1,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            },
          ]}
          className="rounded-2xl h-14 items-center justify-center w-full"
        >
          <Text style={styles.buttonText} className="text-white text-[16px]">
            {item.cta}
          </Text>
        </Pressable>

        <Text
          style={[styles.termsText, { color: colors.placeholder }]}
          className="text-center text-[12px] px-2 mt-6 mb-2 leading-relaxed"
        >
          By continuing, you accept our{" "}
          <Text
            style={{ color: colors.text, fontFamily: "Inter_600SemiBold" }}
            onPress={() => Linking.openURL(TERMS_URL).catch(() => {})}
          >
            Terms & Conditions
          </Text>
          {" and "}
          <Text
            style={{ color: colors.text, fontFamily: "Inter_600SemiBold" }}
            onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageIllustration: {
    width: SCREEN_W - 48,
    height: Math.min(SCREEN_H * 0.38, 320),
  },
  headline: {
    fontFamily: "Sora_700Bold",
    fontSize: 30,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 23,
  },
  button: {
    shadowColor: "#0A65FF",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 6,
  },
  buttonText: {
    fontFamily: "Inter_600SemiBold",
  },
  termsText: {
    fontFamily: "Inter_400Regular",
  },
});
