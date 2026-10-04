import MessageTicks from "@/components/chat/message-ticks";
import { formatPrice, purposeLabel } from "@/constants/listings";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import {
  chatApi,
  type ChatMessage,
  type Conversation,
} from "@/services/chat";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { PaperPlaneRight } from "phosphor-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ThreadRow =
  | { type: "date"; id: string; label: string }
  | { type: "message"; id: string; message: ChatMessage; grouped: boolean };

const formatTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const startOfDay = (value: string) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const dateLabel = (value: string) => {
  const day = startOfDay(value);
  const today = startOfDay(new Date().toISOString());
  const yesterday = today - 86400000;
  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return new Date(value).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const mergeThread = (local: ChatMessage[], remote: ChatMessage[]) => {
  const remoteNonces = new Set(remote.map((item) => item.nonce).filter(Boolean));
  const remoteIds = new Set(remote.map((item) => item.id));
  const extras = local.filter((item) => {
    const pending = item.status === "pending" || item.status === "failed";
    if (!pending) return false;
    if (remoteIds.has(item.id)) return false;
    if (item.nonce && remoteNonces.has(item.nonce)) return false;
    return true;
  });
  return [...remote, ...extras].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
};

const buildRows = (messages: ChatMessage[]): ThreadRow[] => {
  const chronological: ThreadRow[] = [];
  messages.forEach((message, index) => {
    const previous = messages[index - 1];
    const day = startOfDay(message.createdAt);
    const prevDay = previous ? startOfDay(previous.createdAt) : null;
    if (day !== prevDay) {
      chronological.push({
        type: "date",
        id: `date-${day}`,
        label: dateLabel(message.createdAt),
      });
    }
    const grouped = Boolean(
      previous &&
        previous.senderId === message.senderId &&
        day === startOfDay(previous.createdAt) &&
        new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() < 60000,
    );
    chronological.push({
      type: "message",
      id: message.id,
      message,
      grouped,
    });
  });
  return chronological.reverse();
};

export default function ChatThreadScreen() {
  const { colors, isDark } = useTheme();
  const { user, role } = useAuth();
  const params = useLocalSearchParams<{ id?: string; productId?: string }>();
  const [conversationId, setConversationId] = useState(params.id || "");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const inputRef = useRef<TextInput>(null);
  const sendingRef = useRef<Set<string>>(new Set());

  const theme = useMemo(
    () => ({
      page: isDark ? "#0B141A" : "#EFEAE2",
      incoming: isDark ? "#202C33" : "#FFFFFF",
      outgoing: isDark ? "#005C4B" : "#D9FDD3",
      incomingText: isDark ? "#E9EDEF" : "#111B21",
      outgoingText: isDark ? "#E9EDEF" : "#111B21",
      meta: isDark ? "#8696A0" : "#667781",
      composer: isDark ? "#1F2C34" : "#F0F2F5",
      input: isDark ? "#2A3942" : "#FFFFFF",
      header: isDark ? "#1F2C34" : "#FFFFFF",
      chip: isDark ? "#182229" : "rgba(255,255,255,0.88)",
    }),
    [isDark],
  );

  const openConversation = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      let id = String(params.id || "");
      if (!id && params.productId) {
        const started = await chatApi.start(String(params.productId));
        id = started.id;
        setConversation(started);
      }
      if (!id) {
        setError("Missing conversation.");
        return;
      }
      setConversationId(id);
      const [convo, rows] = await Promise.all([chatApi.get(id), chatApi.messages(id)]);
      setConversation(convo);
      setMessages(rows);
      chatApi.markRead(id).catch(() => undefined);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not open this chat.");
    } finally {
      setLoading(false);
    }
  }, [params.id, params.productId]);

  useEffect(() => {
    openConversation();
  }, [openConversation]);

  useEffect(() => {
    if (!conversationId) return;
    let active = true;
    const pull = async () => {
      try {
        const rows = await chatApi.messages(conversationId);
        if (!active) return;
        setMessages((prev) => mergeThread(prev, rows));
        const incoming = rows[rows.length - 1];
        if (incoming && incoming.senderId !== user?.uid) {
          chatApi.markRead(conversationId).catch(() => undefined);
        }
      } catch {
        // keep local bubbles if a poll fails
      }
    };
    const timer = setInterval(pull, 2000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [conversationId, user?.uid]);

  const peer = role === "agent" ? conversation?.client : conversation?.agent;
  const property = conversation?.property;
  const rows = useMemo(() => buildRows(messages), [messages]);
  const canSend = Boolean(text.trim() && conversationId);

  const sendNow = useCallback(
    async (value: string, existingId?: string) => {
      if (!conversationId || !user?.uid) return;
      const next = value.trim();
      if (!next) return;

      const nonce = existingId || `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      if (sendingRef.current.has(nonce)) return;
      sendingRef.current.add(nonce);

      const optimistic: ChatMessage = {
        id: nonce,
        conversationId,
        senderId: user.uid,
        senderRole: role || "client",
        text: next,
        nonce,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => {
        const without = prev.filter((item) => item.id !== nonce);
        return [...without, optimistic];
      });

      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // haptics are optional
      }

      try {
        const message = await chatApi.send(conversationId, next, nonce);
        setMessages((prev) => {
          const rest = prev.filter((item) => item.id !== nonce && item.id !== message.id);
          return [...rest, { ...message, nonce, status: message.status || "sent" }];
        });
      } catch {
        setMessages((prev) =>
          prev.map((item) => (item.id === nonce ? { ...item, status: "failed" } : item)),
        );
      } finally {
        sendingRef.current.delete(nonce);
      }
    },
    [conversationId, role, user?.uid],
  );

  const send = () => {
    const next = text.trim();
    if (!next || !conversationId) return;
    setText("");
    sendNow(next);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.page }]}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !conversation) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.page }]}>
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{error}</Text>
          <Pressable onPress={openConversation} style={[styles.retry, { backgroundColor: colors.primary }]}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.header }]} edges={["top"]}>
      <View style={[styles.header, { backgroundColor: theme.header, borderBottomColor: isDark ? "#222" : "#E9EDEF" }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Text style={[styles.backText, { color: colors.text }]}>‹</Text>
        </Pressable>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarLetter}>{(peer?.name || "D").slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.peerName, { color: colors.text }]} numberOfLines={1}>
            {peer?.name || (role === "agent" ? "Client" : "Agent")}
          </Text>
          <Text style={[styles.online, { color: "#22C55E" }]}>online</Text>
        </View>
      </View>

      {property ? (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(utilities)/property-view",
              params: { propertyId: property.id || conversation?.productId },
            })
          }
          style={[styles.propertyCard, { backgroundColor: theme.chip }]}
        >
          {property.image ? (
            <Image source={{ uri: property.image }} style={styles.propertyImage} />
          ) : (
            <View style={[styles.propertyImage, { backgroundColor: colors.disabled + "33" }]} />
          )}
          <View style={styles.propertyCopy}>
            <Text style={[styles.propertyTitle, { color: colors.text }]} numberOfLines={1}>
              {property.title}
            </Text>
            <Text style={[styles.propertyMeta, { color: theme.meta }]} numberOfLines={1}>
              {purposeLabel(property.purpose)}
              {property.location ? ` · ${property.location}` : ""}
            </Text>
            <Text style={[styles.propertyPrice, { color: colors.primary }]}>
              {property.price ? formatPrice(property.price) : "Price on request"}
            </Text>
          </View>
        </Pressable>
      ) : null}

      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: theme.page }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          data={rows}
          inverted
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          contentContainerStyle={styles.thread}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyThread, { color: theme.meta }]}>
                Message this agent about the listing. Your chat stays on this property.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.type === "date") {
              return (
                <View style={styles.dateWrap}>
                  <View style={[styles.dateChip, { backgroundColor: theme.chip }]}>
                    <Text style={[styles.dateText, { color: theme.meta }]}>{item.label}</Text>
                  </View>
                </View>
              );
            }

            const mine = item.message.senderId === user?.uid;
            const failed = item.message.status === "failed";
            return (
              <Pressable
                onPress={() => {
                  if (failed) sendNow(item.message.text, item.message.nonce || item.message.id);
                }}
                style={[
                  styles.bubbleWrap,
                  mine ? styles.mineWrap : styles.theirsWrap,
                  item.grouped ? styles.grouped : styles.spaced,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    mine
                      ? {
                          backgroundColor: theme.outgoing,
                          borderBottomRightRadius: item.grouped ? 18 : 6,
                        }
                      : {
                          backgroundColor: theme.incoming,
                          borderBottomLeftRadius: item.grouped ? 18 : 6,
                        },
                  ]}
                >
                  <Text style={[styles.bubbleText, { color: mine ? theme.outgoingText : theme.incomingText }]}>
                    {item.message.text}
                  </Text>
                  <View style={styles.metaRow}>
                    {failed ? (
                      <Text style={styles.failedHint}>Tap to retry</Text>
                    ) : null}
                    <Text style={[styles.bubbleTime, { color: theme.meta }]}>
                      {formatTime(item.message.createdAt)}
                    </Text>
                    {mine ? (
                      <MessageTicks
                        status={item.message.status}
                        muted={theme.meta}
                        read="#53BDEB"
                      />
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />

        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: theme.composer }}>
          <View style={[styles.composer, { backgroundColor: theme.composer }]}>
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              placeholder="Message"
              placeholderTextColor={theme.meta}
              style={[styles.input, { color: colors.text, backgroundColor: theme.input }]}
              multiline
              blurOnSubmit={false}
              onSubmitEditing={() => {
                if (Platform.OS === "ios") send();
              }}
            />
            <Pressable
              onPress={send}
              disabled={!canSend}
              style={[
                styles.send,
                { backgroundColor: canSend ? "#00A884" : theme.meta, opacity: canSend ? 1 : 0.55 },
              ]}
            >
              <PaperPlaneRight size={18} color="#FFFFFF" weight="fill" />
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 40, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 34, lineHeight: 36, fontWeight: "300" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarLetter: { color: "#fff", fontWeight: "800", fontSize: 16 },
  headerCopy: { flex: 1 },
  peerName: { fontSize: 17, fontWeight: "800" },
  online: { fontSize: 12, fontWeight: "600", marginTop: 1, textTransform: "lowercase" },
  propertyCard: {
    flexDirection: "row",
    marginHorizontal: 10,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 14,
    overflow: "hidden",
  },
  propertyImage: { width: 64, height: 64 },
  propertyCopy: { flex: 1, paddingHorizontal: 10, paddingVertical: 8, justifyContent: "center" },
  propertyTitle: { fontSize: 13, fontWeight: "800" },
  propertyMeta: { fontSize: 11, marginTop: 2 },
  propertyPrice: { fontSize: 12, fontWeight: "800", marginTop: 3 },
  thread: { paddingHorizontal: 10, paddingVertical: 8, flexGrow: 1 },
  emptyWrap: { transform: [{ scaleY: -1 }] },
  emptyThread: { textAlign: "center", marginTop: 24, lineHeight: 20, paddingHorizontal: 24 },
  dateWrap: { alignItems: "center", marginVertical: 8 },
  dateChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  dateText: { fontSize: 12, fontWeight: "700" },
  bubbleWrap: { maxWidth: "84%" },
  mineWrap: { alignSelf: "flex-end" },
  theirsWrap: { alignSelf: "flex-start" },
  grouped: { marginBottom: 2 },
  spaced: { marginBottom: 8 },
  bubble: {
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 5,
    borderRadius: 18,
  },
  bubbleText: { fontSize: 15.5, lineHeight: 21 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 3 },
  bubbleTime: { fontSize: 11, fontWeight: "600" },
  failedHint: { fontSize: 11, color: "#EF4444", fontWeight: "700", marginRight: 8 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 16,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  retry: { marginTop: 16, paddingHorizontal: 20, height: 44, borderRadius: 12, justifyContent: "center" },
  retryText: { color: "#fff", fontWeight: "800" },
});
