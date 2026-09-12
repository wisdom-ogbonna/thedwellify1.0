import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Search, SquarePen } from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/context/AuthContext";
import { useConversations } from "@/hooks/use-conversations";
import type { Conversation } from "@/services/chatTypes";
import { ChatListRow } from "./chat-list-row";

/**
 * Conversation list, shared by the client and agent Messages tabs.
 *
 * Both tabs previously held a near-identical copy of this screen with hardcoded
 * mock arrays; this is the single real implementation. The header and search bar
 * keep the original design. The story rail was removed because nothing backs it.
 */
export const ConversationListScreen = ({
  title = "Chats",
}: {
  title?: string;
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const {
    conversations,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
    remove,
    setMuted,
  } = useConversations();

  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return conversations;

    return conversations.filter((c) => {
      const name = c.otherUser?.name?.toLowerCase() ?? "";
      const product = c.productTitle?.toLowerCase() ?? "";
      const last = c.lastMessage?.toLowerCase() ?? "";
      return name.includes(term) || product.includes(term) || last.includes(term);
    });
  }, [conversations, searchQuery]);

  const openThread = useCallback((conversation: Conversation) => {
    // Matches the route the original screens already pushed to.
    router.push(`/(utilities)/chats/?id=${conversation.id}`);
  }, []);

  const showActions = useCallback(
    (conversation: Conversation) => {
      Alert.alert(
        conversation.otherUser?.name || "Conversation",
        undefined,
        [
          {
            text: conversation.isMuted ? "Unmute" : "Mute notifications",
            onPress: () => setMuted(conversation.id, !conversation.isMuted),
          },
          {
            text: "Delete chat",
            style: "destructive",
            onPress: () =>
              Alert.alert(
                "Delete chat?",
                "This removes the conversation from your list. The other person keeps their copy.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => remove(conversation.id),
                  },
                ]
              ),
          },
          { text: "Cancel", style: "cancel" },
        ],
        { cancelable: true }
      );
    },
    [remove, setMuted]
  );

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ChatListRow
        conversation={item}
        currentUserId={user?.uid ?? ""}
        onPress={() => openThread(item)}
        onLongPress={() => showActions(item)}
      />
    ),
    [user?.uid, openThread, showActions]
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={{ paddingTop: 64, alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }

    return (
      <View style={{ paddingTop: 72, paddingHorizontal: 40, alignItems: "center" }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
            textAlign: "center",
          }}
        >
          {searchQuery ? "No matching chats" : "No conversations yet"}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: colors.placeholder,
            textAlign: "center",
            marginTop: 6,
            lineHeight: 19,
          }}
        >
          {searchQuery
            ? "Try a different name or property."
            : "Open a property and tap Message to start a conversation with an agent."}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.background, flex: 1 }}
      edges={["top"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* 1. Header Area Section */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "800",
            color: colors.text,
            fontFamily: "Poppins",
          }}
        >
          {title}
        </Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Start a chat",
              "Open a property listing and tap Message to reach its agent."
            )
          }
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <SquarePen size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 2. Search Input Bar */}
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: `${colors.placeholder}70`,
            borderRadius: 24,
            paddingHorizontal: 12,
            height: 50,
          }}
        >
          <Search size={18} color={`${colors.text}90`} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={`${colors.text}90`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              marginLeft: 8,
              // Was colors.background, which rendered typed text invisible.
              color: colors.text,
              fontSize: 16,
            }}
          />
        </View>
      </View>

      {error && !conversations.length ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 12, color: colors.error }}>{error}</Text>
        </View>
      ) : null}

      {/* 3. Conversations */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24,
          flexGrow: filtered.length ? undefined : 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};
