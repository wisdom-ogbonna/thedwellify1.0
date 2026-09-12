import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

interface Props {
  visible: boolean;
  uri: string | null;
  caption?: string | null;
  onClose: () => void;
}

/**
 * Full-screen image view. Deliberately minimal: tap anywhere or the close button
 * to dismiss. Pinch-zoom would need a gesture-handler wrapper and is not part of
 * this pass.
 */
export const ImageViewer = ({ visible, uri, caption, onClose }: Props) => (
  <Modal
    visible={visible && Boolean(uri)}
    transparent
    animationType="fade"
    onRequestClose={onClose}
    statusBarTranslucent
  >
    <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.96)" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.12)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <Pressable
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          onPress={onClose}
        >
          {uri ? (
            <Image
              source={{ uri }}
              style={{ width: "100%", height: "80%" }}
              contentFit="contain"
              transition={150}
            />
          ) : null}
        </Pressable>

        {caption ? (
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 14,
              textAlign: "center",
              paddingHorizontal: 24,
              paddingBottom: 16,
            }}
          >
            {caption}
          </Text>
        ) : null}
      </SafeAreaView>
    </View>
  </Modal>
);
