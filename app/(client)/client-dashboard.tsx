import BottomSheet, { BottomSheetRefProps } from "@/components/bottom-sheet";
import ClientEvent from "@/components/client-event";
import Sidebar from "@/components/sidebar/sidebar";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { auth } from "../../config/firebase";
import { API } from "../../services/api";
import { registerForPushNotificationsAsync } from "../../services/notification";

// ─── Constants ────────────────────────────────────────────────────────────────

const PROPERTY_TYPES = ["Hotel", "Apartment", "Shortlet"] as const;
type PropertyType = (typeof PROPERTY_TYPES)[number];

// ─── Types ────────────────────────────────────────────────────────────────────

type Agent = {
  agentId: string;
  name: string;
  phone: string;
  email: string;
  agencyName: string;
  rating: number;
  distanceKm: number;
};

type LiveAgent = {
  name: string;
  phone: string;
  lat: number;
  lng: number;
};

type LiveData = {
  requestStatus: string;
  lat: number;
  lng: number;
  agent: LiveAgent | null;
};

type MatchRequest = {
  requestId: string;
  lat: number;
  lng: number;
  propertyType: PropertyType;
  status: string;
};

type MatchData = {
  request: MatchRequest;
  agent: Agent;
};

type Coords = {
  lat: number;
  lng: number;
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getRealAddress = async (lat: number, lng: number): Promise<string> => {
  try {
    const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`,
    );
    const data = await res.json();
    return data.results?.[0]?.formatted_address ?? "Address not found";
  } catch {
    return "Address unavailable";
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RequestMatchScreen() {
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [selectedType, setSelectedType] = useState<PropertyType>("Hotel");
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [agentLocation, setAgentLocation] = useState<Coords | null>(null);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [lastKnownLocation, setLastKnownLocation] = useState<Coords | null>(
    null,
  );
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  const ref = useRef<BottomSheetRefProps | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const router = useRouter();
  const { colors } = useTheme();
  const { height: SCREEN_HEIGHT, width } = Dimensions.get("window");
  const sidebarX = useRef(new Animated.Value(-width)).current;

  const SNAP_50 = -SCREEN_HEIGHT * 0.59;
  const SNAP_80 = -SCREEN_HEIGHT * 0.8;

  // ─── Preserve last known agent location ───────────────────────────────────

  useEffect(() => {
    if (agentLocation?.lat != null && agentLocation?.lng != null) {
      setLastKnownLocation(agentLocation);
    }
  }, [agentLocation]);

  // ─── Sidebar ──────────────────────────────────────────────────────────────

  const toggleSidebar = () => {
    const toOpen = !isSidebarVisible;
    if (toOpen) setIsSidebarVisible(true);

    Animated.timing(sidebarX, {
      toValue: toOpen ? 0 : -width,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (!toOpen) setIsSidebarVisible(false);
    });
  };

  const sidebarItems = [
    {
      label: "Home",
      icon: "House" as const,
      onPress: () => {
        toggleSidebar();
        router.push("/(client)/client-dashboard");
      },
      isActive: true,
    },
    {
      label: "History",
      icon: "ClockCounterClockwise" as const,
      onPress: () => {
        toggleSidebar();
        router.push("/(client)/history");
      },
    },
    {
      label: "Profile",
      icon: "UserCircle" as const,
      onPress: () => {
        toggleSidebar();
        router.push("/(client)/profile");
      },
    },
  ];

  // ─── Push Token Sync ──────────────────────────────────────────────────────

  const syncPushToken = async (): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log("[Push Sync]: Deferred — no authenticated user context");
        return;
      }

      const pushData = await registerForPushNotificationsAsync();
      if (!pushData) return;

      const payload =
        pushData.platform === "ios"
          ? { platform: pushData.platform, expoPushToken: pushData.token }
          : { platform: pushData.platform, fcmToken: pushData.token };

      const token = await user.getIdToken();
      await API.post("/notifications/client", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Client device registered and token synced");
    } catch (err: unknown) {
      const error = err as ApiError;
      console.log(
        "❌ Push token sync failed:",
        error?.response?.data ?? error.message,
      );
    }
  };

  // ─── Location ─────────────────────────────────────────────────────────────

  const getLocation = async (): Promise<void> => {
    try {
      setLocationLoading(true);

      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        const res = await Location.requestForegroundPermissionsAsync();
        status = res.status;
      }

      if (status !== "granted") {
        Alert.alert("Permission required", "Enable location to continue");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = loc.coords;
      setLat(latitude);
      setLng(longitude);

      mapRef.current?.animateToRegion(
        { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        800,
      );

      const realAddress = await getRealAddress(latitude, longitude);
      setAddress(realAddress);
    } catch (error: unknown) {
      Alert.alert("Error", "Failed to get location");
      console.error(error);
    } finally {
      setLocationLoading(false);
    }
  };

  // ─── Map fit helper ───────────────────────────────────────────────────────

  const fitMapToMarkers = (
    clientLat: number,
    clientLng: number,
    agentLat: number,
    agentLng: number,
  ): void => {
    mapRef.current?.fitToCoordinates(
      [
        { latitude: clientLat, longitude: clientLng },
        { latitude: agentLat, longitude: agentLng },
      ],
      {
        edgePadding: { top: 100, right: 100, bottom: 300, left: 100 },
        animated: true,
      },
    );
  };

  // ─── Polling ──────────────────────────────────────────────────────────────

  // Wrapped in useCallback so the interval effect doesn't get a stale closure
  const getLiveData = useCallback(async (): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const res = await API.get<LiveData>("/client/live", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      setLiveData(data);
      setRequestStatus(data.requestStatus);

      if (data.agent) {
        setAgentLocation({ lat: data.agent.lat, lng: data.agent.lng });
        // liveData carries client coords at top-level lat/lng
        fitMapToMarkers(data.lat, data.lng, data.agent.lat, data.agent.lng);
      }
    } catch (err: unknown) {
      const error = err as ApiError;
      console.log("Polling error:", error?.response?.data ?? error.message);
    }
  }, []);

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    getLocation();
    syncPushToken();

    const timer = setTimeout(() => {
      ref.current?.scrollTo(SNAP_50);
    }, 100);

    return () => clearTimeout(timer);
    // SNAP_50 derives from SCREEN_HEIGHT which never changes at runtime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(getLiveData, 5000);
    return () => clearInterval(interval);
  }, [getLiveData]);

  // ─── Match Request ────────────────────────────────────────────────────────

  const handleRequest = async (): Promise<void> => {
    if (lat == null || lng == null) {
      Alert.alert("Error", "Location not available");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Authentication Error", "Please sign in again");
      return;
    }

    try {
      setLoading(true);
      setMatchData(null);
      setLiveData(null); // clear stale polling data alongside

      const token = await user.getIdToken();
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };

      const createRes = await API.post<{ requestId: string }>(
        "/match/request",
        { lat, lng, propertyType: selectedType },
        authHeader,
      );

      const { requestId } = createRes.data;
      if (!requestId) throw new Error("No requestId returned from server");

      console.log("REQUEST ID:", requestId);

      const matchRes = await API.post<{ request: MatchRequest; agent: Agent }>(
        `/match/match/${requestId}`,
        {},
        authHeader,
      );

      const { request, agent } = matchRes.data;

      if (!agent) {
        Alert.alert("No Agent", "No agents available — try again later");
        return;
      }

      setMatchData({ request, agent });
    } catch (err: unknown) {
      const error = err as ApiError;
      Alert.alert(
        "Error",
        error?.response?.data?.message ??
          "No agents are currently available for this property type. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Derived marker state ─────────────────────────────────────────────────

  // Prefer live location; fall back to last known; null if neither is available
  const resolvedAgentLat = agentLocation?.lat ?? lastKnownLocation?.lat ?? null;
  const resolvedAgentLng = agentLocation?.lng ?? lastKnownLocation?.lng ?? null;
  const agentIsLive = agentLocation != null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Sidebar toggle */}
      <TouchableOpacity
        onPress={toggleSidebar}
        activeOpacity={0.8}
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 30,
          padding: 10,
          marginVertical: 30,
          marginHorizontal: 12,
          borderRadius: 12,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {[22, 16, 22].map((w, i) => (
          <View
            key={i}
            style={{
              width: w,
              height: 2.5,
              backgroundColor: colors.text,
              marginBottom: i < 2 ? 4 : 0,
              borderRadius: 2,
            }}
          />
        ))}
      </TouchableOpacity>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        showsUserLocation={false}
        showsCompass={false}
        showsMyLocationButton={false}
        loadingEnabled
        mapPadding={{ top: 0, right: 0, left: 0, bottom: 320 }}
        initialRegion={{
          latitude: lat ?? 4.8156,
          longitude: lng ?? 7.0498,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {lat != null && lng != null && (
          <Marker
            coordinate={{ latitude: lat, longitude: lng }}
            title="You"
            description="Your Location"
          />
        )}

        {liveData?.agent != null &&
          resolvedAgentLat != null &&
          resolvedAgentLng != null && (
            <Marker
              coordinate={{
                latitude: resolvedAgentLat,
                longitude: resolvedAgentLng,
              }}
              title={liveData.agent.name}
              description={
                agentIsLive
                  ? liveData.agent.phone
                  : `${liveData.agent.phone} (Offline — Last Known Location)`
              }
              pinColor={agentIsLive ? "green" : "orange"}
            />
          )}
      </MapView>

      {/* Bottom sheet */}
      <BottomSheet ref={ref}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          bounces={false}
          overScrollMode="never"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <ClientEvent
            locationLoading={locationLoading}
            address={address}
            getLocation={getLocation}
            PROPERTY_TYPES={PROPERTY_TYPES}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            handleRequest={handleRequest}
            loading={loading}
            setMatchData={setMatchData}
            matchData={matchData ?? liveData}
            requestStatus={requestStatus}
          />
        </ScrollView>
      </BottomSheet>

      {/* Sidebar */}
      <Sidebar
        visible={isSidebarVisible}
        name={auth.currentUser?.displayName ?? "Client"}
        rating={5}
        translateX={sidebarX}
        onOverlayPress={toggleSidebar}
        items={sidebarItems}
      />
    </View>
  );
}
