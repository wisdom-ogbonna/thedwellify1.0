import React from "react";
import { View, Text, Image, Pressable, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import {
  Phone,
  ChatTeardropText,
  NavigationArrow,
  WarningCircle,
  ShieldCheck,
  CaretLeft,
  MapPin,
  ClockAfternoon,
} from "phosphor-react-native";

const AgentTracking = () => {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* FULL SCREEN MAP PLACEHOLDER */}
      <View className="absolute inset-0 bg-gray-300 items-center justify-center">
        {/* In a real app, replace this View with <MapView /> */}
        <Text className="text-gray-400 font-black text-2xl uppercase tracking-tighter opacity-30">
          Willnwork on this tomorrow GN
        </Text>
      </View>

      {/* TOP HEADER OVERLAY */}
      <View className="absolute top-12 left-0 right-0 px-6 flex-row justify-between items-center">
        <Pressable
          onPress={() => router.back()}
          className="bg-white/90 p-4 rounded-3xl shadow-xl border-[0.5px] border-black/5"
        >
          <CaretLeft size={20} color="#000" weight="bold" />
        </Pressable>

        <View className="bg-white/90 px-6 py-3 rounded-full shadow-xl border-[0.5px] border-black/5 flex-row items-center">
          <View className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2" />
          <Text className="text-black font-black text-xs uppercase tracking-widest">
            Live Tracking
          </Text>
        </View>
      </View>

      {/* FLOATING STATUS CARD (Top Center-ish) */}
      <View className="absolute top-32 left-6 right-6 bg-black/80 p-5 rounded-[32px] flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="bg-white/10 p-3 rounded-2xl mr-4">
            <ClockAfternoon size={24} color="#FFF" weight="duotone" />
          </View>
          <View>
            <Text className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
              Arriving in
            </Text>
            <Text className="text-white text-xl font-black">8 - 12 mins</Text>
          </View>
        </View>
        <View className="h-10 w-[1px] bg-white/20" />
        <View className="items-end">
          <Text className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
            Next Stop
          </Text>
          <Text className="text-white text-sm font-bold">Lekki Phase 1</Text>
        </View>
      </View>

      {/* BOTTOM CONTROL CENTER */}
      <View className="absolute bottom-10 left-6 right-6">
        {/* SAFETY QUICK ACTIONS */}
        <View className="flex-row justify-center gap-x-4 mb-4">
          <Pressable className="bg-white/90 px-5 py-3 rounded-2xl flex-row items-center shadow-lg">
            <ShieldCheck size={18} color="#10b981" weight="fill" />
            <Text className="text-black font-bold text-xs ml-2">
              Secure Meeting
            </Text>
          </Pressable>
          <Pressable className="bg-red-500 px-5 py-3 rounded-2xl flex-row items-center shadow-lg">
            <WarningCircle size={18} color="#FFF" weight="fill" />
            <Text className="text-white font-bold text-xs ml-2">SOS</Text>
          </Pressable>
        </View>

        {/* MAIN AGENT CARD */}
        <View
          style={{ backgroundColor: colors.card }}
          className="p-6 rounded-[40px] shadow-2xl border-[0.5px] border-black/5"
        >
          <View className="flex-row items-center mb-6">
            <View className="relative">
              <Image
                source={{
                  uri: "https://randomuser.me/api/portraits/men/32.jpg",
                }}
                className="w-16 h-16 rounded-[24px] border-2 border-emerald-500"
              />
              <View className="absolute -bottom-1 -right-1 bg-emerald-500 p-1 rounded-full border-2 border-white">
                <ShieldCheck size={12} color="white" weight="fill" />
              </View>
            </View>

            <View className="flex-1 ml-4">
              <Text
                style={{ color: colors.text }}
                className="text-xl font-black"
              >
                John Momoh
              </Text>
              <Text
                style={{ color: colors.text }}
                className="opacity-50 text-xs font-bold uppercase tracking-tighter"
              >
                Toyota Corolla • KJA-442AA
              </Text>
            </View>

            <View className="flex-row gap-x-2">
              <Pressable
                style={{ backgroundColor: colors.primary }}
                className="p-4 rounded-2xl shadow-md"
              >
                <Phone size={20} color="white" weight="fill" />
              </Pressable>
            </View>
          </View>

          {/* ACTION BUTTONS */}
          <View className="flex-row gap-x-3">
            <Pressable
              style={{
                backgroundColor: colors.background,
                borderColor: colors.border,
              }}
              className="flex-1 py-4 rounded-2xl border-[0.5px] items-center flex-row justify-center"
            >
              <ChatTeardropText size={20} color={colors.text} weight="bold" />
              <Text style={{ color: colors.text }} className="font-bold ml-2">
                Message
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(client)/dashboard")}
              className="flex-1 py-4 bg-red-50 rounded-2xl items-center justify-center border border-red-100"
            >
              <Text className="text-red-500 font-bold">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

export default AgentTracking;
