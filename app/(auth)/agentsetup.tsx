import { useTheme } from "@/hooks/use-theme";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
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

type FieldKey = "name" | "email" | "agencyName" | "licenseId" | "address";
type ThemeColors = ReturnType<typeof useTheme>["colors"];

interface StepConfig {
  key: string;
  lead: string;
  accent: string;
  subtitle: string;
  fields: FieldKey[];
}

const LETTER = "A-Za-zÀ-ÖØ-öø-ÿ";

// At least two name parts; letters (incl. accented), ' . and - only.
const NAME_RE = new RegExp(
  `^[${LETTER}][${LETTER}'’.-]*(?: [${LETTER}][${LETTER}'’.-]*)+$`,
);
const EMAIL_RE =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const AGENCY_RE = new RegExp(`^[${LETTER}0-9][${LETTER}0-9&'’.,()\\- ]{1,79}$`);
const LICENSE_RE = /^[A-Z0-9][A-Z0-9\-/]{3,24}$/;
// Street addresses: must contain a letter, allows digits and , . # / -
const ADDRESS_RE = new RegExp(
  `^(?=.*[${LETTER}])[${LETTER}0-9][${LETTER}0-9'’.,#/\\- ]{4,119}$`,
);

const normalize = (v: string) => v.trim().replace(/\s+/g, " ");

const EMPTY_FORM: Record<FieldKey, string> = {
  name: "",
  email: "",
  agencyName: "",
  licenseId: "",
  address: "",
};

/** Light cleanup while typing (never fights the user). */
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
    case "name":
      if (!v) return "Enter your full name";
      if (v.length > 60 || !NAME_RE.test(v))
        return "Use your first and last name (letters only)";
      return "";
    case "email":
      if (!v) return "Enter your email address";
      if (!EMAIL_RE.test(v)) return "Enter a valid email, e.g. you@agency.com";
      return "";
    case "agencyName":
      if (!v) return "Enter your agency name";
      if (!AGENCY_RE.test(v)) return "Enter a valid agency name";
      return "";
    case "licenseId":
      if (!v) return "Enter your license ID";
      if (!LICENSE_RE.test(v))
        return "Use letters, numbers, - or / (4-25 characters)";
      return "";
    case "address":
      if (!v) return "Enter your office address";
      if (!ADDRESS_RE.test(v))
        return "Enter a valid address, e.g. 12 Admiralty Way, Lekki";
      return "";
  }
};

const FIELD_PROPS: Record<
  FieldKey,
  { label: string; placeholder: string } & Partial<TextInputProps>
> = {
  name: {
    label: "Full Name",
    placeholder: "e.g. Tunde Bakare",
    autoCapitalize: "words",
    autoComplete: "name",
    textContentType: "name",
    autoCorrect: false,
    maxLength: 60,
  },
  email: {
    label: "Email Address",
    placeholder: "you@agency.com",
    keyboardType: "email-address",
    autoCapitalize: "none",
    autoComplete: "email",
    textContentType: "emailAddress",
    autoCorrect: false,
    maxLength: 100,
  },
  agencyName: {
    label: "Agency Name",
    placeholder: "e.g. Dwellify Realty",
    autoCapitalize: "words",
    textContentType: "organizationName",
    maxLength: 80,
  },
  licenseId: {
    label: "License ID",
    placeholder: "e.g. LIC-12345",
    autoCapitalize: "characters",
    autoCorrect: false,
    maxLength: 25,
  },
  address: {
    label: "Office Address",
    placeholder: "e.g. 12 Admiralty Way, Lekki, Lagos",
    autoCapitalize: "words",
    autoComplete: "street-address",
    textContentType: "fullStreetAddress",
    maxLength: 120,
  },
};

