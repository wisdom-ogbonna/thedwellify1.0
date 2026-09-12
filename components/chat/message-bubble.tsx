import React, { memo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { FileText, RotateCw } from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import { formatFileSize } from "@/services/chatAttachments";
import type { Message } from "@/services/chatTypes";
import { formatTime } from "./format";
import { ReceiptTicks } from "./receipt-ticks";

interface Props {
  message: Message;
  isMine: boolean;
  /** True when the previous message is from the same sender in the same minute. */
  grouped?: boolean;
  uploadProgress?: number;
  onPressImage?: (uri: string, caption?: string | null) => void;
  onLongPress?: (message: Message) => void;
  onRetry?: (clientMessageId: string) => void;
}

const MAX_IMAGE_WIDTH = 250;

const MessageBubbleComponent = ({
  message,
  isMine,
  grouped = false,
  uploadProgress,
  onPressImage,
  onLongPress,
  onRetry,
}: Props) => {
  const { colors, isDark } = useTheme();

  /* System messages (including "message deleted") sit centred, unbubbled. */
  if (message.type === "system" || message.deletedForEveryone) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 8 }}>
        <Text
          style={{
            fontSize: 12,
            fontStyle: "italic",
            color: colors.placeholder,
            textAlign: "center",
            paddingHorizontal: 24,
          }}
        >
          {message.deletedForEveryone
            ? "This message was deleted"
            : message.text}
        </Text>
      </View>
    );
  }

  const bubbleBg = isMine ? colors.primary : isDark ? "#111111" : "#FFFFFF";
  const textColor = isMine ? "#FFFFFF" : colors.text;
  const metaColor = isMine ? "rgba(255,255,255,0.75)" : colors.placeholder;

  // Prefer the local file while an upload is in flight so the image appears at once.
  const imageUri = message.localUri || message.mediaUrl;
  const isImage = message.mediaType === "image";
  const isFile = message.mediaType === "file";

  const aspectRatio =
    message.width && message.height ? message.width / message.height : 4 / 3;

  const failed = message.status === "failed";

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: isMine ? "flex-end" : "flex-start",
        marginTop: grouped ? 2 : 8,
        paddingHorizontal: 16,
      }}
    >
      <Pressable
        onLongPress={() => onLongPress?.(message)}
        delayLongPress={300}
        style={{
          maxWidth: "82%",
          backgroundColor: bubbleBg,
          borderRadius: 18,
          // Tail on the outer edge, suppressed for grouped follow-ups.
          borderBottomRightRadius: isMine && !grouped ? 4 : 18,
          borderBottomLeftRadius: !isMine && !grouped ? 4 : 18,
          padding: isImage ? 4 : 12,
          borderWidth: isMine ? 0 : 1,
          borderColor: isDark ? "#222222" : "#F1F5F9",
          opacity: failed ? 0.7 : 1,
        }}
      >
        {/* Quoted reply */}
        {message.replyTo ? (
          <View
            style={{
              borderLeftWidth: 3,
              borderLeftColor: isMine ? "rgba(255,255,255,0.6)" : colors.primary,
              paddingLeft: 8,
              paddingVertical: 4,
              marginBottom: 6,
              marginHorizontal: isImage ? 8 : 0,
              marginTop: isImage ? 6 : 0,
              backgroundColor: isMine
                ? "rgba(255,255,255,0.12)"
                : isDark
                  ? "#1A1A1A"
                  : "#F8FAFC",
              borderRadius: 6,
            }}
          >
            <Text
              numberOfLines={2}
              style={{ fontSize: 12, color: metaColor }}
            >
              {message.replyTo.text || "Attachment"}
            </Text>
          </View>
        ) : null}

        {/* Image */}
        {isImage ? (
          <Pressable
            onPress={() =>
              imageUri && onPressImage?.(imageUri, message.text || null)
            }
            style={{
              width: MAX_IMAGE_WIDTH,
              aspectRatio,
              borderRadius: 14,
              overflow: "hidden",
              backgroundColor: isDark ? "#1A1A1A" : "#E2E8F0",
            }}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator color={colors.primary} />
              </View>
            )}

            {/* Upload progress veil */}
            {uploadProgress !== undefined && uploadProgress < 1 ? (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.35)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}
                >
                  {Math.round(uploadProgress * 100)}%
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}

        {/* Document */}
        {isFile ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              maxWidth: 240,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isMine
                  ? "rgba(255,255,255,0.18)"
                  : isDark
                    ? "#1E1E1E"
                    : "#EFF6FF",
              }}
            >
              <FileText size={20} color={isMine ? "#FFFFFF" : colors.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={2}
                style={{ fontSize: 13, fontWeight: "600", color: textColor }}
              >
                {message.fileName || "Document"}
              </Text>
              {message.fileSize ? (
                <Text style={{ fontSize: 11, color: metaColor, marginTop: 2 }}>
                  {formatFileSize(message.fileSize)}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Property card */}
        {message.type === "property" && message.propertyCard ? (
          <View
            style={{
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: isMine
                ? "rgba(255,255,255,0.14)"
                : isDark
                  ? "#1A1A1A"
                  : "#F8FAFC",
              marginBottom: message.text ? 8 : 0,
            }}
          >
            {(message.propertyCard as any).image ? (
              <Image
                source={{ uri: String((message.propertyCard as any).image) }}
                style={{ width: 220, height: 120 }}
                contentFit="cover"
              />
            ) : null}
            <View style={{ padding: 10 }}>
              <Text
                numberOfLines={2}
                style={{ fontSize: 13, fontWeight: "700", color: textColor }}
              >
                {String((message.propertyCard as any).title ?? "Property")}
              </Text>
              {(message.propertyCard as any).price ? (
                <Text
                  style={{ fontSize: 12, color: metaColor, marginTop: 2 }}
                >
                  {String((message.propertyCard as any).price)}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Text / caption */}
        {message.text && !isFile ? (
          <Text
            style={{
              fontSize: 15,
              lineHeight: 21,
              color: textColor,
              marginTop: isImage ? 8 : 0,
              marginHorizontal: isImage ? 8 : 0,
            }}
          >
            {message.text}
          </Text>
        ) : null}

        {/* Meta row: time + receipt */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 5,
            marginTop: 4,
            marginHorizontal: isImage ? 8 : 0,
            marginBottom: isImage ? 4 : 0,
          }}
        >
          {failed ? (
            <Pressable
              onPress={() =>
                message.clientMessageId && onRetry?.(message.clientMessageId)
              }
              hitSlop={8}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <RotateCw size={12} color="#EF4444" />
              <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "600" }}>
                Tap to retry
              </Text>
            </Pressable>
          ) : (
            <Text style={{ fontSize: 10, color: metaColor }}>
              {formatTime(message.createdAt)}
            </Text>
          )}

          {isMine ? (
            <ReceiptTicks
              status={message.status}
              color={metaColor}
              readColor={isMine ? "#7DD3FC" : colors.primary}
            />
          ) : null}
        </View>
      </Pressable>
    </View>
  );
};

export const MessageBubble = memo(MessageBubbleComponent);
