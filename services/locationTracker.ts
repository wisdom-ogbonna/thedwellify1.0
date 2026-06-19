import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { API } from "./api";
import { auth } from "../config/firebase";

// Constants
const BACKGROUND_TRACKING_TASK_OLD = "BACKGROUND_AGENT_LOCATION_TRACKING";
const BACKGROUND_TRACKING_TASK_NEW = "background-location-task";
const MIN_DISTANCE_METERS = 5;
const HEARTBEAT_INTERVAL_MS = 60000;

// Storage Keys
const KEYS = {
  LAST_LOCATION: "@tracker_last_location",
  TRACKING_STATUS: "@tracker_is_online",
  FAILED_QUEUE: "@tracker_failed_queue",
};

// Types
interface Coordinates {
  lat: number;
  lng: number;
}

interface QueuedPayload extends Coordinates {
  load: number;
  rating: number;
  timestamp: number;
}

export interface TrackerResponse {
  success: boolean;
  errorType?: "PERMISSION_DENIED" | "HARDWARE_DISABLED" | "UNKNOWN";
  message?: string;
}

// Memory States
let foregroundSubscription: Location.LocationSubscription | null = null;
let heartbeatTimer: NodeJS.Timeout | null = null;
let netInfoUnsubscribe: (() => void) | null = null;
let isConnected: boolean = true;
let processingQueue: boolean = false;