const STEPS: StepConfig[] = [
  {
    key: "identity",
    lead: "Let's verify ",
    accent: "you.",
    subtitle: "Your name and email appear on your agent profile.",
    fields: ["name", "email"],
  },
  {
    key: "agency",
    lead: "Your ",
    accent: "agency.",
    subtitle: "Add your agency and license so clients can trust you.",
    fields: ["agencyName", "licenseId"],
  },
  {
    key: "office",
    lead: "Where's your ",
    accent: "office?",
    subtitle: "Clients use this to find and verify your business.",
    fields: ["address"],
  },
];

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
  colors: ThemeColors;
  inputRef?: (ref: TextInput | null) => void;
}

function Field({
  label,
  error,
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
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>

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

export default function AgentSetupScreen() {
  const { user, checkProfile } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<Record<FieldKey, string>>(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>(
    {},
  );
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const inputRefs = useRef<Partial<Record<FieldKey, TextInput | null>>>({});
  const directionRef = useRef<"forward" | "back">("forward");

  const total = STEPS.length;
  const current = STEPS[step];
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
    const t = setTimeout(() => {
      inputRefs.current[current.fields[0]]?.focus();
    }, 350);
    return () => clearTimeout(t);
  }, [step]);

  // Android hardware back walks back through steps.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (loading) return true;
      if (step > 0) {
        goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step, loading]);

  /* ------------------------------- Navigation ------------------------------- */

  const goBack = () => {
    if (loading || step === 0) return;
    directionRef.current = "back";
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (loading) return;
    Keyboard.dismiss();

    try {
      setLoading(true);
      await API.post("/agent/verify", {
        name: normalize(form.name),
        email: normalize(form.email).toLowerCase(),
        address: normalize(form.address),
        agencyName: normalize(form.agencyName),
        licenseId: normalize(form.licenseId),
        phone: user?.phone || "",
      });
      await checkProfile();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Setup failed.");
    } finally {
      setLoading(false);
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

  /** Return key: jump to the next field in the step, or advance the step. */
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

  const bind = (key: FieldKey) => ({
    value: form[key],
    onChangeText: (v: string) => setField(key, v),
    onBlur: () => markTouched([key]),
    onSubmitEditing: () => onSubmitField(key),
    inputRef: (r: TextInput | null) => {
      inputRefs.current[key] = r;
    },
    error: touched[key] ? errors[key] : "",
    colors,
    blurOnSubmit: false,
    returnKeyType:
      current.fields[current.fields.length - 1] === key && isLast
        ? ("done" as const)
        : ("next" as const),
  });

  /* ---------------------------------- View ---------------------------------- */

  const entering =
    directionRef.current === "forward"
      ? FadeInRight.duration(280)
      : FadeInLeft.duration(280);

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.background, flex: 1 }}
      edges={["top"]}
    >
      {/* Top row: back (after step 1) + progress */}
      <View style={styles.navHeader}>
        {step > 0 ? (
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
        ) : (
          <View style={styles.backSpacer} />
        )}

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
            <Text style={[styles.title, { color: colors.text }]}>
              {current.lead}
              <Text style={{ color: colors.primary }}>{current.accent}</Text>
            </Text>
            <Text style={[styles.subtitle, { color: colors.placeholder }]}>
              {current.subtitle}
            </Text>

            <View style={styles.fields}>
              {current.fields.map((f) => (
                <Field key={f} {...FIELD_PROPS[f]} {...bind(f)} />
              ))}
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
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={isLast ? "Submit verification" : "Continue"}
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
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.btnInner}>
                <Text
                  style={[
                    styles.primaryBtnText,
                    { color: stepValid ? "#FFFFFF" : colors.placeholder },
                  ]}
                >
                  {isLast ? "Submit Verification" : "Continue"}
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
  backSpacer: { width: 40, height: 40 },
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
    paddingTop: 28,
    paddingBottom: 24,
  },

  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -1,
  },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  fields: { gap: 18, marginTop: 28 },

  label: { fontWeight: "600", fontSize: 14, marginBottom: 8 },
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
});
