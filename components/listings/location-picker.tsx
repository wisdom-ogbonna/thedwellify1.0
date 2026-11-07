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

export function LocationPicker({
  value,
  onChange,
  requireLandmark = false,
  compact = false,
}: Props) {
  const { colors, isDark } = useTheme();
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
    if (!q) return source;
    return source.filter((item) => item.toLowerCase().includes(q));
  }, [lgas, query, sheet, states]);

  const select = (item: string) => {
    if (sheet === "state") {
      onChange({
        state: item,
        lga: "",
        landmark: value.landmark,
      });
    } else {
      onChange({ ...value, lga: item });
    }
    setSheet(null);
    setQuery("");
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
        setSheet(key);
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.select,
        {
          backgroundColor: surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: disabled ? 0.55 : pressed ? 0.86 : 1,
        },
      ]}
    >
      <View style={styles.selectCopy}>
        <Text style={[styles.selectLabel, { color: muted }]}>{label}</Text>
        <Text
          style={[
            styles.selectValue,
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
    <View style={compact ? undefined : styles.modal}>
      <View
        style={[
          styles.searchRow,
          compact ? styles.inlineSearch : null,
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
          autoFocus={!compact}
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
          nestedScrollEnabled
          style={compact ? styles.compactList : undefined}
          renderItem={({ item }) => {
            const selected =
              item === (sheet === "state" ? value.state : value.lga);
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
                <Text style={[styles.optionText, { color: colors.text }]}>
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

  return (
    <View style={styles.wrap}>
      {row("state", "State", "Tap to select a state", value.state)}
      {row(
        "lga",
        "LGA",
        value.state ? "Tap to select an LGA" : "Choose a state first",
        value.lga,
        !value.state,
      )}
      <View
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
      </View>
      {preview && !compact ? (
        <Text style={[styles.preview, { color: muted }]}>{preview}</Text>
      ) : null}

      {compact && sheet ? (
        <View
          style={[
            styles.inlineList,
            { borderColor: colors.border, backgroundColor: surface },
          ]}
        >
          {list}
        </View>
      ) : null}

      <Modal
        visible={!compact && !!sheet}
        animationType="slide"
        onRequestClose={() => setSheet(null)}
      >
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHead}>
            <Pressable
              onPress={() => {
                setSheet(null);
                setQuery("");
              }}
              hitSlop={12}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {sheet === "state"
                ? "Select state"
                : `Select LGA in ${value.state}`}
            </Text>
            <View style={{ width: 24 }} />
          </View>
          {list}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
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
  },
  selectCopy: { flex: 1 },
  selectLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  selectValue: { marginTop: 6, fontSize: 16, fontWeight: "800" },
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
  inlineList: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  compactList: { maxHeight: 280 },
  inlineSearch: { marginHorizontal: 10, marginTop: 10 },
  modal: { flex: 1 },
  modalHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "800" },
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
  option: {
    minHeight: 52,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { fontSize: 16, fontWeight: "600" },
  empty: { textAlign: "center", marginTop: 40, fontSize: 14 },
  loader: { marginTop: 40 },
});