const getDistance = (loc1: Coordinates, loc2: Coordinates): number => {
  const R = 6371e3;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const φ1 = rad(loc1.lat);
  const φ2 = rad(loc2.lat);
  const Δφ = rad(loc2.lat - loc1.lat);
  const Δλ = rad(loc2.lng - loc1.lng);

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const stashPayloadToQueue = async (payload: QueuedPayload) => {
  try {
    const rawQueue = await AsyncStorage.getItem(KEYS.FAILED_QUEUE);
    const queue: QueuedPayload[] = rawQueue ? JSON.parse(rawQueue) : [];
    queue.push(payload);
    await AsyncStorage.setItem(KEYS.FAILED_QUEUE, JSON.stringify(queue));
  } catch (err) {
    console.error("CRITICAL: Failed tracking outbox mutation", err);
  }
};

const dispatchLocationUpdate = async (
  coords: Coordinates,
  isHeartbeat = false,
): Promise<void> => {
  const payload: QueuedPayload = {
    ...coords,
    load: 0,
    rating: 5,
    timestamp: Date.now(),
  };

  try {
    const storedLastLocStr = await AsyncStorage.getItem(KEYS.LAST_LOCATION);

    if (storedLastLocStr && !isHeartbeat) {
      const storedLastLoc: Coordinates = JSON.parse(storedLastLocStr);
      const distanceMoved = getDistance(storedLastLoc, coords);
      if (distanceMoved < MIN_DISTANCE_METERS) {
        return;
      }
    }

    if (!isConnected) {
      throw new Error("Network disconnected. Stashing update in queue.");
    }

    await API.post("/location/update", {
      lat: payload.lat,
      lng: payload.lng,
      load: payload.load,
      rating: payload.rating,
    });

    await AsyncStorage.setItem(KEYS.LAST_LOCATION, JSON.stringify(coords));
    console.log(`📍 [${isHeartbeat ? "Heartbeat" : "Movement"}] Sync success.`);
  } catch (error: any) {
    console.warn(
      "⚠️ Remote location sync failed. Stashing entry locally:",
      error?.message || error,
    );
    await stashPayloadToQueue(payload);
  }
};

const drainLocalQueue = async () => {
  if (processingQueue) return;

  const netState = await NetInfo.fetch();
  const networkAvailable = netState.isConnected ?? false;
  if (!networkAvailable) return;

  processingQueue = true;

  try {
    const rawQueue = await AsyncStorage.getItem(KEYS.FAILED_QUEUE);
    if (!rawQueue) {
      processingQueue = false;
      return;
    }

    let queue: QueuedPayload[] = JSON.parse(rawQueue);
    if (queue.length === 0) {
      processingQueue = false;
      return;
    }

    console.log(`♻️ Processing ${queue.length} cached offline updates...`);

    const savedToken = await AsyncStorage.getItem("@secure_auth_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (savedToken) {
      headers["Authorization"] = `Bearer ${savedToken}`;
    }

    while (queue.length > 0) {
      const currentItem = queue[0];
      try {
        await API.post(
          "/location/update",
          {
            lat: currentItem.lat,
            lng: currentItem.lng,
            load: currentItem.load,
            rating: currentItem.rating,
          },
          { headers, timeout: 8000 },
        );

        queue.shift();
      } catch (err) {
        console.warn(
          "⚠️ Queue clearing interrupted, network down again or request timed out.",
        );
        break;
      }
    }

    await AsyncStorage.setItem(KEYS.FAILED_QUEUE, JSON.stringify(queue));
  } catch (err) {
    console.error("Queue process crash:", err);
  } finally {
    processingQueue = false;
  }
};

const startHeartbeatSystem = () => {
  if (heartbeatTimer) clearInterval(heartbeatTimer);

  heartbeatTimer = setInterval(async () => {
    try {
      // Direct fail-safe check: Is GPS disabled mid-session during this heartbeat cycle?
      const isGpsEnabled = await Location.hasServicesEnabledAsync();
      if (!isGpsEnabled) {
        console.warn("⚠️ Heartbeat blocked: Device GPS services are turned off.");
        return; 
      }

      const storedLastLocStr = await AsyncStorage.getItem(KEYS.LAST_LOCATION);
      if (storedLastLocStr) {
        const parsedCoords: Coordinates = JSON.parse(storedLastLocStr);
        await dispatchLocationUpdate(parsedCoords, true);
      } else {
        const freshPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        await dispatchLocationUpdate(
          {
            lat: freshPosition.coords.latitude,
            lng: freshPosition.coords.longitude,
          },
          true,
        );
      }
    } catch (err) {
      console.error("Heartbeat routine execution failed safely:", err);
    }
  }, HEARTBEAT_INTERVAL_MS);
};

/**
 * Handles explicit hardware, permissions, and native OS dialog triggers
 */
export const startLocationTracking = async (): Promise<TrackerResponse> => {
  try {
    // 1. Verify global device hardware configuration status first
    let isGpsEnabled = await Location.hasServicesEnabledAsync();

    if (!isGpsEnabled) {
      try {
        // ✅ Explicitly prompts Android native system dialog to switch GPS on directly
        await Location.enableNetworkProviderAsync();
        // Check state again after system prompt resolution
        isGpsEnabled = await Location.hasServicesEnabledAsync();
      } catch (providerError) {
        console.log(
          "System provider intent prompt rejected or failed",
          providerError,
        );
      }
    }

    // Re-check hardware layer. If still false, user denied or hardware doesn't exist
    if (!isGpsEnabled) {
      return {
        success: false,
        errorType: "HARDWARE_DISABLED",
        message:
          "Device system location/GPS hardware configuration is disabled. Please enable location services.",
      };
    }

    // 2. Clear out permissions mapping
    const { status: foregroundStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== "granted") {
      return {
        success: false,
        errorType: "PERMISSION_DENIED",
        message: "Foreground location access denied.",
      };
    }

    const { status: backgroundStatus } =
      await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== "granted") {
      return {
        success: false,
        errorType: "PERMISSION_DENIED",
        message: "Background location access denied.",
      };
    }

    // Clean tracking states safely to prevent duplicate background leaks
    await stopLocationTracking();

    // Establish System Network Monitoring
    netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      const previouslyOffline = !isConnected;
      isConnected = state.isConnected ?? false;

      if (isConnected && previouslyOffline) {
        drainLocalQueue();
      }
    });

    // Start Foreground Location Engine
    foregroundSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: MIN_DISTANCE_METERS,
        timeInterval: 10000,
      },
      async (location) => {
        const coords = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
        await dispatchLocationUpdate(coords, false);
      },
    );

    // Start Native Expo Background Module
    await Location.startLocationUpdatesAsync(BACKGROUND_TRACKING_TASK_NEW, {
      accuracy: Location.Accuracy.High,
      timeInterval: 15000,
      distanceInterval: MIN_DISTANCE_METERS,
      foregroundService: {
        notificationTitle: "Agent Delivery Routing",
        notificationBody: "Tracking your delivery location to assign orders.",
        notificationColor: "#000000",
      },
      pausesLocationUpdatesAutomatically: false,
    });

    // Start Heartbeat Watchdog
    startHeartbeatSystem();

    // Persist Tracking State
    await AsyncStorage.setItem(KEYS.TRACKING_STATUS, "true");
    console.log(
      "🚀 Production geolocation services fully mounted successfully.",
    );

    return { success: true };
  } catch (err: any) {
    console.error(
      "Failed to safely scale geolocation engine:",
      err?.message || err,
    );
    return {
      success: false,
      errorType: "UNKNOWN",
      message: err?.message || "An unexpected error occurred.",
    };
  }
};

