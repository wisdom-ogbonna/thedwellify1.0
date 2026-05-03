import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
  Appearance,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { API } from "../../services/api";
import { useTheme } from "@react-navigation/native";

export default function ClientDashboard() {
  const { logout } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const scheme = useColorScheme();

  const fetchProfile = async () => {
    try {
      const res = await API.get("/client/profile");
      setProfile(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleThemeChange = () => {
    Alert.alert(
      "Appearance Settings",
      "Select the app's theme mode:",
      [
        {
          text: "Light Mode",
          onPress: () => Appearance.setColorScheme("light"),
        },
        {
          text: "Dark Mode",
          onPress: () => Appearance.setColorScheme("dark"),
        },
        {
          text: "System Default",
          onPress: () => Appearance.setColorScheme(null),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true },
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
        paddingTop: insets.top + 32,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 32,
      }}
    >
      {/* Header */}
      <View className="mb-12">
        <Text
          className="text-xs font-bold uppercase tracking-widest opacity-40"
          style={{ color: colors.text }}
        >
          Dashboard
        </Text>
        <Text
          className="text-5xl font-black tracking-tighter mt-2"
          style={{ color: colors.text }}
        >
          {profile.name.split(" ")[0]}.
        </Text>
      </View>

      {/* Account Info */}
      <View className="space-y-6 mb-8">
        <DetailItem label="Email" value={profile.email} />
        <DetailItem label="Phone" value={profile.phone || "Not provided"} />
        <DetailItem
          label="Status"
          value={profile.verified ? "Verified" : "Pending"}
        />
      </View>

      {/* Theme Selection Card */}
      <View
        className="border-2 rounded-3xl p-6 mb-8 flex-row justify-between items-center"
        style={{ borderColor: colors.border }}
      >
        <Text
          className="font-bold uppercase tracking-widest text-xs opacity-40"
          style={{ color: colors.text }}
        >
          Theme
        </Text>
        <Pressable
          onPress={handleThemeChange}
          className="px-4 py-2 rounded-full"
          style={{ backgroundColor: colors.primary + "15" }}
        >
          <Text
            className="font-bold text-[10px] uppercase"
            style={{ color: colors.text }}
          >
            {scheme === "dark"
              ? "Dark Mode"
              : scheme === "light"
                ? "Light Mode"
                : "System Default"}
          </Text>
        </Pressable>
      </View>

      {/* Quick Actions Grid */}
      <View className="flex-row flex-wrap justify-between">
        {["Search", "Saved", "Agents", "Requests"].map((title) => (
          <View key={title} className="w-[48%] mb-4">
            <Pressable
              className="h-28 border-2 rounded-3xl p-6 justify-end"
              style={{ borderColor: colors.border }}
            >
              <Text
                className="font-bold text-lg"
                style={{ color: colors.text }}
              >
                {title}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      {/* Logout */}
      <Pressable
        onPress={logout}
        style={{ backgroundColor: colors.primary }}
        className="mt-15 py-5 rounded-4xl items-center"
      >
        <Text
          className="font-bold text-md uppercase tracking-widest opacity-90"
          style={{ color: "#ffffff" }}
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
        className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1"
        style={{ color: colors.text }}
      >
        {label}
      </Text>
      <Text className="text-lg font-semibold" style={{ color: colors.text }}>
        {value}
      </Text>
    </View>
  );
};
