import React from "react";
import { Modal, ScrollView, View } from "react-native";

const BottomInfoModal = ({
  visible,
  onClose,
  colors,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  colors: any;
}) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <View
          className="rounded-t-3xl px-5 pt-5 pb-8"
          style={{ backgroundColor: colors.card, maxHeight: "88%" }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            bounces={false}
            overScrollMode="never"
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default BottomInfoModal;
