import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import type { Message } from "@/services/chatTypes";
import { formatDateSeparator, startsNewDay } from "./format";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";

interface Props {
  messages: Message[];
  currentUserId: string;
  loadingMore?: boolean;
  hasMore?: boolean;
  peerTyping?: boolean;
  uploadProgress?: Record<string, number>;
  onLoadOlder?: () => void;
  onPressImage?: (uri: string, caption?: string | null) => void;
  onLongPressMessage?: (message: Message) => void;
  onRetry?: (clientMessageId: string) => void;
  emptyLabel?: string;
}

type Row =
  | { kind: "message"; message: Message; grouped: boolean }
  | { kind: "separator"; id: string; label: string }
  | { kind: "typing"; id: string };

const GROUP_WINDOW_MS = 60_000;

/**
 * Inverted FlatList, so new messages appear at the bottom and older history pages
 * in when the user scrolls up (onEndReached fires at the visual top when inverted).
 *
 * Rows are built newest-first to match the inversion; date separators are emitted
 * below their day group so they read correctly once flipped.
 */
export const MessageList = ({
  messages,
  currentUserId,
  loadingMore = false,
  hasMore = false,
  peerTyping = false,
  uploadProgress = {},
  onLoadOlder,
  onPressImage,
  onLongPressMessage,
  onRetry,
  emptyLabel = "No messages yet. Say hello 👋",
}: Props) => {
  const { colors } = useTheme();

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];

    // messages arrive oldest-first; walk backwards to build the inverted order.
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      const previous = messages[i - 1];

      const sameSender = previous?.senderId === message.senderId;
      const closeInTime =
        previous?.createdAt && message.createdAt
          ? message.createdAt - previous.createdAt < GROUP_WINDOW_MS
          : false;

      out.push({
        kind: "message",
        message,
        grouped: Boolean(sameSender && closeInTime),
      });

      // A separator belongs *after* this row in inverted order when this message
      // opens a new day relative to the one before it.
      if (startsNewDay(message.createdAt, previous?.createdAt)) {
        out.push({
          kind: "separator",
          id: `sep-${message.id}`,
          label: formatDateSeparator(message.createdAt),
        });
      }
    }

    if (peerTyping) out.unshift({ kind: "typing", id: "typing" });

    return out;
  }, [messages, peerTyping]);

  const renderItem = useCallback(
    ({ item }: { item: Row }) => {
      if (item.kind === "separator") {
        return (
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colors.placeholder,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {item.label}
            </Text>
          </View>
        );
      }

      if (item.kind === "typing") {
        return (
          <View style={{ paddingHorizontal: 16, paddingTop: 6 }}>
            <TypingIndicator />
          </View>
        );
      }

      const { message } = item;

      return (
        <MessageBubble
          message={message}
          isMine={message.senderId === currentUserId}
          grouped={item.grouped}
          uploadProgress={uploadProgress[message.id]}
          onPressImage={onPressImage}
          onLongPress={onLongPressMessage}
          onRetry={onRetry}
        />
      );
    },
    [
      colors.placeholder,
      currentUserId,
      uploadProgress,
      onPressImage,
      onLongPressMessage,
      onRetry,
    ]
  );

  const keyExtractor = useCallback(
    (item: Row) => (item.kind === "message" ? item.message.id : item.id),
    []
  );

  return (
    <FlatList
      data={rows}
      inverted
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingVertical: 12,
        flexGrow: rows.length ? undefined : 1,
      }}
      onEndReached={hasMore ? onLoadOlder : undefined}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        loadingMore ? (
          <View style={{ paddingVertical: 16 }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            // Counteract the inversion so the copy is not upside down.
            transform: [{ scaleY: -1 }],
          }}
        >
          <Text style={{ fontSize: 14, color: colors.placeholder }}>
            {emptyLabel}
          </Text>
        </View>
      }
      removeClippedSubviews={false}
      initialNumToRender={20}
      maxToRenderPerBatch={20}
      windowSize={11}
    />
  );
};
