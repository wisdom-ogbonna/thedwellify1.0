import { useModal } from "@/components/dialogs/popup-modal";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { agentApi } from "@/services/agent";
import { pickCameraImage, pickLibraryImages } from "@/services/media-picker";
import { router } from "expo-router";
import {
  BadgeCheck,
  BellRing,
  Building2,
  Camera,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  LockKeyhole,
  LogOut,
  Mail,
  Moon,
  Phone,
  Sun,
  UserRound,
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
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PickResult =
  | { ok: true; assets: { uri: string; name: string; type: string }[] }
  | { ok: true; asset: { uri: string; name: string; type: string } }
  | { ok: false; reason: "permission" | "canceled" };

const C = {
  background: "#000000",
  surface: "#0B0F14",
  surfaceLight: "#101722",
  border: "#1C2A3B",
  divider: "#202B3B",
  primary: "#1687FF",
  blueSoft: "#101B2B",
  text: "#F8FAFC",
  secondary: "#A0AEC0",
  muted: "#788493",
  danger: "#F04444",
  white: "#FFFFFF",
};

const FONT = undefined as string | undefined;

export default function ProfileScreen() {
  const { logout, isOnline, goOnline, goOffline } = useAuth();
  const { isDark } = useTheme();
  const { showModal } = useModal();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await agentApi.profile();
      setProfile(data);
    } catch (error) {
      console.error("Profile fetch failed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchProfile();
  }, []);

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
      const response = await agentApi.uploadAvatar(file);

      setProfile((prev: any) => ({
        ...prev,
        avatar: response.avatar || file.uri,
      }));
    } catch (error: any) {
      Alert.alert(
        "Upload failed",
        error?.response?.data?.error ||
          "Could not update your profile picture.",
      );
      void fetchProfile();
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarUpload = () => {
    if (uploadingAvatar) return;

    Alert.alert("Profile photo", "Update your agent profile picture.", [
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

  const handleToggle = async (value: boolean) => {
    setToggling(true);

    try {
      if (value) {
        await goOnline();
      } else {
        await goOffline();
      }
    } catch {
      Alert.alert("Error", "Status update failed");
    } finally {
      setToggling(false);
    }
  };

  const handleThemeChange = () => {
    Appearance.setColorScheme(isDark ? "light" : "dark");
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
      icon: UserRound,
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
      icon: LockKeyhole,
      path: "/(agent)/privacy",
    },
    {
      id: "help",
      label: "Help & Support",
      subtitle: "Agent concierge 24/7, FAQs",
      icon: CircleHelp,
      path: "/(agent)/help",
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor={C.background} barStyle="light-content" />
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={C.background}
        barStyle="light-content"
        translucent={false}
      />

      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>

          <Pressable
            onPress={handleThemeChange}
            style={styles.themeButton}
            hitSlop={10}
          >
            {isDark ? (
              <Moon size={19} color={C.primary} />
            ) : (
              <Sun size={19} color={C.primary} />
            )}
            <ChevronDown size={13} color={C.secondary} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void fetchProfile();
              }}
              tintColor={C.primary}
            />
          }
        >
          {/* PROFILE IDENTITY */}
          <View style={styles.profileSection}>
            <View style={styles.avatarArea}>
              <Pressable
                onPress={handleAvatarUpload}
                style={styles.avatarPressable}
              >
                <Image
                  source={{
                    uri:
                      profile?.avatar ||
                      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300",
                  }}
                  style={styles.avatar}
                />

                {uploadingAvatar && (
                  <View style={styles.avatarLoading}>
                    <ActivityIndicator color={C.white} />
                  </View>
                )}
              </Pressable>

              {/* EDIT BUTTON */}
              {/* <Pressable
                onPress={() => router.push("/(agent)/personalInfo")}
                style={styles.editButton}
              >
                <Pencil size={17} color={C.white} />
              </Pressable> */}

              {/* CAMERA BUTTON */}
              <Pressable
                onPress={handleAvatarUpload}
                style={styles.cameraButton}
              >
                <Camera size={18} color={C.white} />
              </Pressable>
            </View>

            <View style={styles.identity}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {profile?.name || "Agent"}
                </Text>

                <BadgeCheck
                  size={21}
                  color={C.primary}
                  fill={C.primary}
                  stroke={C.background}
                />
              </View>

              <View style={styles.contactLine}>
                <Mail size={14} color={C.muted} />
                <Text style={styles.contactText} numberOfLines={1}>
                  {profile?.email || "No email available"}
                </Text>
              </View>

              <View style={styles.contactLine}>
                <Phone size={14} color={C.muted} />
                <Text style={styles.contactText} numberOfLines={1}>
                  {profile?.phone || "No phone available"}
                </Text>
              </View>
            </View>
          </View>

          {/* AGENT AVAILABILITY */}
          <View style={styles.availabilityCard}>
            <Text style={styles.availabilityLabel}>AGENT AVAILABILITY</Text>

            <View style={styles.availabilityRight}>
              <Text
                style={[
                  styles.availabilityStatus,
                  { color: isOnline ? C.primary : C.secondary },
                ]}
              >
                {toggling ? "Updating..." : isOnline ? "Online:" : "Offline:"}
              </Text>

              <Switch
                value={isOnline}
                onValueChange={handleToggle}
                disabled={toggling}
                trackColor={{
                  false: "#293445",
                  true: "#155AA0",
                }}
                thumbColor={C.white}
                ios_backgroundColor="#293445"
                style={styles.switch}
              />
            </View>
          </View>

          {/* SETTINGS SECTION */}
          <Text style={styles.sectionLabel}>SETTINGS & SECURITY</Text>

          <View style={styles.settingsCard}>
            {settingsOptions.map((item, index) => {
              const Icon = item.icon;

              return (
                <View key={item.id}>
                  <Pressable
                    onPress={() => router.push(item.path as any)}
                    android_ripple={{
                      color: "rgba(22,135,255,0.08)",
                    }}
                    style={styles.settingRow}
                  >
                    <View style={styles.settingIcon}>
                      <Icon size={20} color={C.primary} />
                    </View>

                    <View style={styles.settingContent}>
                      <Text style={styles.settingTitle}>{item.label}</Text>

                      <Text style={styles.settingSubtitle} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    </View>

                    <ChevronRight size={20} color={C.muted} />
                  </Pressable>

                  {index !== settingsOptions.length - 1 && (
                    <View style={styles.rowDivider} />
                  )}
                </View>
              );
            })}

            {/* LOGOUT */}
            <View style={styles.rowDivider} />

            <Pressable
              onPress={handleLogout}
              android_ripple={{
                color: "rgba(240,68,68,0.08)",
              }}
              style={styles.settingRow}
            >
              <View style={styles.logoutIcon}>
                <LogOut size={20} color={C.danger} />
              </View>

              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: C.danger }]}>
                  Logout
                </Text>

                <Text style={[styles.settingSubtitle, { color: C.muted }]}>
                  Sign out from this device
                </Text>
              </View>

              <ChevronRight size={20} color={C.danger} />
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: C.background,
    alignItems: "center",
    justifyContent: "center",
  },

  container: {
    flex: 1,
    backgroundColor: C.background,
  },

  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 35,
  },

  // HEADER
  header: {
    height: 55,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    color: C.white,
    fontFamily: FONT,
    fontSize: 23,
    fontWeight: "700",
    letterSpacing: -0.5,
  },

  themeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 5,
  },

  // PROFILE
  profileSection: {
    alignItems: "center",
    paddingTop: 9,
    paddingBottom: 31,
  },

  avatarArea: {
    width: 110,
    height: 110,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarPressable: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: C.primary,
    backgroundColor: C.surface,
  },

  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  editButton: {
    position: "absolute",
    top: 15,
    right: -125,
    width: 40,
    height: 24,
    borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  cameraButton: {
    position: "absolute",
    bottom: -1,
    right: -26,
    width: 37,
    height: 37,
    borderRadius: 19,
    backgroundColor: C.primary,
    borderWidth: 2,
    borderColor: C.background,
    alignItems: "center",
    justifyContent: "center",
  },

  identity: {
    alignItems: "center",
    marginTop: 12,
    width: "100%",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginBottom: 3,
  },

  name: {
    color: C.white,
    fontFamily: FONT,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.5,
    maxWidth: "85%",
  },

  contactLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 4,
  },

  contactText: {
    color: C.secondary,
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: "400",
  },

  // AVAILABILITY
  availabilityCard: {
    minHeight: 59,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  availabilityLabel: {
    color: C.secondary,
    fontFamily: FONT,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  availabilityRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  availabilityStatus: {
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: "500",
  },

  switch: {
    transform: [{ scaleX: 0.91 }, { scaleY: 0.91 }],
  },

  // SETTINGS
  sectionLabel: {
    color: C.secondary,
    fontFamily: FONT,
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.7,
    marginTop: 17,
    marginBottom: 10,
    marginLeft: 4,
  },

  settingsCard: {
    backgroundColor: C.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 0,
    overflow: "hidden",
  },

  settingRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },

  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#18283F",
    alignItems: "center",
    justifyContent: "center",
  },

  settingContent: {
    flex: 1,
    marginLeft: 14,
    minWidth: 0,
  },

  settingTitle: {
    color: C.text,
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.15,
  },

  settingSubtitle: {
    color: C.muted,
    fontFamily: FONT,
    fontSize: 11.5,
    fontWeight: "400",
    marginTop: 4,
  },

  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.divider,
    marginLeft: 64,
    marginRight: 16,
  },
});
