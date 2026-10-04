import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
  "Newly Built",
  "Gated Estate",
  "Serviced & 24/7 Power",
  "Furnished",
  "Bathrooms",
  "Swimming Pool",
];

const MAX_DETAILS = 300;


const SPACE = {
  screen: 20, // horizontal screen padding
  section: 24, // gap between sections
  label: 8, // gap between a label and its field
  gap: 10, // gap between siblings in a row / wrap
};

const RADIUS = { field: 14, chip: 12, card: 16 };

const FIELD_HEIGHT = 52;

const TYPE = {
  title: 26,
  subtitle: 14,
  label: 13,
  body: 15,
  chip: 13,
  caption: 12,
  button: 16,
};

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
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const primary = colors.primary || "#0066FF";
  const text = colors.text;
  const muted = isDark ? "#8E96A8" : "#64748B";
  const fieldBg = isDark ? "#151922" : "#F8FAFC";
  const border = isDark ? "#252B36" : "#E2E8F0";
  const segmentBg = isDark ? "#10151F" : "#F1F5F9";

  const [mode, setMode] = useState<"buy" | "rent">("buy");
  const [propertyType, setPropertyType] = useState("");
  const [location, setLocation] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [details, setDetails] = useState("");

  const minValue = toNumber(minBudget);
  const maxValue = toNumber(maxBudget);
  const budgetInvalid = minValue > 0 && maxValue > 0 && minValue > maxValue;
  const canSubmit = maxValue > 0 && !budgetInvalid;

  const toggleFeature = (feature: string) =>
    setFeatures((current) =>
      current.includes(feature)
        ? current.filter((item) => item !== feature)
        : [...current, feature],
    );

  const handleSend = () => {
    if (!canSubmit) return;
    Alert.alert(
      "Request sent",
      "Your custom property request has been submitted.",
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          contentContainerStyle={{
            paddingTop: insets.top + 12,
            paddingHorizontal: SPACE.screen,
            paddingBottom: 32,
          }}
        >
          {/* Caps width on tablets / large phones and centres the column */}
          <View style={{ width: "100%", maxWidth: 560, alignSelf: "center" }}>
            {/* ------------------------------ HEADER ------------------------------ */}
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.8}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="chevron-back" size={22} color={text} />
            </TouchableOpacity>

            <Text
              style={{
                color: text,
                fontSize: TYPE.title,
                lineHeight: 32,
                fontWeight: "800",
                letterSpacing: -0.4,
                marginTop: 20,
              }}
            >
              Request a custom property
            </Text>

            <Text
              style={{
                color: muted,
                fontSize: TYPE.subtitle,
                lineHeight: 21,
                marginTop: 6,
              }}
            >
              Tell us exactly what you&apos;re looking for and we&apos;ll find
              the best options for you.
            </Text>

            {/* ----------------------------- BUY / RENT ---------------------------- */}
            <View
              style={{
                marginTop: SPACE.section,
                height: 52,
                padding: 4,
                flexDirection: "row",
                borderRadius: RADIUS.field,
                backgroundColor: segmentBg,
                borderWidth: 1,
                borderColor: border,
              }}
            >
              {(
                [
                  { key: "buy", label: "Buy", icon: "home" },
                  { key: "rent", label: "Rent", icon: "key-outline" },
                ] as const
              ).map((item) => {
                const active = mode === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.8}
                    onPress={() => setMode(item.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      borderRadius: RADIUS.field - 4,
                      backgroundColor: active ? primary : "transparent",
                    }}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={active ? "#FFFFFF" : muted}
                    />
                    <Text
                      style={{
                        fontSize: TYPE.body,
                        fontWeight: "600",
                        color: active ? "#FFFFFF" : muted,
                      }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ----------------------------- PROPERTY TYPE ------------------------------ */}
            <Section label="Property type" muted={muted}>
              <View
                style={{
                  height: FIELD_HEIGHT,
                  borderRadius: RADIUS.field,
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  backgroundColor: fieldBg,
                  borderWidth: 1,
                  borderColor: border,
                }}
              >
                <Ionicons name="home-outline" size={20} color={muted} />
                <TextInput
                  value={propertyType}
                  onChangeText={setPropertyType}
                  placeholder="e.g. Filling Station"
                  placeholderTextColor={muted}
                  returnKeyType="next"
                  style={{
                    flex: 1,
                    fontSize: TYPE.body,
                    color: text,
                    paddingVertical: 0,
                  }}
                />
              </View>
            </Section>
            
            {/* ----------------------------- LOCATION ------------------------------ */}
            <Section label="Preferred location" hint="Optional" muted={muted}>
              <View
                style={{
                  height: FIELD_HEIGHT,
                  borderRadius: RADIUS.field,
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  backgroundColor: fieldBg,
                  borderWidth: 1,
                  borderColor: border,
                }}
              >
                <Ionicons name="location-outline" size={20} color={muted} />
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g. Port Harcourt, Rivers State"
                  placeholderTextColor={muted}
                  returnKeyType="next"
                  style={{
                    flex: 1,
                    fontSize: TYPE.body,
                    color: text,
                    paddingVertical: 0,
                  }}
                />
              </View>
            </Section>

            {/* ------------------------------ BUDGET ------------------------------- */}
            <Section
              label={mode === "rent" ? "Yearly budget" : "Your budget"}
              muted={muted}
            >
              <View style={{ flexDirection: "row", gap: SPACE.gap }}>
                <BudgetInput
                  placeholder="Minimum"
                  value={minBudget}
                  onChange={(v) => setMinBudget(formatAmount(v))}
                  fieldBg={fieldBg}
                  border={budgetInvalid ? "#DC2626" : border}
                  text={text}
                  muted={muted}
                />
                <BudgetInput
                  placeholder="Maximum"
                  value={maxBudget}
                  onChange={(v) => setMaxBudget(formatAmount(v))}
                  fieldBg={fieldBg}
                  border={budgetInvalid ? "#DC2626" : border}
                  text={text}
                  muted={muted}
                />
              </View>

              {budgetInvalid && (
                <Text
                  style={{
                    color: "#DC2626",
                    fontSize: TYPE.caption,
                    marginTop: 8,
                  }}
                >
                  Minimum can&apos;t be higher than maximum.
                </Text>
              )}
            </Section>

            {/* ----------------------------- FEATURES ------------------------------ */}
            <Section
              label="What do you need?"
              hint="Tap to select"
              muted={muted}
            >
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: SPACE.gap,
                }}
              >
                {FEATURES.map((feature) => (
                  <Chip
                    key={feature}
                    label={feature}
                    active={features.includes(feature)}
                    showCheck
                    onPress={() => toggleFeature(feature)}
                    primary={primary}
                    fieldBg={fieldBg}
                    border={border}
                    muted={muted}
                  />
                ))}
              </View>
            </Section>

            {/* ------------------------- ADDITIONAL DETAILS ------------------------ */}
            <Section label="Additional details" hint="Optional" muted={muted}>
              <View
                style={{
                  borderRadius: RADIUS.field,
                  padding: 14,
                  backgroundColor: fieldBg,
                  borderWidth: 1,
                  borderColor: border,
                }}
              >
                <TextInput
                  value={details}
                  onChangeText={setDetails}
                  multiline
                  maxLength={MAX_DETAILS}
                  textAlignVertical="top"
                  placeholder="e.g. 3-bedroom house in a secure estate, close to the university, with reliable power."
                  placeholderTextColor={muted}
                  style={{
                    fontSize: TYPE.body,
                    lineHeight: 22,
                    color: text,
                    minHeight: 100,
                    padding: 0,
                  }}
                />
                <Text
                  style={{
                    color: muted,
                    fontSize: TYPE.caption,
                    textAlign: "right",
                    marginTop: 8,
                  }}
                >
                  {details.length}/{MAX_DETAILS}
                </Text>
              </View>
            </Section>

            {/* ------------------------------- INFO -------------------------------- */}
            <View
              style={{
                marginTop: SPACE.section,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
                padding: 14,
                borderRadius: RADIUS.card,
                backgroundColor: fieldBg,
                borderWidth: 1,
                borderColor: border,
              }}
            >
              <IconBubble
                name="information-circle-outline"
                size={20}
                color={primary}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: text,
                    fontSize: TYPE.label,
                    fontWeight: "700",
                  }}
                >
                  Your request goes to our agents
                </Text>
                <Text
                  style={{
                    color: muted,
                    fontSize: TYPE.caption,
                    lineHeight: 18,
                    marginTop: 2,
                  }}
                >
                  You&apos;ll get a notification once a vetted agent reviews
                  your criteria and matches listings.
                </Text>
              </View>
            </View>

            {/* -------------------- RECENT REQUEST (placeholder data) -------------------- */}
            <Section label="Recent request" muted={muted}>
              <View
                style={{
                  padding: 14,
                  borderRadius: RADIUS.card,
                  backgroundColor: fieldBg,
                  borderWidth: 1,
                  borderColor: border,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <IconBubble name="home-outline" size={18} color={primary} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: text,
                        fontSize: TYPE.label,
                        fontWeight: "700",
                      }}
                    >
                      3-bed house in Port Harcourt
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: muted,
                        fontSize: TYPE.caption,
                        marginTop: 2,
                      }}
                    >
                      ₦50M – ₦70M
                    </Text>
                  </View>

                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      backgroundColor: "#D9770618",
                    }}
                  >
                    <Text
                      style={{
                        color: "#D97706",
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      Awaiting
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={{
                    marginTop: 12,
                    height: 40,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: `${primary}15`,
                  }}
                >
                  <Text
                    style={{
                      color: primary,
                      fontSize: TYPE.label,
                      fontWeight: "700",
                    }}
                  >
                    View request
                  </Text>
                </TouchableOpacity>
              </View>
            </Section>
          </View>
        </ScrollView>

        {/* ------------------------- STICKY SEND BUTTON -------------------------- */}
        <View
          style={{
            paddingHorizontal: SPACE.screen,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: border,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSend}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            style={{
              width: "100%",
              maxWidth: 560,
              alignSelf: "center",
              height: 54,
              borderRadius: RADIUS.field,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: primary,
              opacity: canSubmit ? 1 : 0.45,
            }}
          >
            <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: TYPE.button,
                fontWeight: "700",
              }}
            >
              Send request
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION                                                                    */
/* -------------------------------------------------------------------------- */

function Section({
  label,
  hint,
  muted,
  children,
}: {
  label: string;
  hint?: string;
  muted: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginTop: SPACE.section }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: SPACE.label,
        }}
      >
        <Text
          style={{
            color: muted,
            fontSize: TYPE.label,
            fontWeight: "700",
          }}
        >
          {label}
        </Text>
        {hint ? (
          <Text style={{ color: muted, fontSize: TYPE.caption }}>{hint}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* CHIP                                                                       */
/* -------------------------------------------------------------------------- */

function Chip({
  label,
  icon,
  active,
  showCheck = false,
  onPress,
  primary,
  fieldBg,
  border,
  muted,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active: boolean;
  showCheck?: boolean;
  onPress: () => void;
  primary: string;
  fieldBg: string;
  border: string;
  muted: string;
}) {
  const fg = active ? "#FFFFFF" : muted;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        height: 42,
        paddingHorizontal: 14,
        borderRadius: RADIUS.chip,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: active ? primary : fieldBg,
        borderWidth: 1,
        borderColor: active ? primary : border,
      }}
    >
      {showCheck && active ? (
        <Ionicons name="checkmark" size={15} color={fg} />
      ) : icon ? (
        <Ionicons name={icon} size={16} color={fg} />
      ) : null}
      <Text style={{ fontSize: TYPE.chip, fontWeight: "600", color: fg }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* -------------------------------------------------------------------------- */
/* ICON BUBBLE                                                                */
/* -------------------------------------------------------------------------- */

function IconBubble({
  name,
  size,
  color,
}: {
  name: keyof typeof Ionicons.glyphMap;
  size: number;
  color: string;
}) {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: `${color}15`,
      }}
    >
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* BUDGET INPUT                                                               */
/* -------------------------------------------------------------------------- */

function BudgetInput({
  placeholder,
  value,
  onChange,
  fieldBg,
  border,
  text,
  muted,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  fieldBg: string;
  border: string;
  text: string;
  muted: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        height: FIELD_HEIGHT,
        borderRadius: RADIUS.field,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: fieldBg,
        borderWidth: 1,
        borderColor: border,
      }}
    >
      <Text style={{ color: muted, fontSize: TYPE.body }}>₦</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        placeholder={placeholder}
        placeholderTextColor={muted}
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: TYPE.body,
          color: text,
          paddingVertical: 0,
        }}
      />
    </View>
  );
}
