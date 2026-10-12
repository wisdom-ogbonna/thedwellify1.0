import { formatPrice, purposeLabel } from "@/constants/listings";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { chatApi, type Conversation } from "@/services/chat";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  productId: string;
  productTitle?: string;
  onClose: () => void;
  onShared?: (conversationId: string) => void;
};

const otherPerson = (item: Conversation, uid?: string) =>
  item.agentId === uid ? item.client : item.agent;

export default function ShareListingSheet({
  visible,
  productId,
  productTitle,
  onClose,
  onShared,
}: Props) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [contacts, setContacts] = useState<Conversation[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sharingId, setSharingId] = useState("");
  const [error, setError] = useState("");

  const surface = isDark ? "#121212" : "#FFFFFF";

  const load = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      setContacts(await chatApi.list());
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not load contacts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setSharingId("");
      return;
    }
    load();
  }, [visible, load]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((item) => {
      const peer = otherPerson(item, user?.uid);
      const hay = [
        peer?.name,
        item.property?.title,
        item.property?.location,
        item.kind === "agent_peer" ? "agent" : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return !q || hay.includes(q);
    });
  }, [contacts, query, user?.uid]);

  const shareTo = async (item: Conversation) => {
    if (sharingId) return;
    try {
      setSharingId(item.id);
      await chatApi.shareListing(item.id, productId);
      const peer = otherPerson(item, user?.uid);
      onClose();
      Alert.alert(
        "Listing shared",
        `Sent to ${peer?.name || "your contact"}.`,
        [
          {
            text: "Open chat",
            onPress: () => onShared?.(item.id),
          },
          { text: "Done" },
        ],
      );
    } catch (err: any) {
      Alert.alert(
        "Could not share",
        err?.response?.data?.error || "Try another contact.",
      );
    } finally {
      setSharingId("");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: surface,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: colors.text }]}>
                Share listing
              </Text>
              <Text
                style={[styles.sub, { color: colors.placeholder }]}
                numberOfLines={1}
              >
                {productTitle || "Send this property to a chat contact."}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View
            style={[
              styles.search,
              { borderColor: colors.border, backgroundColor: colors.disabled + "18" },
            ]}
          >
            <Ionicons name="search-outline" size={18} color={colors.placeholder} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search contacts"
              placeholderTextColor={colors.placeholder}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>

          {loading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{error}</Text>
              <Pressable
                onPress={load}
                style={[styles.retry, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={rows}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              contentContainerStyle={rows.length ? undefined : styles.emptyList}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={28}
                    color={colors.placeholder}
                  />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    No chat contacts yet
                  </Text>
                  <Text style={[styles.emptyCopy, { color: colors.placeholder }]}>
                    Message a client or another agent first, then share listings here.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const peer = otherPerson(item, user?.uid);
                const busy = sharingId === item.id;
                const image = item.property?.image || peer?.avatar;
                const line =
                  item.kind === "agent_peer"
                    ? peer?.agencyName || "Agent"
                    : item.property?.title ||
                      (item.kind === "property_request"
                        ? "Property request"
                        : "Chat");
                return (
                  <Pressable
                    onPress={() => shareTo(item)}
                    disabled={Boolean(sharingId)}
                    style={({ pressed }) => [
                      styles.row,
                      {
                        backgroundColor: pressed ? colors.disabled + "22" : "transparent",
                        opacity: sharingId && !busy ? 0.5 : 1,
                      },
                    ]}
                  >
                    {image ? (
                      <Image source={{ uri: image }} style={styles.avatar} />
                    ) : (
                      <View
                        style={[styles.avatar, { backgroundColor: colors.primary }]}
                      >
                        <Text style={styles.letter}>
                          {(peer?.name || "C").slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.rowCopy}>
                      <Text
                        style={[styles.name, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {peer?.name || "Contact"}
                      </Text>
                      <Text
                        style={[styles.meta, { color: colors.placeholder }]}
                        numberOfLines={1}
                      >
                        {line}
                        {item.property?.price
                          ? ` · ${formatPrice(item.property.price)}`
                          : ""}
                        {item.property?.purpose
                          ? ` · ${purposeLabel(item.property.purpose)}`
                          : ""}
                      </Text>
                    </View>
                    {busy ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <Ionicons
                        name="send-outline"
                        size={18}
                        color={colors.primary}
                      />
                    )}
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  dismiss: { flex: 1 },
  sheet: {
    maxHeight: "82%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#666",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  headerCopy: { flex: 1, paddingRight: 12 },
  title: { fontSize: 22, fontWeight: "800" },
  sub: { fontSize: 14, marginTop: 4 },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    height: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  list: { minHeight: 220 },
  emptyList: { flexGrow: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  letter: { color: "#fff", fontWeight: "800", fontSize: 16 },
  rowCopy: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 13, marginTop: 2 },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", textAlign: "center", marginTop: 10 },
  emptyCopy: { fontSize: 14, textAlign: "center", marginTop: 6, lineHeight: 20 },
  retry: {
    marginTop: 14,
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: { color: "#fff", fontWeight: "800" },
});
