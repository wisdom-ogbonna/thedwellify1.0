import { formatListingLocation } from "@/constants/nigeria-locations";
import { useTheme } from "@/hooks/use-theme";
import { placesApi } from "@/services/places";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LocationValue = {
  state: string;
  lga: string;
  landmark: string;
};

type Props = {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  requireLandmark?: boolean;
  compact?: boolean;
};

// Sentinel rows pinned to the top of each list so the user can clear a
// filter back to "every state" / "every LGA" instead of being stuck once
// something specific is picked.
const ALL_STATES_LABEL = "All states";
const ALL_LGAS_LABEL = "All LGAs";

// Above this width we show the picker as a centered dialog instead of a
// full-bleed sheet — a full-screen takeover for a short list looks fine on
// a phone but feels oversized on a tablet.
const WIDE_SCREEN_BREAKPOINT = 700;

export function LocationPicker({
  value,
  onChange,
  requireLandmark = false,
  compact = false,
}: Props) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isWideScreen = width >= WIDE_SCREEN_BREAKPOINT;

  const [sheet, setSheet] = useState<"state" | "lga" | null>(null);
  const [query, setQuery] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [lgas, setLgas] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingLgas, setLoadingLgas] = useState(false);
  const preview = formatListingLocation(value);
  const muted = colors.placeholder;
  const surface = isDark ? "#121212" : "#FFFFFF";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingStates(true);
      try {
        const next = await placesApi.states();
        if (!cancelled) setStates(next);
      } finally {
        if (!cancelled) setLoadingStates(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!value.state) {
      setLgas([]);
      return;
    }
    let cancelled = false;
    // Clear out the previous state's LGA list right away so a stale LGA
    // that belongs to the old state can't be tapped while the new list
    // for `value.state` is still loading.
    setLgas([]);
    (async () => {
      setLoadingLgas(true);
      try {
        const next = await placesApi.lgas(value.state);
        if (!cancelled) setLgas(next);
      } finally {
        if (!cancelled) setLoadingLgas(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value.state]);

  const options = useMemo(() => {
    const source = sheet === "state" ? states : lgas;
    const q = query.trim().toLowerCase();

    if (q) {
      // Hide the "All" row while actively searching — it would just be
      // noise mixed in with the filtered matches.
      return source.filter((item) => item.toLowerCase().includes(q));
    }

    const allLabel = sheet === "state" ? ALL_STATES_LABEL : ALL_LGAS_LABEL;
    return [allLabel, ...source];
  }, [lgas, query, sheet, states]);

  const closeSheet = () => {
    setSheet(null);
    setQuery("");
  };

  const select = (item: string) => {
    if (sheet === "state") {
      if (item === ALL_STATES_LABEL) {
        onChange({ state: "", lga: "", landmark: value.landmark });
      } else {
        onChange({ state: item, lga: "", landmark: value.landmark });
      }
    } else {
      if (item === ALL_LGAS_LABEL) {
        onChange({ ...value, lga: "" });
      } else {
        onChange({ ...value, lga: item });
      }
    }
    closeSheet();
  };

  const row = (
    key: "state" | "lga",
    label: string,
    placeholder: string,
    selected: string,
    disabled?: boolean,
  ) => (
    <Pressable
      onPress={() => {
        if (disabled) return;
        setQuery("");
        // Tapping an already-open selector again collapses it, instead of
        // leaving the dropdown stuck open with no way to dismiss it.
        setSheet((prev) => (prev === key ? null : key));
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.select,
        compact && styles.selectCompact,
        {
          backgroundColor: surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: disabled ? 0.55 : pressed ? 0.86 : 1,
        },
      ]}
    >
      <View style={styles.selectCopy}>
        {!compact && (
          <Text style={[styles.selectLabel, { color: muted }]}>{label}</Text>
        )}
        <Text
          style={[
            compact ? styles.selectValueCompact : styles.selectValue,
            { color: selected ? colors.text : muted },
          ]}
          numberOfLines={1}
        >
          {selected || placeholder}
        </Text>
      </View>
      {key === "lga" && loadingLgas && value.state ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={muted} />
      )}
    </Pressable>
  );

  const list = (
    <View style={styles.listBody}>
      <View
        style={[
          styles.searchRow,
          {
            backgroundColor: isDark ? "#1A1A1A" : "#F4F4F5",
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name="search" size={18} color={muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={sheet === "state" ? "Search states" : "Search LGAs"}
          placeholderTextColor={muted}
          autoFocus
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>
      {((sheet === "state" && loadingStates) ||
        (sheet === "lga" && loadingLgas)) &&
      options.length === 0 ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={options}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          style={styles.optionsList}
          renderItem={({ item }) => {
            const isAllOption =
              item === ALL_STATES_LABEL || item === ALL_LGAS_LABEL;
            const selected = isAllOption
              ? sheet === "state"
                ? !value.state
                : !value.lga
              : item === (sheet === "state" ? value.state : value.lga);
            return (
              <Pressable
                onPress={() => select(item)}
                style={[
                  styles.option,
                  {
                    borderBottomColor: colors.border,
                    backgroundColor: selected
                      ? `${colors.primary}14`
                      : "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    isAllOption && styles.optionTextAll,
                    { color: isAllOption ? colors.primary : colors.text },
                  ]}
                >
                  {item}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: muted }]}>No match found</Text>
          }
        />
      )}
    </View>
  );

  const modalTitle =
    sheet === "state" ? "Select state" : `Select LGA in ${value.state}`;

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <View style={styles.wrap}>
        {row("state", "State", "Select state", value.state)}
        {row(
          "lga",
          "LGA",
          value.state ? "Select LGA" : "Choose a state first",
          value.lga,
          !value.state,
        )}
      </View>
      {/* <View
        style={[
          styles.landmarkBox,
          { backgroundColor: surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.selectLabel, { color: muted }]}>
          Landmark {requireLandmark ? "" : "(optional)"}
        </Text>
        <TextInput
          value={value.landmark}
          onChangeText={(landmark) => onChange({ ...value, landmark })}
          placeholder="e.g. Lekki Phase 1, Wuse 2, GRA"
          placeholderTextColor={muted}
          style={[styles.landmarkInput, { color: colors.text }]}
        />
      </View> */}
      {preview && !compact ? (
        <Text style={[styles.preview, { color: muted }]}>{preview}</Text>
      ) : null}

      {/* The dropdown always opens in a Modal — its own native layer that
          sits above the rest of the screen and scrolls independently,
          instead of being nested inside this screen's own scroll view
          (which caused the list to hijack the outer screen's scroll). */}
      <Modal
        visible={!!sheet}
        transparent={isWideScreen}
        animationType={isWideScreen ? "fade" : "slide"}
        statusBarTranslucent={isWideScreen}
        onRequestClose={closeSheet}
      >
        {isWideScreen ? (
          <View style={styles.wideModalRoot}>
            <Pressable style={styles.wideModalBackdrop} onPress={closeSheet} />
            <View
              style={[
                styles.wideModalCard,
                { backgroundColor: colors.background },
              ]}
            >
              <View style={styles.modalHead}>
                <Pressable onPress={closeSheet} hitSlop={12}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {modalTitle}
                </Text>
                <View style={{ width: 24 }} />
              </View>
              {list}
            </View>
          </View>
        ) : (
          <SafeAreaView
            style={[styles.modal, { backgroundColor: colors.background }]}
          >
            <View style={styles.modalHead}>
              <Pressable onPress={closeSheet} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {modalTitle}
              </Text>
              <View style={{ width: 24 }} />
            </View>
            {list}
          </SafeAreaView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    width: "100%",
  },
  // In compact mode this component is meant to sit inline next to other
  // controls (e.g. a filter button), so it should claim the row's
  // remaining width rather than shrink to its content.
  compactContainer: {
    flex: 1,
  },
  wrap: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  select: {
    minHeight: 72,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flex: 1,
  },
  selectCompact: {
    minHeight: 46,
    paddingVertical: 0,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  selectCopy: { flex: 1 },
  selectLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  selectValue: { marginTop: 6, fontSize: 16, fontWeight: "800" },
  selectValueCompact: { fontSize: 14, fontWeight: "700" },
  landmarkBox: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  landmarkInput: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "600",
    paddingVertical: 4,
  },
  preview: { fontSize: 12, fontWeight: "600", lineHeight: 18 },
  modal: { flex: 1 },
  // Tablet / wide-screen dialog treatment: a centered, width-capped card
  // with a backdrop, instead of a full-bleed sheet.
  wideModalRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  wideModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  wideModalCard: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "80%",
    borderRadius: 20,
    overflow: "hidden",
  },
  modalHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  listBody: { flex: 1 },
  searchRow: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "600" },
  optionsList: { flex: 1 },
  option: {
    minHeight: 52,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { fontSize: 16, fontWeight: "600" },
  optionTextAll: { fontWeight: "800" },
  empty: { textAlign: "center", marginTop: 40, fontSize: 14 },
  loader: { marginTop: 40 },
});
