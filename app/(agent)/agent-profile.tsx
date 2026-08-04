import { useModal } from "@/components/dialogs/popup-modal";
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
  Appearance,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { Switch } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { logout, isOnline, goOnline, goOffline } = useAuth();
  const { colors, isDark } = useTheme();
  const { showModal } = useModal();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [isThemeSwitchOn, setIsThemeSwitchOn] = useState<boolean>(isDark);
  const scheme = useColorScheme();

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

  const handleThemeChange = () => {
    const nextTheme = isDark ? "light" : "dark";
    Appearance.setColorScheme(nextTheme);
    setIsThemeSwitchOn(!isDark);
  };

  const handleLogout = () => {
    const triggerLogout = () => {
      showModal({
        title: "Log Out?",
        text: "Are you sure you want to log out?",
        type: "logout",
        ctaText1: "Log Out",
        ctaText2: "Cancel",
        onCta1: async () => await logout(),
      });
    };
    triggerLogout();
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
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
      style={{ backgroundColor: colors.background, flex: 1 }}
    >
      {/* Header Utilities */}
      <View
        style={{
          backgroundColor: colors.background,
        }}
        className="flex-row justify-between items-center px-6 py-3"
      >
        <Text
          style={{ color: colors.text }}
          className="text-lg font-bold font-['Poppins']"
        >
          Profile
        </Text>
        <Pressable
          className="p-1"
          onPress={() => router.push("/(agent)/enquires")}
        >
          <Settings size={22} color={colors.text} className="p-1 rounded-xl" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchProfile}
            tintColor={colors.primary}
          />
        }
      >
        {/* User Badge Section */}
        <View
          style={{
            backgroundColor: colors.background,
          }}
          className="items-center pt-6 pb-6"
        >
          <View className="relative">
            <Image
              source={{
                uri:
                  profile?.avatar ||
                  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300",
              }}
              style={{ borderColor: colors.border }}
              className="w-24 h-24 rounded-full bg-slate-200 border"
            />
            <Pressable
              style={{ backgroundColor: colors.primary }}
              className="absolute bottom-0 right-0 p-2 rounded-full border-2 border-white shadow-sm"
            >
              <Camera size={14} color="#FFFFFF" />
            </Pressable>
            <View
              style={{ backgroundColor: colors.primary }}
              className="absolute top-0 right-0 rounded-full p-0.5 border border-white"
            >
              <CheckCircle2 size={16} color="#FFFFFF" fill={colors.primary} />
            </View>
          </View>

          <Text
            style={{ color: colors.text }}
            className="text-xl font-bold font-['Poppins'] mt-4"
          >
            {profile?.name || "Tunde Bakare"}
          </Text>

          <Pressable
            onPress={() => router.push("/(agent)/personalInfo")}
            style={{
              borderColor: colors.primary,
              backgroundColor: colors.background,
            }}
            className="border rounded-full px-6 py-3 mt-2"
          >
            <Text
              style={{ color: colors.primary }}
              className="text-md font-semibold font-['Inter']"
            >
              Edit Profile
            </Text>
          </Pressable>

          <View className="flex-row items-center mt-3 gap-3">
            <Text
              style={{ color: colors.text }}
              className="text-md font-['Inter'] tracking-wider"
            >
              Real Estate Agent
            </Text>
            <Text
              style={{
                color: colors.success,
                backgroundColor: `${colors.success}15`,
              }}
              className="text-md font-bold px-3 py-1 rounded-full font-['Inter'] uppercase"
            >
              Verified
            </Text>
          </View>

          <Text
            style={{ color: colors.placeholder }}
            className="text-md font-['Inter'] mt-3"
          >
            {profile?.email || "tundebakare@gmail.com"}
          </Text>
          <Text
            style={{ color: colors.placeholder }}
            className="text-md font-['Inter'] mt-1"
          >
            {profile?.phone || "+234 801 234 5678"}
          </Text>
        </View>

        {/* Account Type Card */}
        <View className="px-5 mt-6">
          <View
            style={{
              backgroundColor: `${colors.text}60`,
              borderColor: colors.border,
            }}
            className="border rounded-3xl p-5 shadow-sm"
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text
                  style={{ color: colors.placeholder }}
                  className="text-[10px] font-bold font-['Inter'] uppercase tracking-wider"
                >
                  Account Type
                </Text>
                <Text
                  style={{ color: colors.text }}
                  className="text-lg font-bold font-['Poppins'] mt-0.5"
                >
                  {accountType === "agent" ? "Agent Account" : "Client Account"}
                </Text>
              </View>
              <View
                style={{ backgroundColor: colors.background }}
                className="p-2.5 flex-row gap-3 justify-center items-center rounded-xl"
              >
                <Text
                  style={{ color: colors.text }}
                  className="text-lg font-semibold"
                >
                  {toggling ? "Updating..." : isOnline ? "Online" : "Offline"}:
                </Text>
                <Switch
                  trackColor={{ false: colors.border, true: colors.primary }}
                  value={isOnline}
                  onValueChange={handleToggle}
                  disabled={toggling}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {/* Agent Radio Switch */}
            <Pressable
              onPress={() => setAccountType("agent")}
              style={{
                borderColor:
                  accountType === "agent" ? colors.placeholder : colors.border,
                backgroundColor:
                  accountType === "agent" ? colors.text : colors.background,
              }}
              className="flex-row items-center justify-between p-4 rounded-2xl border mb-3"
            >
              <View className="flex-row items-center flex-1 pr-4">
                <User
                  size={20}
                  color={
                    accountType === "agent"
                      ? colors.background
                      : colors.placeholder
                  }
                />
                <View className="ml-3">
                  <Text
                    style={{
                      color:
                        accountType === "agent"
                          ? colors.background
                          : colors.text,
                    }}
                    className="text-lg font-bold font-['Inter']"
                  >
                    Agent Account
                  </Text>
                  <Text
                    style={{ color: colors.placeholder }}
                    className="text-md font-['Inter'] mt-0.5"
                  >
                    Manage listings & enquiries
                  </Text>
                </View>
              </View>
              <View
                style={{
                  borderColor:
                    accountType === "agent" ? colors.primary : colors.border,
                }}
                className="w-5 h-5 rounded-full border-2 items-center justify-center"
              >
                {accountType === "agent" && (
                  <View
                    style={{ backgroundColor: colors.primary }}
                    className="w-2.5 h-2.5 rounded-full"
                  />
                )}
              </View>
            </Pressable>

            {/* Client Radio Switch */}
            <Pressable
              onPress={() => setAccountType("client")}
              style={{
                borderColor:
                  accountType === "client" ? colors.border : colors.border,
                backgroundColor:
                  accountType === "client" ? colors.text : colors.background,
              }}
              className="flex-row items-center justify-between p-4 rounded-2xl border mb-4"
            >
              <View className="flex-row items-center flex-1 pr-4">
                <Briefcase
                  size={20}
                  color={
                    accountType === "client"
                      ? colors.background
                      : colors.placeholder
                  }
                />
                <View className="ml-3">
                  <Text
                    style={{
                      color:
                        accountType === "client"
                          ? colors.background
                          : colors.text,
                    }}
                    className="text-lg font-bold font-['Inter']"
                  >
                    Client Account
                  </Text>
                  <Text
                    style={{ color: colors.placeholder }}
                    className="text-md font-['Inter'] mt-0.5"
                  >
                    Search properties & favorites
                  </Text>
                </View>
              </View>
              <View
                style={{
                  borderColor:
                    accountType === "client" ? colors.primary : colors.border,
                }}
                className="w-5 h-5 rounded-full border-2 items-center justify-center"
              >
                {accountType === "client" && (
                  <View
                    style={{ backgroundColor: colors.primary }}
                    className="w-2.5 h-2.5 rounded-full"
                  />
                )}
              </View>
            </Pressable>

            <Pressable
              style={{ backgroundColor: colors.primary }}
              className="h-14 rounded-2xl items-center justify-center shadow-sm"
            >
              <Text className="text-white font-semibold font-['Inter'] text-base">
                Switch Account
              </Text>
            </Pressable>
          </View>
        </View>

        {/* System Theme Switcher Controls Menu */}
        <View className="px-5 pt-5 pb-2">
          <View>
            <View
              className="border rounded-3xl w-full p-6 mb-8 flex-row items-center justify-between"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.background,
              }}
            >
              <View>
                <Text
                  className="text-xs uppercase tracking-widest opacity-60 font-bold mb-1"
                  style={{
                    color: colors.text,
                  }}
                >
                  Theme
                </Text>

                <Text
                  className="font-semibold text-base"
                  style={{
                    color: colors.text,
                  }}
                >
                  {scheme === "dark"
                    ? "Dark Mode"
                    : scheme === "light"
                      ? "Light Mode"
                      : "System Default"}
                </Text>
              </View>
              <Switch
                value={isThemeSwitchOn}
                trackColor={{
                  false: colors.border,
                  true: colors.primary,
                }}
                thumbColor={isThemeSwitchOn ? colors.text : colors.primary}
                onValueChange={handleThemeChange}
              />
            </View>
          </View>
        </View>

        {/* Settings & Security Tree */}
        <View className="mt-2 px-5">
          <Text
            style={{ color: colors.placeholder }}
            className="text-md uppercase tracking-wider mb-3 ml-1 font-['Inter']"
          >
            Settings & Security
          </Text>
          <View
            style={{
              backgroundColor: colors.background,
            }}
            className="rounded-3xl gap-5 overflow-hidden"
          >
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
                  className={"flex-row items-center justify-between px-5 py-4 "}
                >
                  <View className="flex-row items-center">
                    <IconComponent size={20} color={colors.placeholder} />
                    <Text
                      style={{ color: colors.text }}
                      className="text-[16px] font-semibold font-['Inter'] ml-4"
                    >
                      {item.label}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.placeholder} />
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
