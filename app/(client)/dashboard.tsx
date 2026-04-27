import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { API } from "../../services/api";
import { useTheme } from "@react-navigation/native";

export default function ClientDashboard() {
  const { logout } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets(); // 1. Use insets instead of SafeAreaView wrapper

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      // 2. Apply insets here to prevent bleeding
      contentContainerStyle={{
        paddingTop: insets.top + 32,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 32,
      }}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={fetchProfile}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View className="mb-10">
        <Text
          className="text-sm font-bold uppercase tracking-widest opacity-40"
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

      {/* Grid Actions */}
      <View className="flex-row flex-wrap justify-between">
        {[
          { title: "Properties", desc: "Find home" },
          { title: "Saved", desc: "Shortlist" },
          { title: "Agents", desc: "Chat" },
          { title: "Requests", desc: "Track" },
        ].map((item, i) => (
          <View key={i} className="w-[48%] mb-4">
            <Pressable
              className="h-28 p-5 rounded-3xl border-2 justify-center"
              style={{ borderColor: colors.border }}
            >
              <Text
                className="font-bold text-base"
                style={{ color: colors.text }}
              >
                {item.title}
              </Text>
              <Text
                className="opacity-40 text-xs font-medium mt-1"
                style={{ color: colors.text }}
              >
                {item.desc}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      {/* Account Info */}
      <View
        className="mt-8 border-t-2 pt-8"
        style={{ borderColor: colors.border }}
      >
        <Text
          className="text-xs font-bold uppercase tracking-widest opacity-30 mb-4"
          style={{ color: colors.text }}
        >
          Account
        </Text>
        <Text className="font-semibold text-lg" style={{ color: colors.text }}>
          {profile.email}
        </Text>
      </View>
    </ScrollView>
  );
}
