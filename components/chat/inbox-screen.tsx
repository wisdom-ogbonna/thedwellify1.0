import { NotificationBell } from "@/components/notifications/notification-bell";
import { formatPrice, purposeLabel } from "@/constants/listings";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { chatApi, type ChatMessage, type Conversation } from "@/services/chat";
import { connectSocket, getSocket, isSocketConnected } from "@/services/socket";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

export default function InboxScreen({
  role
}: {
  role: "client" | "agent";
}) {
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
      connectSocket().catch(() => undefined);
      const timer = setInterval(() => {
        if (isSocketConnected()) return;
        chatApi
          .list()
          .then((rows) => setItems(rows))
          .catch(() => undefined);
      }, 15000);
      return () => clearInterval(timer);
    }, [load]),
  );

  useEffect(() => {
    let active = true;
    const attach = async () => {
      await connectSocket();
      if (!active) return;
      const socket = getSocket();

      const onUpdated = (row: Conversation) => {
        if (!row?.id) return;
        setItems((prev) => {
          const rest = prev.filter((item) => item.id !== row.id);
          return [row, ...rest];
        });
      };

      const onNew = (message: ChatMessage) => {
        if (!message?.conversationId) return;
        setItems((prev) =>
          prev.map((item) =>
            item.id === message.conversationId
              ? {
                  ...item,
                  lastMessage: message.text,
                  lastMessageAt: message.createdAt,
                  lastSenderId: message.senderId,
                  unreadCount:
                    message.senderId === user?.uid
                      ? item.unreadCount
                      : (item.unreadCount || 0) + 1,
                }
              : item,
          ),
        );
      };

      socket?.on("conversation:updated", onUpdated);
      socket?.on("message:new", onNew);
      return () => {
        socket?.off("conversation:updated", onUpdated);
        socket?.off("message:new", onNew);
      };
    };

    let detach: (() => void) | undefined;
    attach().then((fn) => {
      detach = fn;
    });
    return () => {
      active = false;
      detach?.();
    };
  }, [user?.uid]);

  const threads = useMemo(() => {
    const byPeer = new Map<string, Conversation>();
    items.forEach((item) => {
      const key =
        (item.agentId === user?.uid ? item.clientId : item.agentId) || item.id;
      const prev = byPeer.get(key);
      if (!prev) {
        byPeer.set(key, item);
        return;
      }
      const prevTime = prev.lastMessageAt ? new Date(prev.lastMessageAt).getTime() : 0;
      const nextTime = item.lastMessageAt ? new Date(item.lastMessageAt).getTime() : 0;
      const winner = nextTime >= prevTime ? item : prev;
      byPeer.set(key, {
        ...winner,
        unreadCount: (prev.unreadCount || 0) + (item.unreadCount || 0),
      });
    });
    return [...byPeer.values()];
  }, [items, user?.uid]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((item) => {
      const peer =
        item.agentId === user?.uid ? item.client?.name : item.agent?.name;
      const hay = [
        peer,
        item.property?.title,
        item.property?.location,
        item.lastMessage,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [threads, query, user?.uid]);

  const unreadTotal = threads.reduce(
    (sum, item) => sum + (item.unreadCount || 0),
    0,
  );

  const renderItem = ({ item }: { item: Conversation }) => {
    const peer = item.agentId === user?.uid ? item.client : item.agent;
    const image = item.property?.image || peer?.avatar;
    const hasUnread = (item.unreadCount || 0) > 0;
    const mine = item.lastSenderId && item.lastSenderId === user?.uid;
    const hasMessage = Boolean(item.lastMessage);
    const preview = item.lastMessage || "Start the conversation";

    // "Shortlet Home - For Sale • ₦15,000"
    const propertyLine =
      item.kind === "agent_peer"
        ? peer?.agencyName || "Direct agent chat"
        : (item.property?.title || "Property enquiry") +
          (item.property?.purpose
            ? ` - ${purposeLabel(item.property.purpose)}`
            : "") +
          (item.property?.price ? ` • ${formatPrice(item.property.price)}` : "");

    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/(utilities)/chats",
            params: { id: item.id },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={`Chat with ${peer?.name || "contact"}${
          hasUnread ? `, ${item.unreadCount} unread` : ""
        }`}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: hasUnread
              ? colors.primary + "14"
              : colors.disabled + "14",
            borderColor: hasUnread ? colors.primary + "66" : colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarFallback,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={styles.avatarLetter}>
              {(peer?.name || "D").slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.cardBody}>
          {/* Name + time */}
          <View style={styles.topRow}>
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
            >
              {peer?.name || (item.kind === "agent_peer" ? "Agent" : role === "agent" ? "Client" : "Agent")}
            </Text>
            <Text
              style={[
                styles.time,
                {
                  color: hasUnread ? colors.primary : colors.placeholder,
                  fontWeight: hasUnread ? "700" : "500",
                },
              ]}
            >
              {formatTime(item.lastMessageAt)}
            </Text>
          </View>

          {/* Property line + unread badge */}
          <View style={styles.midRow}>
            <Text
              style={[styles.property, { color: colors.placeholder }]}
              numberOfLines={1}
            >
              {propertyLine}
            </Text>
            {hasUnread && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>
                  {item.unreadCount > 9 ? "9+" : item.unreadCount}
                </Text>
              </View>
            )}
          </View>

          {/* Last message */}
          <Text
            style={[
              styles.preview,
              {
                color: hasMessage ? colors.text : colors.placeholder,
                fontWeight: hasUnread ? "700" : "500",
              },
            ]}
            numberOfLines={1}
          >
            {mine && hasMessage ? `You: ${preview}` : preview}
          </Text>
        </View>
      </Pressable>
    );
  };

  /* Header is an element, so the search input keeps focus while typing. */
  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.titleCol}>
          <Text style={[styles.kicker, { color: colors.primary }]}>INBOX</Text>
          <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        </View>
        <NotificationBell color={colors.text} size={20} />
      </View>

      <Text style={[styles.sub, { color: colors.placeholder }]}>
        {role === "agent"
          ? "Chat clients, other agents, and shared listings."
          : "Chat agents about homes you want to rent or buy."}
      </Text>

      <View
        style={[
          styles.search,
          {
            borderColor: colors.border,
            backgroundColor: colors.disabled + "14",
          },
        ]}
      >
        <Ionicons name="search-outline" size={20} color={colors.placeholder} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={
            role === "agent"
              ? "Search clients or listings"
              : "Search agents or listings"
          }
          placeholderTextColor={colors.placeholder}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable
            onPress={() => setQuery("")}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.placeholder}
            />
          </Pressable>
        )}
      </View>

      {unreadTotal > 0 && (
        <View style={styles.unreadRow}>
          <Ionicons name="mail" size={18} color={colors.primary} />
          <Text style={[styles.unreadText, { color: colors.primary }]}>
            {unreadTotal} unread
          </Text>
        </View>
      )}
    </View>
  );

  /* Loading / error / empty live inside the list so the search stays usable. */
  const emptyState = loading ? (
    <View style={styles.empty}>
      <ActivityIndicator color={colors.primary} />
    </View>
  ) : error ? (
    <View style={styles.empty}>
      <Ionicons
        name="cloud-offline-outline"
        size={32}
        color={colors.placeholder}
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{error}</Text>
      <Pressable
        onPress={load}
        style={[styles.retry, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  ) : (
    <View style={styles.empty}>
      <Ionicons
        name="chatbubbles-outline"
        size={32}
        color={colors.placeholder}
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {query ? "No matches" : "No conversations yet"}
      </Text>
      <Text style={[styles.emptyCopy, { color: colors.placeholder }]}>
        {query
          ? "Try a different name or listing."
          : role === "agent"
            ? "When a client taps one of your properties, the chat will appear here."
            : "Open a listing and tap Message agent to start a live chat."}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <FlatList
        data={loading || error ? [] : filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyState}
        ItemSeparatorComponent={Separator}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
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
      />
    </SafeAreaView>
  );
}

function Separator() {
  return <View style={{ height: 12 }} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  list: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 120,
  },

  header: { paddingHorizontal: 4, paddingBottom: 20 },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  titleCol: { flex: 1 },
  kicker: { fontSize: 13, fontWeight: "800", letterSpacing: 1 },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 2,
  },
  sub: { fontSize: 15, lineHeight: 22, marginTop: 8 },

  // Search
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    marginTop: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 26,
  },
  searchInput: { flex: 1, minWidth: 0, fontSize: 15, paddingVertical: 0 },

  unreadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
  },
  unreadText: { fontSize: 16, fontWeight: "700" },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderWidth: 1,
    borderRadius: 24,
    backgroundColor: "#121214"
  },
  avatar: { width: 56, height: 56, borderRadius: 18 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarLetter: { color: "#fff", fontWeight: "900", fontSize: 22 },
  cardBody: { flex: 1, minWidth: 0 },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: { flex: 1, fontSize: 17, fontWeight: "800" },
  time: { fontSize: 13 },

  midRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
  },
  property: { flex: 1, fontSize: 14 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  preview: { fontSize: 16, marginTop: 4 },

  // States
  empty: {
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 16,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  emptyCopy: { fontSize: 14, lineHeight: 21, textAlign: "center" },
  retry: {
    marginTop: 6,
    paddingHorizontal: 24,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
  },
  retryText: { color: "#fff", fontWeight: "800" },
});
