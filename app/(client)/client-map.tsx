import ClientEvent from "@/components/client-event";
import BottomModal from "@/components/dialogs/bottom-modal";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useTheme } from "@react-navigation/native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { MapPinIcon } from "lucide-react-native";
import { auth } from "../../config/firebase";
import { API } from "../../services/api";
import { registerForPushNotificationsAsync } from "../../services/notification";

const PROPERTY_TYPES = ["Hotel", "Apartment", "Shortlet", "Land"] as const;
type PropertyType = (typeof PROPERTY_TYPES)[number];

const SHEET_RAISE_DELAY_MS = 600;
const SHEET_RAISE_FALLBACK_MS = 2000;

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
  requestId?: string | null;
  requestStatus: string;
  message?: string | null;
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
      error?: string;
    };
  };
  message: string;
};

async function getRealAddress(lat: number, lng: number): Promise<string> {
  try {
    const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) return "Address unavailable";

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`,
    );

    if (!response.ok) return "Address unavailable";

    const data = await response.json();

    return data.status === "OK"
      ? (data.results?.[0]?.formatted_address ?? "Address not found")
      : "Address not found";
  } catch {
    return "Address unavailable";
  }
}

async function getCoordsFromAddress(query: string): Promise<Coords | null> {
  try {
    const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) return null;

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query,
      )}&key=${key}`,
    );

    if (!response.ok) return null;

    const data = await response.json();
    const location =
      data.status === "OK" ? data.results?.[0]?.geometry?.location : null;

    return location ? { lat: location.lat, lng: location.lng } : null;
  } catch {
    return null;
  }
}

function getAreaName(address: string): string {
  if (
    !address ||
    address === "Address unavailable" ||
    address === "Address not found"
  ) {
    return "Selected location";
  }

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 1 ? parts[1] : parts[0];
}

function PropertyPin({ color, label }: { color: string; label: string }) {
  return (
    <View style={pinStyles.wrapper}>
      <View
        style={[
          pinStyles.head,
          {
            backgroundColor: color,
          },
        ]}
      >
        {/* Small house symbol */}
        <View style={pinStyles.house}>
          <View style={[pinStyles.roofLeft, { backgroundColor: "#FFFFFF" }]} />
          <View style={[pinStyles.roofRight, { backgroundColor: "#FFFFFF" }]} />
          <View style={pinStyles.houseBody}>
            <View style={pinStyles.door} />
          </View>
        </View>
      </View>

      <View
        style={[
          pinStyles.tip,
          {
            backgroundColor: color,
          },
        ]}
      />

      <View style={pinStyles.shadow} />
    </View>
  );
}

