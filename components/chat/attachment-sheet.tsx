import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, FileText, ImageIcon } from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import { canPickDocuments } from "@/services/chatAttachments";

interface Props {
  visible: boolean;
  onClose: () => void;
  onPickImages: () => void;
  onTakePhoto: () => void;
  onPickDocument: () => void;
}

/**
 * Attachment chooser. A plain bottom Modal rather than the gesture bottom-sheet,
 * because this only needs three taps and no drag interaction.
 */
export const AttachmentSheet = ({
  visible,
  onClose,
  onPickImages,
  onTakePhoto,
  onPickDocument,
}: Props) => {
  const { colors, isDark } = useTheme();

  const documentsAvailable = canPickDocuments();

  const options = [
    {
      key: "photos",
      label: "Photo library",
      hint: "Send up to 5 photos",
      Icon: ImageIcon,
      tint: "#2563EB",
      onPress: onPickImages,
      enabled: true,
    },
    {
      key: "camera",
      label: "Camera",
      hint: "Take a photo now",
      Icon: Camera,
      tint: "#059669",
      onPress: onTakePhoto,
      enabled: true,
    },
    {
      key: "document",
      label: "Document",
      hint: documentsAvailable
        ? "PDF, Word, Excel, text"
        : "Needs an app update",
      Icon: FileText,
      tint: "#DB2777",
      onPress: onPickDocument,
      enabled: documentsAvailable,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
        onPress={onClose}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {/* Absorbs the touch so tapping the sheet does not hit the backdrop. */}
          <Pressable onPress={() => {}}>
            <View
              style={{
                backgroundColor: colors.background,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingTop: 12,
              }}
            >
              <SafeAreaView edges={["bottom"]}>
                <View
                  style={{
                    alignSelf: "center",
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.placeholder,
                    opacity: 0.4,
                    marginBottom: 16,
                  }}
                />

                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: colors.text,
                    paddingHorizontal: 20,
                    marginBottom: 8,
                  }}
                >
                  Send attachment
                </Text>

                {options.map(({ key, label, hint, Icon, tint, onPress, enabled }) => (
                  <Pressable
                    key={key}
                    onPress={() => {
                      onClose();
                      onPress();
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      opacity: enabled ? 1 : 0.5,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: `${tint}22`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={20} color={tint} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "700",
                          color: colors.text,
                        }}
                      >
                        {label}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.placeholder,
                          marginTop: 1,
                        }}
                      >
                        {hint}
                      </Text>
                    </View>
                  </Pressable>
                ))}

                <Pressable
                  onPress={onClose}
                  style={{
                    marginTop: 8,
                    marginHorizontal: 20,
                    marginBottom: 8,
                    paddingVertical: 14,
                    borderRadius: 14,
                    backgroundColor: isDark ? "#111111" : "#F1F5F9",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: "700", color: colors.text }}
                  >
                    Cancel
                  </Text>
                </Pressable>
              </SafeAreaView>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};
