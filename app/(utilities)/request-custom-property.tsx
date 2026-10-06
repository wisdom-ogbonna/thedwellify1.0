import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Ban,
  Bath,
  Bell,
  BedDouble,
  Building2,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  DollarSign,
  FileText,
  Headphones,
  Home,
  Key,
  MapPin,
  Minus,
  Plus,
  Send,
  ShieldCheck,
  Sofa,
  Waves,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* -------------------------------------------------------------------------- */
/* DATA                                                                       */
/* -------------------------------------------------------------------------- */

const FEATURES = [
  { label: "Gated Estate", icon: Home },
  { label: "Parking Space", icon: Car },
  { label: "Serviced & 24/7 Power", icon: Zap },
  { label: "Furnished", icon: Sofa },
  { label: "Bathrooms", icon: Bath },
  { label: "Swimming Pool", icon: Waves },
];

const BEDROOMS = ["1", "2", "3+"] as const;
const TOTAL_STEPS = 5;
const MAX_DETAILS = 500;

/* Colours taken from the design screenshots */
const DARK = {
  bg: "#060910",
  card: "#0D1522",
  cardAlt: "#111C2D",
  border: "#1A2538",
  text: "#FFFFFF",
  muted: "#6E7C93",
  sub: "#8B97AB",
  blue: "#0077FF",
  link: "#3B82F6",
  success: "#10B981",
  danger: "#EF4444",
};

const LIGHT = {
  bg: "#F6F8FC",
  card: "#FFFFFF",
  cardAlt: "#F1F5F9",
  border: "#E2E8F0",
  text: "#0F172A",
  muted: "#64748B",
  sub: "#64748B",
  blue: "#0077FF",
  link: "#2563EB",
  success: "#10B981",
  danger: "#DC2626",
};

