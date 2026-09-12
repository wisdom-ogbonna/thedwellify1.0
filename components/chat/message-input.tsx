import React, { useCallback, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Plus, Send, X } from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import type { ReplyPreview } from "@/services/chatTypes";

interface Props {
  onSend: (text: string) => void;
  onChangeText?: (text: string) => void;
  onAttach?: () => void;
  replyTo?: ReplyPreview | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Composer. Keeps the Plus (attach) / Send affordances from the original static
 * design, and grows to a few lines before scrolling internally.
 */
export const MessageInput = ({
  onSend,
  onChangeText,
  onAttach,
  replyTo,
  onCancelReply,
  disabled = false,
  placeholder = "Type a message...",
}: Props) => {
  const { colors, isDark } = useTheme();
  const [value, setValue] = useState("");

  const canSend = value.trim().length > 0 && !disabled;

  const handleChange = useCallback(
    (next: string) => {
      setValue(next);
      onChangeText?.(next);
    },
    [onChangeText]
  );

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    // Clear first so the field feels instant; the outbox owns delivery.
    setValue("");
    onChangeText?.("");
    onSend(trimmed);
  }, [value, disabled, onSend, onChangeText]);

  const surface = isDark ? "#111111" : "#F1F5F9";

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: isDark ? "#222222" : "#F1F5F9",
        backgroundColor: colors.background,
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 8,
      }}
    >
      {replyTo ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: surface,
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 8,
            marginBottom: 8,
            borderLeftWidth: 3,
            borderLeftColor: colors.primary,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}
            >
              Replying to
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontSize: 12, color: colors.placeholder, marginTop: 1 }}
            >
              {replyTo.text || "Attachment"}
            </Text>
          </View>

          <Pressable onPress={onCancelReply} hitSlop={10}>
            <X size={16} color={colors.placeholder} />
          </Pressable>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
        <Pressable
          onPress={onAttach}
          disabled={disabled}
          hitSlop={8}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: surface,
            alignItems: "center",
            justifyContent: "center",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <Plus size={20} color={colors.text} />
        </Pressable>

        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          multiline
          editable={!disabled}
          style={{
            flex: 1,
            minHeight: 40,
            maxHeight: 120,
            backgroundColor: surface,
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingTop: 10,
            paddingBottom: 10,
            fontSize: 15,
            color: colors.text,
          }}
        />

        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          hitSlop={8}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: canSend ? colors.primary : surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Send size={18} color={canSend ? "#FFFFFF" : colors.placeholder} />
        </Pressable>
      </View>
    </View>
  );
};
