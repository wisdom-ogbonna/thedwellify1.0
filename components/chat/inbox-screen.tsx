import { formatPrice, purposeLabel } from "@/constants/listings";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { chatApi, type Conversation } from "@/services/chat";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const formatTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

export default function InboxScreen({ role }: { role: "client" | "agent" }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [items, setItems] = useState<Conversation[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const rows = await chatApi.list();
      setItems(rows);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not load messages.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(() => {
        chatApi
          .list()
          .then((rows) => setItems(rows))
          .catch(() => undefined);
      }, 3000);
      return () => clearInterval(timer);
    }, [load]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const peer = role === "agent" ? item.client?.name : item.agent?.name;
      const hay = [peer, item.property?.title, item.property?.location, item.lastMessage]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, role]);

  const unreadTotal = items.reduce((sum, item) => sum + (item.unreadCount || 0), 0);

  const renderItem = ({ item }: { item: Conversation }) => {
    const peer = role === "agent" ? item.client : item.agent;
    const image = item.property?.image;
    const preview = item.lastMessage || "Start the conversation";
    const mine = item.lastSenderId && item.lastSenderId === user?.uid;
    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/(utilities)/chats",
            params: { id: item.id },
          })
        }
        style={[styles.row, { borderColor: colors.border }]}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarLetter}>
              {(peer?.name || "D").slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {peer?.name || (role === "agent" ? "Client" : "Agent")}
            </Text>
            <Text
              style={[
                styles.time,
                { color: item.unreadCount ? colors.primary : colors.placeholder },
              ]}
            >
              {formatTime(item.lastMessageAt)}
            </Text>
          </View>
          <Text style={[styles.property, { color: colors.placeholder }]} numberOfLines={1}>
            {item.property?.title || "Property enquiry"}
            {item.property?.purpose
              ? ` · ${purposeLabel(item.property.purpose)}`
              : ""}
            {item.property?.price ? ` · ${formatPrice(item.property.price)}` : ""}
          </Text>
          <View style={styles.previewRow}>
            <Text
              style={[
                styles.preview,
                {
                  color: item.unreadCount ? colors.text : colors.placeholder,
                  fontWeight: item.unreadCount ? "700" : "500",
                },
              ]}
              numberOfLines={1}
            >
              {mine ? `You: ${preview}` : preview}
            </Text>
            {item.unreadCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>
                  {item.unreadCount > 9 ? "9+" : item.unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: colors.primary }]}>Inbox</Text>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        <Text style={[styles.sub, { color: colors.placeholder }]}>
          {role === "agent"
            ? "Reply to clients asking about your listings."
            : "Chat agents about homes you want to rent or buy."}
        </Text>
        {unreadTotal > 0 ? (
          <Text style={[styles.unreadHint, { color: colors.primary }]}>
            {unreadTotal} unread
          </Text>
        ) : null}
        <View
          style={[
            styles.search,
            { borderColor: colors.border, backgroundColor: colors.disabled + "14" },
          ]}
        >
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={role === "agent" ? "Search clients or listings" : "Search agents or listings"}
            placeholderTextColor={colors.placeholder}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{error}</Text>
          <Pressable onPress={load} style={[styles.retry, { backgroundColor: colors.primary }]}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No conversations yet</Text>
              <Text style={[styles.emptyCopy, { color: colors.placeholder }]}>
                {role === "agent"
                  ? "When a client taps one of your properties, the chat will appear here."
                  : "Open a listing and tap Message agent to start a live chat."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  kicker: { fontSize: 12, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  title: { fontSize: 30, fontWeight: "900", marginTop: 4 },
  sub: { fontSize: 14, marginTop: 6, lineHeight: 20 },
  unreadHint: { marginTop: 8, fontWeight: "800" },
  search: {
    marginTop: 16,
    height: 48,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  searchInput: { fontSize: 15 },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  row: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 58, height: 58, borderRadius: 18 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarLetter: { color: "#fff", fontWeight: "900", fontSize: 20 },
  rowBody: { flex: 1, marginLeft: 12 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "800", flex: 1, paddingRight: 8 },
  time: { fontSize: 12, fontWeight: "700" },
  property: { fontSize: 12, marginTop: 3, fontWeight: "600" },
  previewRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  preview: { flex: 1, fontSize: 14, paddingRight: 8 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  empty: { alignItems: "center", paddingTop: 48, paddingHorizontal: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  emptyCopy: { fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },
  retry: { marginTop: 16, paddingHorizontal: 20, height: 44, borderRadius: 12, justifyContent: "center" },
  retryText: { color: "#fff", fontWeight: "800" },
});