type Palette = typeof DARK;

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const formatAmount = (value: string) =>
  value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const toNumber = (value: string) => Number(value.replace(/,/g, "")) || 0;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function CustomPropertyRequest() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const P: Palette = isDark ? DARK : LIGHT;

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [mode, setMode] = useState<"buy" | "rent">("buy");
  const [propertyType, setPropertyType] = useState("");
  const [location, setLocation] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [bedrooms, setBedrooms] = useState<(typeof BEDROOMS)[number] | "">("");
  const [features, setFeatures] = useState<string[]>([]);
  const [details, setDetails] = useState("");

  const minValue = toNumber(minBudget);
  const maxValue = toNumber(maxBudget);
  const budgetInvalid = minValue > 0 && maxValue > 0 && minValue > maxValue;
  const canSubmit = maxValue > 0 && !budgetInvalid;

  /* animated progress bar */
  const progress = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: step / TOTAL_STEPS,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [step, progress]);

  const toggleFeature = (feature: string) =>
    setFeatures((current) =>
      current.includes(feature)
        ? current.filter((item) => item !== feature)
        : [...current, feature],
    );

  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const back = () => (step > 1 ? setStep((s) => s - 1) : router.back());

  const handleSend = () => {
    if (!canSubmit) return;
    // TODO: call your API here, then show the success screen.
    setSubmitted(true);
  };

  const goHome = () => router.replace("/" as any); // TODO: point at your home route

  /* ------------------------------ SUCCESS ------------------------------ */

  if (submitted) {
    const budgetText = `${minValue > 0 ? `₦${minBudget} – ` : "Up to "}₦${maxBudget}`;
    return (
      <View style={{ flex: 1, backgroundColor: P.bg }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 20,
            paddingBottom: 24,
          }}
        >
          <View style={{ width: "100%", maxWidth: 560, alignSelf: "center" }}>
            <BackButton P={P} onPress={() => router.back()} />

            <SuccessIllustration P={P} />

            <Text
              style={{
                color: P.text,
                fontSize: 30,
                fontWeight: "800",
                textAlign: "center",
                marginTop: 8,
              }}
            >
              Request Sent!
            </Text>
            <Text
              style={{
                color: P.sub,
                fontSize: 15,
                lineHeight: 24,
                textAlign: "center",
                marginTop: 12,
                paddingHorizontal: 8,
              }}
            >
              Your property request has been successfully sent to our trusted
              agents. They will review your details and get back to you soon.
            </Text>

            {/* Summary */}
            <View
              style={{
                marginTop: 28,
                padding: 18,
                borderRadius: 24,
                backgroundColor: P.card,
                borderWidth: 1,
                borderColor: P.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: `${P.blue}1F`,
                    borderWidth: 1,
                    borderColor: `${P.blue}66`,
                  }}
                >
                  <Home size={20} color={P.blue} />
                </View>
                <Text
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    color: P.text,
                    fontSize: 17,
                    fontWeight: "700",
                  }}
                >
                  Your Request Summary
                </Text>
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 5,
                    borderRadius: 14,
                    backgroundColor: P.blue,
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {mode === "buy" ? "Buy" : "Rent"}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: P.border,
                  marginVertical: 16,
                }}
              />

              <SummaryRow
                P={P}
                icon={DollarSign}
                label="Budget Range"
                value={budgetText}
              />
              <SummaryRow
                P={P}
                icon={MapPin}
                label="Location"
                value={location.trim() || "Anywhere"}
              />
              <SummaryRow
                P={P}
                icon={Building2}
                label="Property Type"
                value={propertyType.trim() || "Any"}
              />
              <SummaryRow
                P={P}
                icon={BedDouble}
                label="Bedrooms"
                value={bedrooms || "Any"}
              />
              <SummaryRow
                P={P}
                icon={ShieldCheck}
                label="Additional Features"
                value={features.length ? features.join(", ") : "None"}
                last
              />
            </View>

            {/* Stay notified */}
            <View
              style={{
                marginTop: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                padding: 16,
                borderRadius: 20,
                backgroundColor: P.card,
                borderWidth: 1,
                borderColor: P.border,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: P.cardAlt,
                  borderWidth: 1,
                  borderColor: `${P.blue}55`,
                }}
              >
                <Bell size={18} color={P.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: P.text, fontSize: 16, fontWeight: "700" }}
                >
                  Stay Notified
                </Text>
                <Text
                  style={{
                    color: P.sub,
                    fontSize: 14,
                    lineHeight: 20,
                    marginTop: 2,
                  }}
                >
                  We&apos;ll send you updates via in-app notifications and
                  messages once an agent responds.
                </Text>
              </View>
            </View>

            <PrimaryButton
              P={P}
              label="Back to Home"
              icon={<Home size={20} color="#FFFFFF" />}
              onPress={goHome}
              bold
              style={{ marginTop: 14 }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  /* ------------------------------ STEPS ------------------------------ */

  const renderStep = () => {
    switch (step) {
      /* ---------------------------- 1 · MODE ---------------------------- */
      case 1:
        return (
          <>
            <Title P={P}>What are you looking for?</Title>
            <Subtitle color={P.link}>
              Let us help you find the right property.
            </Subtitle>

            <View style={{ marginTop: 32, gap: 16 }}>
              {(
                [
                  {
                    key: "buy",
                    title: "Buy",
                    sub: "Own your dream property",
                    icon: <Home size={26} color="#FFFFFF" />,
                  },
                  {
                    key: "rent",
                    title: "Rent",
                    sub: "Find the perfect place to call home",
                    icon: <Key size={26} color="#FFFFFF" />,
                  },
                ] as const
              ).map((item) => (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.85}
                  onPress={() => {
                    setMode(item.key);
                    next();
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                    borderRadius: 24,
                    backgroundColor: P.card,
                    borderWidth: 1,
                    borderColor: P.border,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: P.blue,
                    }}
                  >
                    {item.icon}
                  </View>
                  <View style={{ flex: 1, marginLeft: 16, paddingRight: 24 }}>
                    <Text
                      style={{
                        color: P.text,
                        fontSize: 18,
                        fontWeight: "700",
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{
                        color: P.muted,
                        fontSize: 15,
                        lineHeight: 22,
                        marginTop: 2,
                      }}
                    >
                      {item.sub}
                    </Text>
                  </View>
                  <ChevronRight size={22} color={P.sub} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        );

      /* --------------------------- 2 · BUDGET --------------------------- */
      case 2:
        return (
          <>
            <Title P={P}>What is your budget?</Title>
            <Subtitle color={P.link}>
              Tell us your preferred price range.
            </Subtitle>

            <View style={{ marginTop: 32, gap: 16 }}>
              <BudgetInput
                P={P}
                label={
                  mode === "rent" ? "Minimum yearly budget" : "Minimum budget"
                }
                placeholder="e.g. 50,000,000"
                value={minBudget}
                onChange={(v) => setMinBudget(formatAmount(v))}
                invalid={budgetInvalid}
              />
              <BudgetInput
                P={P}
                label={
                  mode === "rent" ? "Maximum yearly budget" : "Maximum budget"
                }
                placeholder="e.g. 100,000,000"
                value={maxBudget}
                onChange={(v) => setMaxBudget(formatAmount(v))}
                invalid={budgetInvalid}
              />
            </View>

            {budgetInvalid && (
              <Text style={{ color: P.danger, fontSize: 13, marginTop: 10 }}>
                Minimum can&apos;t be higher than maximum.
              </Text>
            )}

            <PrimaryButton
              P={P}
              label="Continue"
              icon={<ArrowRight size={20} color="#FFFFFF" />}
              iconAfter
              onPress={next}
              disabled={!canSubmit}
              style={{ marginTop: 28 }}
            />
          </>
        );

      /* -------------------------- 3 · LOCATION -------------------------- */
      case 3:
        return (
          <>
            <Title P={P}>Where do you want to live?</Title>
            <Subtitle color={P.link}>Tell us your preferred location.</Subtitle>

            <View
              style={{
                marginTop: 32,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 10,
              }}
            >
              <Text style={{ color: P.sub, fontSize: 16 }}>
                Preferred location
              </Text>
              <Text style={{ color: P.muted, fontSize: 14 }}>(Optional)</Text>
            </View>

            <View
              style={{
                height: 54,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingHorizontal: 18,
                borderRadius: 18,
                backgroundColor: P.card,
                borderWidth: 1,
                borderColor: P.border,
              }}
            >
              <MapPin size={22} color={P.sub} />
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Port Harcourt, Rivers State"
                placeholderTextColor={P.muted}
                returnKeyType="done"
                style={{
                  flex: 1,
                  fontSize: 17,
                  color: P.text,
                  paddingVertical: 0,
                }}
              />
            </View>

            <MapPreview
              place={location.split(",")[0].trim() || "Your area"}
              region={location.trim() || "Nigeria"}
            />
          </>
        );
        
      /* ---------------------------- 5 · MORE ---------------------------- */
      default:
        return (
          <>
            <Title P={P}>Tell us more</Title>
            <Subtitle color={P.sub}>
              Any additional details will help us find the best matches for you.
            </Subtitle>

            <View
              style={{
                marginTop: 28,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 12,
              }}
            >
              <Text style={{ color: P.text, fontSize: 18, fontWeight: "700" }}>
                Additional Details
              </Text>
              <Text style={{ color: P.sub, fontSize: 15 }}>(Optional)</Text>
            </View>

            <View
              style={{
                padding: 18,
                borderRadius: 22,
                backgroundColor: P.card,
                borderWidth: 1,
                borderColor: P.border,
              }}
            >
              <View style={{ flexDirection: "row", gap: 14 }}>
                <FileText size={22} color={P.sub} style={{ marginTop: 2 }} />
                <TextInput
                  value={details}
                  onChangeText={setDetails}
                  multiline
                  maxLength={MAX_DETAILS}
                  textAlignVertical="top"
                  placeholder="e.g. I need a 3-bedroom house in a secure gated estate, preferably close to the university with reliable power."
                  placeholderTextColor={P.muted}
                  style={{
                    flex: 1,
                    fontSize: 16,
                    lineHeight: 24,
                    color: P.text,
                    minHeight: 120,
                    padding: 0,
                  }}
                />
              </View>
              <Text
                style={{
                  color: P.sub,
                  fontSize: 14,
                  textAlign: "right",
                  marginTop: 8,
                }}
              >
                {details.length}/{MAX_DETAILS}
              </Text>
            </View>

            <PrimaryButton
              P={P}
              label="Send Request"
              icon={<Send size={20} color="#FFFFFF" />}
              onPress={handleSend}
              disabled={!canSubmit}
              bold
              style={{ marginTop: 16 }}
            />

            <View
              style={{
                marginTop: 16,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 14,
                padding: 16,
                borderRadius: 22,
                backgroundColor: P.card,
                borderWidth: 1,
                borderColor: P.border,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: P.cardAlt,
                }}
              >
                <Headphones size={20} color={P.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: P.text, fontSize: 16, fontWeight: "700" }}
                >
                  Your request will be sent to our agents
                </Text>
                <Text
                  style={{
                    color: P.sub,
                    fontSize: 14,
                    lineHeight: 21,
                    marginTop: 4,
                  }}
                >
                  You&apos;ll get an instant in-app notification once a vetted
                  agent reviews your criteria and matches listings.
                </Text>
              </View>
            </View>
          </>
        );
    }
  };

  const pinnedFooter = step === 3;

  return (
    <View style={{ flex: 1, backgroundColor: P.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ------------------------------ HEADER ------------------------------ */}
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 20,
            width: "100%",
            maxWidth: 560,
            alignSelf: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <BackButton P={P} onPress={back} />
            <View
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                backgroundColor: P.cardAlt,
                overflow: "hidden",
              }}
            >
              <Animated.View
                style={{
                  height: "100%",
                  borderRadius: 3,
                  backgroundColor: P.blue,
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                }}
              />
            </View>
            <Text style={{ color: P.sub, fontSize: 15, fontWeight: "500" }}>
              {step} of {TOTAL_STEPS}
            </Text>
          </View>
        </View>

        {/* ------------------------------- BODY ------------------------------- */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          contentContainerStyle={{
            paddingTop: 28,
            paddingHorizontal: 20,
            paddingBottom: 32,
          }}
        >
          <View style={{ width: "100%", maxWidth: 560, alignSelf: "center" }}>
            {renderStep()}
          </View>
        </ScrollView>

        {pinnedFooter && (
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 16),
            }}
          >
            <PrimaryButton
              P={P}
              label="Continue"
              icon={<ArrowRight size={20} color="#FFFFFF" />}
              iconAfter
              onPress={next}
              style={{ width: "100%", maxWidth: 560, alignSelf: "center" }}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* SMALL PIECES                                                               */
/* -------------------------------------------------------------------------- */

function BackButton({ P, onPress }: { P: Palette; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={{
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: P.cardAlt,
        borderWidth: 1,
        borderColor: P.border,
      }}
    >
      <ChevronLeft size={22} color={P.text} />
    </TouchableOpacity>
  );
}

function Title({ P, children }: { P: Palette; children: React.ReactNode }) {
  return (
    <Text
      style={{
        color: P.text,
        fontSize: 32,
        lineHeight: 38,
        fontWeight: "800",
        letterSpacing: -0.5,
      }}
    >
      {children}
    </Text>
  );
}

function Subtitle({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <Text style={{ color, fontSize: 17, lineHeight: 24, marginTop: 12 }}>
      {children}
    </Text>
  );
}

function FieldLabel({
  P,
  required,
  children,
}: {
  P: Palette;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Text
      style={{
        color: P.sub,
        fontSize: 16,
        fontWeight: "700",
        marginTop: 28,
        marginBottom: 12,
      }}
    >
      {children}
      {required && <Text style={{ color: P.blue }}> *</Text>}
    </Text>
  );
}

function PrimaryButton({
  P,
  label,
  icon,
  iconAfter,
  onPress,
  disabled,
  bold,
  style,
}: {
  P: Palette;
  label: string;
  icon?: React.ReactNode;
  iconAfter?: boolean;
  onPress: () => void;
  disabled?: boolean;
  bold?: boolean;
  style?: any;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={[
        {
          height: 54,
          borderRadius: 18,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          backgroundColor: P.blue,
          opacity: disabled ? 0.45 : 1,
          shadowColor: P.blue,
          shadowOpacity: 0.35,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        },
        style,
      ]}
    >
      {!iconAfter && icon}
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 18,
          fontWeight: bold ? "700" : "500",
        }}
      >
        {label}
      </Text>
      {iconAfter && icon}
    </TouchableOpacity>
  );
}

function BudgetInput({
  P,
  label,
  placeholder,
  value,
  onChange,
  invalid,
}: {
  P: Palette;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 22,
        backgroundColor: P.card,
        borderWidth: 1,
        borderColor: invalid ? P.danger : P.border,
      }}
    >
      <Text style={{ color: P.sub, fontSize: 14 }}>{label}</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          marginTop: 10,
        }}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: P.cardAlt,
            borderWidth: 1,
            borderColor: P.border,
          }}
        >
          <Text style={{ color: P.text, fontSize: 15, fontWeight: "700" }}>
            ₦
          </Text>
        </View>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          placeholder={placeholder}
          placeholderTextColor={P.muted}
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 18,
            color: P.text,
            paddingVertical: 0,
          }}
        />
        <ChevronDown size={20} color={P.sub} />
      </View>
    </View>
  );
}

