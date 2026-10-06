import { useModal } from "@/components/dialogs/popup-modal";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { agentApi } from "@/services/agent";
import { pickCameraImage, pickLibraryImages } from "@/services/media-picker";
import { router } from "expo-router";
import {
  Bell,
  Briefcase,
  Camera,
  Check,
  ChevronRight,
  Clock,
  HelpCircle,
  Landmark,
  LogOut,
  Mail,
  Moon,
  Phone,
  Settings,
  Shield,
  Sun,
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
  StyleSheet,
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [isThemeSwitchOn, setIsThemeSwitchOn] = useState<boolean>(isDark);
  const scheme = useColorScheme();

  const surface = isDark ? "#0F1A2B" : "#FFFFFF";
  const iconBg = isDark ? "#162235" : "#F1F5F9";
  const danger = "#F26B6B";

  const fetchProfile = async () => {
    try {
      const data = await agentApi.profile();
      setProfile(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const uploadPickedAvatar = async (
    picked:
      | { ok: true; assets: { uri: string; name: string; type: string }[] }
      | { ok: true; asset: { uri: string; name: string; type: string } }
      | { ok: false; reason: "permission" | "canceled" },
  ) => {
    if (!picked.ok) {
      if (picked.reason === "permission") {
        Alert.alert(
          "Permission required",
          "Allow camera or photo access to set a profile picture.",
        );
      }
      return;
    }
    const file = "assets" in picked ? picked.assets[0] : picked.asset;
    if (!file) return;
    setUploadingAvatar(true);
    setProfile((prev: any) => ({ ...prev, avatar: file.uri }));
    try {
      const res = await agentApi.uploadAvatar(file);
      setProfile((prev: any) => ({ ...prev, avatar: res.avatar || file.uri }));
    } catch (err: any) {
      Alert.alert(
        "Upload failed",
        err?.response?.data?.error || "Could not update your profile picture.",
      );
      fetchProfile();
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarUpload = () => {
    if (uploadingAvatar) return;
    Alert.alert("Profile photo", "This photo is shown on your agent profile.", [
      {
        text: "Take photo",
        onPress: async () => uploadPickedAvatar(await pickCameraImage()),
      },
      {
        text: "Choose from library",
        onPress: async () => uploadPickedAvatar(await pickLibraryImages(1)),
      },
      { text: "Cancel", style: "cancel" },
    ]);
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
      subtitle: "Name, national ID, contact details",
      icon: User,
      path: "/profile/personal",
    },
    {
      id: "business",
      label: "Business Information",
      subtitle: "Agency, broker license, tax info",
      icon: Briefcase,
      path: "/profile/business",
    },
    {
      id: "bank",
      label: "Bank Details & Payouts",
      subtitle: "Commission accounts and routing",
      icon: Landmark,
      path: "/profile/bank",
    },
    {
      id: "notifications",
      label: "Notification Settings",
      subtitle: "Push, inquiries, leads & alerts",
      icon: Bell,
      path: "/profile/notifications",
    },
    {
      id: "privacy",
      label: "Privacy & Security",
      subtitle: "Two-factor auth, passcodes, sessions",
      icon: Shield,
      path: "/profile/privacy",
    },
    {
      id: "help",
      label: "Help & Support",
      subtitle: "Agent concierge 24/7, FAQs",
      icon: HelpCircle,
      path: "/profile/help",
    },
    {
      id: "logout",
      label: "Logout",
      subtitle: "Sign out from this device",
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
          className="text-3xl font-bold font-['Poppins']"
        >
          Profile
        </Text>
        <Pressable
          onPress={() => router.push("/(agent)/enquires")}
          style={[
            styles.headerBtn,
            { backgroundColor: surface, borderColor: "#1D2C42" },
          ]}
        >
          <Settings size={22} color={colors.text} />
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
          className="items-center pt-4 pb-6"
        >
          <View style={styles.avatarWrap}>
            <Image
              source={{
                uri:
                  profile?.avatar ||
                  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300",
              }}
              style={[styles.avatar, { borderColor: colors.primary }]}
            />

            {/* Verified badge (top right) */}
            <View
              style={[
                styles.verifiedBadge,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.background,
                },
              ]}
            >
              <Check size={16} color="#FFFFFF" strokeWidth={3} />
            </View>

            {/* Camera button (bottom right) */}
            <Pressable
              onPress={handleAvatarUpload}
              disabled={uploadingAvatar}
              style={[
                styles.cameraBtn,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.background,
                },
              ]}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Camera size={16} color="#FFFFFF" />
              )}
            </Pressable>
          </View>

          <Text
            style={{ color: colors.text }}
            className="text-2xl font-bold font-['Poppins'] mt-3"
          >
            {profile?.name || "Tunde Bakare"}
          </Text>

          <Pressable
            onPress={() => router.push("/(agent)/personalInfo")}
            style={{
              borderColor: colors.primary,
              backgroundColor: colors.background,
            }}
            className="border rounded-full px-12 py-3 mt-4"
          >
            <Text
              style={{ color: colors.primary }}
              className="text-base font-semibold tracking-wide font-['Inter']"
            >
              Edit Profile
            </Text>
          </Pressable>

          <View className="flex-row items-center mt-5 gap-3">
            <Text
              style={{ color: colors.text }}
              className="text-base font-['Inter']"
            >
              Real Estate Agent
            </Text>
            <Text
              style={{
                color: colors.success,
                backgroundColor: `${colors.success}15`,
                borderColor: `${colors.success}60`,
                borderWidth: 1,
                overflow: "hidden",
              }}
              className="text-sm font-bold px-3 py-1 rounded-md font-['Inter'] uppercase tracking-wider"
            >
              Verified
            </Text>
          </View>

          <View className="flex-row items-center mt-4 gap-2">
            <Mail size={18} color={colors.placeholder} />
            <Text
              style={{ color: colors.placeholder }}
              className="text-base font-['Inter']"
            >
              {profile?.email || "tundebakare@gmail.com"}
            </Text>
          </View>
          <View className="flex-row items-center mt-2 gap-2">
            <Phone size={18} color={colors.placeholder} />
            <Text
              style={{ color: colors.placeholder }}
              className="text-base font-['Inter']"
            >
              {profile?.phone || "+234 801 234 5678"}
            </Text>
          </View>
        </View>

        {/* Agent Availability Card */}
        <View className="px-5 mt-4">
          <View
            style={{ backgroundColor: surface, borderColor: "#1D2C42" }}
            className="rounded-3xl border p-5"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 shrink">
                <Text
                  style={{ color: colors.placeholder }}
                  className="text-xs font-bold font-['Inter'] uppercase tracking-widest"
                >
                  Agent Availability
                </Text>
                <View
                  style={{
                    backgroundColor: isOnline
                      ? `${colors.success}15`
                      : `${colors.placeholder}20`,
                    borderColor: isOnline ? `${colors.success}60` : "#1D2C42",
                  }}
                  className="flex-row items-center gap-1.5 border rounded-full px-2.5 py-1"
                >
                  <View
                    style={{
                      backgroundColor: isOnline
                        ? colors.success
                        : colors.placeholder,
                    }}
                    className="w-2 h-2 rounded-full"
                  />
                  <Text
                    style={{
                      color: isOnline ? colors.success : colors.placeholder,
                    }}
                    className="text-xs font-bold font-['Inter']"
                  >
                    {toggling ? "Updating..." : isOnline ? "Online" : "Offline"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-2">
                <Text
                  style={{ color: colors.placeholder }}
                  className="text-base font-['Inter']"
                >
                  {isOnline ? "Online: " : "Offline: "}
                </Text>
                <Switch
                  trackColor={{ false: "#1D2C42", true: colors.primary }}
                  value={isOnline}
                  onValueChange={handleToggle}
                  disabled={toggling}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            <View
              style={{
                borderColor: "#1D2C42",
                backgroundColor: colors.background,
              }}
              className="flex-row items-center border rounded-2xl p-4 mt-4"
            >
              <View
                style={{
                  backgroundColor: isOnline
                    ? `${colors.success}20`
                    : `${colors.placeholder}20`,
                }}
                className="w-12 h-12 rounded-xl items-center justify-center"
              >
                <Clock
                  size={22}
                  color={isOnline ? colors.success : colors.placeholder}
                />
              </View>
              <View className="flex-1 mx-4">
                <Text
                  style={{ color: colors.text }}
                  className="text-base font-bold font-['Inter']"
                >
                  {isOnline ? "Receiving Inquiries" : "Not Receiving Inquiries"}
                </Text>
                <Text
                  style={{ color: colors.placeholder }}
                  className="text-sm font-['Inter'] mt-0.5"
                >
                  {isOnline
                    ? "Ready for direct buyer leads and instant client calls"
                    : "You won't receive new buyer leads or client calls"}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: isOnline
                    ? colors.success
                    : colors.placeholder,
                }}
                className="w-2.5 h-2.5 rounded-full"
              />
            </View>
          </View>
        </View>

        {/* System Theme Switcher Controls Menu */}
        <View className="px-5 pt-5 pb-2">
          <View
            className="border rounded-3xl w-full p-5 flex-row items-center justify-between"
            style={{
              borderColor: "#1D2C42",
              backgroundColor: surface,
            }}
          >
            <View className="flex-row items-center gap-4">
              <View
                style={{ backgroundColor: iconBg }}
                className="w-12 h-12 rounded-xl items-center justify-center"
              >
                {isDark ? (
                  <Moon size={22} color={colors.primary} />
                ) : (
                  <Sun size={22} color={colors.primary} />
                )}
              </View>
              <View>
                <Text
                  className="text-xs uppercase tracking-widest font-bold mb-1"
                  style={{ color: colors.placeholder }}
                >
                  Theme
                </Text>
                <Text
                  className="font-semibold text-lg"
                  style={{ color: colors.text }}
                >
                  {scheme === "dark"
                    ? "Dark Mode"
                    : scheme === "light"
                      ? "Light Mode"
                      : "System Default"}
                </Text>
              </View>
            </View>
            <Switch
              value={isThemeSwitchOn}
              trackColor={{
                false: "#1D2C42",
                true: colors.primary,
              }}
              thumbColor="#ffffff"
              onValueChange={handleThemeChange}
            />
          </View>
        </View>

        {/* Settings & Security Tree */}
        <View className="mt-4 px-5">
          <Text
            style={{ color: colors.placeholder }}
            className="text-sm uppercase tracking-widest mb-3 ml-1 font-semibold font-['Inter']"
          >
            Settings & Security
          </Text>
          <View
            style={{
              backgroundColor: surface,
              borderColor: "#1D2C42",
            }}
            className="rounded-3xl border overflow-hidden"
          >
            {settingsOptions.map((item, index) => {
              const IconComponent = item.icon;
              const isLogout = item.id === "logout";
              const isLast = index === settingsOptions.length - 1;
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
                    } else if (item.id === "privacy") {
                      router.push("/(agent)/privacy" as any);
                    } else if (item.id === "help") {
                      router.push("/(agent)/help");
                    } else if (item.id === "logout") {
                      handleLogout();
                    }
                  }}
                  style={{
                    borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                    borderBottomColor: "#1D2C42",
                  }}
                  className="flex-row items-center justify-between px-5 py-5"
                >
                  <View className="flex-row items-center flex-1 pr-3">
                    <View
                      style={{
                        backgroundColor: isLogout ? `${danger}18` : iconBg,
                      }}
                      className="w-12 h-12 rounded-xl items-center justify-center"
                    >
                      <IconComponent
                        size={20}
                        color={isLogout ? danger : colors.placeholder}
                      />
                    </View>
                    <View className="ml-4 flex-1">
                      <Text
                        style={{ color: isLogout ? danger : colors.text }}
                        className="text-[17px] font-semibold font-['Inter']"
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={{
                          color: isLogout ? `${danger}CC` : colors.placeholder,
                        }}
                        className="text-sm font-['Inter'] mt-1"
                      >
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight
                    size={18}
                    color={isLogout ? danger : colors.placeholder}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: {
    width: 108,
    height: 108,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#E2E8F0",
    borderWidth: 3,
  },
  verifiedBadge: {
    position: "absolute",
    right: 4,
    top: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  cameraBtn: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
});
