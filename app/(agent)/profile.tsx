import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { API } from "../../services/api";
import { useRouter } from "expo-router"; // Added router
import { ClipboardText } from "phosphor-react-native"; // Added icon

export default function ProfileScreen() {
  const { logout, isOnline, goOnline, goOffline } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter(); // Initialize router

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

  if (loading)
    return (
      <View
        className="flex-1 justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 32,
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
        <View
          className={`px-4 py-2 rounded-full ${profile.verified ? "bg-green-100" : "bg-amber-100"}`}
        >
          <Text
            className={`text-[10px] font-bold uppercase ${profile.verified ? "text-green-800" : "text-amber-800"}`}
          >
            {profile.verified ? "Verified" : "Pending"}
          </Text>
        </View>
      </View>

      {/* Requests Navigation Card (High visibility) */}
      <Pressable
        onPress={() => router.push("../(utilities)/requests")}
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
        <Text
          className="text-xs font-bold uppercase opacity-60"
          style={{ color: colors.text }}
        >
          →
        </Text>
      </Pressable>

      {/* Online Status Card */}
      <View
        className="border-2 rounded-3xl p-6 mb-8 flex-row justify-between items-center"
        style={{ borderColor: colors.border }}
      >
        <Text
          className="font-bold uppercase tracking-widest text-xs opacity-40"
          style={{ color: colors.text }}
        >
          Status
        </Text>
        <View className="flex-row items-center gap-4">
          <Text className="font-black text-lg" style={{ color: colors.text }}>
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

      {/* Details List */}
      <View className="space-y-6 mb-12">
        <DetailItem label="Phone" value={profile.phone} />
        <DetailItem label="Address" value={profile.address} />
        <DetailItem label="Agency" value={profile.agencyName} />
        <DetailItem label="License" value={profile.licenseId} />
      </View>

      {/* Logout */}
      <Pressable
        onPress={logout}
        style={{ backgroundColor: colors.primary }}
        className="py-5 rounded-4xl items-center"
      >
        <Text
          className="font-bold text-md uppercase tracking-widest opacity-90"
          style={{ color: "#FFFFFF" }}
        >
          Sign Out
        </Text>
      </Pressable>
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
