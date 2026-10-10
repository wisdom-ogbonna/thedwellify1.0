import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import {
  getPropertyRequest,
  type PropertyRequest,
} from "@/services/property-requests";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  BedDouble,
  Building2,
  ChevronLeft,
  DollarSign,
  FileText,
  MapPin,
  ShieldCheck,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const naira = (value?: number | null) => {
  if (value == null || !Number.isFinite(Number(value))) return "";
  return `₦${Number(value).toLocaleString("en-NG")}`;
};

const budgetText = (item?: PropertyRequest | null) => {
  if (!item) return "Not set";
  if (item.minBudget && item.maxBudget) {
    return `${naira(item.minBudget)} – ${naira(item.maxBudget)}`;
  }
  return naira(item.maxBudget) || naira(item.minBudget) || "Not set";
};

export default function PropertyRequestDetail() {
  const { colors, isDark } = useTheme();
  const { role } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [item, setItem] = useState<PropertyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const card = isDark ? "#101826" : "#FFFFFF";
  const border = isDark ? "#1E293B" : "#E5E7EB";

  const load = useCallback(async () => {
    if (!id) {
      setError("Missing request");
      setLoading(false);
      return;
    }
    try {
      setError("");
      setItem(await getPropertyRequest(id, role));
    } catch (err: any) {
      setError(err?.message || "Could not load this request.");
    } finally {
      setLoading(false);
    }
  }, [id, role]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={[styles.safe, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.back, { backgroundColor: isDark ? "#152033" : "#F1F5F9" }]}
        >
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Property request</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: colors.error, textAlign: "center" }}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}>
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{item?.purpose || "Request"}</Text>
              </View>
              <Text style={{ color: colors.placeholder, fontWeight: "600" }}>
                {item?.status === "open" ? "Open" : item?.status}
              </Text>
            </View>
            <Text style={[styles.client, { color: colors.text }]}>
              {item?.clientName || "A client"}
            </Text>
            <Text style={{ color: colors.placeholder, marginTop: 4 }}>
              wants to {String(item?.purpose || "").toLowerCase() || "find"} a{" "}
              {item?.propertyType}
            </Text>
          </View>

          <Row icon={Building2} label="Property type" value={item?.propertyType || "—"} colors={colors} card={card} border={border} />
          <Row icon={MapPin} label="Location" value={item?.location || "—"} colors={colors} card={card} border={border} />
          <Row icon={DollarSign} label="Budget" value={budgetText(item)} colors={colors} card={card} border={border} />
          {item?.bedrooms ? (
            <Row icon={BedDouble} label="Bedrooms" value={item.bedrooms} colors={colors} card={card} border={border} />
          ) : null}
          {item?.features?.length ? (
            <Row
              icon={ShieldCheck}
              label="Features"
              value={item.features.join(", ")}
              colors={colors}
              card={card}
              border={border}
            />
          ) : null}
          <Row
            icon={FileText}
            label="Looking for"
            value={item?.lookingFor || "No extra details"}
            colors={colors}
            card={card}
            border={border}
          />
        </ScrollView>
      )}
    </View>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  colors,
  card,
  border,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string;
  colors: { text: string; placeholder: string; primary: string };
  card: string;
  border: string;
}) {
  return (
    <View style={[styles.row, { backgroundColor: card, borderColor: border }]}>
      <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}22` }]}>
        <Icon size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.placeholder, fontSize: 12, fontWeight: "700" }}>
          {label}
        </Text>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", marginTop: 4 }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "800" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  badgeText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
  client: { fontSize: 24, fontWeight: "800" },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
