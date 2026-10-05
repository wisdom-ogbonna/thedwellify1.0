import { useTheme } from "@/hooks/use-theme";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { Sora_600SemiBold, useFonts } from "@expo-google-fonts/sora";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  ImageSourcePropType,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);

  const [fontsLoaded] = useFonts({
    Sora_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const compact = height < 740;
  const imageHeight = Math.min(height * (compact ? 0.28 : 0.34), compact ? 220 : 280);
  const headlineSize = compact ? 26 : 32;
  const slideHeight = pageHeight || height;

  const dashes = useMemo(
    () =>
      SLIDES.map((slide, index) => (
        <View
          key={slide.id}
          style={[
            styles.dash,
            {
              backgroundColor: index === activeIndex ? colors.primary : colors.disabled + "55",
            },
          ]}
        />
      )),
    [activeIndex, colors.disabled, colors.primary],
  );

  if (!fontsLoaded) return null;

  const goTo = (index: number) => {
    listRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      goTo(activeIndex + 1);
      return;
    }
    router.push("/(auth)/phone");
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index >= 0 && index < SLIDES.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const renderItem = ({ item }: ListRenderItemInfo<Slide>) => (
    <View style={[styles.slide, { width, height: slideHeight, backgroundColor: colors.background }]}>
      <View style={styles.hero}>
        <Image
          source={item.image}
          style={[styles.image, { height: imageHeight }]}
          resizeMode="contain"
        />
      </View>

      <View style={styles.copy}>
        <Text
          style={[
            styles.headline,
            { color: colors.text, fontSize: headlineSize, lineHeight: headlineSize + 8 },
          ]}
        >
          {item.headlineParts.map((part, index) => (
            <Text key={`${item.id}-${index}`} style={{ color: part.accent ? colors.primary : colors.text }}>
              {part.text}
            </Text>
          ))}
        </Text>
        <Text style={[styles.subtitle, { color: colors.placeholder }]}>{item.subtitle}</Text>
        <Pressable
          onPress={handleNext}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.buttonText}>{item.cta}</Text>
        </Pressable>
        <Text style={[styles.terms, { color: colors.placeholder }]}>
          By continuing, you accept our{" "}
          <Text style={[styles.termsLink, { color: colors.text }]}>Terms & Conditions</Text>
          {" and "}
          <Text style={[styles.termsLink, { color: colors.text }]}>Privacy Policy</Text>.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.progress}>{dashes}</View>
      <View style={styles.listWrap} onLayout={(event) => setPageHeight(event.nativeEvent.layout.height)}>
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
          style={styles.list}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  progress: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
  },
  dash: {
    flex: 1,
    height: 4,
    borderRadius: 999,
  },
  listWrap: { flex: 1 },
  list: { flex: 1 },
  slide: {
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  image: {
    width: "100%",
  },
  copy: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  headline: {
    fontFamily: "Sora_600SemiBold",
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 22,
  },
  button: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    fontSize: 16,
  },
  terms: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 14,
  },
  termsLink: {
    fontFamily: "Inter_600SemiBold",
    textDecorationLine: "underline",
  },
});