export const stopLocationTracking = async () => {
  if (foregroundSubscription) {
    foregroundSubscription.remove();
    foregroundSubscription = null;
  }

  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = null;
  }

  const isOldTaskRunning = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_TRACKING_TASK_OLD,
  );
  if (isOldTaskRunning) {
    try { await Location.stopLocationUpdatesAsync(BACKGROUND_TRACKING_TASK_OLD); } catch {}
  }

  const isNewTaskRunning = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_TRACKING_TASK_NEW,
  );
  if (isNewTaskRunning) {
    try { await Location.stopLocationUpdatesAsync(BACKGROUND_TRACKING_TASK_NEW); } catch {}
  }

  await AsyncStorage.setItem(KEYS.TRACKING_STATUS, "false");
  console.log("🛑 Geoloc platform components teardown completely executed.");
};

export const bootstrapLocationTracker = async () => {
  try {
    const isOnlineFlag = await AsyncStorage.getItem(KEYS.TRACKING_STATUS);
    if (isOnlineFlag === "true") {
      console.log(
        "🔄 App restart recovery caught tracking state flag. Re-initializing engine...",
      );
      await startLocationTracking();
    }
  } catch (err) {
    console.error(
      "Failed recovering geolocation task on boot state routing:",
      err,
    );
  }
};

const sharedHeadlessLocationEngineRunner = async ({
  data,
  error,
}: TaskManager.TaskManagerTaskBody<any>) => {
  if (error) {
    console.error("TaskManager task error caught:", error.message);
    return;
  }

  if (data) {
    const { locations } = data;
    if (!locations || locations.length === 0) return;

    const primaryFix = locations[locations.length - 1];
    if (!primaryFix || !primaryFix.coords) return;

    const lat = primaryFix.coords.latitude;
    const lng = primaryFix.coords.longitude;

    if (
      lat === undefined ||
      lng === undefined ||
      lat === null ||
      lng === null
    ) {
      return;
    }

    const coords: Coordinates = { lat, lng };
    const payload: QueuedPayload = {
      ...coords,
      load: 0,
      rating: 5,
      timestamp: Date.now(),
    };

    try {
      const rawQueue = await AsyncStorage.getItem(KEYS.FAILED_QUEUE);
      const currentQueue: QueuedPayload[] = rawQueue
        ? JSON.parse(rawQueue)
        : [];

      const netState = await NetInfo.fetch();
      const networkAvailable = netState.isConnected ?? false;

      if (!networkAvailable) {
        currentQueue.push(payload);
        await AsyncStorage.setItem(
          KEYS.FAILED_QUEUE,
          JSON.stringify(currentQueue),
        );
        return;
      }

      await drainLocalQueue();

      const savedToken = await AsyncStorage.getItem("@secure_auth_token");

      if (!savedToken) {
        currentQueue.push(payload);
        await AsyncStorage.setItem(
          KEYS.FAILED_QUEUE,
          JSON.stringify(currentQueue),
        );
        return;
      }

      const authHeader = `Bearer ${savedToken}`;

      await API.post(
        "/location/update",
        {
          lat: coords.lat,
          lng: coords.lng,
          load: 0,
          rating: 5,
        },
        {
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      );

      await AsyncStorage.setItem(KEYS.LAST_LOCATION, JSON.stringify(coords));
      console.log(`📍 Background sync success: ${coords.lat}, ${coords.lng}`);
    } catch (err: any) {
      console.warn("Headless OS Engine choked. Stashing in outbox safely.");
      const rawQueue = await AsyncStorage.getItem(KEYS.FAILED_QUEUE);
      const currentQueue = rawQueue ? JSON.parse(rawQueue) : [];
      currentQueue.push(payload);
      await AsyncStorage.setItem(
        KEYS.FAILED_QUEUE,
        JSON.stringify(currentQueue),
      );
    }
  }
};

TaskManager.defineTask(
  BACKGROUND_TRACKING_TASK_OLD,
  sharedHeadlessLocationEngineRunner,
);
TaskManager.defineTask(
  BACKGROUND_TRACKING_TASK_NEW,
  sharedHeadlessLocationEngineRunner,
);
