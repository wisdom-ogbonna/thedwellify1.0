import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import {
  CaretRight,
  Clock,
  CreditCard,
  SealCheck,
  ShieldCheck,
  Wallet,
} from "phosphor-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const PaymentStartInspection = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const [method, setMethod] = useState<"card" | "wallet">("card");

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.background }}
      className="px-5 pt-16"
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER SECTION */}
        <View className="mb-8">
          <View className="flex-row items-center mb-2">
            <View className="bg-emerald-500/10 px-3 py-1 rounded-full flex-row items-center">
              <SealCheck size={14} color="#10b981" weight="fill" />
              <Text className="text-emerald-600 font-bold text-[10px] ml-1 uppercase tracking-tighter">
                Verified Agent
              </Text>
            </View>
          </View>
          <Text
            style={{ color: colors.text }}
            className="text-4xl font-black tracking-tight"
          >
            Checkout
          </Text>
          <Text
            style={{ color: colors.text }}
            className="text-base opacity-50 mt-1"
          >
            Complete payment to dispatch your agent.
          </Text>
        </View>

        {/* PRICE GLASS CARD */}
        <View
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="p-8 rounded-[40px] border-[0.5px] items-center mb-8 shadow-2xl shadow-black/5"
        >
          <Text
            style={{ color: colors.text }}
            className="text-sm opacity-50 font-bold uppercase tracking-widest mb-1"
          >
            Inspection Fee
          </Text>
          <Text
            style={{ color: colors.text }}
            className="text-5xl font-black"
          >
            ₦7,000
          </Text>
          <View className="flex-row items-center mt-4 bg-black/5 px-4 py-2 rounded-2xl">
            <Clock size={16} color={colors.text} weight="bold" />
            <Text
              style={{ color: colors.text }}
              className="ml-2 font-bold text-xs opacity-70"
            >
              Covers 3 property inspections
            </Text>
          </View>
        </View>

        <Text
          style={{ color: colors.text }}
          className="text-lg font-bold mb-4 ml-1"
        >
          Payment Method
        </Text>

        <View className="gap-5 mb-8">
          <PaymentOption
            active={method === "card"}
            onPress={() => setMethod("card")}
            icon={
              <CreditCard
                size={24}
                color={method === "card" ? "white" : colors.text}
                weight="duotone"
              />
            }
            title="Debit Card"
            subtitle="Pay with Visa or Mastercard"
            colors={colors}
          />
          <PaymentOption
            active={method === "wallet"}
            onPress={() => setMethod("wallet")}
            icon={
              <Wallet
                size={24}
                color={method === "wallet" ? "white" : colors.text}
                weight="duotone"
              />
            }
            title="Dwellify Wallet"
            subtitle="Balance: ₦12,400.00"
            colors={colors}
          />
        </View>

        <View
          style={{ backgroundColor: colors.card }}
          className="p-5 rounded-3xl flex-row items-start border-[0.5px] border-emerald-500/20"
        >
          <ShieldCheck size={28} color="#10b981" weight="duotone" />
          <View className="ml-4 flex-1">
            <Text style={{ color: colors.text }} className="font-bold text-sm">
              Funds Protection
            </Text>
            <Text
              style={{ color: colors.text }}
              className="text-xs opacity-50 leading-4 mt-1"
            >
              Funds are held securely and only released once you confirm the
              inspection is complete.
            </Text>
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>

      {/* FIXED FOOTER BUTTON */}
      <View className="pb-8 pt-4">
        <Pressable
          style={{ backgroundColor: colors.primary }}
          onPress={() => router.push("/(utilities)/agent-tracking")}
          className="py-5 rounded-3xl flex-row justify-center items-center gap-5 shadow-xl active:scale-95 transition-all"
        >
          <Text className="text-white text-lg font-black mr-2">
            Confirm Payment
          </Text>
          <CaretRight size={20} color="white" weight="bold" />
        </Pressable>
      </View>
    </View>
  );
};

// Sub-component for Payment Options
const PaymentOption = ({
  active,
  title,
  subtitle,
  icon,
  onPress,
  colors,
}: any) => (
  <Pressable
    onPress={onPress}
    style={{
      backgroundColor: active ? colors.primary : colors.card,
      borderColor: active ? colors.primary : colors.border,
    }}
    className="p-5 rounded-3xl flex-row items-center border-[0.5px] shadow-sm"
  >
    <View
      className={`p-3 rounded-2xl ${active ? "bg-white/20" : "bg-black/5"}`}
    >
      {icon}
    </View>
    <View className="ml-4 flex-1">
      <Text
        className={`font-bold text-base ${active ? "text-white" : ""}`}
        style={!active ? { color: colors.text } : {}}
      >
        {title}
      </Text>
      <Text
        className={`text-xs ${active ? "text-white/70" : "opacity-50"}`}
        style={!active ? { color: colors.text } : {}}
      >
        {subtitle}
      </Text>
    </View>
    {active && <SealCheck size={24} color="white" weight="fill" />}
  </Pressable>
);

export default PaymentStartInspection;
