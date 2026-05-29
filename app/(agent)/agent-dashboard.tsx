import Sidebar from "@/components/sidebar/sidebar";
import { useTheme } from "@/hooks/use-theme";
import * as WebBrowser from "expo-web-browser";
import {
  Bell,
  Buildings,
  CheckCircle,
  CurrencyNgn,
  HouseSimple,
  List,
  MapPin,
  Warning,
  XCircle,
} from "phosphor-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../config/firebase";
import { API } from "../../services/api";
import { registerForPushNotificationsAsync } from "../../services/notification";

const { width } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStatus =
  | "active"
  | "suspended"
  | "matched"
  | "inspection_started"
  | "inspection_completed"
  | null;

interface ThemeColors {
  primary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  placeholder?: string;
}

interface ProfileData {
  name: string;
  [key: string]: any;
}

// ─── Safe normalization layer ─────────────────────────────────────────────────

function normalizeStatus(status: unknown): AgentStatus {
  if (!status || typeof status !== "string") return null;

  const cleaned = status.trim().toLowerCase();

  switch (cleaned) {
    case "active":
      return "active";
    case "suspended":
      return "suspended";
    case "matched":
      return "matched";
    case "inspection_started":
      return "inspection_started";
    case "inspection_completed":
      return "inspection_completed";
    default:
      return null;
  }
}

// ─── Static UI config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Exclude<AgentStatus, null>,
  { label: string; color: string; bg: string }
> = {
  active: { label: "Available", color: "#15803d", bg: "#dcfce7" },
  suspended: { label: "Suspended", color: "#b91c1c", bg: "#fee2e2" },
  matched: { label: "Request Matched", color: "#b45309", bg: "#fef3c7" },
  inspection_started: {
    label: "In Inspection",
    color: "#1d4ed8",
    bg: "#dbeafe",
  },
  inspection_completed: {
    label: "Completed",
    color: "#15803d",
    bg: "#dcfce7",
  },
};