export default function RequestMatchScreen() {
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  const [gpsCoords, setGpsCoords] = useState<Coords | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<Coords | null>(null);

  const [address, setAddress] = useState("");
  const [areaName, setAreaName] = useState("Finding your location...");
  const [addressLoading, setAddressLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<PropertyType>("Hotel");

  const [searchText, setSearchText] = useState("Finding your location...");
  const [isEditingSearch, setIsEditingSearch] = useState(false);
  const [searching, setSearching] = useState(false);

  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [agentLocation, setAgentLocation] = useState<Coords | null>(null);
  const [lastKnownLocation, setLastKnownLocation] = useState<Coords | null>(
    null,
  );

  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [sheetCollapsed, setSheetCollapsed] = useState(false);

  const mapRef = useRef<MapView | null>(null);
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const selectedCoordsRef = useRef<Coords | null>(null);
  const gpsCoordsRef = useRef<Coords | null>(null);
  const agentLocationRef = useRef<Coords | null>(null);
  const lastKnownLocationRef = useRef<Coords | null>(null);

  const userInteractingRef = useRef(false);
  const raiseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressRequestRef = useRef(0);
  const locationRequestRef = useRef(0);

  const clearSheetTimers = useCallback(() => {
    if (raiseTimerRef.current) clearTimeout(raiseTimerRef.current);
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);

    raiseTimerRef.current = null;
    fallbackTimerRef.current = null;
  }, []);

  const releaseMap = useCallback(() => {
    clearSheetTimers();
    userInteractingRef.current = false;
    setSheetCollapsed(false);
  }, [clearSheetTimers]);

  const handleMapGesture = useCallback(() => {
    userInteractingRef.current = true;
    setSheetCollapsed(true);

    clearSheetTimers();

    // Safety net for gestures that don't trigger region-complete normally.
    fallbackTimerRef.current = setTimeout(() => {
      releaseMap();
    }, SHEET_RAISE_FALLBACK_MS);
  }, [clearSheetTimers, releaseMap]);

  const updateSelectedLocation = useCallback(
    async (coords: Coords, isGpsLocation = false) => {
      const requestNumber = ++addressRequestRef.current;

      selectedCoordsRef.current = coords;
      setSelectedCoords(coords);
      setAddressLoading(true);

      const fullAddress = await getRealAddress(coords.lat, coords.lng);

      if (requestNumber !== addressRequestRef.current) return;

      setAddress(fullAddress);
      setAddressLoading(false);

      if (isGpsLocation) {
        setAreaName("Your current location");
      } else {
        setAreaName(getAreaName(fullAddress));
      }
    },
    [],
  );

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      if (!userInteractingRef.current) return;

      void updateSelectedLocation({
        lat: region.latitude,
        lng: region.longitude,
      });

      clearSheetTimers();

      raiseTimerRef.current = setTimeout(() => {
        releaseMap();
      }, SHEET_RAISE_DELAY_MS);
    },
    [clearSheetTimers, releaseMap, updateSelectedLocation],
  );

  const handleRegionChange = useCallback(
    (_region: Region, details?: { isGesture?: boolean }) => {
      if (details?.isGesture) handleMapGesture();
    },
    [handleMapGesture],
  );

  useEffect(() => {
    if (isEditingSearch) return;

    setSearchText(addressLoading ? "Updating address…" : areaName);
  }, [areaName, addressLoading, isEditingSearch]);

  const getLocation = async (): Promise<void> => {
    const requestNumber = ++locationRequestRef.current;

    try {
      setLocationLoading(true);

      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        const permission = await Location.requestForegroundPermissionsAsync();

        status = permission.status;
      }

      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Enable location to find your current position. You can still select a location by moving the map.",
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (requestNumber !== locationRequestRef.current) return;

      const coords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      gpsCoordsRef.current = coords;
      setGpsCoords(coords);

      await updateSelectedLocation(coords, true);

      if (!userInteractingRef.current) {
        mapRef.current?.animateToRegion(
          {
            latitude: coords.lat,
            longitude: coords.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          650,
        );
      }
    } catch (error: unknown) {
      Alert.alert("Error", "Failed to get location");
      console.error(error);
    } finally {
      if (requestNumber === locationRequestRef.current) {
        setLocationLoading(false);
      }
    }
  };

  const returnToCurrentLocation = async () => {
    const currentGps = gpsCoordsRef.current;

    if (currentGps) {
      await updateSelectedLocation(currentGps, true);

      mapRef.current?.animateToRegion(
        {
          latitude: currentGps.lat,
          longitude: currentGps.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        650,
      );

      return;
    }

    await getLocation();
  };

  const handleSearchSubmit = async () => {
    const query = searchText.trim();

    setIsEditingSearch(false);

    if (!query) {
      setSearchText(areaName);
      return;
    }

    setSearching(true);
    const coords = await getCoordsFromAddress(query);
    setSearching(false);

    if (!coords) {
      Alert.alert("Location not found", "Try a different search.");
      setSearchText(areaName);
      return;
    }

    await updateSelectedLocation(coords);

    mapRef.current?.animateToRegion(
      {
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      650,
    );
  };

  const syncPushToken = async (): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const pushData = await registerForPushNotificationsAsync();
      if (!pushData) return;

      const token = await user.getIdToken();

      await API.post(
        "/notifications/client",
        {
          platform: pushData.platform,
          expoPushToken: pushData.token,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (err: unknown) {
      const error = err as ApiError;

      console.log(
        "Push token sync failed:",
        error?.response?.data ?? error.message,
      );
    }
  };

  const getLiveData = useCallback(async (): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();

      const response = await API.get<LiveData>("/client/live", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      setLiveData(data);

      if (data.requestStatus) {
        setRequestStatus(data.requestStatus);
      }

      if (data.requestId) {
        setActiveRequestId(data.requestId);
      }

      if (data.agent) {
        const coords = {
          lat: data.agent.lat,
          lng: data.agent.lng,
        };

        agentLocationRef.current = coords;
        lastKnownLocationRef.current = coords;

        setAgentLocation(coords);
        setLastKnownLocation(coords);
      } else {
        agentLocationRef.current = null;
        setAgentLocation(null);
      }
    } catch (err: unknown) {
      const error = err as ApiError;

      console.log("Polling error:", error?.response?.data ?? error.message);
    }
  }, []);

  useEffect(() => {
    void getLocation();
    void syncPushToken();

    return () => {
      clearSheetTimers();
      addressRequestRef.current += 1;
      locationRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      void getLiveData();
    }, 5000);

    return () => clearInterval(interval);
  }, [getLiveData]);

  const handleRequest = async (): Promise<void> => {
    const selected = selectedCoordsRef.current;

    if (!selected) {
      Alert.alert("Location required", "Select a location on the map first.");
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
      setLiveData(null);
      setRequestStatus("pending");
      setActiveRequestId(null);

      const token = await user.getIdToken();

      const authHeader = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const createResponse = await API.post<{ requestId: string }>(
        "/match/request",
        {
          lat: selected.lat,
          lng: selected.lng,
          propertyType: selectedType,
        },
        authHeader,
      );

      const { requestId } = createResponse.data;

      if (!requestId) {
        throw new Error("No requestId returned from server");
      }

      setActiveRequestId(requestId);

      const matchResponse = await API.post<{
        request: MatchRequest;
        agent: Agent;
        error?: string;
      }>(`/match/match/${requestId}`, {}, authHeader);

      const { request, agent } = matchResponse.data;

      if (!agent) {
        setRequestStatus("no_agents");
        Alert.alert("No Agent", "No agents available — try again later.");
        return;
      }

      setMatchData({ request, agent });
      setRequestStatus(request?.status || "offered");

      void getLiveData();
    } catch (err: unknown) {
      const error = err as ApiError;
      const serverError =
        error?.response?.data?.error || error?.response?.data?.message;

      setRequestStatus(
        serverError === "No available agents nearby" ? "no_agents" : null,
      );

      Alert.alert(
        "Error",
        serverError ||
          error.message ||
          "No agents are currently available for this property type. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  const displayedAgent = agentLocation ?? lastKnownLocation;
  const agentIsLive = agentLocation !== null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        showsUserLocation={false}
        showsCompass={false}
        showsMyLocationButton={false}
        loadingEnabled
        initialRegion={{
          latitude: 4.8156,
          longitude: 7.0498,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPanDrag={handleMapGesture}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {liveData?.agent && displayedAgent && (
          <Marker
            key="agent-property-location"
            coordinate={{
              latitude: displayedAgent.lat,
              longitude: displayedAgent.lng,
            }}
            title={liveData.agent.name}
            description={
              agentIsLive
                ? liveData.agent.phone
                : `${liveData.agent.phone} (Last known location)`
            }
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            <PropertyPin color="#16A34A" label="Agent" />
          </Marker>
        )}
      </MapView>

      <View pointerEvents="none" style={styles.centerPin}>
        <View style={styles.centerPinHead}>
          <View style={styles.centerPinDot} />
        </View>
        <View style={styles.centerPinTip} />
        <View style={styles.centerPinShadow} />
      </View>

      <View
        pointerEvents="box-none"
        style={[styles.locationDropdownPosition, { top: insets.top + 12 }]}
      >
        <View style={styles.locationDropdown}>
          <View style={styles.locationIcon}>
            <MapPinIcon size={22} color={colors.primary} />
          </View>

          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => setIsEditingSearch(true)}
            onBlur={() => setIsEditingSearch(false)}
            onSubmitEditing={handleSearchSubmit}
            editable={!searching}
            placeholder="Search for a location"
            placeholderTextColor="rgba(255,255,255,0.45)"
            returnKeyType="search"
            style={styles.locationInput}
          />

          {addressLoading || searching ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
              style={{ marginLeft: 8 }}
            />
          ) : (
            <Pressable
              onPress={() => void returnToCurrentLocation()}
              hitSlop={8}
              style={({ pressed }) => [
                styles.refreshButton,
                pressed && styles.refreshButtonPressed,
              ]}
            >
              <MaterialIcons name="refresh" size={22} color={"#cccccc"} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Notification bell */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: insets.top + 12,
          right: 16,
          zIndex: 60,
        }}
      >
        <NotificationBell
          color="#111827"
          size={20}
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: "#FFFFFF",
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 4,
          }}
        />
      </View>

      <BottomModal
        onClose={() => {}}
        colors={colors}
        collapsed={sheetCollapsed}
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
          setMatchData={(data: MatchData | null) => {
            setMatchData(data);

            if (!data) {
              setRequestStatus(null);
              setActiveRequestId(null);
            }
          }}
          matchData={
            matchData ||
            (liveData
              ? {
                  request: {
                    requestId: liveData.requestId || activeRequestId || "",
                    lat: liveData.lat,
                    lng: liveData.lng,
                    propertyType: selectedType,
                    status: liveData.requestStatus,
                  },
                  agent: liveData.agent as any,
                  message: liveData.message,
                }
              : null)
          }
          requestStatus={requestStatus}
          requestId={activeRequestId || liveData?.requestId}
        />
      </BottomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  // The pin's point sits at the center of the map.
  centerPin: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 30,
    height: 43,
    marginLeft: -15,
    marginTop: -42,
    alignItems: "center",
    zIndex: 25,
  },

  centerPinHead: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#111827",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  centerPinDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },

  centerPinTip: {
    position: "absolute",
    top: 20,
    width: 15,
    height: 15,
    backgroundColor: "#111827",
    transform: [{ rotate: "45deg" }],
    zIndex: -1,
  },

  centerPinShadow: {
    position: "absolute",
    bottom: 0,
    width: 10,
    height: 3,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.2)",
  },

  locationDropdownPosition: {
    position: "absolute",
    left: 16,
    right: 74,
    zIndex: 60,
  },

  locationDropdown: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: 24,
    backgroundColor: "rgba(17, 20, 28, 0.92)",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  locationIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  locationIconDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2.5,
    borderColor: "#60A5FA",
    backgroundColor: "transparent",
  },

  locationInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    padding: 0,
  },

  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },

  refreshButtonPressed: {
    opacity: 0.6,
  },

  refreshIconRing: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderTopColor: "transparent",
    transform: [{ rotate: "45deg" }],
  },

  refreshIconArrow: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 0,
    height: 0,
    borderLeftWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomWidth: 4.5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFFFFF",
    transform: [{ rotate: "100deg" }],
  },

  // Shared round floating-button chrome (recenter button).
  roundIconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  roundIconButtonPressed: {
    opacity: 0.8,
  },

  recenterOuterRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  recenterInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2563EB",
  },
});

const pinStyles = StyleSheet.create({
  wrapper: {
    width: 44,
    height: 52,
    alignItems: "center",
  },

  head: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  tip: {
    position: "absolute",
    top: 31,
    width: 14,
    height: 14,
    transform: [{ rotate: "45deg" }],
    zIndex: -1,
  },

  house: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  roofLeft: {
    position: "absolute",
    top: 3,
    left: 2,
    width: 12,
    height: 3,
    borderRadius: 1,
    transform: [{ rotate: "-38deg" }],
  },

  roofRight: {
    position: "absolute",
    top: 3,
    right: 2,
    width: 12,
    height: 3,
    borderRadius: 1,
    transform: [{ rotate: "38deg" }],
  },

  houseBody: {
    width: 13,
    height: 10,
    marginBottom: 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  door: {
    width: 4,
    height: 6,
    backgroundColor: "#374151",
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },

  shadow: {
    position: "absolute",
    bottom: 0,
    width: 13,
    height: 4,
    borderRadius: 7,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
});
