import { formatPrice, purposeLabel } from "@/constants/listings";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { chatApi, type Conversation } from "@/services/chat";
import { Ionicons } from "@expo/vector-icons";
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
  }, [items, query, role]);

  const unreadTotal = items.reduce(
    (sum, item) => sum + (item.unreadCount || 0),
    0,
  );

  const renderItem = ({ item }: { item: Conversation }) => {
    const peer = role === "agent" ? item.client : item.agent;
    const image = item.property?.image;
    const hasUnread = (item.unreadCount || 0) > 0;
    const mine = item.lastSenderId && item.lastSenderId === user?.uid;
    const hasMessage = Boolean(item.lastMessage);
    const preview = item.lastMessage || "Start the conversation";

    // "Shortlet Home - For Sale • ₦15,000"
    const propertyLine =
      (item.property?.title || "Property enquiry") +
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
            borderColor: hasUnread ? colors.primary + "66" : "#222226",
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
              {peer?.name || (role === "agent" ? "Client" : "Agent")}
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
      </View>

      <Text style={[styles.sub, { color: colors.placeholder }]}>
        {role === "agent"
          ? "Reply to clients asking about your listings."
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
    paddingTop: 8,
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
    borderColor: "#222226",
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
