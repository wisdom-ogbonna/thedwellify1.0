import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { API } from "./api";
import { auth } from "../config/firebase"; // Verified Firebase hook bridge

// Constants (Resolves task-definition cache collisions between native & JS engines)
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

// Memory States
let foregroundSubscription: Location.LocationSubscription | null = null;
let heartbeatTimer: NodeJS.Timeout | null = null;
let netInfoUnsubscribe: (() => void) | null = null;
let isConnected: boolean = true;
let processingQueue: boolean = false;

/**
 * Calculates distance using the Haversine formula
 */
const getDistance = (loc1: Coordinates, loc2: Coordinates): number => {
  const R = 6371e3; // Earth's radius in meters
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const φ1 = rad(loc1.lat);
  const φ2 = rad(loc2.lat);
  const Δφ = rad(loc2.lat - loc1.lat);
  const Δλ = rad(loc2.lng - loc1.lng);

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Serializes and saves failed requests to local disk safely
 */
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

/**
 * Dispatches location payloads to API endpoints or queues them if offline
 */
const dispatchLocationUpdate = async (
  coords: Coordinates,
  isHeartbeat = false
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
        // Drop excessive API calls if agent is standing still (unless it is an explicit heartbeat)
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
      error?.message || error
    );
    await stashPayloadToQueue(payload);
  }
};

/**
 * Flushes backlogged offline items sequentially when connectivity recovers
 */
const drainLocalQueue = async () => {
  if (processingQueue || !isConnected) return;
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

    while (queue.length > 0 && isConnected) {
      const currentItem = queue[0];
      try {
        await API.post("/location/update", {
          lat: currentItem.lat,
          lng: currentItem.lng,
          load: currentItem.load,
          rating: currentItem.rating,
        });
        queue.shift(); // Remove successfully sent item
      } catch (err) {
        console.warn("⚠️ Queue clearing interrupted, network down again.");
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

/**
 * Periodic fallback routine ensuring backend stays warm even when geofence stays idle
 */
const startHeartbeatSystem = () => {
  if (heartbeatTimer) clearInterval(heartbeatTimer);

  heartbeatTimer = setInterval(async () => {
    try {
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
          true
        );
      }
    } catch (err) {
      console.error("Heartbeat routine execution failed", err);
    }
  }, HEARTBEAT_INTERVAL_MS);
};

/**
 * Handles explicit hardware and subscription initializations
 */
export const startLocationTracking = async () => {
  try {
    const { status: foregroundStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== "granted")
      throw new Error("Foreground geoloc access denied");

    const { status: backgroundStatus } =
      await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== "granted")
      throw new Error("Background geoloc access denied");

    const isGpsEnabled = await Location.hasServicesEnabledAsync();
    if (!isGpsEnabled)
      throw new Error("Device system hardware GPS configuration is disabled");

    // Clean tracking states cleanly to prevent duplicate background processes running
    await stopLocationTracking();

    // 1. Establish System Network Monitoring
    netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      const previouslyOffline = !isConnected;
      isConnected = state.isConnected ?? false;

      if (isConnected && previouslyOffline) {
        drainLocalQueue();
      }
    });

    // 2. Start Foreground Location Engine
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
      }
    );

    // 3. Start Native Expo Background Module (Maps directly to your production app.json config key)
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

    // 4. Start Heartbeat Watchdog
    startHeartbeatSystem();

    // Persist Tracking State
    await AsyncStorage.setItem(KEYS.TRACKING_STATUS, "true");
    console.log(
      "🚀 Production geolocation services fully mounted successfully."
    );
  } catch (err: any) {
    console.error(
      "Failed to safely scale geolocation engine:",
      err?.message || err
    );
    throw err;
  }
};

/**
 * Clear memory configurations, subscriptions, intervals, and device persistent flags cleanly
 */
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

  // Safely clean older legacy task tracking queues if they persist in native memory
  const isOldTaskRunning = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_TRACKING_TASK_OLD
  );
  if (isOldTaskRunning) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_TRACKING_TASK_OLD);
  }

  // Safely stop your current standard task engine setup
  const isNewTaskRunning = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_TRACKING_TASK_NEW
  );
  if (isNewTaskRunning) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_TRACKING_TASK_NEW);
  }

  await AsyncStorage.setItem(KEYS.TRACKING_STATUS, "false");
  console.log("🛑 Geoloc platform components teardown completely executed.");
};

/**
 * Recovery execution mechanism checking storage profiles upon app initialization
 */
