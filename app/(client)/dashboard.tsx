import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import * as Location from "expo-location";
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

/* =========================
   GOOGLE REVERSE GEOCODE
========================= */
const getRealAddress = async (lat: number, lng: number) => {
  try {
    const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`
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

  /* =========================
     GET LOCATION
  ========================= */
  useEffect(() => {
    getLocation();
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

      const realAddress = await getRealAddress(latitude, longitude);
      setAddress(realAddress);
    } catch (error) {
      Alert.alert("Error", "Failed to get location");
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
        error?.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <View className="flex-1 bg-[#0B0F1A] px-5 pt-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* TITLE */}
        <Text className="text-white text-3xl font-bold mb-6">
          Find Property
        </Text>

        {/* LOCATION */}
        <View className="bg-[#121826] p-5 rounded-2xl mb-5">
          <Text className="text-gray-400 mb-2">Your Location</Text>

          {locationLoading ? (
            <ActivityIndicator color="#6366F1" />
          ) : (
            <>
              <Text className="text-white font-semibold">
                {address}
              </Text>

              {lat && lng && (
                <Text className="text-gray-500 text-xs mt-1">
                  {lat.toFixed(4)}, {lng.toFixed(4)}
                </Text>
              )}
            </>
          )}

          <Pressable onPress={getLocation} className="mt-3">
            <Text className="text-indigo-400 font-semibold">
              Refresh Location
            </Text>
          </Pressable>
        </View>

        {/* PROPERTY TYPE */}
        <View className="bg-[#121826] p-5 rounded-2xl mb-6">
          <Text className="text-gray-400 mb-3">Property Type</Text>

          <View className="flex-row gap-3">
            {PROPERTY_TYPES.map((type) => {
              const active = selectedType === type;

              return (
                <Pressable
                  key={type}
                  onPress={() => setSelectedType(type)}
                  className={`flex-1 py-3 rounded-xl items-center ${
                    active ? "bg-indigo-600" : "bg-[#1F2937]"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      active ? "text-white" : "text-gray-300"
                    }`}
                  >
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* BUTTON */}
        <Pressable
          onPress={handleRequest}
          disabled={loading}
          className="bg-indigo-600 py-4 rounded-2xl items-center active:opacity-80"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">
              Request Match
            </Text>
          )}
        </Pressable>

        {/* AGENT RESULT */}
        {agent && (
          <View className="bg-green-900 p-5 rounded-2xl mt-6">
            <Text className="text-white text-lg font-bold mb-2">
              Agent Found 🎉
            </Text>

            <Text className="text-white">Name: {agent.name}</Text>
            <Text className="text-white">Phone: {agent.phone}</Text>
            <Text className="text-white">
              Agency: {agent.agencyName}
            </Text>
            <Text className="text-white">
              Rating: ⭐ {agent.rating}
            </Text>
            <Text className="text-white">
              Distance: {agent.distanceKm} km
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}