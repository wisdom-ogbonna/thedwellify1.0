import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Phone, ShieldCheck } from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/context/AuthContext";
import { useThread } from "@/hooks/use-thread";
import { AttachmentSheet } from "@/components/chat/attachment-sheet";
import { ImageViewer } from "@/components/chat/image-viewer";
import { MessageInput } from "@/components/chat/message-input";
import { MessageList } from "@/components/chat/message-list";
import { formatPresence } from "@/components/chat/format";
import {
  pickDocuments,
  pickImages,
  takePhoto,
} from "@/services/chatAttachments";
import type { Message, ReplyPreview } from "@/services/chatTypes";

/**
 * 1:1 message thread.
 *
 * This screen already existed as a static mock (hardcoded bubbles, a fixed
 * "Online" label, a non-functional input). The layout is preserved; the data is
 * now real. The conversation id arrives as `?id=` — the shape the two list
 * screens were already pushing.
 */
export default function ChatThreadScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string; conversationId?: string }>();

  const conversationId = params.id || params.conversationId;

  const {
    conversation,
    messages,
    loading,
    error,
    loadingMore,
    hasMore,
    peerTyping,
    presence,
    uploadProgress,
    loadOlder,
    markRead,
    onInputChange,
    sendText,
    sendAttachments,
    retry,
    discard,
    removeMessage,
  } = useThread(conversationId);

  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [viewer, setViewer] = useState<{ uri: string; caption?: string | null } | null>(
    null
  );
  const [replyTo, setReplyTo] = useState<ReplyPreview | null>(null);

  // Colour constants mirroring the original screen.
  const elementBg = isDark ? "#000000" : "#FFFFFF";
  const screenBg = isDark ? "#000000" : "#F8FAFC";
  const textColor = isDark ? "#FFFFFF" : "#0F172A";
  const subTextColor = isDark ? "#94A3B8" : "#64748B";
  const borderColor = isDark ? "#222222" : "#F1F5F9";

  const peer = conversation?.otherUser;

  /* Clear the unread badge whenever the thread comes into focus. */
  useFocusEffect(
    useCallback(() => {
      void markRead();
    }, [markRead])
  );

  const handleAttach = useCallback(
    async (pick: () => Promise<any[]>) => {
      try {
        const files = await pick();
        if (files.length) await sendAttachments(files);
      } catch (err: any) {
        Alert.alert("Attachment failed", err?.message || "Could not attach that file.");
      }
    },
    [sendAttachments]
  );

  const handleLongPress = useCallback(
    (message: Message) => {
      const isMine = message.senderId === user?.uid;
      const isPending = message.status === "sending" || message.status === "failed";

      const options: any[] = [];

      if (message.status === "failed" && message.clientMessageId) {
        options.push(
          {
            text: "Retry",
            onPress: () => retry(message.clientMessageId as string),
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => discard(message.clientMessageId as string),
          }
        );
      } else if (!isPending) {
        options.push({
          text: "Reply",
          onPress: () =>
            setReplyTo({
              id: message.id,
              text: message.text || (message.mediaType === "image" ? "Photo" : "Document"),
              senderId: message.senderId,
              type: message.type,
            }),
        });

        if (isMine) {
          options.push({
            text: "Unsend for everyone",
            style: "destructive",
            onPress: () => removeMessage(message.id, true),
          });
        }

        options.push({
          text: "Delete for me",
          style: "destructive",
          onPress: () => removeMessage(message.id, false),
        });
      }

      options.push({ text: "Cancel", style: "cancel" });

      Alert.alert("Message", undefined, options, { cancelable: true });
    },
    [user?.uid, retry, discard, removeMessage]
  );

  const handleSend = useCallback(
    (text: string) => {
      void sendText(text, replyTo);
      setReplyTo(null);
    },
    [sendText, replyTo]
  );

  const callPeer = useCallback(() => {
    if (!peer?.phone) {
      Alert.alert("No phone number", "This user has not shared a phone number.");
      return;
    }
    void Linking.openURL(`tel:${peer.phone}`);
  }, [peer?.phone]);

  /* --------------------------------- guards --------------------------------- */

  if (!conversationId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: elementBg }} edges={["top", "bottom"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: textColor, fontSize: 15, textAlign: "center" }}>
            No conversation selected.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusLine = peerTyping
    ? "typing…"
    : formatPresence(presence.isOnline, presence.lastSeen);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: elementBg }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* 1. Header Profile Navigation Area */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: elementBg,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: 12 }}
            hitSlop={10}
          >
            <ChevronLeft size={24} color={textColor} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 16,
                  fontWeight: "900",
                  color: textColor,
                  marginRight: 4,
                  maxWidth: "80%",
                }}
              >
                {peer?.name || conversation?.productTitle || "Chat"}
              </Text>

              {peer?.verified ? (
                <ShieldCheck
                  size={14}
                  color="#2563EB"
                  fill={isDark ? "#000000" : "#FFFFFF"}
                />
              ) : null}
            </View>

            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                color: peerTyping
                  ? colors.primary
                  : presence.isOnline
                    ? "#22C55E"
                    : subTextColor,
                fontWeight: "700",
                marginTop: 1,
              }}
            >
              {statusLine || conversation?.productTitle || ""}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={callPeer}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? "#111111" : "#F1F5F9",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Phone size={18} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* 2. Chat stream + composer */}
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: screenBg }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {loading && !messages.length ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error && !messages.length ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
            }}
          >
            <Text style={{ color: textColor, fontSize: 15, textAlign: "center" }}>
              {error}
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <MessageList
              messages={messages}
              currentUserId={user?.uid ?? ""}
              loadingMore={loadingMore}
              hasMore={hasMore}
              peerTyping={peerTyping}
              uploadProgress={uploadProgress}
              onLoadOlder={loadOlder}
              onPressImage={(uri, caption) => setViewer({ uri, caption })}
              onLongPressMessage={handleLongPress}
              onRetry={retry}
            />
          </View>
        )}

        <MessageInput
          onSend={handleSend}
          onChangeText={onInputChange}
          onAttach={() => setAttachmentsOpen(true)}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          disabled={Boolean(error) && !messages.length}
        />
      </KeyboardAvoidingView>

      <AttachmentSheet
        visible={attachmentsOpen}
        onClose={() => setAttachmentsOpen(false)}
        onPickImages={() => handleAttach(() => pickImages(5))}
        onTakePhoto={() => handleAttach(takePhoto)}
        onPickDocument={() => handleAttach(pickDocuments)}
      />

      <ImageViewer
        visible={Boolean(viewer)}
        uri={viewer?.uri ?? null}
        caption={viewer?.caption}
        onClose={() => setViewer(null)}
      />
    </SafeAreaView>
  );
}
