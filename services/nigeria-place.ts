import { resolveNigeriaPlace } from "@/constants/nigeria-locations";
import { API } from "@/services/api";
import * as Location from "expo-location";

export type NigeriaPlace = {
  state: string;
  lga: string;
  landmark: string;
};

const googleKey = () =>
  String(process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || "").replace(/\s/g, "");

const fromGoogle = async (lat: number, lng: number): Promise<NigeriaPlace | null> => {
  const key = googleKey();
  if (!key) return null;
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`,
  );
  if (!response.ok) return null;
  const data = await response.json();
  if (data.status !== "OK" || !Array.isArray(data.results)) return null;

  const parts: string[] = [];
  for (const result of data.results) {
    for (const component of result.address_components || []) {
      parts.push(component.long_name, component.short_name);
    }
    if (result.formatted_address) parts.push(result.formatted_address);
  }
  const place = resolveNigeriaPlace(parts);
  return place.state ? place : null;
};

const fromNominatim = async (lat: number, lng: number): Promise<NigeriaPlace | null> => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&zoom=14`,
    { headers: { "User-Agent": "Dwellify/1.0" } },
  );
  if (!response.ok) return null;
  const data = await response.json();
  const address = data?.address || {};
  const place = resolveNigeriaPlace([
    address.state,
    address.county,
    address.municipality,
    address.city_district,
    address.city,
    address.town,
    address.village,
    address.suburb,
    address.neighbourhood,
    address.quarter,
    address.road,
    data?.display_name,
  ]);
  return place.state ? place : null;
};

const fromExpo = async (lat: number, lng: number): Promise<NigeriaPlace | null> => {
  const results = await Location.reverseGeocodeAsync({
    latitude: lat,
    longitude: lng,
  });
  const first = results[0];
  if (!first) return null;
  const place = resolveNigeriaPlace([
    first.region,
    first.subregion,
    first.district,
    first.city,
    first.street,
    first.name,
    first.formattedAddress,
  ]);
  return place.state ? place : null;
};

const fromBackend = async (lat: number, lng: number): Promise<NigeriaPlace | null> => {
  const res = await API.get<NigeriaPlace>("/location/place", {
    params: { lat, lng },
    skipErrorLog: true,
  });
  const place = res.data;
  if (!place?.state) return null;
  return {
    state: place.state,
    lga: place.lga || "",
    landmark: place.landmark || "",
  };
};

export const resolvePlaceFromCoords = async (
  lat: number,
  lng: number,
): Promise<NigeriaPlace> => {
  const attempts = [fromGoogle, fromBackend, fromNominatim, fromExpo];
  let best: NigeriaPlace = { state: "", lga: "", landmark: "" };

  for (const attempt of attempts) {
    try {
      const place = await attempt(lat, lng);
      if (!place?.state) continue;
      if (place.lga) return place;
      if (!best.state) best = place;
    } catch {
      // Try the next provider.
    }
  }

  return best;
};
