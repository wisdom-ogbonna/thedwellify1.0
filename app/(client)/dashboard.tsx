import BottomSheet, { BottomSheetRefProps } from "@/components/bottom-sheet";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Dimensions, ScrollView, View } from "react-native";
import { API } from "../../services/api";
import ClientEvent from "@/components/client-event";

const PROPERTY_TYPES = ["Hotel", "Apartment", "Shortlet"];

type Agent = {
  agentId: string;
  name: string;
  phone: string;
  email: string;
  agencyName: string;
  rating: number;
  distanceKm: number;
};

/* =========================
   GOOGLE REVERSE GEOCODE
========================= */
const getRealAddress = async (lat: number, lng: number) => {
  try {
    const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`,
    );

    const data = await res.json();

    if (data.results?.length > 0) {
      return data.results[0].formatted_address;
    }

    return "Address not found";
  } catch {
    return "Address unavailable";
  }
};

export default function RequestMatchScreen() {
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState("");

  const [selectedType, setSelectedType] = useState("Hotel");

  const [agent, setAgent] = useState<Agent | null>(null);

  const ref = useRef<BottomSheetRefProps>(null);

  const { height: SCREEN_HEIGHT } = Dimensions.get("window");

  const SNAP_25 = -SCREEN_HEIGHT * 0.10;
  const SNAP_50 = -SCREEN_HEIGHT * 0.59;
  const SNAP_80 = -SCREEN_HEIGHT * 0.80;

  /* =========================
     GET LOCATION
  ========================= */
  useEffect(() => {
    getLocation();
    ref.current?.scrollTo(SNAP_50);
  }, [SNAP_50]);

  const getLocation = async () => {
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

      const realAddress = await getRealAddress(latitude, longitude);
      setAddress(realAddress);
    } catch (error) {
      Alert.alert("Error: ", "Failed to get location");
      console.error("Error: ", error);
    } finally {
      setLocationLoading(false);
    }
  };

  /* =========================
     REQUEST + MATCH FLOW
  ========================= */
  const handleRequest = async () => {
    if (!lat || !lng) {
      Alert.alert("Error", "Location not available");
      return;
    }

    try {
      setLoading(true);
      setAgent(null);

      // ✅ STEP 1: CREATE REQUEST
      const createRes = await API.post("/match/request", {
        lat,
        lng,
        propertyType: selectedType,
      });

      const requestId = createRes.data?.requestId;

      if (!requestId) {
        throw new Error("No requestId returned");
      }

      console.log("REQUEST ID:", requestId);

      // ✅ STEP 2: MATCH AGENT
      const matchRes = await API.post(`/match/match/${requestId}`);

      const agentData = matchRes.data?.agent;

      if (!agentData) {
        Alert.alert("No Agent", "Try again later");
        return;
      }

      setAgent(agentData);
    } catch (error: any) {
      console.log(error);

      Alert.alert(
        "Error",
        error?.response?.data?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <View className="flex-1 relative bg-[#0B0F1A]">
      <ScrollView showsVerticalScrollIndicator={false}>
        <BottomSheet ref={ref}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            bounces={false}
          >
            <ClientEvent
              locationLoading={locationLoading}
              address={address}
              lat={lat}
              lng={lng}
              getLocation={getLocation}
              PROPERTY_TYPES={PROPERTY_TYPES}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              handleRequest={handleRequest}
              loading={loading}
              setAgent={setAgent}
              agent={agent}
            />
          </ScrollView>
        </BottomSheet>
      </ScrollView>
    </View>
  );
}
