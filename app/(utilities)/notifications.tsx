import { useInbox } from "@/context/InboxContext";
import { useTheme } from "@/hooks/use-theme";
import { inboxApi, type InboxItem } from "@/services/inbox";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Bell,
  Building2,
  CheckCheck,
  ChevronLeft,
  Home,
  MessageCircle,
  UserRound,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const timeAgo = (value?: string | null) => {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return "";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d`;
  return new Date(value).toLocaleDateString();
};

const iconFor = (type: string) => {
  if (type.includes("chat")) return MessageCircle;
  if (type.includes("property") || type === "NEW_PROPERTY") return Home;
  if (type.includes("request")) return Building2;
  return Bell;
};

const openItem = (item: InboxItem, router: ReturnType<typeof useRouter>) => {
  const type = item.type || item.data?.type || "";
  const data = item.data || {};

  if (type === "incoming_request") {
    router.push({
      pathname: "/(utilities)/requests",
      params: {
        requestId: String(data.requestId || ""),
        agentId: String(data.agentId || ""),
        propertyType: String(data.propertyType || ""),
        lat: String(data.lat || ""),
        lng: String(data.lng || ""),
      },
    });
    return;
  }

  if (
    type === "request_accepted" ||
    type === "request_unavailable" ||
    type === "request_cancelled" ||
    type === "request_rematch"
  ) {
    router.push("/(client)/client-map");
    return;
  }

  if (type === "listing_chat" && data.conversationId) {
    router.push({
      pathname: "/(utilities)/chats",
      params: { id: String(data.conversationId) },
    });
    return;
  }

  if (type === "NEW_PROPERTY" && data.productId) {
    router.push({
      pathname: "/(utilities)/property-view",
      params: { propertyId: String(data.productId) },
    });
    return;
  }

  if (
    type === "property_request" ||
    type === "property_request_sent" ||
    type === "request_missed"
  ) {
    if (data.requestId) {
      router.push({
        pathname: "/(utilities)/property-request",
        params: { id: String(data.requestId) },
      });
    }
  }
};

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { refresh: refreshBadge } = useInbox();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"all" | "unattended" | "attended">("all");

  const bg = colors.background;
  const card = isDark ? "#101826" : "#F0F2F5";
  const unreadBg = isDark ? "#15243A" : "#E7F3FF";
  const muted = colors.placeholder;

  const load = useCallback(async (soft = false) => {
    if (!soft) setLoading(true);
    try {
      setError("");
      const data = await inboxApi.list();
      setItems(data.notifications || []);
      refreshBadge();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Could not load notifications.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshBadge]);

  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [load]),
  );

  const unattended = items.filter((item) => item.status !== "attended");
  const attended = items.filter((item) => item.status === "attended");

  const sections = useMemo(() => {
    if (tab === "unattended") {
      return [{ title: "New", data: unattended }];
    }
    if (tab === "attended") {
      return [{ title: "Earlier", data: attended }];
    }
    return [
      { title: "New", data: unattended },
      { title: "Earlier", data: attended },
    ].filter((section) => section.data.length > 0);
  }, [attended, tab, unattended]);

  const onPressItem = async (item: InboxItem) => {
    if (item.status !== "attended") {
      setItems((current) =>
        current.map((row) =>
          row.id === item.id ? { ...row, status: "attended" } : row,
        ),
      );
      inboxApi.attend(item.id).then(() => refreshBadge()).catch(() => undefined);
    }
    openItem(item, router);
  };

  const markAll = async () => {
    setItems((current) =>
      current.map((row) => ({ ...row, status: "attended" as const })),
    );
    try {
      await inboxApi.attendAll();
      refreshBadge();
    } catch {
      load(true);
    }
  };

  return (
    <View style={[styles.safe, { backgroundColor: bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={[styles.back, { backgroundColor: card }]}
        >
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        <Pressable onPress={markAll} hitSlop={8} disabled={!unattended.length}>
          <CheckCheck
            size={22}
            color={unattended.length ? colors.primary : muted}
          />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {(
          [
            ["all", "All"],
            ["unattended", "New"],
            ["attended", "Earlier"],
          ] as const
        ).map(([key, label]) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? colors.primary : card,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? "#FFFFFF" : colors.text,
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                {label}
                {key === "unattended" && unattended.length
                  ? ` ${unattended.length}`
                  : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: colors.error, textAlign: "center", paddingHorizontal: 24 }}>
            {error}
          </Text>
          <Pressable onPress={() => load()} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(true);
              }}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Bell size={36} color={muted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No notifications yet
              </Text>
              <Text style={[styles.emptyBody, { color: muted }]}>
                Requests, replies and missed activity will show up here.
              </Text>
            </View>
          }
          renderSectionHeader={({ section }) =>
            section.data.length ? (
              <Text style={[styles.section, { color: colors.text }]}>
                {section.title}
              </Text>
            ) : null
          }
          renderItem={({ item }) => {
            const unread = item.status !== "attended";
            const Icon = iconFor(item.type);
            const initial = (item.actorName || "D").trim().charAt(0).toUpperCase();
            return (
              <Pressable
                onPress={() => onPressItem(item)}
                style={[
                  styles.row,
                  { backgroundColor: unread ? unreadBg : "transparent" },
                ]}
              >
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  {item.actorAvatar ? (
                    <UserRound size={20} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.avatarText}>{initial}</Text>
                  )}
                  <View
                    style={[styles.glyph, { backgroundColor: colors.primary }]}
                  >
                    <Icon size={11} color="#FFFFFF" />
                  </View>
                </View>
                <View style={styles.copy}>
                  <Text
                    style={[
                      styles.itemTitle,
                      { color: colors.text, fontWeight: unread ? "800" : "600" },
                    ]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  {!!item.body && (
                    <Text
                      style={[styles.itemBody, { color: muted }]}
                      numberOfLines={2}
                    >
                      {item.body}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.time,
                      { color: unread ? colors.primary : muted },
                    ]}
                  >
                    {timeAgo(item.createdAt)}
                    {item.type === "request_missed" ? " · Missed" : ""}
                  </Text>
                </View>
                {unread ? <View style={styles.dot} /> : null}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, fontSize: 26, fontWeight: "800", letterSpacing: -0.4 },
  tabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    fontSize: 17,
    fontWeight: "800",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
  glyph: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  copy: { flex: 1, paddingRight: 8 },
  itemTitle: { fontSize: 15, lineHeight: 20 },
  itemBody: { fontSize: 14, lineHeight: 20, marginTop: 3 },
  time: { fontSize: 12, fontWeight: "700", marginTop: 6 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1877F2",
    marginTop: 20,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "800" },
  emptyBody: { fontSize: 14, lineHeight: 20, textAlign: "center" },
});
