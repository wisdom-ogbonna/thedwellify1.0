import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { API } from "@/services/api";
import { router } from "expo-router";
import {
  Bell,
  Briefcase,
  Camera,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Landmark,
  LogOut,
  Settings,
  User,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Switch } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { logout, isOnline, goOnline, goOffline } = useAuth();
  const { colors } = useTheme();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [accountType, setAccountType] = useState<"agent" | "client">("agent");

  const fetchProfile = async () => {
    try {
      const res = await API.get("/agent/profile");
      setProfile(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleToggle = async (value: boolean) => {
    setToggling(true);
    try {
      value ? await goOnline() : await goOffline();
    } catch (e) {
      Alert.alert("Error", "Status update failed");
    } finally {
      setToggling(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Sign out",
      "This action will log you out of your account. You will need to sign in again to access your account.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => await logout(),
        },
      ],
      {
        cancelable: true,
      },
    );
  };

  const settingsOptions = [
    {
      id: "personal",
      label: "Personal Information",
      icon: User,
      path: "/profile/personal",
    },
    {
      id: "business",
      label: "Business Information",
      icon: Briefcase,
      path: "/profile/business",
    },
    {
      id: "bank",
      label: "Bank Details",
      icon: Landmark,
      path: "/profile/bank",
    },
    {
      id: "notifications",
      label: "Notification Settings",
      icon: Bell,
      path: "/profile/notifications",
    },
    {
      id: "help",
      label: "Help & Support",
      icon: HelpCircle,
      path: "/profile/help",
    },
    {
      id: "logout",
      label: "Logout",
      icon: LogOut,
      path: "/profile/logout",
    },
  ];

  if (loading)
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator color={colors.text} size="large" />
      </View>
    );

  return (
    <SafeAreaView
      className="flex-1 bg-[#F8FAFC]"
      edges={["top"]}
      style={{ backgroundColor: "#F8FAFC", flex: 1 }}
    >
      {/* Header Utilities */}
      <View className="flex-row justify-between items-center px-6 py-3 bg-white border-b border-slate-100">
        <Text className="text-lg font-bold text-slate-900 font-['Poppins']">
          Profile
        </Text>
        <Pressable
          className="p-1"
          onPress={() => router.push("/(agent)/enquires")}
        >
          <Settings
            size={22}
            color="blue"
            className="bg-blue-500/10 p-1 rounded-xl"
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchProfile}
            tintColor="#0A65FF"
          />
        }
      >
        {/* User Badge Section */}
        <View className="items-center bg-white pt-6 pb-6 border-b border-slate-100">
          <View className="relative">
            <Image
              source={{
                uri:
                  profile?.avatar ||
                  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300",
              }}
              className="w-24 h-24 rounded-full bg-slate-200 border-2 border-slate-100"
            />
            <Pressable className="absolute bottom-0 right-0 bg-[#0A65FF] p-2 rounded-full border-2 border-white shadow-sm">
              <Camera
                size={14}
                color="#FFFFFF"
                className="bg-blue-500/10 p-1 rounded-xl"
              />
            </Pressable>
            <View className="absolute top-0 right-0 bg-blue-500 rounded-full p-0.5 border border-white">
              <CheckCircle2 size={16} color="#FFFFFF" fill="#0A65FF" />
            </View>
          </View>

          <Text className="text-xl font-bold text-slate-900 font-['Poppins'] mt-4">
            {profile?.name || "Tunde Bakare"}
          </Text>

          <Pressable
            onPress={() => router.push("/(agent)/personalInfo")}
            className="border border-blue-500 rounded-full px-6 py-3 mt-2 bg-white active:bg-slate-50"
          >
            <Text className="text-md font-semibold text-blue-700 font-['Inter']">
              Edit Profile
            </Text>
          </Pressable>

          <View className="flex-row items-center mt-3 gap-3">
            <Text className="text-md text-black font-['Inter'] tracking-wider">
              {"Real Estate Agent"}
            </Text>
            <Text className="text-md font-bold bg-amber-700/10 px-3 py-1 rounded-full text-amber-700 font-['Inter'] uppercase">
              VERIFIED
            </Text>
          </View>

          <Text className="text-md text-slate-400 font-['Inter'] mt-3">
            {profile?.email || "tundebakare@gmail.com"}
          </Text>
          <Text className="text-md text-slate-400 font-['Inter'] mt-1">
            {profile?.phone || "+234 801 234 5678"}
          </Text>
        </View>

        {/* Account Type Card */}
        <View className="px-5 mt-6">
          <View className="bg-blue-300/10 border border-blue-500/10 rounded-3xl p-5 shadow-sm shadow-slate-100/50">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-[10px] font-bold text-slate-400 font-['Inter'] uppercase tracking-wider">
                  Account Type
                </Text>
                <Text className="text-lg font-bold text-slate-900 font-['Poppins'] mt-0.5">
                  {accountType === "agent" ? "Agent Account" : "Client Account"}
                </Text>
              </View>
              <View className="bg-blue-500/10 p-2.5 flex-row gap-3 justify-center items-center rounded-xl">
                <Text className="text-lg font-semibold">
                  {toggling ? "Updating..." : isOnline ? "Online" : "Offline"}:
                </Text>
                <Switch
                  trackColor={{ false: "#e2e8f0", true: "#0A65FF" }}
                  value={isOnline}
                  onValueChange={handleToggle}
                  disabled={toggling}
                  thumbColor={"#ffffff"}
                />
              </View>
            </View>

            {/* Agent Radio Switch */}
            <Pressable
              onPress={() => setAccountType("agent")}
              className={`flex-row items-center justify-between p-4 rounded-2xl border ${accountType === "agent" ? "border-[#0A65FF] bg-blue-50/10" : "border-slate-100 bg-slate-50/50"} mb-3`}
            >
              <View className="flex-row items-center flex-1 pr-4">
                <User
                  size={20}
                  color={accountType === "agent" ? "#0A65FF" : "#64748B"}
                />
                <View className="ml-3">
                  <Text className="text-lg font-bold text-slate-800 font-['Inter']">
                    Agent Account
                  </Text>
                  <Text className="text-md text-slate-400 font-['Inter'] mt-0.5">
                    Manage listings & enquiries
                  </Text>
                </View>
              </View>
              <View
                className={`w-5 h-5 rounded-full border-2 items-center justify-center ${accountType === "agent" ? "border-[#0A65FF]" : "border-slate-300"}`}
              >
                {accountType === "agent" && (
                  <View className="w-2.5 h-2.5 rounded-full bg-[#0A65FF]" />
                )}
              </View>
            </Pressable>

            {/* Client Radio Switch */}
            <Pressable
              onPress={() => setAccountType("client")}
              className={`flex-row items-center justify-between p-4 rounded-2xl border ${accountType === "client" ? "border-[#0A65FF] bg-blue-50/10" : "border-slate-100 bg-slate-50/50"} mb-4`}
            >
              <View className="flex-row items-center flex-1 pr-4">
                <Briefcase
                  size={20}
                  color={accountType === "client" ? "#0A65FF" : "#64748B"}
                />
                <View className="ml-3">
                  <Text className="text-lg font-bold text-slate-800 font-['Inter']">
                    Client Account
                  </Text>
                  <Text className="text-md text-slate-400 font-['Inter'] mt-0.5">
                    Search properties & favorites
                  </Text>
                </View>
              </View>
              <View
                className={`w-5 h-5 rounded-full border-2 items-center justify-center ${accountType === "client" ? "border-[#0A65FF]" : "border-slate-300"}`}
              >
                {accountType === "client" && (
                  <View className="w-2.5 h-2.5 rounded-full bg-[#0A65FF]" />
                )}
              </View>
            </Pressable>

            <Pressable className="bg-[#0A65FF] h-14 rounded-2xl items-center justify-center active:bg-blue-700 shadow-sm shadow-blue-500/10">
              <Text className="text-white font-semibold font-['Inter'] text-base">
                Switch Account
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Settings & Security Tree */}
        <View className="mt-8 px-5">
          <Text className="text-md text-slate-400 font-['Inter'] uppercase tracking-wider mb-3 ml-1">
            Settings & Security
          </Text>
          <View className="bg-white rounded-3xl gap-5 border border-slate-100 overflow-hidden shadow-sm shadow-slate-100/50">
            {settingsOptions.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (item.id === "business") {
                      router.push("/(agent)/businessForm");
                    } else if (item.id === "personal") {
                      router.push("/(agent)/personalInfo");
                    } else if (item.id === "bank") {
                      router.push("/(agent)/bank");
                    } else if (item.id === "notifications") {
                      router.push("/(agent)/notification");
                    } else if (item.id === "help") {
                      router.push("/(agent)/help");
                    } else if (item.id === "logout") {
                      handleLogout();
                    }
                  }}
                  className={`flex-row items-center justify-between px-5 py-4 active:bg-slate-50 ${
                    index !== settingsOptions.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <View className="flex-row items-center">
                    <IconComponent size={20} color="#64748B" />
                    <Text className="text-[16px] font-semibold text-slate-700 font-['Inter'] ml-4">
                      {item.label}
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
