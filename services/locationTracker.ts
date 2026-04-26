import * as Location from "expo-location";
import { API } from "./api";
let subscription: Location.LocationSubscription | null = null;
let lastLocation: { lat: number; lng: number } | null = null;

const getDistance = (loc1: any, loc2: any) => {
  const R = 6371e3;
  const φ1 = (loc1.lat * Math.PI) / 180;
  const φ2 = (loc2.lat * Math.PI) / 180;
  const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const startLocationTracking = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") return;

  subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      distanceInterval: 5,
      timeInterval: 3000,
    },
    async (location) => {
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;

      const newLoc = { lat, lng };

      if (lastLocation) {
        const distance = getDistance(lastLocation, newLoc);
        if (distance < 5) return;
      }

      lastLocation = newLoc;

      await API.post("/location/update", {
        lat,
        lng,
        load: 0,
        rating: 5,
      });

      console.log("📍 Updated:", lat, lng);
    }
  );
};

export const stopLocationTracking = () => {
  if (subscription) {
    subscription.remove();
    subscription = null;
    lastLocation = null;
  }
};