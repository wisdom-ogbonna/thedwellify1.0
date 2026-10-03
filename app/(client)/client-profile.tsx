import { useModal } from "@/components/dialogs/popup-modal";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { API } from "@/services/api";
import { useRouter } from "expo-router";
import {
  Calendar,
  ChevronRight,
  Clock,
  CreditCard,
  Heart,
  LifeBuoy,
  LogOut,
  Settings,
  Trash2Icon,
  UserCheck2Icon,
} from "lucide-react-native";
import { StarIcon } from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Appearance,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Switch } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PremiumProfileScreen() {
  const { isDark } = useTheme();
  const { logout } = useAuth();
  const { showModal } = useModal();

  const [isThemeSwitchOn, setIsThemeSwitchOn] = useState<boolean>(isDark);

  const { colors } = useTheme();
  const scheme = useColorScheme();

  const [profile, setProfile] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [_, setDeleting] = useState(false);
  const router = useRouter();

  /**
   * =========================
   * FETCH PROFILE
   * =========================
   */
  const fetchProfile = async () => {
    try {
      setLoading(true);

      const res = await API.get("/client/profile");

      setProfile(res.data);
    } catch (error) {
      console.log("PROFILE ERROR:", error);

      Alert.alert("Error", "Failed to load your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  /**
   * =========================
   * THEME SWITCHER
   * =========================
   */
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

  /**
   * =========================
   * DELETE ACCOUNT
   * =========================
   */
  const deleteAccount = async () => {
    try {
      setDeleting(true);

      const res = await API.delete("/client/delete");

      Alert.alert(
        "Account Deleted",
        res.data?.message || "Your account was deleted successfully.",
        [
          {
            text: "OK",
            onPress: async () => {
              await logout();
            },
          },
        ],
      );
    } catch (error: any) {
      console.log("DELETE ACCOUNT ERROR:", error);

      const message =
        error?.response?.data?.error ||
        "Unable to delete account. Please try again.";

      Alert.alert("Delete Failed", message);
    } finally {
      setDeleting(false);
    }
  };

  /**
   * =========================
   * CONFIRM DELETE
   * =========================
   */
  const handleDeleteAccount = () => {
    const triggerDelete = () => {
      showModal({
        title: "Delete Account?",
        text: "Are you sure you want to delete your account? This action cannot be undone.",
        type: "delete",
        ctaText1: "Delete",
        ctaText2: "Cancel",
        onCta1: deleteAccount,
      });
    };
    triggerDelete();
  };

  /**
   * =========================
   * LOADING
   * =========================
   */
  if (loading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const textColor = isDark ? "#FFFFFF" : "#0F172A";
  const subTextColor = isDark ? "#94A3B8" : "#64748B";
  const cardBg = isDark ? "#111111" : "#F8FAFC";
  const borderColor = isDark ? "#222222" : "#F1F5F9";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#FFFFFF" }}
      edges={["top"]}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* User Profile Info Card Area */}
        <View
          style={{
            alignItems: "center",
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 24,
          }}
        >
          <View className="relative">
            <Image
              source={{
                uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiex10nhyzatAU0O2nOebIcdFLSolwIyMb1QY5IjZEgA&s=10",
              }}
              className="w-24 h-24 rounded-full border-2 border-blue-600"
            />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 4,
                backgroundColor: "#22C55E",
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: isDark ? "#000000" : "#FFFFFF",
              }}
            />
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: "900",
              color: textColor,
              marginTop: 16,
              letterSpacing: -0.5,
            }}
          >
            {profile?.name?.split(" ")[0] || "User"}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "#2563EB",
              marginTop: 4,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            DWELLIFY USER • Joined 2023
          </Text>

          <TouchableOpacity className="mt-4 bg-blue-600 px-6 py-2 rounded-full shadow-none">
            <Text className="text-white text-xs font-bold">Edit Profile</Text>
          </TouchableOpacity>

          {/* User Metrics Boxes */}
          <View className="flex-row justify-center gap-4 mt-6 w-full">
            <View
              style={{
                backgroundColor: cardBg,
                paddingVertical: 12,
                paddingHorizontal: 24,
                alignItems: "center",
                flex: 1,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: borderColor,
              }}
            >
              <Text
                style={{ fontSize: 20, fontWeight: "900", color: textColor }}
              >
                12
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "500",
                  color: subTextColor,
                  marginTop: 2,
                }}
              >
                Saved Homes
              </Text>
            </View>
            <View
              style={{
                backgroundColor: cardBg,
                paddingVertical: 12,
                paddingHorizontal: 24,
                alignItems: "center",
                flex: 1,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: borderColor,
              }}
            >
              <Text
                style={{ fontSize: 20, fontWeight: "900", color: textColor }}
              >
                3
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "500",
                  color: subTextColor,
                  marginTop: 2,
                }}
              >
                Scheduled
              </Text>
            </View>
          </View>
        </View>

        {/* System Theme Switcher Controls Menu */}
        <View className="px-5 pt-5 pb-2">
          <View>
            <View
              className="border rounded-3xl w-full p-6 mb-8 flex-row items-center justify-between"
              style={{
                borderColor: colors.placeholder,
              }}
            >
              <View>
                <Text
                  className="text-xs uppercase tracking-widest opacity-40 font-bold mb-1"
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
                  false: colors.placeholder,
                  true: colors.placeholder,
                }}
                thumbColor={isThemeSwitchOn ? colors.text : colors.primary}
                onValueChange={handleThemeChange}
              />
            </View>
          </View>
        </View>

        {/* Settings Navigation List Groups */}
        <View className="px-5 mt-4">
          <ProfileMenuRow
            Icon={Heart}
            title="Saved Properties"
            badge="12"
            iconColor="#3B82F6"
          />
          <ProfileMenuRow
            Icon={Clock}
            title="History"
            iconColor="#A8422D"
            onPress={() => router.push("/utilities/client-history-event")}
          />
          <ProfileMenuRow
            Icon={Calendar}
            title="Scheduled Visits"
            iconColor="#10B981"
          />
          <ProfileMenuRow
            Icon={CreditCard}
            title="Payment Methods"
            iconColor="#6366F1"
          />
          <ProfileMenuRow
            Icon={UserCheck2Icon}
            title="Become an Agent"
            iconColor="#32CD32"
          />
          <ProfileMenuRow
            Icon={LifeBuoy}
            title="Support & Help"
            iconColor="#F59E0B"
          />
          <ProfileMenuRow Icon={StarIcon} title="Rate Us" iconColor="#FFD700" />
          <ProfileMenuRow
            Icon={Settings}
            title="Settings"
            iconColor="#64748B"
          />
          <ProfileMenuRow
            Icon={LogOut}
            title="Logout"
            onPress={handleLogout}
            isDanger={true}
            iconColor="#EF4444"
          />
          <ProfileMenuRow
            Icon={Trash2Icon}
            title="Delete Account"
            onPress={handleDeleteAccount}
            isDanger={true}
            iconColor="#EF4444"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface RowProps {
  Icon: any;
  title: string;
  badge?: string;
  isDanger?: boolean;
  onPress?: () => void;
  iconColor: string;
}

function ProfileMenuRow({
  Icon,
  title,
  badge,
  isDanger = false,
  iconColor,
  onPress,
}: RowProps) {
  const { isDark } = useTheme();
  const textColor = isDanger ? "#EF4444" : isDark ? "#FFFFFF" : "#0F172A";
  const borderColor = isDark ? "#1F2937" : "#F1F5F9";
  const rowIconBg = isDark ? "#111111" : "#F8FAFC";

  return (
    <TouchableOpacity
      className="flex-row items-center justify-between py-4"
      onPress={onPress}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: rowIconBg,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: isDark ? "#222" : "#F1F5F9",
          }}
        >
          <Icon size={18} color={isDanger ? "#EF4444" : iconColor} />
        </View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: textColor,
            marginLeft: 16,
          }}
        >
          {title}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {badge && (
          <View
            style={{
              backgroundColor: isDark ? "rgba(37,99,235,0.2)" : "#EFF6FF",
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 6,
              marginRight: 8,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#2563EB" }}>
              {badge}
            </Text>
          </View>
        )}
        <ChevronRight size={16} color={isDark ? "#4B5563" : "#CBD5E1"} />
      </View>
    </TouchableOpacity>
  );
}