export const bootstrapLocationTracker = async () => {
  try {
    const isOnlineFlag = await AsyncStorage.getItem(KEYS.TRACKING_STATUS);
    if (isOnlineFlag === "true") {
      console.log(
        "🔄 App restart recovery caught tracking state flag. Re-initializing engine..."
      );
      await startLocationTracking();
    }
  } catch (err) {
    console.error(
      "Failed recovering geolocation task on boot state routing:",
      err
    );
  }
};

/* =========================================================================
   NATIVE HEADLESS SHARED GLOBAL TASK RUNNER EXECUTOR
   ========================================================================= */
/* =========================================================================
   NATIVE HEADLESS SHARED GLOBAL TASK RUNNER EXECUTOR
   ========================================================================= */
const sharedHeadlessLocationEngineRunner = async ({ data, error }: TaskManager.TaskManagerTaskBody<any>) => {
  if (error) {
    console.error("TaskManager task error caught:", error.message);
    return;
  }
  
  if (data) {
    const { locations } = data;
    if (!locations || locations.length === 0) return;

    // Grab the latest precise native coordinate entry point safely
    const primaryFix = locations[locations.length - 1]; 
    if (!primaryFix || !primaryFix.coords) return;

    const lat = primaryFix.coords.latitude;
    const lng = primaryFix.coords.longitude;

    // Safety check: If the OS returns bad/empty coordinates, reject the background cycle
    if (lat === undefined || lng === undefined || lat === null || lng === null) {
      console.warn("⚠️ Headless task woke up but coordinates were unreadable.");
      return;
    }

    const coords: Coordinates = { lat, lng };

    try {
      const rawQueue = await AsyncStorage.getItem(KEYS.FAILED_QUEUE);
      const currentQueue: QueuedPayload[] = rawQueue ? JSON.parse(rawQueue) : [];
      
      const netState = await NetInfo.fetch();
      const networkAvailable = netState.isConnected ?? false;

      // 1. Handle Offline State instantly
      if (!networkAvailable) {
        const payload: QueuedPayload = { ...coords, load: 0, rating: 5, timestamp: Date.now() };
        currentQueue.push(payload);
        await AsyncStorage.setItem(KEYS.FAILED_QUEUE, JSON.stringify(currentQueue));
        return;
      }

      // 2. Resolve Firebase Authentication inside the isolated background thread
      let currentUser = auth.currentUser;
      let authHeader = "";

      if (!currentUser) {
        // Give the native bridge up to 3 seconds to recover the user session from keychain memory
        currentUser = await new Promise((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
          });
          setTimeout(() => {
            unsubscribe();
            resolve(null);
          }, 3000);
        });
      }

      if (currentUser) {
        const token = await currentUser.getIdToken(true); 
        authHeader = `Bearer ${token}`;
      } else {
        console.warn("⚠️ Background auth handshake timed out. Caching location entry.");
        const payload: QueuedPayload = { ...coords, load: 0, rating: 5, timestamp: Date.now() };
        currentQueue.push(payload);
        await AsyncStorage.setItem(KEYS.FAILED_QUEUE, JSON.stringify(currentQueue));
        return;
      }

      // 3. Dispatch payload with explicit header authentication parameters
      // 💡 NOTE: double-check if your backend expects "lat" or "latitude" / "lng" or "longitude"
      await API.post("/location/update", {
        lat: coords.lat,
        lng: coords.lng,
        load: 0,
        rating: 5,
      }, {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json"
        }
      });

      // Update local storage so foreground loop stays caught up
      await AsyncStorage.setItem(KEYS.LAST_LOCATION, JSON.stringify(coords));
      console.log(`📍 Background sync success: ${coords.lat}, ${coords.lng}`);

    } catch (err: any) {
      console.error("Headless OS Engine Update Exception:", err?.response?.data || err?.message || err);
      
      // If server rejects with error, hold data in outbox queue so updates aren't permanently lost
      const payload: QueuedPayload = { ...coords, load: 0, rating: 5, timestamp: Date.now() };
      const rawQueue = await AsyncStorage.getItem(KEYS.FAILED_QUEUE);
      const currentQueue = rawQueue ? JSON.parse(rawQueue) : [];
      currentQueue.push(payload);
      await AsyncStorage.setItem(KEYS.FAILED_QUEUE, JSON.stringify(currentQueue));
    }
  }
};

// =========================================================================
// REGISTRATION
// =========================================================================
// =========================================================================
// REGISTRATION (Make sure both lines are fully written like this)
// =========================================================================
TaskManager.defineTask(BACKGROUND_TRACKING_TASK_OLD, sharedHeadlessLocationEngineRunner);
TaskManager.defineTask(BACKGROUND_TRACKING_TASK_NEW, sharedHeadlessLocationEngineRunner);