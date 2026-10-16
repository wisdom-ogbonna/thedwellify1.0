import { useTheme } from "@/hooks/use-theme";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ArrowRight, CheckCircle, User } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { API } from "../../services/api";

/* -------------------------------------------------------------------------- */
/* TYPES & CONSTANTS                                                          */
/* -------------------------------------------------------------------------- */

type FieldKey =
  | "fullName"
  | "email"
  | "agencyName"
  | "licenseId"
  | "operatingArea";

type ThemeColors = ReturnType<typeof useTheme>["colors"];

interface StepConfig {
  key: string;
  lead: string;
  accent: string;
  subtitle: string;
  fields: FieldKey[];
}

// Letters (incl. accented), apostrophes, dots and hyphens; at least two name parts.
const LETTER = "A-Za-zÀ-ÖØ-öø-ÿ";
const NAME_RE = new RegExp(
  `^[${LETTER}][${LETTER}'’.-]*(?: [${LETTER}][${LETTER}'’.-]*)+$`,
);
const EMAIL_RE =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const AGENCY_RE = new RegExp(`^[${LETTER}0-9][${LETTER}0-9&'’.,()\\- ]{1,79}$`);
const AREA_RE = new RegExp(`^[${LETTER}0-9][${LETTER}0-9'’.,/\\- ]{2,79}$`);
const LICENSE_RE = /^[A-Z0-9][A-Z0-9\-/]{3,24}$/;

const normalize = (v: string) => v.trim().replace(/\s+/g, " ");

const EMPTY_FORM: Record<FieldKey, string> = {
  fullName: "",
  email: "",
  agencyName: "",
  licenseId: "",
  operatingArea: "",
};

/** Light input cleanup while typing (never fights the user). */
const sanitize = (key: FieldKey, v: string) => {
  switch (key) {
    case "email":
      return v.replace(/\s/g, "");
    case "licenseId":
      return v.toUpperCase().replace(/[^A-Z0-9\-/]/g, "");
    default:
      return v.replace(/^\s+/, "").replace(/\s{2,}/g, " ");
  }
};

const validateField = (key: FieldKey, raw: string): string => {
  const v = normalize(raw);
  switch (key) {
    case "fullName":
      if (!v) return "Enter your full name";
      if (v.length > 60 || !NAME_RE.test(v))
        return "Use your first and last name (letters only)";
      return "";
    case "email":
      if (!v) return "Enter your email address";
      if (!EMAIL_RE.test(v)) return "Enter a valid email, e.g. you@email.com";
      return "";
    case "agencyName":
      if (!v) return "Enter your agency or company name";
      if (!AGENCY_RE.test(v)) return "Enter a valid agency name";
      return "";
    case "operatingArea":
      if (!v) return "Enter your location";
      if (!AREA_RE.test(v)) return "Enter a valid area, e.g. Lekki, Lagos";
      return "";
    case "licenseId":
      // Optional: only validate when provided
      if (!v) return "";
      if (!LICENSE_RE.test(v))
        return "Use letters, numbers, - or / (4-25 chars)";
      return "";
  }
};

/* -------------------------------------------------------------------------- */
/* SMALL UI PIECES                                                            */
/* -------------------------------------------------------------------------- */

function ProgressBar({
  progress,
  colors,
}: {
  progress: number;
  colors: ThemeColors;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(trackWidth * progress, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, trackWidth]);

  const fillStyle = useAnimatedStyle(() => ({ width: width.value }));

  return (
    <View
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: colors.disabled + "2E" }]}
    >
      <Animated.View
        style={[styles.fill, { backgroundColor: colors.primary }, fillStyle]}
      />
    </View>
  );
}

interface FieldProps extends TextInputProps {
  label: string;
  error?: string;
  optional?: boolean;
  colors: ThemeColors;
  inputRef?: (ref: TextInput | null) => void;
}

