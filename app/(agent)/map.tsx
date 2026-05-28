import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Text,
} from "react-native";

import MapView, {
  Marker,
  PROVIDER_GOOGLE,
} from "react-native-maps";

import * as Location from "expo-location";

import { Ionicons } from "@expo/vector-icons";

import { SafeAreaView } from "react-native-safe-area-context";

import { API } from "../../services/api";

export default function MapScreen() {
  const mapRef = useRef(null);

  const [location, setLocation] = useState(null);

  const [agent, setAgent] = useState(null);

  const [loading, setLoading] = useState(true);

  /**
   * ✅ Get user location
   */
  useEffect(() => {
    (async () => {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setLoading(false);
          return;
        }

        const loc =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

        setLocation(loc.coords);

      } catch (err) {
        console.log("Location error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /**
   * ✅ Fetch live agent data
   */
  const fetchAgent = async () => {
    try {
      const res = await API.get("/agent/live");

      setAgent(res.data);

    } catch (err) {
      console.log(
        "Agent fetch error:",
        err.response?.data || err.message
      );
    }
  };

  /**
   * ✅ Auto refresh
   */
  useEffect(() => {
    fetchAgent();

    const interval = setInterval(() => {
      fetchAgent();
    }, 5000);

    return () => clearInterval(interval);

  }, []);

  /**
   * ✅ Focus map on current user
   */
  const focusUser = () => {
    if (!location || !mapRef.current) return;

    mapRef.current.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,

        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      600
    );
  };

  /**
   * ✅ Auto fit markers
   */
  useEffect(() => {
    if (
      !mapRef.current ||
      !agent?.isOnline ||
      !agent?.lat ||
      !agent?.lng
    ) {
      return;
    }

    const coordinates = [
      {
        latitude: agent.lat,
        longitude: agent.lng,
      },
    ];

    // Add client location if matched
    if (
      (agent?.status === "matched" ||
        agent?.status === "inspection_started") &&
      agent?.clientLat &&
      agent?.clientLng
    ) {
      coordinates.push({
        latitude: agent.clientLat,
        longitude: agent.clientLng,
      });
    }

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: {
        top: 120,
        right: 80,
        bottom: 120,
        left: 80,
      },

      animated: true,
    });

  }, [agent]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#111"
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsCompass={false}
        showsMyLocationButton={false}
        initialRegion={{
          latitude:
            location?.latitude ||
            4.8156,

          longitude:
            location?.longitude ||
            7.0498,

          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* ✅ AGENT MARKER */}
        {agent?.isOnline &&
          agent?.lat &&
          agent?.lng && (
            <Marker
              coordinate={{
                latitude: agent.lat,
                longitude: agent.lng,
              }}
            >
              <View style={styles.agentMarker}>
                
                {/* Agent bubble */}
                <View style={styles.agentBubble}>
                  <Ionicons
                    name="car"
                    size={12}
                    color="#fff"
                  />

                  <Text style={styles.bubbleText}>
                    You
                  </Text>
                </View>

                {/* Pulse */}
                <View style={styles.pulse} />

                {/* Avatar */}
                <Image
                  source={{
                    uri: "https://i.pravatar.cc/150?img=12",
                  }}
                  style={styles.avatar}
                />
              </View>
            </Marker>
        )}

        {/* ✅ CLIENT MARKER */}
        {(agent?.status === "matched" ||
          agent?.status ===
            "inspection_started") &&
          agent?.clientLat &&
          agent?.clientLng && (
            <Marker
              coordinate={{
                latitude: agent.clientLat,
                longitude: agent.clientLng,
              }}
            >
              <View style={styles.clientMarker}>
                
                {/* Client name */}
                <View style={styles.clientBubble}>
                  <Ionicons
                    name="person"
                    size={12}
                    color="#fff"
                  />

                  <Text style={styles.bubbleText}>
                    {agent.clientName ||
                      "Client"}
                  </Text>
                </View>

                {/* Client icon */}
                <View style={styles.clientPin}>
                  <Ionicons
                    name="person"
                    size={20}
                    color="#fff"
                  />
                </View>
              </View>
            </Marker>
        )}
      </MapView>

      {/* ✅ Locate button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={focusUser}
      >
        <Ionicons
          name="locate"
          size={22}
          color="#111"
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  fab: {
    position: "absolute",

    right: 16,
    bottom: 80,

    backgroundColor: "#fff",

    padding: 14,

    borderRadius: 30,

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,

    elevation: 6,
  },

  /**
   * =========================
   * AGENT MARKER
   * =========================
   */

  agentMarker: {
    alignItems: "center",
    justifyContent: "center",
  },

  pulse: {
    position: "absolute",

    width: 52,
    height: 52,

    borderRadius: 26,

    backgroundColor:
      "rgba(37,99,235,0.25)",
  },

  avatar: {
    width: 44,
    height: 44,

    borderRadius: 22,

    borderWidth: 3,
    borderColor: "#2563eb",
  },

  agentBubble: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#2563eb",

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 20,

    marginBottom: 6,
  },

  /**
   * =========================
   * CLIENT MARKER
   * =========================
   */

  clientMarker: {
    alignItems: "center",
  },

  clientBubble: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#111",

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 20,

    marginBottom: 6,
  },

  clientPin: {
    width: 44,
    height: 44,

    borderRadius: 22,

    backgroundColor: "#111",

    justifyContent: "center",
    alignItems: "center",

    borderWidth: 3,
    borderColor: "#fff",
  },

  /**
   * =========================
   * SHARED
   * =========================
   */

  bubbleText: {
    color: "#fff",

    fontSize: 12,
    fontWeight: "600",

    marginLeft: 4,
  },
});