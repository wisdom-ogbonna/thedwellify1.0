import React, { createContext, useContext, useState, ReactNode } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Warning, Trash, SignOut, Check, X } from "phosphor-react-native";
import { useTheme } from "@/hooks/use-theme"; // Adjust path to your useTheme hook

type ModalType = "error" | "delete" | "logout" | "success";

interface ModalOptions {
  title: string;
  text: string;
  type: ModalType;
  ctaText1?: string;
  ctaText2?: string;
  onCta1?: () => void;
  onCta2?: () => void;
}

interface ModalContextType {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function CustomModalProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ModalOptions>({
    title: "",
    text: "",
    type: "success",
  });

  const showModal = (options: ModalOptions) => {
    setConfig(options);
    setVisible(true);
  };

  const hideModal = () => {
    setVisible(false);
  };

  // Helper to render the correct icon and styling based on modal type
  const renderHeaderIcon = () => {
    switch (config.type) {
      case "error":
        return (
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: `${colors.error}15` }}
          >
            <Warning size={32} color={colors.error} weight="regular" />
          </View>
        );
      case "delete":
        return (
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: `${colors.error}15` }}
          >
            <Trash size={32} color={colors.error} weight="regular" />
          </View>
        );
      case "logout":
        return (
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: `${colors.primary}15` }}
          >
            <SignOut size={32} color={colors.primary} weight="regular" />
          </View>
        );
      case "success":
        return (
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.success }}
          >
            <Check size={32} color="#FFFFFF" weight="bold" />
          </View>
        );
    }
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}

      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={hideModal}
      >
        {/* Backdrop overlay with high zIndex */}
        <View
          style={{ zIndex: 9999 }}
          className="flex-1 bg-black/60 items-center justify-center px-6"
        >
          {/* Modal Container */}
          <View
            className="w-full max-w-85 rounded-4xl p-6 relative shadow-2xl items-center"
            style={{
              backgroundColor: colors.background,
              borderColor: `${colors.border}40`,
            }}
          >
            {/* Top-Right Close Button */}
            <TouchableOpacity
              onPress={hideModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: `${colors.border}20` }}
            >
              <X size={16} color={colors.text} weight="bold" />
            </TouchableOpacity>

            {/* Icon Banner */}
            {renderHeaderIcon()}

            {/* Title */}
            <Text
              className="text-[20px] font-bold text-center mb-2"
              style={{ color: colors.text }}
            >
              {config.title}
            </Text>

            {/* Body Description Text */}
            <Text
              className="text-[14px] text-center leading-5 mb-6 px-2"
              style={{ color: colors.placeholder }}
            >
              {config.text}
            </Text>

            {/* Action Buttons Section */}
            <View className="w-full flex-row gap-3">
              {/* Secondary CTA / Cancel Button (if ctaText2 exists) */}
              {config.ctaText2 && (
                <TouchableOpacity
                  onPress={() => {
                    config.onCta2?.();
                    hideModal();
                  }}
                  className="flex-1 py-3.5 rounded-2xl items-center justify-center border"
                  style={{
                    backgroundColor:
                      config.type === "delete"
                        ? `${colors.error}10`
                        : `${colors.primary}10`,
                    borderColor: "transparent",
                  }}
                >
                  <Text
                    className="text-[15px] font-semibold"
                    style={{
                      color:
                        config.type === "delete"
                          ? colors.error
                          : colors.primary,
                    }}
                  >
                    {config.ctaText2}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Primary CTA Button */}
              <TouchableOpacity
                onPress={() => {
                  config.onCta1?.();
                  hideModal();
                }}
                className="flex-1 py-3.5 rounded-2xl items-center justify-center shadow-sm"
                style={{
                  backgroundColor:
                    config.type === "delete" ? colors.error : colors.primary,
                }}
              >
                <Text className="text-[15px] font-semibold text-white">
                  {config.ctaText1 || "Okay"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a CustomModalProvider");
  }
  return context;
}