function Field({
  label,
  error,
  optional,
  colors,
  inputRef,
  onFocus,
  onBlur,
  ...rest
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
      ? colors.primary
      : colors.border;

  return (
    <View>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {optional ? (
          <Text style={[styles.optional, { color: colors.placeholder }]}>
            Optional
          </Text>
        ) : null}
      </View>

      <TextInput
        ref={inputRef}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.primary}
        accessibilityLabel={label}
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor,
            backgroundColor: focused
              ? colors.background
              : colors.disabled + "14",
          },
        ]}
      />

      {error ? (
        <Animated.Text
          entering={FadeIn.duration(180)}
          style={[styles.error, { color: colors.error }]}
        >
          {error}
        </Animated.Text>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function PremiumBiodataScreen() {
  const { user, checkProfile } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { role } = useLocalSearchParams();
  const isAgent = role === "agent";

  const [form, setForm] = useState<Record<FieldKey, string>>(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>(
    {},
  );
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const inputRefs = useRef<Partial<Record<FieldKey, TextInput | null>>>({});
  const directionRef = useRef<"forward" | "back">("forward");

  /* ------------------------------- Step config ------------------------------ */

  const steps = useMemo<StepConfig[]>(
    () =>
      isAgent
        ? [
            {
              key: "name",
              lead: "What's your ",
              accent: "name?",
              subtitle: "Clients will see this on your agent profile.",
              fields: ["fullName"],
            },
            {
              key: "agency",
              lead: "Your ",
              accent: "agency.",
              subtitle: "Tell us who you work with so clients can trust you.",
              fields: ["agencyName", "licenseId"],
            },
            {
              key: "area",
              lead: "Where do you ",
              accent: "operate?",
              subtitle:
                "Pick the main area you cover for property inspections.",
              fields: ["operatingArea"],
            },
          ]
        : [
            {
              key: "name",
              lead: "What's your ",
              accent: "name?",
              subtitle:
                "Tell us who you are so agents know who they're helping.",
              fields: ["fullName"],
            },
            {
              key: "email",
              lead: "How can we ",
              accent: "reach you?",
              subtitle: "We'll use your email for updates about your requests.",
              fields: ["email"],
            },
            {
              key: "area",
              lead: "Where are you ",
              accent: "based?",
              subtitle: "This helps match you with agents close to you.",
              fields: ["operatingArea"],
            },
          ],
    [isAgent],
  );

  const total = steps.length;
  const current = steps[step];
  const isLast = step === total - 1;

  const errors = useMemo(() => {
    const out = {} as Record<FieldKey, string>;
    (Object.keys(form) as FieldKey[]).forEach((k) => {
      out[k] = validateField(k, form[k]);
    });
    return out;
  }, [form]);

  const stepValid = current.fields.every((f) => !errors[f]);

  const setField = (key: FieldKey, value: string) =>
    setForm((prev) => ({ ...prev, [key]: sanitize(key, value) }));

  const markTouched = (keys: FieldKey[]) =>
    setTouched((prev) => {
      const next = { ...prev };
      keys.forEach((k) => (next[k] = true));
      return next;
    });

  /* --------------------------------- Effects -------------------------------- */

  // Track keyboard visibility so the footer hugs the keyboard.
  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvt, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvt, () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Focus the first field of each step once the transition settles.
  useEffect(() => {
    if (isSuccess) return;
    const t = setTimeout(() => {
      inputRefs.current[current.fields[0]]?.focus();
    }, 350);
    return () => clearTimeout(t);
  }, [step, isSuccess]);

  // Android hardware back walks back through steps.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSuccess || isSubmitting) return isSubmitting;
      if (step > 0) {
        goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step, isSuccess, isSubmitting]);

  /* ------------------------------- Navigation ------------------------------- */

  const goBack = () => {
    if (isSubmitting) return;
    if (step > 0) {
      directionRef.current = "back";
      setStep((s) => s - 1);
    } else {
      Keyboard.dismiss();
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    Keyboard.dismiss();

    const name = normalize(form.fullName);
    const emailValue = normalize(form.email).toLowerCase();
    const area = normalize(form.operatingArea);

    try {
      setIsSubmitting(true);

      if (isAgent) {
        await API.post("/agent/verify", {
          name,
          email: emailValue || user?.email || "agent@dwellify.com",
          address: area,
          agencyName: normalize(form.agencyName),
          licenseId: normalize(form.licenseId) || "N/A",
          phone: user?.phone || "",
        });
      } else {
        await API.post("/client/verify", {
          name,
          email: emailValue,
          address: area,
        });
      }

      await checkProfile();
      setIsSuccess(true);
    } catch (err: any) {
      Alert.alert(
        "Setup Failed",
        err?.response?.data?.error ||
          "Something went wrong while setting up your profile.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const goNext = () => {
    markTouched(current.fields);

    const firstInvalid = current.fields.find((f) => errors[f]);
    if (firstInvalid) {
      inputRefs.current[firstInvalid]?.focus();
      return;
    }

    if (isLast) {
      handleSubmit();
      return;
    }

    directionRef.current = "forward";
    setStep((s) => s + 1);
  };

  /** Enter key: jump to the next field in the step, or advance the step. */
  const onSubmitField = (field: FieldKey) => {
    const idx = current.fields.indexOf(field);
    const nextField = current.fields[idx + 1];
    if (nextField) {
      markTouched([field]);
      inputRefs.current[nextField]?.focus();
    } else {
      goNext();
    }
  };

  /* ------------------------------ Field helpers ----------------------------- */

  const fieldError = (key: FieldKey) => (touched[key] ? errors[key] : "");

  const bind = (key: FieldKey) => ({
    value: form[key],
    onChangeText: (v: string) => setField(key, v),
    onBlur: () => markTouched([key]),
    onSubmitEditing: () => onSubmitField(key),
    inputRef: (r: TextInput | null) => {
      inputRefs.current[key] = r;
    },
    error: fieldError(key),
    colors,
    blurOnSubmit: false,
    returnKeyType:
      current.fields[current.fields.length - 1] === key
        ? ((isLast ? "done" : "next") as "done" | "next")
        : ("next" as const),
  });

  const initials = normalize(form.fullName)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  /* ------------------------------ Success screen ---------------------------- */

  if (isSuccess) {
    return (
      <SafeAreaView
        style={{ backgroundColor: colors.background, flex: 1 }}
        edges={["top", "bottom"]}
      >
        <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
        <View style={styles.successWrap}>
          <Animated.View
            entering={FadeInRight.springify()}
            style={{ alignItems: "center", width: "100%" }}
          >
            <View
              style={[
                styles.successOuter,
                { backgroundColor: colors.primary + "14" },
              ]}
            >
              <View
                style={[
                  styles.successInner,
                  { backgroundColor: colors.primary + "26" },
                ]}
              >
                <CheckCircle
                  size={56}
                  color={colors.primary}
                  strokeWidth={1.5}
                />
              </View>
            </View>

            <Text style={[styles.successTitle, { color: colors.text }]}>
              Profile Created!
            </Text>

            <Text style={[styles.successBody, { color: colors.placeholder }]}>
              Welcome to Dwellify. Your premium {isAgent ? "Agent" : "Client"}{" "}
              account is now completely set up.
            </Text>

            <Pressable
              onPress={() => {
                router.dismissAll();
                router.replace(
                  isAgent ? "/(agent)/create-property" : "/(tabs)/profile",
                );
              }}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={styles.primaryBtnText}>Enter Dashboard</Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  /* -------------------------------- Form view ------------------------------- */

  const entering =
    directionRef.current === "forward"
      ? FadeInRight.duration(280)
      : FadeInLeft.duration(280);

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.background, flex: 1 }}
      edges={["top"]}
    >
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: step === 0 && !isSubmitting,
        }}
      />

      {/* Top row: back + progress */}
      <View style={styles.navHeader}>
        <Pressable
          onPress={goBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[
            styles.backButton,
            {
              backgroundColor: colors.disabled + "1F",
              borderColor: colors.border,
            },
          ]}
        >
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>

        <View style={styles.progressWrap}>
          <ProgressBar progress={(step + 1) / total} colors={colors} />
        </View>

        <Text style={[styles.stepCount, { color: colors.placeholder }]}>
          {step + 1}/{total}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          showsVerticalScrollIndicator={false}
        >
          <Animated.View key={current.key} entering={entering}>
            {/* Avatar preview on the first step */}
            {step === 0 && (
              <View style={styles.avatarWrap}>
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: colors.primary + "14",
                      borderColor: colors.primary + "40",
                    },
                  ]}
                >
                  {initials ? (
                    <Text
                      style={[styles.avatarText, { color: colors.primary }]}
                    >
                      {initials}
                    </Text>
                  ) : (
                    <User size={36} color={colors.primary} strokeWidth={1.5} />
                  )}
                </View>
              </View>
            )}

            <Text style={[styles.title, { color: colors.text }]}>
              {current.lead}
              <Text style={{ color: colors.primary }}>{current.accent}</Text>
            </Text>
            <Text style={[styles.subtitle, { color: colors.placeholder }]}>
              {current.subtitle}
            </Text>

            <View style={styles.fields}>
              {current.key === "name" && (
                <Field
                  label="Full Name"
                  placeholder={
                    isAgent ? "e.g. Tunde Bakare" : "e.g. Adaeze Okafor"
                  }
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  autoCorrect={false}
                  maxLength={60}
                  {...bind("fullName")}
                />
              )}

              {current.key === "email" && (
                <Field
                  label="Email Address"
                  placeholder="you@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  autoCorrect={false}
                  maxLength={100}
                  {...bind("email")}
                />
              )}

              {current.key === "agency" && (
                <>
                  <Field
                    label="Agency / Company Name"
                    placeholder="e.g. Bakare Properties Ltd"
                    autoCapitalize="words"
                    textContentType="organizationName"
                    maxLength={80}
                    {...bind("agencyName")}
                  />
                  <Field
                    label="License / REAN Number"
                    optional
                    placeholder="e.g. REAN-2024-00123"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={25}
                    {...bind("licenseId")}
                  />
                </>
              )}

              {current.key === "area" && (
                <Field
                  label={isAgent ? "Operating Area" : "Location / City"}
                  placeholder={
                    isAgent ? "e.g. Lekki, Lagos" : "e.g. Lagos, Nigeria"
                  }
                  autoCapitalize="words"
                  textContentType="addressCity"
                  maxLength={80}
                  {...bind("operatingArea")}
                />
              )}
            </View>
          </Animated.View>
        </ScrollView>

        {/* Footer rides above the keyboard */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: keyboardVisible ? 12 : Math.max(insets.bottom, 16),
            },
          ]}
        >
          <Pressable
            onPress={goNext}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel={isLast ? "Finish setup" : "Continue"}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: stepValid
                  ? colors.primary
                  : colors.disabled + "40",
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.btnInner}>
                <Text
                  style={[
                    styles.primaryBtnText,
                    { color: stepValid ? "#FFFFFF" : colors.placeholder },
                  ]}
                >
                  {isLast ? "Finish Setup" : "Continue"}
                </Text>
                {!isLast && (
                  <ArrowRight
                    size={18}
                    color={stepValid ? "#FFFFFF" : colors.placeholder}
                  />
                )}
              </View>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  navHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  progressWrap: { flex: 1 },
  track: { height: 6, borderRadius: 3, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3 },
  stepCount: {
    fontSize: 13,
    fontWeight: "700",
    minWidth: 28,
    textAlign: "right",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },

  avatarWrap: { alignItems: "flex-start", marginBottom: 20 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 28, fontWeight: "800", letterSpacing: 1 },

  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  fields: { gap: 18, marginTop: 28 },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: { fontWeight: "600", fontSize: 14 },
  optional: { fontSize: 12, fontWeight: "600" },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: { fontSize: 12.5, fontWeight: "600", marginTop: 6 },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryBtn: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  successWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  successOuter: {
    marginBottom: 32,
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  successInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  successBody: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
});
