import { useTheme } from "@react-navigation/native";
import React from "react";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";

export default function OfflineModal({
  visible,
  onRetry,
  isLoading = false,
}: {
  visible: boolean;
  onRetry: () => void;
  isLoading?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/60 p-8">
        <View
          className="w-full p-8 rounded-3xl"
          style={{ backgroundColor: colors.background }}
        >
          <Text
            className="text-2xl font-black mb-2"
            style={{ color: colors.text }}
          >
            Offline
          </Text>
          <Text className="opacity-60 mb-8" style={{ color: colors.text }}>
            Please check your internet connection to continue using Dwellify.
          </Text>

          <Pressable
            onPress={onRetry}
            className="py-4 rounded-full items-center mb-4"
            style={{ backgroundColor: colors.primary }}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size={20} color="#FFFFFF" />
            ) : (
              <Text className="font-bold text-white uppercase tracking-widest">
                Retry
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => BackHandler.exitApp()}
            className="py-2 items-center"
          >
            <Text
              className="font-bold opacity-40 uppercase tracking-widest"
              style={{ color: colors.text }}
            >
              Exit App
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
