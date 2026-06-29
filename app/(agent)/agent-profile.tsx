import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  CaretLeftIcon,
  ClipboardText,
} from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Appearance,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { API } from "../../services/api";

export default function ProfileScreen() {
  const { logout, isOnline, goOnline, goOffline } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scheme = useColorScheme();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);

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

  const handleRequests = async () => {
    const user = auth.currentUser;
    if (!user) {
      return;
    }

    const token = await user.getIdToken();
    const authHeader = {
      headers: { Authorization: `Bearer ${token}` },
    };

    try {
      const response: any = await API.get("/agent/requests", authHeader);

      const requestsList = response?.requests || response?.data?.requests;

      if (
        requestsList &&
        Array.isArray(requestsList) &&
        requestsList.length > 0
      ) {
        const sorted = [...requestsList].sort(
          (a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0),
        );
        const latestItem = sorted[0];

        if (
          latestItem &&
          latestItem.status === "pending" &&
          latestItem.requestId
        ) {
          router.push({
            pathname: "/(utilities)/requests",
            params: {
              requestId: String(latestItem.requestId),
              agentId: String(latestItem.agentId),
              clientName: String(latestItem.clientName),
              propertyType: String(latestItem.propertyType),
              lat: String(latestItem.lat),
              lng: String(latestItem.lng),
            },
          });
        } else {
          Alert.alert(
            "You have no requests at this moment",
            "Please try again later!",
          );
        }
      } else {
        console.log("No requests found in the response.");
      }
    } catch (err: any) {
      console.error("Request Check failed:", err);
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
    Alert.alert("Appearance Settings", "Select the app's theme mode:", [
      { text: "Light Mode", onPress: () => Appearance.setColorScheme("light") },
      { text: "Dark Mode", onPress: () => Appearance.setColorScheme("dark") },
      {
        text: "System Default",
        onPress: () => Appearance.setColorScheme(null),
      },
      { text: "Cancel", style: "cancel" },
    ]);
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

  if (loading)
    return (
      <View
        className="flex-1 justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator color={colors.text} />
      </View>
    );

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 32,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={fetchProfile}
          tintColor={colors.primary}
        />
      }
    >
      <View className="flex-row items-center mb-5" style={{ gap: 12 }}>
        <TouchableOpacity
          className="p-1 -ml-1"
          onPress={() => router.push("/(agent)/agent-dashboard")}
        >
          <CaretLeftIcon size={28} color={colors.text} />
        </TouchableOpacity>

        <Text
          style={{ color: colors.text }}
          className="text-2xl font-black tracking-tight"
        >
          PROFILE
        </Text>
      </View>
      {/* Header */}
      <View className="mb-10 flex-row justify-between items-start">
        <View>
          <Text
            className="text-4xl font-black tracking-tighter"
            style={{ color: colors.text }}
          >
            {profile.name.split(" ")[0]}.
          </Text>
          <Text
            className="text-sm font-bold uppercase tracking-widest opacity-40 mt-1"
            style={{ color: colors.text }}
          >
            {profile.email}
          </Text>
        </View>
      </View>

      {/* Requests Navigation Card */}
      <TouchableOpacity
        onPress={handleRequests}
        className="border-2 rounded-3xl p-6 mb-8 flex-row items-center justify-between"
        style={{
          borderColor: colors.primary,
          backgroundColor: colors.primary + "10",
        }}
      >
        <View className="flex-row items-center gap-4">
          <ClipboardText color={colors.primary} weight="bold" size={24} />
          <Text className="font-bold text-lg" style={{ color: colors.text }}>
            View Requests
          </Text>
        </View>
        <ArrowRight size={16} color={colors.text} />
      </TouchableOpacity>

      {/* Settings Grid */}
      <View className="flex-row gap-4 mb-8">
        {/* Online Status Card */}
        <View
          className="flex-1 border-2 rounded-3xl p-6 justify-between"
          style={{ borderColor: colors.border }}
        >
          <Text
            className="font-bold uppercase tracking-widest text-[10px] opacity-40 mb-4"
            style={{ color: colors.text }}
          >
            Status
          </Text>
          <View className="flex-row justify-between items-center">
            <Text className="font-black text-sm" style={{ color: colors.text }}>
              {toggling ? "Updating..." : isOnline ? "Online" : "Offline"}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={handleToggle}
              disabled={toggling}
              trackColor={{ true: colors.primary }}
            />
          </View>
        </View>

        {/* Theme Toggle Card */}
        <TouchableOpacity
          onPress={handleThemeChange}
          className="flex-1 border-2 rounded-3xl p-6 justify-between"
          style={{ borderColor: colors.border }}
        >
          <Text
            className="font-bold uppercase tracking-widest text-[10px] opacity-40 mb-4"
            style={{ color: colors.text }}
          >
            Theme
          </Text>
          <Text className="font-black text-sm" style={{ color: colors.text }}>
            {scheme === "dark"
              ? "Dark"
              : scheme === "light"
                ? "Light"
                : "System"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Details List */}
      <View className="space-y-6 mb-12">
        <DetailItem label="Phone" value={profile.phone} />
        <DetailItem label="Address" value={profile.address} />
        <DetailItem label="Agency" value={profile.agencyName} />
        <DetailItem label="License" value={profile.licenseId} />
      </View>

      {/* Logout */}
      <TouchableOpacity
        onPress={handleLogout}
        style={{ backgroundColor: colors.primary }}
        className="py-5 rounded-4xl items-center"
      >
        <Text
          className="font-bold text-md uppercase tracking-widest opacity-90"
          style={{ color: "#FFFFFF" }}
        >
          Sign Out
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const DetailItem = ({ label, value }: { label: string; value: string }) => {
  const { colors } = useTheme();
  return (
    <View className="border-b-2 pb-4" style={{ borderColor: colors.border }}>
      <Text
        className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1"
        style={{ color: colors.text }}
      >
        {label}
      </Text>
      <Text className="text-base font-semibold" style={{ color: colors.text }}>
        {value || "Not provided"}
      </Text>
    </View>
  );
};
