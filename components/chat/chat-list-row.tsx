import React, { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { BellOff, Check, CheckCheck } from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import type { Conversation } from "@/services/chatTypes";
import { ChatAvatar } from "./chat-avatar";
import { formatListTimestamp } from "./format";

interface Props {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
  onLongPress?: () => void;
}

/**
 * One row in the conversation list. Preserves the original layout — 52px avatar
 * with an online dot, name + timestamp on the first line, preview + unread pill
 * on the second.
 */
const ChatListRowComponent = ({
  conversation,
  currentUserId,
  onPress,
  onLongPress,
}: Props) => {
  const { colors } = useTheme();

  const {
    otherUser,
    lastMessage,
    lastMessageType,
    lastMessageAt,
    lastMessageSenderId,
    unreadCount,
    productTitle,
    isMuted,
  } = conversation;

  const isMine = lastMessageSenderId === currentUserId;
  const unread = unreadCount > 0;

  const preview =
    lastMessage ||
    (lastMessageType === "image"
      ? "📷 Photo"
      : lastMessageType === "file"
        ? "📄 Document"
        : "Tap to start chatting");

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
      }}
    >
      <View style={{ marginRight: 14 }}>
        <ChatAvatar
          name={otherUser?.name}
          userId={otherUser?.id}
          uri={otherUser?.avatar}
          size={52}
          isOnline={Boolean(otherUser?.isOnline)}
          showPresence
        />
      </View>

      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: 15,
              fontWeight: unread ? "800" : "700",
              color: colors.text,
              marginRight: 8,
            }}
          >
            {otherUser?.name || "Dwellify user"}
          </Text>

          <Text
            style={{
              fontSize: 11,
              fontWeight: unread ? "700" : "500",
              color: unread ? colors.primary : colors.placeholder,
            }}
          >
            {formatListTimestamp(lastMessageAt)}
          </Text>
        </View>

        {/* The thread is always about a specific listing, so name it. */}
        {productTitle ? (
          <Text
            numberOfLines={1}
            style={{
              fontSize: 11,
              color: colors.primary,
              marginTop: 1,
              fontWeight: "600",
            }}
          >
            {productTitle}
          </Text>
        ) : null}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 3,
            gap: 4,
          }}
        >
          {isMine && lastMessage ? (
            unread ? (
              <Check size={13} color={colors.placeholder} />
            ) : (
              <CheckCheck size={13} color={colors.placeholder} />
            )
          ) : null}

          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: 13,
              color: unread ? colors.text : colors.placeholder,
              fontWeight: unread ? "600" : "400",
            }}
          >
            {preview}
          </Text>

          {isMuted ? <BellOff size={13} color={colors.placeholder} /> : null}

          {unread ? (
            <View
              style={{
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                paddingHorizontal: 6,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

export const ChatListRow = memo(ChatListRowComponent);
