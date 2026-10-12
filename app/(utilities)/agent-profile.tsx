import { useModal } from "@/components/dialogs/popup-modal";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { agentApi } from "@/services/agent";
import { pickCameraImage, pickLibraryImages } from "@/services/media-picker";
import { router } from "expo-router";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  BellRing,
  Building2,
  ChevronRight,
  HelpCircle,
  Lock,
  LogOut,
  Mail,
  Moon,
  Pencil,
  Phone,
  Sun,
  User,
  Wallet,
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
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Swap for your font family (e.g. "Inter_600SemiBold") if you use per-weight fonts
const FONT = undefined as string | undefined;

type PickResult =
  | { ok: true; assets: { uri: string; name: string; type: string }[] }
  | { ok: true; asset: { uri: string; name: string; type: string } }
  | { ok: false; reason: "permission" | "canceled" };

export default function ProfileScreen() {
  const { logout, isOnline, goOnline, goOffline } = useAuth();
  const { colors, isDark } = useTheme();
  const { showModal } = useModal();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ---- design tokens ----
  const headerBg = isDark ? "#0A101B" : "#FFFFFF";
  const surface = isDark ? "#0B111C" : "#FFFFFF";
  const surfaceInner = isDark ? "#0E1624" : "#F8FAFC";
  const iconBg = isDark ? "#111B2E" : "#EEF2F7";
  const divider = isDark ? "#1A2332" : "#E8EDF3";
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

  const uploadPickedAvatar = async (picked: PickResult) => {
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

  const handleThemeChange = (value: boolean) => {
    Appearance.setColorScheme(value ? "dark" : "light");
  };

  const handleLogout = () => {
    showModal({
      title: "Log Out?",
      text: "Are you sure you want to log out?",
      type: "logout",
      ctaText1: "Log Out",
      ctaText2: "Cancel",
      onCta1: async () => await logout(),
    });
  };

  const settingsOptions = [
    {
      id: "personal",
      label: "Personal Information",
      subtitle: "Name, national ID, contact details",
      icon: User,
      path: "/(agent)/personalInfo",
    },
    {
      id: "business",
      label: "Business Information",
      subtitle: "Agency, broker license, tax info",
      icon: Building2,
      path: "/(agent)/businessForm",
    },
    {
      id: "bank",
      label: "Bank Details & Payouts",
      subtitle: "Commission accounts and routing",
      icon: Wallet,
      path: "/(agent)/bank",
    },
    {
      id: "notifications",
      label: "Notification Settings",
      subtitle: "Push, inquiries, leads & alerts",
      icon: BellRing,
      path: "/(utilities)/notifications",
    },
    {
      id: "privacy",
      label: "Privacy & Security",
      subtitle: "Two-factor auth, passcodes, sessions",
      icon: Lock,
      path: "/(agent)/privacy",
    },
    {
      id: "help",
      label: "Help & Support",
      subtitle: "Agent concierge 24/7, FAQs",
      icon: HelpCircle,
      path: "/(agent)/help",
    },
    {
      id: "logout",
      label: "Logout",
      subtitle: "Sign out from this device",
      icon: LogOut,
      path: "",
    },
  ];

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const switchProps = {
    trackColor: { false: isDark ? "#1D2C42" : "#CBD5E1", true: colors.primary },
    thumbColor: "#FFFFFF",
    ios_backgroundColor: isDark ? "#1D2C42" : "#CBD5E1",
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ---------- Header ---------- */}
      <SafeAreaView
        edges={["top"]}
        style={{
          backgroundColor: headerBg,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: divider,
        }}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.backBtn,
              { backgroundColor: iconBg, borderColor: divider },
            ]}
          >
            <ArrowLeft size={22} color={colors.primary} />
          </Pressable>

          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Profile
            </Text>
            <Text style={[styles.headerSub, { color: colors.placeholder }]}>
              Real estate agent account
            </Text>
          </View>

          <Pressable
            hitSlop={10}
            onPress={() => router.push("/(utilities)/notifications")}
          >
            <Bell size={24} color={colors.text} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchProfile();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* ---------- Profile card ---------- */}
        <View
          style={[
            styles.card,
            { backgroundColor: surface, borderColor: divider },
          ]}
        >
          <View style={styles.profileTop}>
            <Pressable onPress={handleAvatarUpload} style={styles.avatarWrap}>
              <Image
                source={{
                  uri:
                    profile?.avatar ||
                    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300",
                }}
                style={[styles.avatar, { borderColor: colors.primary }]}
              />
              {uploadingAvatar && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              )}
              <View
                style={[
                  styles.onlineDot,
                  {
                    backgroundColor: isOnline
                      ? colors.success
                      : colors.placeholder,
                    borderColor: surface,
                  },
                ]}
              />
            </Pressable>

            <View style={styles.profileInfo}>
              <Text
                numberOfLines={1}
                style={[styles.name, { color: colors.text }]}
              >
                {profile?.name || "Agent"}
              </Text>

              <View
                style={[
                  styles.verifiedPill,
                  {
                    backgroundColor: `${colors.success}18`,
                    borderColor: `${colors.success}66`,
                  },
                ]}
              >
                <BadgeCheck size={15} color={colors.success} />
                <Text style={[styles.verifiedText, { color: colors.success }]}>
                  VERIFIED
                </Text>
              </View>

              <Text
                numberOfLines={1}
                style={[styles.role, { color: colors.placeholder }]}
              >
                Real Estate Agent
              </Text>
            </View>

            <Pressable
              onPress={() => router.push("/(agent)/personalInfo")}
              style={[styles.editBtn, { backgroundColor: colors.primary }]}
            >
              <Pencil size={16} color="#FFFFFF" />
              {/* <Text style={styles.editText}>Edit Profile</Text> */}
            </Pressable>
          </View>

          <Text style={[styles.availableText, { color: colors.placeholder }]}>
            {isOnline
              ? "Available for direct buyer leads and instant client calls"
              : "You won't receive new buyer leads or client calls"}
          </Text>

          <View style={styles.contactRow}>
            <ContactTile
              icon={<Phone size={20} color={colors.primary} />}
              label="PHONE"
              value={profile?.phone || "—"}
              bg={surfaceInner}
              border={divider}
              iconBg={iconBg}
              textColor={colors.text}
              labelColor={colors.placeholder}
            />
            <ContactTile
              icon={<Mail size={20} color={colors.primary} />}
              label="EMAIL"
              value={profile?.email || "—"}
              bg={surfaceInner}
              border={divider}
              iconBg={iconBg}
              textColor={colors.text}
              labelColor={colors.placeholder}
            />
          </View>
        </View>

        {/* ---------- Agent availability ---------- */}
        <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>
          AGENT AVAILABILITY
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: surface, borderColor: divider },
          ]}
        >
          <View style={styles.rowBetween}>
            <View style={styles.rowCenter}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isOnline
                      ? colors.success
                      : colors.placeholder,
                  },
                ]}
              />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {isOnline ? "Receiving inquiries" : "Not receiving inquiries"}
              </Text>
            </View>

            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isOnline
                    ? `${colors.success}18`
                    : `${colors.placeholder}20`,
                  borderColor: isOnline ? `${colors.success}66` : divider,
                },
              ]}
            >
              <View
                style={[
                  styles.pillDot,
                  {
                    backgroundColor: isOnline
                      ? colors.success
                      : colors.placeholder,
                  },
                ]}
              />
              <Text
                style={[
                  styles.pillText,
                  { color: isOnline ? colors.success : colors.placeholder },
                ]}
              >
                {toggling ? "Updating..." : isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </View>

          <View style={[styles.rowBetween, { marginTop: 10 }]}>
            <Text style={[styles.cardSub, { color: colors.placeholder }]}>
              {isOnline
                ? "Tap to pause incoming leads"
                : "Tap to resume incoming leads"}
            </Text>
            <Switch
              {...switchProps}
              value={isOnline}
              onValueChange={handleToggle}
              disabled={toggling}
            />
          </View>
        </View>

        {/* ---------- Theme ---------- */}
        <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>
          THEME
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: surface, borderColor: divider },
          ]}
        >
          <View style={styles.rowBetween}>
            <View style={styles.rowCenter}>
              <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                {isDark ? (
                  <Moon size={22} color={colors.primary} />
                ) : (
                  <Sun size={22} color={colors.primary} />
                )}
              </View>
              <View style={{ marginLeft: 14 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {isDark ? "Dark Mode" : "Light Mode"}
                </Text>
                <Text
                  style={[
                    styles.cardSub,
                    { color: colors.placeholder, marginTop: 2 },
                  ]}
                >
                  Current theme
                </Text>
              </View>
            </View>
            <Switch
              {...switchProps}
              value={isDark}
              onValueChange={handleThemeChange}
            />
          </View>
        </View>

        {/* ---------- Settings & Security ---------- */}
        <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>
          SETTINGS & SECURITY
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: surface,
              borderColor: divider,
              padding: 0,
              overflow: "hidden",
            },
          ]}
        >
          {settingsOptions.map((item, index) => {
            const Icon = item.icon;
            const isLogout = item.id === "logout";
            const isLast = index === settingsOptions.length - 1;

            return (
              <View key={item.id}>
                <Pressable
                  onPress={() =>
                    isLogout ? handleLogout() : router.push(item.path as any)
                  }
                  android_ripple={{ color: `${colors.primary}15` }}
                  style={styles.settingRow}
                >
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: isLogout ? `${danger}18` : iconBg },
                    ]}
                  >
                    <Icon
                      size={21}
                      color={isLogout ? danger : colors.primary}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text
                      style={[
                        styles.settingTitle,
                        { color: isLogout ? danger : colors.text },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.cardSub,
                        {
                          color: isLogout ? `${danger}CC` : colors.placeholder,
                          marginTop: 2,
                        },
                      ]}
                    >
                      {item.subtitle}
                    </Text>
                  </View>

                  <ChevronRight
                    size={20}
                    color={isLogout ? danger : colors.placeholder}
                  />
                </Pressable>

                {/* inset divider, starts under the text like the design */}
                {!isLast && (
                  <View
                    style={{
                      height: StyleSheet.hairlineWidth,
                      backgroundColor: divider,
                      marginLeft: 70,
                      marginRight: 16,
                    }}
                  />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function ContactTile({
  icon,
  label,
  value,
  bg,
  border,
  iconBg,
  textColor,
  labelColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
  border: string;
  iconBg: string;
  textColor: string;
  labelColor: string;
}) {
  return (
    <View
      style={[styles.contactTile, { backgroundColor: bg, borderColor: border }]}
    >
      <View style={[styles.contactIcon, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
        <Text style={[styles.contactLabel, { color: labelColor }]}>
          {label}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.contactValue, { color: textColor }]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  // header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontFamily: FONT, fontSize: 22, fontWeight: "700" },
  headerSub: { fontFamily: FONT, fontSize: 14, marginTop: 1 },

  // generic card
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowCenter: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
  sectionLabel: {
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: 26,
    marginBottom: 10,
    marginLeft: 4,
  },
  cardTitle: { fontFamily: FONT, fontSize: 18, fontWeight: "600" },
  cardSub: { fontFamily: FONT, fontSize: 15 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  // profile card
  profileTop: { flexDirection: "row", alignItems: "flex-start" },
  avatarWrap: { width: 70, height: 70 },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    backgroundColor: "#E2E8F0",
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 35,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  onlineDot: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
  },
  profileInfo: { flex: 1, marginLeft: 16, minWidth: 0 },
  name: { fontFamily: FONT, fontSize: 22, fontWeight: "700" },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  verifiedText: {
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  role: { fontFamily: FONT, fontSize: 16, marginTop: 8 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginLeft: 8,
  },
  editText: {
    fontFamily: FONT,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  availableText: {
    fontFamily: FONT,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 18,
  },
  contactRow: { flexDirection: "row", gap: 12, marginTop: 18 },
  contactTile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    minWidth: 0,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: {
    fontFamily: FONT,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  contactValue: {
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 3,
  },

  // availability
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginLeft: 8,
  },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontFamily: FONT, fontSize: 14, fontWeight: "600" },

  // settings rows
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingTitle: { fontFamily: FONT, fontSize: 18, fontWeight: "600" },
});
