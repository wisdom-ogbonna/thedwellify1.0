import React from "react";
import { View, Text, TextInput } from "react-native";
import { useTheme } from "@react-navigation/native";

export const InputField = ({ label, ...props }: any) => {
  const { colors } = useTheme();
  return (
    <View
      className="border-b-2 pb-2 mb-8"
      style={{ borderColor: colors.border }}
    >
      <Text
        className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2"
        style={{ color: colors.text }}
      >
        {label}
      </Text>
      <TextInput
        {...props}
        style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}
        placeholderTextColor={colors.border}
      />
    </View>
  );
};