function OptionTile({
  P,
  active,
  onPress,
  left,
  label,
  showChevron,
  centered,
  height = 48,
  style,
}: {
  P: Palette;
  active: boolean;
  onPress: () => void;
  left?: React.ReactNode;
  label: string;
  showChevron?: boolean;
  centered?: boolean;
  height?: number;
  style?: any;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        {
          height,
          borderRadius: 16,
          paddingHorizontal: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: centered ? "center" : "flex-start",
          gap: 10,
          backgroundColor: active ? P.blue : P.card,
          borderWidth: 1,
          borderColor: active ? P.blue : P.border,
        },
        style,
      ]}
    >
      {left}
      <Text
        numberOfLines={1}
        style={{
          flexShrink: 1,
          color: active ? "#FFFFFF" : P.text,
          fontSize: 16,
          fontWeight: active ? "600" : "400",
        }}
      >
        {label}
      </Text>
      {showChevron && !centered && (
        <View style={{ marginLeft: "auto" }}>
          <ChevronDown size={18} color="#FFFFFF" />
        </View>
      )}
      {showChevron && centered && <ChevronDown size={18} color="#FFFFFF" />}
    </TouchableOpacity>
  );
}

function SummaryRow({
  P,
  icon: Icon,
  label,
  value,
  last,
}: {
  P: Palette;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: last ? 0 : 16,
      }}
    >
      <View style={{ width: 28, paddingTop: 1 }}>
        <Icon size={20} color={P.sub} />
      </View>
      <Text style={{ color: P.sub, fontSize: 16, width: 140 }}>{label}</Text>
      <Text
        style={{
          flex: 1,
          color: P.text,
          fontSize: 16,
          fontWeight: "700",
          textAlign: "right",
          lineHeight: 22,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* SUCCESS ILLUSTRATION                                                       */
/* -------------------------------------------------------------------------- */

function SuccessIllustration({ P }: { P: Palette }) {
  return (
    <View
      style={{ alignItems: "center", justifyContent: "center", height: 250 }}
    >
      <View
        style={{
          position: "absolute",
          width: 250,
          height: 250,
          borderRadius: 125,
          backgroundColor: "rgba(0,119,255,0.08)",
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 190,
          height: 190,
          borderRadius: 95,
          backgroundColor: "rgba(0,119,255,0.12)",
        }}
      />

      {/* ticks */}
      {[
        { top: 40, left: 62, rotate: "45deg" },
        { top: 20, left: 128, rotate: "20deg" },
        { top: 50, right: 56, rotate: "-40deg" },
        { top: 104, right: 40, rotate: "-12deg" },
        { top: 112, left: 40, rotate: "5deg" },
      ].map((t, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            width: 22,
            height: 7,
            borderRadius: 4,
            backgroundColor: "#35598F",
            top: t.top,
            left: (t as any).left,
            right: (t as any).right,
            transform: [{ rotate: t.rotate }],
          }}
        />
      ))}

      {/* document */}
      <View
        style={{
          width: 116,
          height: 144,
          borderRadius: 16,
          backgroundColor: "#F4F7FF",
          transform: [{ rotate: "-3deg" }],
          alignItems: "center",
          paddingTop: 20,
          shadowColor: P.blue,
          shadowOpacity: 0.4,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 10,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: P.blue,
          }}
        >
          <Home size={24} color="#FFFFFF" />
        </View>
        <View
          style={{
            width: 78,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#B9D0F5",
            marginTop: 16,
          }}
        />
        <View
          style={{
            width: 66,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#CFE0F8",
            marginTop: 8,
            marginRight: 12,
          }}
        />
        <View
          style={{
            width: 54,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#DCE8FA",
            marginTop: 8,
            marginRight: 24,
          }}
        />
      </View>

      {/* check badge */}
      <View
        style={{
          position: "absolute",
          right: "50%",
          marginRight: -86,
          bottom: 50,
          width: 54,
          height: 54,
          borderRadius: 27,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: P.blue,
          borderWidth: 4,
          borderColor: "#050A14",
        }}
      >
        <Check size={26} color="#FFFFFF" strokeWidth={3.5} />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* MAP PREVIEW (static, drawn with views)                                     */
/* -------------------------------------------------------------------------- */

function Road({
  top,
  left,
  width,
  rotate,
  thick = 10,
}: {
  top: number | string;
  left: number | string;
  width: number;
  rotate: string;
  thick?: number;
}) {
  return (
    <View
      style={{
        position: "absolute",
        top: top as any,
        left: left as any,
        width,
        height: thick,
        borderRadius: thick / 2,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D5DEEA",
        transform: [{ rotate }],
      }}
    />
  );
}

function MapLabel({
  children,
  top,
  left,
  color = "#6B7A90",
}: {
  children: string;
  top: number;
  left: number | string;
  color?: string;
}) {
  return (
    <Text
      style={{
        position: "absolute",
        top,
        left: left as any,
        color,
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 0.8,
      }}
    >
      {children}
    </Text>
  );
}

function WhiteCard({
  style,
  children,
}: {
  style?: any;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        {
          position: "absolute",
          backgroundColor: "#FFFFFF",
          borderRadius: 14,
          shadowColor: "#0F172A",
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 4,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function MapPreview({ place, region }: { place: string; region: string }) {
  return (
    <View
      style={{
        marginTop: 20,
        height: 288,
        borderRadius: 28,
        overflow: "hidden",
        backgroundColor: "#F4F7FB",
      }}
    >
      {/* water + parks */}
      <View
        style={{
          position: "absolute",
          left: -60,
          bottom: -80,
          width: 360,
          height: 170,
          borderRadius: 90,
          backgroundColor: "#D8E8FB",
        }}
      />
      <View
        style={{
          position: "absolute",
          right: -90,
          top: 70,
          width: 230,
          height: 240,
          borderRadius: 120,
          backgroundColor: "#DCEAFB",
        }}
      />
      <View
        style={{
          position: "absolute",
          right: 30,
          top: 6,
          width: 80,
          height: 60,
          borderRadius: 30,
          backgroundColor: "#E3F1E7",
        }}
      />

      {/* blocks */}
      {[
        { top: 30, left: 12, w: 80, h: 70 },
        { top: 30, left: 140, w: 100, h: 52 },
        { top: 200, left: 14, w: 100, h: 56 },
        { top: 150, left: 150, w: 90, h: 60 },
      ].map((b, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: b.top,
            left: b.left,
            width: b.w,
            height: b.h,
            borderRadius: 8,
            backgroundColor: "#EBF0F6",
          }}
        />
      ))}

      {/* roads */}
      <Road top={118} left={-40} width={460} rotate="0deg" thick={6} />
      <Road top={80} left={-30} width={420} rotate="26deg" thick={9} />
      <Road top={110} left={-60} width={520} rotate="18deg" thick={9} />
      <Road top={150} left={20} width={380} rotate="-62deg" thick={8} />
      <Road top={150} left="30%" width={420} rotate="62deg" thick={8} />
      <Road top={190} left={-20} width={460} rotate="8deg" thick={7} />

      {/* labels */}
      <MapLabel top={56} left={26}>
        GRA PHASE 2
      </MapLabel>
      <MapLabel top={96} left="30%">
        D-LINE
      </MapLabel>
      <MapLabel top={90} left="68%">
        NS AMADI
      </MapLabel>
      <MapLabel top={170} left="26%">
        OLD GRA
      </MapLabel>
      <MapLabel top={188} left="50%">
        PETER ODILI RD
      </MapLabel>
      <MapLabel top={248} left="62%" color="#0A84C6">
        BONNY RIVER
      </MapLabel>

      {/* radius */}
      <View
        style={{
          position: "absolute",
          top: 86,
          left: "50%",
          marginLeft: -39,
          width: 78,
          height: 78,
          borderRadius: 39,
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: "#5AA2F0",
          backgroundColor: "rgba(0,119,255,0.10)",
        }}
      />

      {/* pill */}
      <View
        style={{
          position: "absolute",
          top: 66,
          left: "50%",
          marginLeft: -52,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
          backgroundColor: "#0077FF",
          shadowColor: "#0077FF",
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: "#FFFFFF",
          }}
        />
        <Text
          numberOfLines={1}
          style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}
        >
          {place}
        </Text>
      </View>

      {/* pin */}
      <View
        style={{
          position: "absolute",
          top: 108,
          left: "50%",
          marginLeft: -17,
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0077FF",
          borderWidth: 3,
          borderColor: "#FFFFFF",
          shadowColor: "#0F172A",
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 5,
        }}
      >
        <MapPin size={15} color="#FFFFFF" />
      </View>

      {/* live chip */}
      <WhiteCard
        style={{
          top: 14,
          left: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 14,
          paddingVertical: 9,
        }}
      >
        <View
          style={{
            width: 9,
            height: 9,
            borderRadius: 5,
            backgroundColor: "#10B981",
          }}
        />
        <Text style={{ color: "#1E293B", fontSize: 14, fontWeight: "700" }}>
          Live Map View
        </Text>
      </WhiteCard>

      {/* zoom */}
      <WhiteCard style={{ top: 14, right: 14, width: 34, overflow: "hidden" }}>
        <View
          style={{ height: 33, alignItems: "center", justifyContent: "center" }}
        >
          <Plus size={16} color="#1E293B" />
        </View>
        <View style={{ height: 1, backgroundColor: "#E2E8F0" }} />
        <View
          style={{ height: 33, alignItems: "center", justifyContent: "center" }}
        >
          <Minus size={16} color="#1E293B" />
        </View>
      </WhiteCard>

      {/* region card */}
      <WhiteCard
        style={{
          bottom: 12,
          left: 14,
          maxWidth: "62%",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <MapPin size={18} color="#0077FF" />
        <View style={{ flexShrink: 1 }}>
          <Text
            numberOfLines={1}
            style={{ color: "#0F172A", fontSize: 15, fontWeight: "800" }}
          >
            {region}
          </Text>
          <Text style={{ color: "#64748B", fontSize: 13 }}>
            Within 15 km radius
          </Text>
        </View>
      </WhiteCard>

      {/* locate */}
      <WhiteCard
        style={{
          bottom: 12,
          right: 14,
          width: 38,
          height: 38,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Crosshair size={20} color="#1E293B" />
      </WhiteCard>
    </View>
  );
}
