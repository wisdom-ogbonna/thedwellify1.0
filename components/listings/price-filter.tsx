import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export type PriceRange = {
  min: number | null;
  max: number | null;
};

type Preset = PriceRange & { id: string; label: string };

const ANY: Preset = { id: "any", label: "Any", min: null, max: null };

const RENT_PRESETS: Preset[] = [
  ANY,
  { id: "u200", label: "Under ₦200k", min: null, max: 200_000 },
  { id: "200-500", label: "₦200k – ₦500k", min: 200_000, max: 500_000 },
  { id: "500-1m", label: "₦500k – ₦1m", min: 500_000, max: 1_000_000 },
  { id: "1-3m", label: "₦1m – ₦3m", min: 1_000_000, max: 3_000_000 },
  { id: "3m+", label: "₦3m+", min: 3_000_000, max: null },
];

const SALE_PRESETS: Preset[] = [
  ANY,
  { id: "u5m", label: "Under ₦5m", min: null, max: 5_000_000 },
  { id: "5-20", label: "₦5m – ₦20m", min: 5_000_000, max: 20_000_000 },
  { id: "20-50", label: "₦20m – ₦50m", min: 20_000_000, max: 50_000_000 },
  { id: "50-150", label: "₦50m – ₦150m", min: 50_000_000, max: 150_000_000 },
  { id: "150+", label: "₦150m+", min: 150_000_000, max: null },
];

const compactNaira = (value: number) => {
  if (value >= 1_000_000) {
    const n = value / 1_000_000;
    return `₦${Number.isInteger(n) ? n : n.toFixed(1)}m`;
  }
  if (value >= 1_000) {
    const n = value / 1_000;
    return `₦${Number.isInteger(n) ? n : n.toFixed(0)}k`;
  }
  return `₦${value.toLocaleString()}`;
};

export const priceChipLabel = (range: PriceRange) => {
  if (range.min == null && range.max == null) return "Price";
  if (range.min != null && range.max != null) {
    return `${compactNaira(range.min)} – ${compactNaira(range.max)}`;
  }
  if (range.max != null) return `Under ${compactNaira(range.max)}`;
  return `${compactNaira(range.min!)}+`;
};

const digitsOnly = (value: string) => value.replace(/[^\d]/g, "");

const toInput = (value: number | null) =>
  value == null ? "" : String(Math.round(value));

const fromInput = (value: string) => {
  const n = Number(digitsOnly(value));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const sameRange = (a: PriceRange, b: PriceRange) => a.min === b.min && a.max === b.max;

const presetsFor = (purpose: string) =>
  purpose === "Rent" ? RENT_PRESETS : SALE_PRESETS;

type Props = {
  purpose: string;
  value: PriceRange;
  onChange: (range: PriceRange) => void;
};

export default function PriceFilter({ purpose, value, onChange }: Props) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PriceRange>(value);
  const [minText, setMinText] = useState(toInput(value.min));
  const [maxText, setMaxText] = useState(toInput(value.max));

  const presets = useMemo(() => presetsFor(purpose), [purpose]);
  const active = !sameRange(value, ANY);
  const sheetBg = isDark ? "#111113" : "#FFFFFF";
  const fieldBg = colors.disabled + "14";

  const openSheet = () => {
    setDraft(value);
    setMinText(toInput(value.min));
    setMaxText(toInput(value.max));
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    setMinText(toInput(value.min));
    setMaxText(toInput(value.max));
  }, [open, purpose, value]);

  const applyPreset = (preset: Preset) => {
    setDraft({ min: preset.min, max: preset.max });
    setMinText(toInput(preset.min));
    setMaxText(toInput(preset.max));
  };

  const applyCustom = (min: string, max: string) => {
    setMinText(min);
    setMaxText(max);
    setDraft({ min: fromInput(min), max: fromInput(max) });
  };

  const apply = () => {
    let min = draft.min;
    let max = draft.max;
    if (min != null && max != null && min > max) {
      const swap = min;
      min = max;
      max = swap;
    }
    onChange({ min, max });
    setOpen(false);
  };

  const reset = () => {
    applyPreset(ANY);
    onChange(ANY);
    setOpen(false);
  };

  const matchedPreset = presets.find((preset) => sameRange(preset, draft));

  return (
    <>
      <Pressable
        onPress={openSheet}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={[
          styles.chip,
          {
            backgroundColor: active ? colors.primary + "22" : colors.disabled + "14",
            borderColor: active ? colors.primary : "#222226",
          },
        ]}
      >
        <Ionicons
          name="pricetag-outline"
          size={14}
          color={active ? colors.primary : colors.placeholder}
        />
        <Text style={[styles.chipText, { color: active ? colors.primary : colors.placeholder }]}>
          {priceChipLabel(value)}
        </Text>
        <Ionicons
          name="chevron-down"
          size={14}
          color={active ? colors.primary : colors.placeholder}
        />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: sheetBg }]}>
            <View style={styles.handle} />
            <View style={styles.sheetHead}>
              <Pressable onPress={reset} hitSlop={8}>
                <Text style={[styles.headAction, { color: colors.placeholder }]}>Reset</Text>
              </Pressable>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Price</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Text style={[styles.headAction, { color: colors.placeholder }]}>Close</Text>
              </Pressable>
            </View>

            <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>Suggested</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetRow}
            >
              {presets.map((preset) => {
                const selected = matchedPreset?.id === preset.id;
                return (
                  <Pressable
                    key={preset.id}
                    onPress={() => applyPreset(preset)}
                    style={[
                      styles.preset,
                      {
                        backgroundColor: selected ? colors.primary : colors.disabled + "14",
                        borderColor: selected ? colors.primary : "#222226",
                      },
                    ]}
                  >
                    <Text style={[styles.presetText, { color: selected ? "#fff" : colors.text }]}>
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>Custom range</Text>
            <View style={styles.customRow}>
              <View style={[styles.moneyField, { borderColor: "#222226", backgroundColor: fieldBg }]}>
                <Text style={[styles.naira, { color: colors.placeholder }]}>₦</Text>
                <TextInput
                  value={minText}
                  onChangeText={(text) => applyCustom(digitsOnly(text), maxText)}
                  placeholder="Minimum"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="number-pad"
                  style={[styles.moneyInput, { color: colors.text }]}
                />
              </View>
              <View style={[styles.dash, { backgroundColor: colors.placeholder }]} />
              <View style={[styles.moneyField, { borderColor: "#222226", backgroundColor: fieldBg }]}>
                <Text style={[styles.naira, { color: colors.placeholder }]}>₦</Text>
                <TextInput
                  value={maxText}
                  onChangeText={(text) => applyCustom(minText, digitsOnly(text))}
                  placeholder="Maximum"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="number-pad"
                  style={[styles.moneyInput, { color: colors.text }]}
                />
              </View>
            </View>

            <Pressable onPress={apply} style={[styles.apply, { backgroundColor: colors.primary }]}>
              <Text style={styles.applyText}>See listings</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipText: { fontSize: 14, fontWeight: "700" },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 8,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#9CA3AF",
    marginBottom: 12,
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800" },
  headAction: { fontSize: 15, fontWeight: "700", minWidth: 52 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  presetRow: { gap: 8, paddingBottom: 18 },
  preset: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
  },
  presetText: { fontSize: 13, fontWeight: "700" },
  customRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  moneyField: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  naira: { fontSize: 16, fontWeight: "800" },
  moneyInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  dash: { width: 12, height: 2, borderRadius: 1 },
  apply: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  applyText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