// ─── StatusPill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: AgentStatus }) {
  const safeStatus = normalizeStatus(status);

  if (!safeStatus) {
    return (
      <View
        style={{
          backgroundColor: "#e5e7eb",
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 999,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: "#4b5563",
            marginRight: 8,
          }}
        />
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#1f2937" }}>
          Unknown Status
        </Text>
      </View>
    );
  }

  const cfg = STATUS_CONFIG[safeStatus];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: cfg.bg,
      }}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: cfg.color,
          marginRight: 8,
        }}
      />
      <Text style={{ fontSize: 14, fontWeight: "700", color: cfg.color }}>
        {cfg.label}
      </Text>
    </View>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  colors: ThemeColors;
}) {
  const textColor = colors.text;
  const secondaryTextColor = "#475569"; // Vibrant slate vs muddy gray

  return (
    <View
      className="flex-1 rounded-2xl p-5 border"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderTopColor: accent,
        borderTopWidth: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View
        className="w-11 h-11 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: accent + "18" }}
      >
        {icon}
      </View>
      <Text
        className="text-xl font-extrabold tracking-tight mb-1"
        style={{ color: textColor }}
      >
        {value}
      </Text>
      <Text className="text-sm font-bold" style={{ color: secondaryTextColor }}>
        {label}
      </Text>
    </View>
  );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

function ActionButton({
  label,
  onPress,
  color,
  disabled,
  loading,
  icon,
}: {
  label: string;
  onPress: () => void;
  color: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], width: "100%" }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        className="rounded-2xl items-center justify-center"
        style={{
          backgroundColor: disabled || loading ? "#94a3b8" : color,
          paddingVertical: 16,
          paddingHorizontal: 24,
          minHeight: 58,
          shadowColor: color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: disabled || loading ? 0 : 0.25,
          shadowRadius: 8,
          elevation: disabled || loading ? 0 : 4,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <View
            className="flex-row items-center justify-center"
            style={{ gap: 10 }}
          >
            {icon && <View style={{ opacity: 1 }}>{icon}</View>}
            <Text className="text-white text-lg font-black tracking-wide">
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Skeleton Loading Framework ───────────────────────────────────────────────

function SkeletonBlock({
  h,
  w = "100%",
  radius = 8,
  mb = 0,
}: {
  h: number;
  w?: any;
  radius?: number;
  mb?: number;
}) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  return (
    <Animated.View
      style={{
        height: h,
        width: w,
        borderRadius: radius,
        backgroundColor: "#e2e8f0",
        marginBottom: mb,
        opacity,
      }}
    />
  );
}

function DashboardSkeleton() {
  return (
    <View className="px-1 pt-2">
      <SkeletonBlock h={24} w="45%" mb={12} />
      <SkeletonBlock h={32} w="65%" mb={32} radius={6} />
      <View className="flex-row mb-6" style={{ gap: 12 }}>
        <View style={{ flex: 1 }}>
          <SkeletonBlock h={115} radius={18} />
        </View>
        <View style={{ flex: 1 }}>
          <SkeletonBlock h={115} radius={18} />
        </View>
        <View style={{ flex: 1 }}>
          <SkeletonBlock h={115} radius={18} />
        </View>
      </View>
      <SkeletonBlock h={175} radius={24} mb={24} />
      <SkeletonBlock h={58} radius={16} mb={14} />
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AgentDashboard() {
  const theme = useTheme();
  const colors = theme.colors as ThemeColors;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>(null);
  const [agentName, setAgentName] = useState("Agent");
  const [totalInspections, setTotalInspections] = useState(0);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [propertyAddress, setPropertyAddress] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const sidebarX = useRef(new Animated.Value(-width)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(25)).current;

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(cardSlide, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleSidebar = () => {
    const open = !isSidebarVisible;
    Animated.timing(sidebarX, {
      toValue: open ? 0 : -width,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setIsSidebarVisible(open));
  };

  const getToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    return user.getIdToken();
  };

  const syncPushToken = async () => {
    try {
      const pushData = await registerForPushNotificationsAsync();
      if (!pushData) return;
      const payload: Record<string, string> = { platform: pushData.platform };
      if (pushData.platform === "ios") payload.expoPushToken = pushData.token;
      else payload.fcmToken = pushData.token;
      await API.post("/notifications/agent", payload);
    } catch {
      // Background operation configuration safe fallback
    }
  };

  const fetchDashboardData = useCallback(async (isRefreshFlow = false) => {
    try {
      setErrorMsg(null);
      if (isRefreshFlow) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = await getToken();
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };

      const [profileResponse, liveStatusResponse] = await Promise.all([
        API.get("/agent/profile", authHeader),
        API.get("/agent/live", authHeader),
      ]);

      const profileData = profileResponse.data;
      const liveData = liveStatusResponse.data;

      setProfile(profileData);
      if (profileData?.name) {
        setAgentName(profileData.name.split(" ")[0] || "Agent");
      } else {
        setAgentName("Agent");
      }

      setAgentStatus(liveData.status ?? null);
      setRequestId(liveData.requestId ?? null);
      setTotalInspections(liveData.totalInspections ?? 0);
      setPendingAmount(liveData.pendingAmount ?? null);
      setPropertyAddress(liveData.propertyAddress ?? null);
      setClientName(liveData.clientName ?? null);

      animateIn();
    } catch (err: any) {
      console.error("Dashboard engine sync failure:", err);
      setErrorMsg(
        err.response?.data?.message ??
          err.message ??
          "Failed to fetch live updates",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    fetchDashboardData(true);
  };

  const startInspection = async () => {
    try {
      setActionLoading(true);
      const user = auth.currentUser;
      if (!user || !requestId)
        throw new Error("Missing active request credentials");
      const token = await getToken();

      await API.post(
        "/client/inspection/start",
        { requestId, agentId: user.uid },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await fetchDashboardData(true);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ?? "Failed to start inspection session",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const endInspection = async () => {
    try {
      setActionLoading(true);
      const user = auth.currentUser;
      if (!user || !requestId)
        throw new Error("Missing structural request token context");
      const token = await getToken();

      await API.post(
        "/client/inspection/end",
        { requestId, agentId: user.uid },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await fetchDashboardData(true);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ??
          "Failed to terminate inspection workflow",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const triggerPayment = async () => {
    try {
      setPaying(true);
      setErrorMsg(null);
      const user = auth.currentUser;
      if (!user) throw new Error("User verification failed");

      const res = await API.post("/payment/pay", { agentId: user.uid });
      const { paymentUrl } = res.data;
      if (!paymentUrl) throw new Error("No gateway endpoint verified");

      await WebBrowser.openBrowserAsync(paymentUrl);
      setTimeout(() => fetchDashboardData(true), 3000);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ??
          "Payment gateway pipeline failed. Please retry.",
      );
    } finally {
      setPaying(false);
    }
  };

  useEffect(() => {
    syncPushToken();
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const isSuspended = agentStatus === "suspended";
  const isMatched = agentStatus === "matched";
  const isInspecting = agentStatus === "inspection_started";
  const highContrastSubtitle = "#475569";

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* ── Header View Block ── */}
      <View
        className="flex-row justify-between items-center px-6 pb-5"
        style={{
          paddingTop: 60,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View>
          <Text
            className="text-2xl font-black tracking-tight"
            style={{ color: colors.text }}
          >
            Dwellify
          </Text>
          <Text
            className="font-black tracking-widest uppercase mt-1"
            style={{ color: highContrastSubtitle, fontSize: 11 }}
          >
            Agent Portal
          </Text>
        </View>

        {/* Scaled touch targets (48x48) */}
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            className="w-12 h-12 rounded-full items-center justify-center border"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Bell size={24} color={colors.text} weight="regular" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            className="w-12 h-12 rounded-full items-center justify-center border"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            onPress={toggleSidebar}
          >
            <List size={26} color={colors.text} weight="regular" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Primary Container View Scroll Engine ── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 28,
          paddingBottom: 44,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {loading ? (
          <DashboardSkeleton />
        ) : (
          <Animated.View
            style={{
              opacity: headerFade,
              transform: [{ translateY: cardSlide }],
            }}
          >
            {/* Greeting Header Segment */}
            <View className="flex-row justify-between items-center mb-8">
              <View>
                <Text
                  className="text-base font-bold mb-0.5"
                  style={{ color: highContrastSubtitle }}
                >
                  {greeting},
                </Text>
                <Text
                  className="text-3xl font-black tracking-tight"
                  style={{ color: colors.text }}
                >
                  {agentName} 👋
                </Text>
              </View>
              <StatusPill status={agentStatus} />
            </View>

            {/* Error messaging Banner */}
            {errorMsg && (
              <View
                className="flex-row items-center rounded-2xl px-5 py-4 mb-6 border"
                style={{
                  backgroundColor: "#fef2f2",
                  borderColor: "#fecaca",
                  gap: 12,
                }}
              >
                <XCircle size={24} color="#991b1b" weight="fill" />
                <Text
                  className="flex-1 text-base font-bold leading-6"
                  style={{ color: "#991b1b" }}
                >
                  {errorMsg}
                </Text>
              </View>
            )}

            {/* Application Metric Matrix Cards */}
            <View className="flex-row mb-6" style={{ gap: 12 }}>
              <StatCard
                icon={<CheckCircle size={24} color="#166534" weight="bold" />}
                label="Completed"
                value={String(totalInspections)}
                accent="#22c55e"
                colors={colors}
              />
              {pendingAmount !== null && (
                <StatCard
                  icon={<CurrencyNgn size={24} color="#b45309" weight="bold" />}
                  label="Due Balance"
                  value={`₦${pendingAmount.toLocaleString()}`}
                  accent="#f59e0b"
                  colors={colors}
                />
              )}
              <StatCard
                icon={<Buildings size={24} color="#1d4ed8" weight="bold" />}
                label="Listings"
                value="—"
                accent="#3b82f6"
                colors={colors}
              />
            </View>

            {/* Managed Active Request Layout */}
            {(isMatched || isInspecting) && requestId && (
              <View
                className="rounded-2xl p-6 mb-6 border"
                style={{
                  backgroundColor: "#fffbeb",
                  borderColor: "#fde68a",
                  shadowColor: "#b45309",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <View
                  className="flex-row items-center mb-4"
                  style={{ gap: 10 }}
                >
                  <HouseSimple size={24} color="#92400e" weight="duotone" />
                  <Text
                    className="text-base font-black tracking-tight"
                    style={{ color: "#92400e" }}
                  >
                    {isMatched
                      ? "New Inspection Request"
                      : "Inspection In Progress"}
                  </Text>
                </View>

                <View
                  className="h-px mb-4"
                  style={{ backgroundColor: "#fde68a" }}
                />

                {clientName && (
                  <View className="flex-row justify-between items-center mb-3.5">
                    <Text
                      className="font-bold uppercase tracking-wider"
                      style={{ color: "#b45309", fontSize: 12 }}
                    >
                      Client Name
                    </Text>
                    <Text
                      className="text-base font-black"
                      style={{ color: "#78350f" }}
                    >
                      {clientName}
                    </Text>
                  </View>
                )}

                {propertyAddress && (
                  <View
                    className="flex-row items-start mb-4"
                    style={{ gap: 8 }}
                  >
                    <MapPin
                      size={18}
                      color="#b45309"
                      style={{ marginTop: 2 }}
                      weight="fill"
                    />
                    <Text
                      className="flex-1 text-base font-semibold leading-6"
                      style={{ color: "#78350f" }}
                      numberOfLines={3}
                    >
                      {propertyAddress}
                    </Text>
                  </View>
                )}

                <View className="flex-row justify-between items-center mt-2">
                  <Text
                    className="font-bold uppercase tracking-wider"
                    style={{ color: "#b45309", fontSize: 12 }}
                  >
                    Request Reference
                  </Text>
                  <Text
                    className="text-sm font-mono font-black"
                    style={{ color: "#78350f", letterSpacing: 0.5 }}
                  >
                    #{requestId.slice(-8).toUpperCase()}
                  </Text>
                </View>
              </View>
            )}

            {/* Account Suspension Alert Card */}
            {isSuspended && (
              <View
                className="flex-row items-start rounded-2xl p-6 mb-6 border"
                style={{
                  backgroundColor: "#fef2f2",
                  borderColor: "#fecaca",
                  gap: 14,
                }}
              >
                <Warning size={26} color="#991b1b" weight="fill" />
                <View className="flex-1">
                  <Text
                    className="text-base font-black mb-1"
                    style={{ color: "#991b1b" }}
                  >
                    Portal Restricted
                  </Text>
                  <Text
                    className="text-sm font-semibold leading-6"
                    style={{ color: "#b91c1c" }}
                  >
                    Your account routing status is suspended due to an
                    outstanding billing statement. Clear the balance context
                    below to open background matching queues.
                  </Text>
                </View>
              </View>
            )}

            {/* Dynamic CTA Operations Wrapper */}
            <View className="mb-6" style={{ gap: 14 }}>
              {isSuspended && (
                <ActionButton
                  label="Pay Outstanding Balance"
                  onPress={triggerPayment}
                  color={colors.primary}
                  loading={paying}
                  icon={<CurrencyNgn size={22} color="#fff" weight="bold" />}
                />
              )}
              {isMatched && requestId && (
                <ActionButton
                  label="Begin Inspection"
                  onPress={startInspection}
                  color="#166534"
                  loading={actionLoading}
                  icon={<HouseSimple size={22} color="#fff" weight="bold" />}
                />
              )}
              {isInspecting && requestId && (
                <ActionButton
                  label="Complete Inspection"
                  onPress={endInspection}
                  color="#1e40af"
                  loading={actionLoading}
                  icon={<CheckCircle size={22} color="#fff" weight="bold" />}
                />
              )}
            </View>

            {/* Information Context Tooltip Strip */}
            <View
              className="rounded-2xl p-5 border"
              style={{
                backgroundColor: "#f0fdf4",
                borderColor: "#bbf7d0",
              }}
            >
              <Text
                className="text-sm font-extrabold uppercase tracking-wider mb-1.5"
                style={{ color: "#166534" }}
              >
                💡 System Notice
              </Text>
              <Text
                className="text-sm font-semibold leading-6"
                style={{ color: "#15803d" }}
              >
                Pull down inside the viewport window context to manually query
                database updates. Proximity matching queues run automatically
                when availability is set to open.
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* ── App Navigation Drawer System ── */}
      <Sidebar
        visible={isSidebarVisible}
        translateX={sidebarX}
        onOverlayPress={toggleSidebar}
        name={agentName}
        items={[
          { label: "Dashboard", icon: "House" },
          { label: "My Listings", icon: "Buildings" },
          { label: "Earnings", icon: "CurrencyNgn" },
          { label: "Settings", icon: "Gear" },
          { label: "Logout", icon: "SignOut" },
        ]}
        rating={5}
        buttonName="View Profile"
        buttonOnPress={() => console.log("Profile action requested")}
      />
    </View>
  );
}
