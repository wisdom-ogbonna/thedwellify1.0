import { useTheme } from "@/hooks/use-theme";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { Sora_600SemiBold, useFonts } from "@expo-google-fonts/sora";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageSourcePropType,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// ─── SLIDE DATA ───────────────────────────────────────────────────────────────
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
      "Browse thousands of apartments and lands curated just for you across Nigeria.",
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
      "Talk directly with verified property agents and owners near you, no middlemen.",
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
      "Complete your transactions safely and move into your new space with confidence.",
    cta: "Get Started",
    image: require("../../assets/images/onboarding/screen-three.png"),
  },
];

// ─── PROGRESS DASHES ───────────────────────────────────────────────────────────
function ProgressDashes({ activeIndex }: { activeIndex: number }) {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-center justify-center gap-x-2 w-full px-5 absolute top-16 z-20">
      {SLIDES.map((_, i) => {
        const isActive = i === activeIndex;
        return (
          <View
            key={i}
            style={[
              styles.dash,
              {
                backgroundColor: isActive ? colors.primary : "#E2E8F0",
                flex: 1,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// ─── TERMS FOOTER ─────────────────────────────────────────────────────────────
function TermsText() {
  const { colors } = useTheme();
  return (
    <Text
      style={styles.termsText && { color: colors.text }}
      className="text-center text-[12px] px-6 mt-7 mb-7 leading-relaxed"
    >
      {"By continuing, you accept our "}
      <Text className="text-slate-600 font-semibold underline">
        Terms & Conditions
      </Text>
      {" and "}
      <Text className="text-slate-600 font-semibold underline">
        Privacy Policy.
      </Text>
    </Text>
  );
}

// ─── MAIN ONBOARDING SCREEN ────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const { colors } = useTheme();

  const [fontsLoaded] = useFonts({
    Sora_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) return null;

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    } else {
      router.push("/(auth)/phone");
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    // Boundary checks to ensure activeIndex stays safe
    if (index >= 0 && index < SLIDES.length) {
      setActiveIndex(index);
    }
  };

  const renderItem = ({ item }: ListRenderItemInfo<Slide>) => (
    <View
      style={{ width: SCREEN_W, backgroundColor: colors.background }}
      className="flex-1 justify-between pt-24 pb-8"
    >
      {/* Visual Asset Section */}
      <View className="flex-1 justify-center items-center px-6">
        <Image
          source={item.image}
          style={styles.imageIllustration}
          resizeMode="contain"
        />
      </View>

      {/* Narrative & Interface Interface Block */}
      <View className="px-8 w-full">
        <Text
          style={styles.headline}
          className="text-center tracking-tight mb-3"
        >
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
          style={styles.subtitle && { color: colors.text, marginVertical: 12, }}
          className="text-center text-slate-500 mb-8 px-2"
        >
          {item.subtitle}
        </Text>

        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.9}
          className="rounded-2xl h-14 items-center justify-center w-full"
          style={styles.button && { backgroundColor: colors.primary }}
        >
          <Text style={styles.buttonText} className="text-white text-[16px]">
            {item.cta}
          </Text>
        </TouchableOpacity>

        <TermsText />
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.background }}
      className="flex-1"
    >
      <StatusBar style="dark" />
      {/* Global Interactive Elements over Slides */}
      <ProgressDashes activeIndex={activeIndex} />

      {/*activeIndex < SLIDES.length - 1 && (
        <TouchableOpacity
          onPress={() => router.push("/(auth)/phone")}
          className="absolute top-24 right-6 z-20 bg-slate-50 px-4 py-2 rounded-full"
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text
            style={styles.skipText}
            className="text-slate-500 font-semibold"
          >
            Skip
          </Text>
        </TouchableOpacity>
      )*/}

      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
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

// ─── STYLES DEFINITIONS ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  dash: {
    height: 5,
    borderRadius: 999,
    transitionProperty: "all",
  },
  imageIllustration: {
    width: "100%",
    height: SCREEN_H * 0.38,
  },
  headline: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 32,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 23,
  },
  button: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  buttonText: {
    fontFamily: "Inter_600SemiBold",
  },
  skipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  termsText: {
    fontFamily: "Inter_400Regular",
  },
});
