import BottomSheet, { BottomSheetRefProps } from "@/components/bottom-sheet";
import ClientEvent from "@/components/client-event";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Dimensions, ScrollView, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API } from "../../services/api";

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

  const [matchData, setMatchData] = useState<any>(null);

  const ref = useRef<BottomSheetRefProps>(null);

  const mapRef = useRef<MapView>(null);

  const insets = useSafeAreaInsets();

  const { height: SCREEN_HEIGHT } = Dimensions.get("window");

  const SNAP_25 = -SCREEN_HEIGHT * 0.1;

  const SNAP_50 = -SCREEN_HEIGHT * 0.59;

  const SNAP_80 = -SCREEN_HEIGHT * 0.8;

  const [liveData, setLiveData] = useState<any>(null);

  const [agentLocation, setAgentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [requestStatus, setRequestStatus] = useState<string | null>(null);

  const [lastKnownLocation, setLastKnownLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (agentLocation?.lat && agentLocation?.lng) {
      setLastKnownLocation(agentLocation);
    }
  }, [agentLocation]);

  useEffect(() => {
    getLocation();

    setTimeout(() => {
      ref.current?.scrollTo(SNAP_50);
    }, 100);
  }, [SNAP_50]);

  useEffect(() => {
    const interval = setInterval(() => {
      getLiveData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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

      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        800,
      );

      const realAddress = await getRealAddress(latitude, longitude);

      setAddress(realAddress);
    } catch (error) {
      Alert.alert("Error", "Failed to get location");

      console.error(error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!lat || !lng) {
      Alert.alert("Error", "Location not available");
      return;
    }

    try {
      setLoading(true);
      setMatchData(null);

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

      const matchRes = await API.post(`/match/match/${requestId}`);

      const { request, agent } = matchRes.data;

      if (!agent) {
        Alert.alert("No Agent", "Try again later");

        return;
      }

      setMatchData({
        request,
        agent,
      });
    } catch (error: any) {
      console.log(error);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "There's currently no agents available with this property. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getLiveData = async () => {
    try {
      const res = await API.get("/client/live");

      const data = res.data;

      setLiveData(data);

      setRequestStatus(data.requestStatus);

      if (data.agent) {
        setAgentLocation({
          lat: data.agent.lat,
          lng: data.agent.lng,
        });

        fitMapToMarkers(data.lat, data.lng, data.agent.lat, data.agent.lng);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const fitMapToMarkers = (
    clientLat: number,
    clientLng: number,
    agentLat: number,
    agentLng: number,
  ) => {
    mapRef.current?.fitToCoordinates(
      [
        {
          latitude: clientLat,
          longitude: clientLng,
        },
        {
          latitude: agentLat,
          longitude: agentLng,
        },
      ],
      {
        edgePadding: {
          top: 100,
          right: 100,
          bottom: 300,
          left: 100,
        },
        animated: true,
      },
    );
  };
  return (
    <View className="flex-1 relative bg-[#0B0F1A]">
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        showsUserLocation={false}
        showsCompass={false}
        showsMyLocationButton={false}
        loadingEnabled
        mapPadding={{
          top: 0,
          right: 0,
          left: 0,
          bottom: 320,
        }}
        initialRegion={{
          latitude: lat || 4.8156,
          longitude: lng || 7.0498,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {lat && lng && (
          <Marker
            coordinate={{
              latitude: lat,
              longitude: lng,
            }}
            title="You"
            description="Your Location"
          />
        )}

        {liveData?.agent &&
          (agentLocation?.lat ?? lastKnownLocation?.lat) != null &&
          (agentLocation?.lng ?? lastKnownLocation?.lng) != null && (
          <Marker
            coordinate={{
              latitude: agentLocation?.lat ?? lastKnownLocation!.lat,
              longitude: agentLocation?.lng ?? lastKnownLocation!.lng,
            }}
            title={liveData.agent.name}
            description={
              agentLocation?.lat
                ? liveData.agent.phone
                : `${liveData.agent.phone} (Offline - Last Known Location)`
            }
            pinColor={agentLocation?.lat ? "green" : "orange"}
          />
        )}
      </MapView>

      <BottomSheet ref={ref}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          bounces={false}
          overScrollMode="never"
          contentContainerStyle={{
            paddingBottom: 120,
          }}
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
            setMatchData={setMatchData ?? setLiveData}
            matchData={matchData ?? liveData}
            requestStatus={requestStatus}
          />
        </ScrollView>
      </BottomSheet>
    </View>
  );
}
