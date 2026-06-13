import { useTheme } from "@/hooks/use-theme";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { CheckIcon } from "phosphor-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { API } from "../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScreenState = "loading" | "awaiting" | "timeout" | "error" | "matched";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMER_DURATION = 60; // seconds
const POLL_INTERVAL_MS = 3000;
const RING_RADIUS = 34;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const ACCEPTED_STATUSES = new Set([
  "matched",
  "inspection_started",
  "accepted",
  "active",
]);

// ─── Component ────────────────────────────────────────────────────────────────

const ClientPaymentStartInspection: React.FC = () => {
  const { colors } = useTheme();
  const params = useLocalSearchParams();

  const requestId = params.requestId as string;
  const agentId = params.agentId as string;
  const propertyType = params.propertyType as string;
  const lat = params.lat as string;
  const lng = params.lng as string;
  const agentName = (params.name as string) || "";
  const agentAgency = (params.agency as string) || "Dwellify Realty";
  const rating = (params.rating as string) || "";
  // const agentDistance = (params.distance as string) || "";
  const agentPhoneNumber = (params.phone as string) || "";

  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [cancelling, setCancelling] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const cleanUpTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ─── Timer ───────────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    // Always reset before starting to avoid double-intervals
    cleanUpTimers();
    setTimeLeft(TIMER_DURATION);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Don't call cleanUpTimers here — causes race with the ref write
          // The effect below handles expiry via screenState change
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [cleanUpTimers]);

  // When timeLeft hits 0, transition to timeout state and stop everything
  useEffect(() => {
    if (timeLeft === 0 && screenState === "awaiting") {
      cleanUpTimers();
      if (mountedRef.current) setScreenState("timeout");
    }
  }, [timeLeft, screenState, cleanUpTimers]);

  // ─── Polling ─────────────────────────────────────────────────────────────

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await API.get("/client/live");
        const data = res.data;

        if (!mountedRef.current) return;

        if (data?.requestStatus && ACCEPTED_STATUSES.has(data.requestStatus)) {
          cleanUpTimers();
          setScreenState("matched");
        }
      } catch (err) {
        console.log("[Polling] error:", err);
      }
    }, POLL_INTERVAL_MS);
  }, [cleanUpTimers]);

  // ─── Send Request ─────────────────────────────────────────────────────────

  const sendInspectionRequest = useCallback(async () => {
    if (!requestId || !agentId) {
      setError("Missing identity parameters (requestId or agentId).");
      setScreenState("error");
      return;
    }

    setScreenState("loading");
    setError(null);

    try {
      await API.post("/notifications/request", {
        requestId,
        agentId,
        propertyType,
        lat: Number(lat),
        lng: Number(lng),
      });

      if (!mountedRef.current) return;

      setScreenState("awaiting");
      startTimer();
      startPolling();
    } catch (e: any) {
      if (!mountedRef.current) return;
      const message =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to send inspection request.";
      setError(message);
      setScreenState("error");
    }
  }, [requestId, agentId, propertyType, lat, lng, startTimer, startPolling]);

  // ─── Cancel ───────────────────────────────────────────────────────────────

  const handleCancelRequest = useCallback(async () => {
    cleanUpTimers();
    setCancelling(true);

    try {
      await API.post(`/match/cancel/${requestId}`);
      router.replace("/(client)/dashboard");
    } catch (e: any) {
      console.log("[Cancel] endpoint error:", e?.message);
      Alert.alert(
        "Feature Coming Soon",
        "Live cancellation is being finalized. Returning you to the dashboard.",
        [{ text: "OK", onPress: () => router.replace("/(client)/dashboard") }],
      );
    } finally {
      if (mountedRef.current) setCancelling(false);
    }
  }, [requestId, cleanUpTimers]);

  // ─── Mount / Unmount ──────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    sendInspectionRequest();

    return () => {
      mountedRef.current = false;
      cleanUpTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const ringOffset = RING_CIRCUMFERENCE * (1 - timeLeft / TIMER_DURATION);

  const ringColor = timeLeft <= 10 ? "#E24B4A" : colors.primary;

  const agentInitials =
    agentName
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "DA";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flex: 1,
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingVertical: 20,
        }}
      >
        {/* ── Header ── */}
        <View style={{ alignItems: "center", marginTop: 4 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 11,
              letterSpacing: 1.5,
              opacity: 0.45,
              fontWeight: "600",
              textTransform: "uppercase",
            }}
          >
            Dwellify Inspection Request
          </Text>
        </View>

        {/* ── Body ── */}
        <View
          style={{ alignItems: "center", justifyContent: "center", flex: 1 }}
        >
          {/* CASE 1: LOADING */}
          {screenState === "loading" && (
            <View style={{ alignItems: "center" }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={{
                  color: colors.text,
                  marginTop: 24,
                  fontSize: 20,
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                Securing Your Connection
              </Text>
              <Text
                style={{
                  color: colors.text,
                  marginTop: 8,
                  fontSize: 14,
                  textAlign: "center",
                  opacity: 0.55,
                  maxWidth: 280,
                  lineHeight: 22,
                }}
              >
                Routing coordination parameters to your matched agent.
              </Text>
            </View>
          )}

          {/* CASE 2: AWAITING (countdown + polling) */}
          {(screenState === "awaiting" || screenState === "matched") && (
            <View style={{ alignItems: "center", width: "100%" }}>
              {/* Animated SVG ring countdown */}
              <View
                style={{
                  marginBottom: 24,
                  position: "relative",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Svg width={88} height={88} viewBox="0 0 80 80">
                  {/* Background track */}
                  <Circle
                    cx={40}
                    cy={40}
                    r={RING_RADIUS}
                    fill="none"
                    stroke={colors.border || "#e5e5e5"}
                    strokeWidth={3}
                  />
                  {/* Progress arc */}
                  <Circle
                    cx={40}
                    cy={40}
                    r={RING_RADIUS}
                    fill="none"
                    stroke={screenState === "matched" ? "#22c55e" : ringColor}
                    strokeWidth={3}
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={
                      screenState === "matched" ? 0 : ringOffset
                    }
                    strokeLinecap="round"
                    rotation={-90}
                    origin="40, 40"
                  />
                </Svg>
                {/* Timer text overlaid in the center */}
                <View
                  style={{
                    position: "absolute",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 88,
                    height: 88,
                  }}
                >
                  {screenState === "matched" ? (
                    <CheckIcon size={28} color="#22c55e" weight="bold" />
                  ) : (
                    <Text
                      style={{
                        color: timeLeft <= 10 ? "#E24B4A" : colors.primary,
                        fontSize: 18,
                        fontWeight: "700",
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {formatTime(timeLeft)}
                    </Text>
                  )}
                </View>
              </View>

              <Text
                style={{
                  color: colors.text,
                  fontSize: 22,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                {screenState === "matched"
                  ? "Match Confirmed!"
                  : "Awaiting Agent Confirmation"}
              </Text>

              <Text
                style={{
                  color: colors.text,
                  marginTop: 10,
                  fontSize: 14,
                  textAlign: "center",
                  opacity: 0.55,
                  maxWidth: 280,
                  lineHeight: 22,
                }}
              >
                {screenState === "matched"
                  ? "The agent has accepted your request. You're all set."
                  : "A notification has been sent to the agent. Waiting for their response."}
              </Text>

              {/* Agent info card — shown when name is available OR matched */}
              {screenState === "matched" && (
                <View
                  style={{
                    marginTop: 24,
                    width: "100%",
                    backgroundColor: colors.background,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border || "#e5e5e5",
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 14,
                    shadowColor: colors.text,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 3,
                    elevation: 2,
                  }}
                >
                  {/* Avatar Container */}
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      backgroundColor: colors.primary + "15",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: colors.primary + "25",
                    }}
                  >
                    <Text
                      style={{
                        color: colors.primary,
                        fontWeight: "700",
                        fontSize: 14,
                        letterSpacing: 0.5,
                      }}
                    >
                      {agentInitials?.toUpperCase() || "A"}
                    </Text>
                  </View>

                  {/* Info Content Column */}
                  <View style={{ flex: 1, justifyContent: "center" }}>
                    {/* Header Row: Name & Rating */}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 3,
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          color: colors.text,
                          fontWeight: "700",
                          fontSize: 15,
                          flex: 1,
                          marginRight: 8,
                        }}
                      >
                        {agentName || "Your Matched Agent"}
                      </Text>

                      {rating && (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <Text style={{ fontSize: 12 }}>⭐</Text>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: "600",
                              color: colors.text,
                            }}
                          >
                            {rating}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Agency Details */}
                    {agentAgency && (
                      <Text
                        numberOfLines={1}
                        style={{
                          color: colors.text,
                          opacity: 0.6,
                          fontSize: 13,
                          fontWeight: "500",
                          marginBottom: 6,
                        }}
                      >
                        {agentAgency}
                      </Text>
                    )}

                    {/* Subtle Inner Divider */}
                    <View
                      style={{
                        height: 1,
                        backgroundColor: colors.border || "#e5e5e5",
                        marginVertical: 4,
                        opacity: 0.6,
                      }}
                    />

                    {agentPhoneNumber ? (
                      <Pressable
                        onPress={async () => {
                          await Clipboard.setStringAsync(agentPhoneNumber);
                          Alert.alert(
                            "Copied",
                            "Phone number copied to clipboard!",
                          );
                        }}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          alignSelf: "flex-start",
                          backgroundColor: colors.primary + "12",
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                          marginTop: 8,
                          gap: 6,
                          opacity: pressed ? 0.6 : 1,
                        })}
                      >
                        <Text
                          numberOfLines={1}
                          style={{
                            color: colors.primary,
                            fontSize: 12,
                            fontWeight: "700",
                            letterSpacing: 0.2,
                          }}
                        >
                          {agentPhoneNumber}
                        </Text>

                        <Text
                          style={{
                            color: colors.primary,
                            opacity: 0.6,
                            fontSize: 11,
                            fontWeight: "500",
                          }}
                        >
                          • Copy
                        </Text>
                      </Pressable>
                    ) : (
                      <Text
                        style={{
                          color: colors.text,
                          opacity: 0.4,
                          fontSize: 12,
                          fontWeight: "500",
                          marginTop: 8,
                          fontStyle: "italic",
                        }}
                      >
                        Phone number unavailable
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* CASE 3: TIMEOUT */}
          {screenState === "timeout" && (
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 44, marginBottom: 16 }}>⌛</Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 22,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                Agent Unresponsive
              </Text>
              <Text
                style={{
                  color: colors.text,
                  marginTop: 10,
                  fontSize: 14,
                  textAlign: "center",
                  opacity: 0.55,
                  maxWidth: 280,
                  lineHeight: 22,
                }}
              >
                The session timed out after 60 seconds. Return to your dashboard
                to start a new request.
              </Text>
            </View>
          )}

          {/* CASE 4: ERROR */}
          {screenState === "error" && (
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  height: 60,
                  width: 60,
                  borderRadius: 30,
                  backgroundColor: "#FEE2E2",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <Text style={{ fontSize: 26 }}>⚠️</Text>
              </View>

              <Text
                style={{
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                Transmission Error
              </Text>

              <Text
                style={{
                  color: "#E24B4A",
                  fontSize: 13,
                  textAlign: "center",
                  marginTop: 8,
                  paddingHorizontal: 16,
                  lineHeight: 20,
                }}
              >
                {error}
              </Text>
            </View>
          )}
        </View>

        {/* ── Footer Controls ── */}
        <View style={{ width: "100%", paddingHorizontal: 0, gap: 10 }}>
          {/* Awaiting → Cancel */}
          {screenState === "awaiting" && (
            <Pressable
              onPress={handleCancelRequest}
              disabled={cancelling}
              className="w-full py-4 rounded-lg items-center bg-red-500"
              style={({ pressed }) => ({
                borderWidth: 1,
                borderColor: colors.border || "#e5e5e5",
                opacity: pressed || cancelling ? 0.6 : 1,
              })}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  Cancel Request
                </Text>
              )}
            </Pressable>
          )}

          {/* Matched → Go to Dashboard */}
          {screenState === "matched" && (
            <Pressable
              onPress={() => router.replace("/(client)/dashboard")}
              style={({ pressed }) => ({
                width: "100%",
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                Continue to Dashboard
              </Text>
            </Pressable>
          )}

          {/* Timeout → Rematch */}
          {screenState === "timeout" && (
            <Pressable
              onPress={() => router.replace("/(client)/dashboard")}
              style={({ pressed }) => ({
                width: "100%",
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                Rematch & Rebook
              </Text>
            </Pressable>
          )}

          {/* Error → Retry + Dashboard */}
          {screenState === "error" && (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => router.replace("/(client)/dashboard")}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border || "#e5e5e5",
                  backgroundColor: colors.background,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  Dashboard
                </Text>
              </Pressable>

              <Pressable
                onPress={sendInspectionRequest}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}
                >
                  Retry Request
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ClientPaymentStartInspection;
